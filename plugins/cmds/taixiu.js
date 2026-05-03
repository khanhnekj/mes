const fs = require("fs");
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');

const TaiXiu = `${__dirname}/core/data/taixiu/`;
const Check = `${TaiXiu}status.json`;

const Xucxac = {
    1: "https://files.catbox.moe/4327xu.jpg",
    2: "https://files.catbox.moe/wkqb94.jpg",
    3: "https://files.catbox.moe/4fdeeb.jpg",
    4: "https://files.catbox.moe/rn49o9.jpg",
    5: "https://files.catbox.moe/m15zci.jpg",
    6: "https://files.catbox.moe/vhyr10.jpg",
};

const Image = path.join(TaiXiu, 'TaixiuIMG');

const Info = {
    amount: 1000000,
    lastWinner: { name: 'Không có', amount: 0 },
    contributionRate: { win: 0.05, lose: 0.1 },
    jackpotCondition: '3 số giống nhau. Đoán đúng tài/xỉu sẽ nhận được 35% tiền từ hũ (nếu nhiều người sẽ chia đều)'
};
const Tile = 1.95;
const Min_Money = 50;
const Select = { 't': 'Tài', 'x': 'Xỉu' };

const ensureDirExists = (dirPath) => !fs.existsSync(dirPath) && fs.mkdirSync(dirPath, { recursive: true });
const readJson = (filePath, defaultValue = []) => {
    try {
        if (!fs.existsSync(filePath)) return defaultValue;
        const data = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(data);
        return Array.isArray(defaultValue) && !Array.isArray(parsed) ? defaultValue : parsed;
    } catch (e) {
        console.error(`Error reading ${filePath}:`, e);
        return defaultValue;
    }
};
const writeJson = (filePath, data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
        console.error(`Error writing ${filePath}:`, e);
    }
};

ensureDirExists(TaiXiu);
ensureDirExists(Image);
!fs.existsSync(Check) && writeJson(Check, []);

const getThreadGamePaths = (threadID) => {
    const ThreadData = `${TaiXiu}Playgroup Data/${threadID}/`;
    const DataFolder = `${ThreadData}data/`;
    const History = `${DataFolder}betHistory/`;
    const PhienFile = `${ThreadData}phien.json`;
    const Hu = `${ThreadData}tx_hu.json`;
    const PhienDetailsFile = `${ThreadData}tx_phien.json`;

    ensureDirExists(ThreadData);
    ensureDirExists(DataFolder);
    ensureDirExists(History);

    return {
        threadFolder: ThreadData,
        historyFolder: History,
        phienFile: PhienFile,
        huFile: Hu,
        phienDetailsFile: PhienDetailsFile
    };
};

if (!global.txTimers) global.txTimers = {};
if (!global.txGameStates) global.txGameStates = {};
if (!global.noPlayerSessions) global.noPlayerSessions = {};

const validatePotAmount = (potInfo) => potInfo.amount = (isNaN(potInfo.amount) || potInfo.amount < 0) ? Info.amount : potInfo.amount;

const updatePot = (potInfo, amount, type = 'add') => {
    if (isNaN(amount) || amount < 0) return 0;
    if (potInfo.amount === Infinity || amount === Infinity) {
        if (type === 'add') potInfo.amount = Infinity;
        return amount;
    }
    const actualAmount = (type === 'add') ? amount : Math.min(amount, potInfo.amount);
    potInfo.amount = Math.floor(potInfo.amount + (type === 'add' ? actualAmount : -actualAmount));
    validatePotAmount(potInfo);
    return actualAmount;
};

const rollDice = () => Math.floor(Math.random() * 6) + 1;
const playGame = () => {
    const jackpotChance = Math.random();
    let dice1, dice2, dice3;

    if (jackpotChance < 0.03) {
        dice1 = dice2 = dice3 = (Math.random() < 0.5 ? 1 : 6);
    } else {
        dice1 = rollDice();
        dice2 = rollDice();
        dice3 = rollDice();
    }
    const total = dice1 + dice2 + dice3;
    const result = (total >= 3 && total <= 10) ? 'x' : 't';
    const isJackpot = (dice1 === dice2 && dice2 === dice3);
    return { total, result, dice1, dice2, dice3, isJackpot };
};

const formatNumber = (number) => new Intl.NumberFormat('vi-VN').format(number);

const parseMoney = (bet_money, userMoney) => {
    if (typeof bet_money !== 'string') return 0;
    bet_money = bet_money.trim().toLowerCase();
    let money = 0;

    if (/^(allin|all)$/i.test(bet_money)) money = userMoney === Infinity ? Infinity : Math.floor(userMoney);
    else if (/^[0-9]+%$/.test(bet_money)) {
        let percent = parseInt(bet_money.match(/^[0-9]+/)[0]);
        money = userMoney === Infinity ? Infinity : Math.floor(userMoney * Math.min(100, Math.max(1, percent)) / 100);
    } else {
        const unitMap = { 'b': 18, 'kb': 21, 'mb': 24, 'gb': 27, 'k': 12, 'm': 15, 'g': 36 };
        const unitEntry = Object.entries(unitMap).find(([unit]) => RegExp(`^[0-9]+${unit}$`, 'i').test(bet_money));
        if (unitEntry) {
            let baseNumber = parseInt(bet_money.replace(new RegExp(unitEntry[0], 'i'), ''));
            if (baseNumber > 0) money = baseNumber * Math.pow(10, unitEntry[1]);
        } else {
            let parsed = parseInt(bet_money);
            if (!isNaN(parsed) && parsed > 0) money = parsed;
        }
    }
    return money === Infinity ? Infinity : Math.floor(money);
};

const createNewSession = (threadID) => {
    const { phienFile } = getThreadGamePaths(threadID);
    const phienData = readJson(phienFile);
    const newSession = { phien: phienData.length + 1, time: Date.now(), result: null };
    phienData.push(newSession);
    writeJson(phienFile, phienData);
    return newSession.phien;
};

const hasPlayersInSession = (threadID, sessionNumber) => {
    const { historyFolder } = getThreadGamePaths(threadID);
    return fs.readdirSync(historyFolder).some(file => {
        try {
            return readJson(path.join(historyFolder, file)).some(bet => bet.phien === sessionNumber && !bet.processed);
        } catch (e) {
            console.error(`Error reading bet file ${file}:`, e);
            return false;
        }
    });
};

const handleAutoOffForInactivity = (threadID) => {
    global.noPlayerSessions[threadID] = (global.noPlayerSessions[threadID] || 0) + 1;
    const currentNoPlayersCount = global.noPlayerSessions[threadID];

    if (currentNoPlayersCount === 1) {
        return { shouldWarn: true, shouldAutoStop: false };
    } else if (currentNoPlayersCount >= 2) {
        return { shouldWarn: false, shouldAutoStop: true };
    }
    return { shouldWarn: false, shouldAutoStop: false };
};

const resetNoPlayerCounter = (threadID) => global.noPlayerSessions[threadID] && delete global.noPlayerSessions[threadID];

const getUserName = async (Users, uid) => {
    try {
        const userInfo = await Users.getData(uid);
        return userInfo.name || `User ${uid}`;
    } catch {
        return `User ${uid}`;
    }
};

async function downloadFile(url, filePath) {
    if (fs.existsSync(filePath)) {
        return;
    }
    try {
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream'
        });
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        console.error(`Error downloading ${url} to ${filePath}:`, error);
    }
}

const getImage = (number) => path.join(Image, `${number}.jpg`);


const processSessionResult = async (api, threadID, gameResult, Users, Currencies) => {
    const { phienFile, huFile, phienDetailsFile, historyFolder } = getThreadGamePaths(threadID);

    const phienData = readJson(phienFile);
    const currentSession = phienData[phienData.length - 1];
    Object.assign(currentSession, { result: gameResult, dice: [gameResult.dice1, gameResult.dice2, gameResult.dice3] });
    writeJson(phienFile, phienData);

    let threadPhienDetails = readJson(phienDetailsFile);
    threadPhienDetails.push({
        dices: [gameResult.dice1, gameResult.dice2, gameResult.dice3],
        sum: gameResult.total,
        result: gameResult.result,
        timestamp: Date.now(),
        threadId: threadID
    });
    writeJson(phienDetailsFile, threadPhienDetails);

    const hasPlayers = hasPlayersInSession(threadID, currentSession.phien);
    let shouldAutoStopAfterProcessing = false;
    let shouldWarnInactivity = false;

    if (!hasPlayers) {
        const autoOffStatus = handleAutoOffForInactivity(threadID);
        shouldAutoStopAfterProcessing = autoOffStatus.shouldAutoStop;
        shouldWarnInactivity = autoOffStatus.shouldWarn;
    } else {
        resetNoPlayerCounter(threadID);
    }

    let threadPotInfo = readJson(huFile, Info);

    let totalBetAmount = 0;
    let winner_players = [];
    let lose_players = [];
    let jackpotWinners = [];

    for (const file of fs.readdirSync(historyFolder)) {
        const userBetDataPath = path.join(historyFolder, file);
        const userBetData = readJson(userBetDataPath);
        const userBets = userBetData.filter(bet => bet.phien === currentSession.phien && !bet.processed);

        for (const bet of userBets) {
            totalBetAmount = (totalBetAmount === Infinity || bet.betAmount === Infinity) ? Infinity : totalBetAmount + bet.betAmount;
            let result = 'thua';
            let winAmount = 0;
            const isWinner = bet.choice === gameResult.result;

            if (gameResult.isJackpot && isWinner) {
                jackpotWinners.push({ id: bet.senderID, select: bet.choice, bet_money: bet.betAmount, jackpotBonus: 0 });
            } else if (!gameResult.isJackpot && isWinner) {
                winAmount = bet.betAmount === Infinity ? Infinity : Math.floor(bet.betAmount * Tile);
                winner_players.push({ id: bet.senderID, select: bet.choice, bet_money: bet.betAmount, winAmount: winAmount });
            } else {
                lose_players.push({ id: bet.senderID, select: bet.choice, bet_money: bet.betAmount });
            }
            Object.assign(bet, { ket_qua: result, winAmount, processed: true });
        }
        writeJson(userBetDataPath, userBetData);
    }

    validatePotAmount(threadPotInfo);
    let jackpotPoolAmount = 0;
    if (jackpotWinners.length > 0) {
        const totalJackpotShare = Math.floor(threadPotInfo.amount * 0.35);
        jackpotPoolAmount = updatePot(threadPotInfo, totalJackpotShare, 'subtract');
        const perWinnerJackpot = Math.floor(jackpotPoolAmount / jackpotWinners.length);

        for (const w of jackpotWinners) {
            w.jackpotBonus = perWinnerJackpot;
            perWinnerJackpot && await Currencies.increaseMoney(w.id, perWinnerJackpot);
        }
        threadPotInfo.lastWinner = { name: await getUserName(Users, jackpotWinners[0].id), amount: perWinnerJackpot };
    }

    for (const w of winner_players) {
        w.bet_money !== Infinity && updatePot(threadPotInfo, Math.floor(w.bet_money * threadPotInfo.contributionRate.win), 'add');
        w.winAmount && await Currencies.increaseMoney(w.id, w.winAmount);
    }
    lose_players.forEach(l => l.bet_money !== Infinity && updatePot(threadPotInfo, Math.floor(l.bet_money * threadPotInfo.contributionRate.lose), 'add'));

    writeJson(huFile, threadPotInfo);

    const diceImagePaths = [
        getImage(gameResult.dice1),
        getImage(gameResult.dice2),
        getImage(gameResult.dice3)
    ];

    let combinedImageBuffer = null;
    let tempImagePath = null;

    try {
        const loadedImages = [];
        for (const p of diceImagePaths) {
            if (fs.existsSync(p)) {
                loadedImages.push(await loadImage(p));
            } else {
                console.warn(`Dice image not found for path: ${p}. Attempting to re-download.`);
                await downloadFile(Xucxac[path.basename(p, '.jpg')], p);
                if (fs.existsSync(p)) {
                    loadedImages.push(await loadImage(p));
                }
            }
        }

        if (loadedImages.length === 3) {
            const imgWidth = loadedImages[0].width;
            const imgHeight = loadedImages[0].height;
            const totalWidth = imgWidth * 3;
            const combinedCanvas = createCanvas(totalWidth, imgHeight);
            const ctx = combinedCanvas.getContext('2d');

            ctx.drawImage(loadedImages[0], 0, 0, imgWidth, imgHeight);
            ctx.drawImage(loadedImages[1], imgWidth, 0, imgWidth, imgHeight);
            ctx.drawImage(loadedImages[2], imgWidth * 2, 0, imgWidth, imgHeight);

            combinedImageBuffer = combinedCanvas.toBuffer('image/png');
            tempImagePath = path.join(TaiXiu, `combined_dice_result_${Date.now()}.png`);
            fs.writeFileSync(tempImagePath, combinedImageBuffer);
        }
    } catch (error) {
        console.error('Error combining dice images:', error);
        tempImagePath = null;
    }

    return {
        totalBetAmount,
        jackpotPool: jackpotPoolAmount,
        winner_players: [...winner_players, ...jackpotWinners.map(w => ({ ...w, winAmount: w.jackpotBonus }))],
        lose_players,
        autoStopped: shouldAutoStopAfterProcessing,
        shouldWarnInactivity: shouldWarnInactivity,
        combinedImagePath: tempImagePath
    };
};

async function createBridgeImage(threadID, count = 13) {
    const { phienFile, huFile, phienDetailsFile } = getThreadGamePaths(threadID);
    const phienDetails = readJson(phienDetailsFile);
    const potInfo = readJson(huFile, Info);

    try {
        const recentPhiens = phienDetails.slice(-count);
        if (recentPhiens.length === 0) return null;

        const canvasWidth = 900, canvasHeight = 600;
        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        const currentPhien = global.txGameStates[threadID] ? global.txGameStates[threadID].currentPhien : (readJson(phienFile).length > 0 ? readJson(phienFile)[readJson(phienFile).length - 1].phien : 1);
        ctx.fillStyle = '#FFD700'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'left';
        ctx.fillText(`Phiên: #${currentPhien}`, 20, 25);
       ctx.fillStyle = '#FFFFFF';
ctx.font = 'bold 18px Arial';
ctx.textAlign = 'center';
ctx.fillText('THỐNG KÊ TÀI XỈU', canvasWidth / 2, 25);

        const gridStartX = 60, gridStartY = 60, gridWidth = canvasWidth - 120, gridHeight = 350;
        const gridRows = 16, gridCols = Math.max(recentPhiens.length + 2, 15);
        const cellWidth = gridWidth / gridCols, cellHeight = gridHeight / gridRows;

        ctx.strokeStyle = '#34495e'; ctx.lineWidth = 1;
        for (let i = 0; i <= gridRows; i++) {
            ctx.beginPath(); ctx.moveTo(gridStartX, gridStartY + i * cellHeight); ctx.lineTo(gridStartX + gridWidth, gridStartY + i * cellHeight); ctx.stroke();
        }
        for (let i = 0; i <= gridCols; i++) {
            ctx.beginPath(); ctx.moveTo(gridStartX + i * cellWidth, gridStartY); ctx.lineTo(gridStartX + i * cellWidth, gridStartY + gridHeight); ctx.stroke();
        }

        ctx.strokeStyle = '#2c3e50'; ctx.lineWidth = 0.5;
        for (let row = 0; row < gridRows; row++) {
            for (let col = 0; col < gridCols; col++) {
                const cellX = gridStartX + col * cellWidth, cellY = gridStartY + row * cellHeight;
                const subCellWidth = cellWidth / 4, subCellHeight = cellHeight / 4;
                for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(cellX + i * subCellWidth, cellY); ctx.lineTo(cellX + i * subCellWidth, cellY + cellHeight); ctx.stroke(); }
                for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(cellX, cellY + i * subCellHeight); ctx.lineTo(cellX + cellWidth, cellY + i * subCellHeight); ctx.stroke(); }
            }
        }
        const dividerY = gridStartY + (18 - 10.5) * cellHeight;
        ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 3; ctx.setLineDash([8, 4]);
        ctx.beginPath(); ctx.moveTo(gridStartX, dividerY); ctx.lineTo(gridStartX + gridWidth, dividerY); ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#ecf0f1'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'right';
        for (let i = 0; i <= gridRows; i++) {
            const value = 18 - i;
            if (value >= 3) ctx.fillText(value.toString(), gridStartX - 10, gridStartY + i * cellHeight + 5);
        }

        ctx.font = 'bold 14px Arial'; ctx.textAlign = 'right'; ctx.fillStyle = '#FFFFFF';
        ctx.fillText('TÀI', gridStartX - 33, gridStartY + (18 - 15) * cellHeight);
        ctx.fillText('XỈU', gridStartX - 33, gridStartY + (18 - 7) * cellHeight);
        if (recentPhiens.length > 0) {
            const points = recentPhiens.map((phien, index) => ({
                x: gridStartX + (index + 1) * cellWidth + cellWidth / 2,
                y: gridStartY + (18 - phien.sum) * cellHeight,
                sum: phien.sum, result: phien.result, dices: phien.dices
            }));

            if (points.length > 1) {
                ctx.strokeStyle = '#f39c12'; ctx.lineWidth = 3; ctx.beginPath();
                ctx.moveTo(points[0].x, points[0].y);
                points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
                ctx.stroke();
            }

            points.forEach((point) => {
                ctx.beginPath(); ctx.arc(point.x, point.y, 12, 0, 2 * Math.PI);
                ctx.fillStyle = point.sum >= 11 ? '#000000' : '#FFFFFF'; ctx.fill();
                ctx.strokeStyle = point.sum >= 11 ? '#FFFFFF' : '#000000'; ctx.lineWidth = 2; ctx.stroke();
                ctx.fillStyle = point.sum >= 11 ? '#FFFFFF' : '#000000';
                ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center';
                ctx.fillText(point.sum.toString(), point.x, point.y + 3);
            });
        }
        const diceGridY = gridStartY + gridHeight + 30, diceGridHeight = 120;
        const diceRows = 6, diceCellHeight = diceGridHeight / diceRows, diceCellWidth = cellWidth;
        ctx.strokeStyle = '#34495e'; ctx.lineWidth = 1;
        for (let i = 0; i <= diceRows; i++) {
            ctx.beginPath(); ctx.moveTo(gridStartX, diceGridY + i * diceCellHeight); ctx.lineTo(gridStartX + gridWidth, diceGridY + i * diceCellHeight); ctx.stroke();
        }
        for (let i = 0; i <= gridCols; i++) {
            ctx.beginPath(); ctx.moveTo(gridStartX + i * diceCellWidth, diceGridY); ctx.lineTo(gridStartX + i * diceCellWidth, diceGridY + diceGridHeight); ctx.stroke();
        }
        const diceColors = ['#FFD700', '#00FFFF', '#FF69B4'];
        const diceNames = ['Xúc xắc 1', 'Xúc xắc 2', 'Xúc xắc 3'];
        ctx.font = 'bold 14px Arial'; ctx.textAlign = 'left';
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = diceColors[i]; ctx.fillText(`● ${diceNames[i]}`, 80 + i * 120, diceGridY + diceGridHeight + 25);
        }

        ctx.fillStyle = '#ecf0f1'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'right';
        for (let i = 0; i < 6; i++) {
            const value = 6 - i; ctx.fillText(value.toString(), gridStartX - 10, diceGridY + i * diceCellHeight + diceCellHeight / 2 + 5);
        }

        if (recentPhiens.length > 0) {
            for (let diceIndex = 0; diceIndex < 3; diceIndex++) {
                const points = recentPhiens.map((phien, index) => ({
                    x: gridStartX + (index + 1) * cellWidth + cellWidth / 2,
                    y: diceGridY + (6 - phien.dices[diceIndex]) * diceCellHeight + diceCellHeight / 2,
                    value: phien.dices[diceIndex]
                }));

                if (points.length > 1) {
                    ctx.strokeStyle = diceColors[diceIndex]; ctx.lineWidth = 2;
                    for (let i = 0; i < points.length - 1; i++) {
                        ctx.beginPath(); ctx.moveTo(points[i].x, points[i].y); ctx.lineTo(points[i + 1].x, points[i + 1].y); ctx.stroke();
                    }
                }
                points.forEach(point => {
                    ctx.beginPath(); ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
                    ctx.fillStyle = diceColors[diceIndex]; ctx.fill();
                    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.stroke();
                    ctx.fillStyle = '#000000'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center';
                    ctx.fillText(point.value.toString(), point.x, point.y + 3);
                });
            }
        }
        ctx.fillStyle = '#a0a0a0'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'right';
        ctx.fillText('© Game Tài Xỉu 5.0', canvasWidth - 20, canvasHeight - 15);
        const outputPath = path.join(TaiXiu, `bridge_image_${Date.now()}.png`);
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
        return outputPath;
    } catch (error) {
        console.error('Error creating bridge image:', error);
        return null;
    }
}

async function sendImageAndDeleteTemp(api, threadID, messageBody, imagePath) {
    if (imagePath && fs.existsSync(imagePath)) {
        await api.sendMessage({ body: messageBody, attachment: fs.createReadStream(imagePath) }, threadID);
        setTimeout(() => fs.unlink(imagePath, err => err && console.error(`Error deleting temp file: ${imagePath}`, err)), 5000);
    } else {
        api.sendMessage(messageBody, threadID);
    }
}

module.exports.config = {
    name: "tx",
    version: "1.0.2",
    author: "lechii & Toàn Sex",
    role: 1,
    info: "Game Tài Xỉu nhiều người chơi",
    category: "Game",
    guide: "[on/off/check/clean]",
    ce: 0,
    Prefix: true
};

this.onLoad = async function () {
    ensureDirExists(Image);
    for (const num in Xucxac) {
        const url = Xucxac[num];
        const filePath = path.join(Image, `${num}.jpg`);
        await downloadFile(url, filePath);
    }
};

this.onCall = async function ({ api, event, args, Users, Currencies, Threads }) {
    try {
        const { ADMINBOT } = global.config;
        const { threadID, messageID, senderID } = event;
        const checkData = readJson(Check);
        const isAdmin = (await Threads.getData(threadID)).threadInfo.adminIDs.some(item => item.id === senderID) || ADMINBOT.includes(senderID);

        if (args[0] === 'clean') {
            if (!isAdmin) return api.sendMessage('❎ Bạn không đủ quyền hạn để sử dụng lệnh này!', threadID, messageID);

            try {
                const targetThreadID = args[1];
                if (targetThreadID && !isNaN(targetThreadID)) {
                    if (fs.existsSync(`${TaiXiu}Playgroup Data/${targetThreadID}/`)) {
                        if (global.txTimers[targetThreadID]) {
                            clearInterval(global.txTimers[targetThreadID]);
                            delete global.txTimers[targetThreadID];
                            delete global.txGameStates[targetThreadID];
                            delete global.noPlayerSessions[targetThreadID];
                        }
                        const index = readJson(Check).indexOf(targetThreadID);
                        if (index > -1) {
                            const currentCheckData = readJson(Check);
                            currentCheckData.splice(index, 1);
                            writeJson(Check, currentCheckData);
                        }
                        fs.rmSync(`${TaiXiu}Playgroup Data/${targetThreadID}/`, { recursive: true, force: true });
                        api.sendMessage(`✅ Đã xóa toàn bộ dữ liệu game Tài Xỉu và tắt game cho nhóm ${targetThreadID}.`, threadID, messageID);
                    } else {
                        api.sendMessage(`❎ Không tìm thấy dữ liệu game cho nhóm ${targetThreadID}.`, threadID, messageID);
                    }
                } else {
                    for (const tid in global.txTimers) {
                        clearInterval(global.txTimers[tid]);
                        delete global.txTimers[tid];
                        delete global.txGameStates[tid];
                        delete global.noPlayerSessions[tid];
                    }

                    if (fs.existsSync(`${TaiXiu}Playgroup Data/`)) {
                        fs.readdirSync(`${TaiXiu}Playgroup Data/`).forEach(dir => {
                            fs.rmSync(`${TaiXiu}Playgroup Data/${dir}/`, { recursive: true, force: true });
                        });
                    }

                    writeJson(Check, []);

                    api.sendMessage('✅ Đã xóa toàn bộ dữ liệu game Tài Xỉu và tắt tất cả phiên đang hoạt động trên bot.', threadID, messageID);
                }
            } catch (error) {
                console.error('Error cleaning game data:', error);
                api.sendMessage('❎ Đã xảy ra lỗi khi xóa dữ liệu game. Vui lòng thử lại!', threadID, messageID);
            }
            return;
        }

        if (['on', 'off'].includes(args[0])) {
            if (!isAdmin) return api.sendMessage('❎ Bạn không đủ quyền hạn để sử dụng!', threadID, messageID);
            const isGameOn = checkData.includes(threadID);

            if (args[0] === 'on') {
                if (isGameOn) return api.sendMessage('⚠️ Game đã được bật rồi.', threadID);
                checkData.push(threadID); writeJson(Check, checkData);

                global.txGameStates[threadID] = { time: 0, currentPhien: createNewSession(threadID), autoStopRequested: false, shouldWarnInactivity: false };

                global.txTimers[threadID] = setInterval(async () => {
                    if (!global.txGameStates[threadID]) {
                        clearInterval(global.txTimers[threadID]);
                        delete global.txTimers[threadID];
                        return;
                    }
                    global.txGameStates[threadID].time++;
                    const currentTime = global.txGameStates[threadID].time;

                    if (currentTime === 45) {
                        api.sendMessage('⏰ Hết thời gian đặt cược.\nĐang tiến hành xổ...', threadID);
                    }
                    if (currentTime === 50) {
                        const gameResult = playGame();
                        const stats = await processSessionResult(api, threadID, gameResult, Users, Currencies);
                        
                        global.txGameStates[threadID].autoStopRequested = stats.autoStopped;
                        global.txGameStates[threadID].shouldWarnInactivity = stats.shouldWarnInactivity;

                        const formatPlayerList = async (players) => players.length === 0 ? 'Không có' : (await Promise.all(players.map(async p => {
                            const userName = await getUserName(Users, p.id);
                            const betDisplay = p.bet_money === Infinity ? '∞' : p.bet_money.toLocaleString();
                            return `${userName} - ${betDisplay} VND (${Select[p.select]})`;
                        }))).map((item, idx) => `${idx + 1}. ${item}`).join('\n');

                        const winnerNames = await formatPlayerList(stats.winner_players);
                        const loserNames = await formatPlayerList(stats.lose_players);

                        const totalBetDisplay = stats.totalBetAmount === Infinity ? '∞' : formatNumber(stats.totalBetAmount);
                        const jackpotDisplay = stats.jackpotPool === Infinity ? '∞' : formatNumber(stats.jackpotPool);
                        
                        const resultMessage = `🎲 KẾT QUẢ PHIÊN #${global.txGameStates[threadID].currentPhien}\n\n🎲 Xúc xắc: ${gameResult.dice1} - ${gameResult.dice2} - ${gameResult.dice3}\n🎯 Tổng điểm: ${gameResult.total}\n🏆 Kết quả: ${Select[gameResult.result]}${gameResult.isJackpot ? ' + JACKPOT‼' : ''}\n───────────────\n👑 Những người thắng (${stats.winner_players.length}):\n${winnerNames}\n───────────────\n💸 Những người thua (${stats.lose_players.length}):\n${loserNames}\n───────────────\n💰 Tổng số tiền cược:\n${totalBetDisplay} VND\n${gameResult.isJackpot ? `💥 Nổ hũ Jackpot: ${jackpotDisplay} VND\n───────────────` : ''}\n🎰 Phiên mới sẽ được bắt đầu sau 10 giây...`;
                        
                        await sendImageAndDeleteTemp(api, threadID, resultMessage, stats.combinedImagePath);
                    }
                    if (currentTime === 60) {
                        if (global.txGameStates[threadID].shouldWarnInactivity) {
                            global.txGameStates[threadID].shouldWarnInactivity = false;
                        }

                        if (global.txGameStates[threadID].autoStopRequested) {
                            api.sendMessage(`🔴 Game Tài Xỉu đã tự động tắt do không có người chơi trong 2 phiên liên tiếp.`, threadID);
                            
                            const checkData = readJson(Check);
                            const index = checkData.indexOf(threadID);
                            if (index > -1) {
                                checkData.splice(index, 1);
                                writeJson(Check, checkData);
                            }
                            clearInterval(global.txTimers[threadID]);
                            delete global.txTimers[threadID];
                            delete global.txGameStates[threadID];
                            delete global.noPlayerSessions[threadID];
                            return;
                        } else {
                            const { huFile } = getThreadGamePaths(threadID);
                            const currentPotInfo = readJson(huFile, Info);
                            validatePotAmount(currentPotInfo);
                            const formattedPotAmount = currentPotInfo.amount === Infinity ? '∞' : formatNumber(currentPotInfo.amount);

                            global.txGameStates[threadID].currentPhien = createNewSession(threadID);
                            
                            const startMessage = `🎲 Bắt đầu phiên #${global.txGameStates[threadID].currentPhien}\n🏦 Tiền trong hũ hiện tại:\n${formattedPotAmount} VND\n⏳ Bạn có 45 giây để đặt cược Tài (11-18) hoặc Xỉu (3-10).\n🔔 Nhập Tài/Xỉu + Số tiền để tiến hành đặt cược.\n`;

                            await sendImageAndDeleteTemp(api, threadID, startMessage, await createBridgeImage(threadID, 13));
                            global.txGameStates[threadID].time = 0;
                        }
                    }
                }, 1000);

                const timeLeft = 45 - global.txGameStates[threadID].time;
                const { huFile } = getThreadGamePaths(threadID);
                const currentPotInfo = readJson(huFile, Info);
                validatePotAmount(currentPotInfo);
                const formattedPotAmount = currentPotInfo.amount === Infinity ? '∞' : formatNumber(currentPotInfo.amount);

                const messageBody = `✅ Đã bật game Tài Xỉu.\n🎲 Bắt đầu phiên #${global.txGameStates[threadID].currentPhien}\n🏦 Tiền trong hũ hiện tại:\n${formattedPotAmount} VND\n⏳ Bạn có 45 giây để đặt cược Tài (11-18) hoặc Xỉu (3-10).\n🔔 Nhập Tài/Xỉu + Số tiền để tiến hành đặt cược.\n\n`;
                await sendImageAndDeleteTemp(api, threadID, messageBody, await createBridgeImage(threadID, 13));
            } else {
                if (!isGameOn) return api.sendMessage('⚠️ Game chưa được bật!', threadID);
                checkData.splice(checkData.indexOf(threadID), 1); writeJson(Check, checkData);
                delete global.noPlayerSessions[threadID];
                if (global.txTimers[threadID]) {
                    clearInterval(global.txTimers[threadID]);
                    delete global.txTimers[threadID];
                    delete global.txGameStates[threadID];
                }
                api.sendMessage('❌ Đã tắt game Tài Xỉu.', threadID);
            }
            return;
        }

        if (args[0] === 'check') {
            const count = parseInt(args[1]) || 13;
            const maxCount = Math.min(Math.max(count, 5), 15);
            const { phienDetailsFile } = getThreadGamePaths(threadID);
            const threadPhienDetails = readJson(phienDetailsFile);

            if (!threadPhienDetails.length) return api.sendMessage('❎ Chưa có dữ liệu phiên nào để hiển thị cầu!', threadID);

            let waitingMsg = null;
            try {
                waitingMsg = await api.sendMessage("🌉 Đang tạo ảnh cầu...", threadID);
                const { huFile } = getThreadGamePaths(threadID);
                const currentPotInfo = readJson(huFile, Info);
                validatePotAmount(currentPotInfo);
                const formattedAmount = currentPotInfo.amount === Infinity ? '∞' : currentPotInfo.amount.toLocaleString('vi-VN') + ' VND';
                const potMessage = `🎰 THÔNG TIN HŨ:\n💰 Số tiền: ${formattedAmount}\n👑 Trúng hũ gần nhất: ${currentPotInfo.lastWinner.name} (${currentPotInfo.lastWinner.amount.toLocaleString('vi-VN')} VND)\n💎 Điều kiện trúng: ${currentPotInfo.jackpotCondition}`;
                await sendImageAndDeleteTemp(api, threadID, potMessage, await createBridgeImage(threadID, maxCount));
            } catch (error) {
                console.error('Lỗi trong lệnh check:', error);
                api.sendMessage('❎ Đã xảy ra lỗi không mong muốn khi thực hiện lệnh.', threadID);
            } finally {
                waitingMsg && api.unsendMessage(waitingMsg.messageID);
            }
            return;
        }

        if (/^(tài|tai|t|xỉu|xiu|x)$/i.test(args[0])) {
            const isGameActive = checkData.includes(threadID);
            const currentGameState = global.txGameStates[threadID];

            if (!isGameActive) return api.sendMessage('❎ Game Tài Xỉu chưa được bật trong nhóm này. Vui lòng liên hệ quản trị viên để bật game.', threadID);
            if (!currentGameState || !global.txTimers[threadID]) return api.sendMessage('❎ Hệ thống Tài Xỉu chưa khởi động hoặc đang có lỗi. Vui lòng thử lại sau.', threadID);
            if (currentGameState.time >= 45) return api.sendMessage('⌛ Đã hết thời gian đặt cược cho phiên này! Vui lòng chờ phiên mới.', threadID);

            const bet_money = args[1];
            if (!bet_money) return api.sendMessage('❎ Vui lòng nhập số tiền cược\nVí dụ: Tài 1000', threadID);

            try {
                const userMoney = (await Currencies.getData(senderID)).money || 0;
                if (userMoney <= 0 && userMoney !== Infinity) return api.sendMessage(`❎ Con đỗ nghèo khỉ không có tiền đòi chơi game xanh chín?`, threadID);

                const betAmount = parseMoney(bet_money, userMoney);
                if (!betAmount || (betAmount <= 0 && betAmount !== Infinity)) return api.sendMessage('❎ Tiền cược không hợp lệ.', threadID);
                if (betAmount !== Infinity && betAmount < Min_Money) return api.sendMessage(`❎ Vui lòng đặt ít nhất ${Min_Money.toLocaleString()} VND`, threadID);
                if (userMoney !== Infinity && betAmount !== Infinity && betAmount > userMoney) return api.sendMessage(`❎ Bạn không đủ tiền. Số dư: ${userMoney === Infinity ? '∞' : userMoney.toLocaleString()} VND`, threadID);

                const select = /^(tài|tai|t)$/i.test(args[0]) ? 't' : 'x';
                
                const { historyFolder } = getThreadGamePaths(threadID);
                const userBetFile = `${historyFolder}${senderID}.json`;
                let userBetData = readJson(userBetFile);
                const existingBetIndex = userBetData.findIndex(bet => bet.phien === currentGameState.currentPhien && !bet.processed);

                if (existingBetIndex !== -1) {
                    if (userBetData[existingBetIndex].choice !== select) return api.sendMessage('⚠️ Bạn chỉ có thể đặt một loại cược trong một phiên!', threadID);
                    await Currencies.decreaseMoney(senderID, betAmount);
                    userBetData[existingBetIndex].betAmount = (userBetData[existingBetIndex].betAmount === Infinity || betAmount === Infinity) ? Infinity : userBetData[existingBetIndex].betAmount + betAmount;
                } else {
                    await Currencies.decreaseMoney(senderID, betAmount);
                    userBetData.push({ senderID, choice: select, betAmount, phien: currentGameState.currentPhien, time: Date.now(), processed: false });
                }
                writeJson(userBetFile, userBetData);

                const timeLeft = 45 - currentGameState.time;
                const currentMoney = (await Currencies.getData(senderID)).money || 0;
                const userName = await getUserName(Users, senderID);

                return api.sendMessage(`\n✅ Người chơi ${userName} đã cược ${Select[select]} với số tiền ${betAmount === Infinity ? '∞' : betAmount.toLocaleString()} VND\n🎯 Phiên hiện tại: #${currentGameState.currentPhien}\n⏳ Còn lại: ${timeLeft} giây\n💳 Số dư còn: ${currentMoney === Infinity ? '∞' : formatNumber(currentMoney)} VND\n`, threadID);
            } catch (error) {
                console.error('Betting error details:', error);
                return api.sendMessage(`❎ Lỗi hệ thống khi đặt cược: ${error.message || 'Không xác định'}. Vui lòng thử lại!`, threadID);
            }
        }
        if (!args.length || args[0] === '') {
            const helpMessage = `\n🎮 TÀI XỈU - HƯỚNG DẪN 🎮\n─────────────────\n🎛️ Quản lý:\n• tx on/off - Bật tắt game tài xỉu\n• tx check - Xem cầu (5-15 phiên)\n• tx clean [ID_Nhóm] - Xóa dữ liệu game của nhóm theo ID nếu không có sẽ xóa tất cả\n\n🎲 Tham gia chơi:\n Tài [số tiền] - Cược Tài (11-18 điểm)\n Xỉu [số tiền] - Cược Xỉu (3-10 điểm)\n• Hỗ trợ: all, phần trăm (50%), đơn vị (1k, 1m)\n\n🎯 Luật chơi:\n• Tài: 11-18 điểm (thắng x${Tile})\n• Xỉu: 3-10 điểm (thắng x${Tile})\n• Bộ ba: Jackpot (chia 35% hũ cho người thắng)\n\n⚡ Hệ thống tự động:\n• Thời gian đặt cược: 45 giây\n• Tự động xử lí tính toán kết quả và trả thưởng\n─────────────────\n🎰 Lưu ý: Chỉ Quản Trị Viên nhóm mới có thể bật/tắt game hoặc xóa dữ liệu\n`;
            return api.sendMessage(helpMessage, threadID);
        }
    } catch (outerError) {
        console.error('Lỗi chung trong module.exports.run:', outerError);
        return api.sendMessage(`❎ Đã xảy ra lỗi không mong muốn trong quá trình xử lý lệnh. Vui lòng thử lại hoặc báo cáo lỗi.`, threadID);
    }
};

this.onEvent = async function ({ api, event, Currencies, Users, Threads }) {
    const { body = '', threadID, senderID } = event;
    const args = body.trim().split(/\s+/);
    const select = (t => /^(tài|tai|t)$/i.test(t) ? 't' : /^(xỉu|xiu|x)$/i.test(t) ? 'x' : null)((args[0] || '').toLowerCase());

    if (select && args[1] && readJson(Check).includes(threadID)) {
        return this.onCall({ api, event, args: [args[0], args[1]], Currencies, Users, Threads });
    }
};
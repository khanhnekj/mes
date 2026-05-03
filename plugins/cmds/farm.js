const fs = require('fs-extra');
const axios = require('axios');
const request = require('request');
const path = require('path');

this.config = {
    "name": "farm",
    "alias": ["farm"],
    "version": "1.1.0",
    "author": "",
    "role": 0,
    "info": "Quản lý trang trại và hợp tác xã",
    "category": "Game",
    "guides": "[trong/thuhoach/choan/info/kho/shop/ban/top/htx/level/bonphan] [args]",
    "cd": 5,
    "prefix": true
};

let plantSchema = {};
let cooldowns = {};
let playerData = {};
let cooperatives = {};
let globalCooperatives = {};

const dataPath = path.join(__dirname, "..", "..", "core", "data","farmData.json");
if (fs.existsSync(dataPath)) {
    const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    plantSchema = data.plantSchema || {};
    cooldowns = data.cooldowns || {};
    playerData = data.playerData || {};
    cooperatives = data.cooperatives || {};
    globalCooperatives = data.globalCooperatives || {};
}

function saveData() {
    const data = { plantSchema, cooldowns, playerData, cooperatives, globalCooperatives };
    fs.writeFileSync(dataPath, JSON.stringify(data), "utf8");
}

const CROPS = {
    "ot": { emoji: "🌶️", name: "Ớt", growTime: 1200000, yield: [2, 6], price: 500, exp: 15 },
    "ngo": { emoji: "🌽", name: "Ngô", growTime: 1200000, yield: [2, 6], price: 500, exp: 15 },
    "khoaitay": { emoji: "🥔", name: "Khoai tây", growTime: 1800000, yield: [2, 5], price: 750, exp: 30 },
    "caingot": { emoji: "🥬", name: "Cải ngọt", growTime: 1800000, yield: [2, 5], price: 750, exp: 30 },
    "dautay": { emoji: "🍓", name: "Dâu tây", growTime: 3600000, yield: [2, 4], price: 1000, exp: 50 },
    "dao": { emoji: "🍑", name: "Đào", growTime: 3600000, yield: [2, 4], price: 1000, exp: 55 },
    "duagang": { emoji: "🍈", name: "Dưa gang", growTime: 10800000, yield: [2, 3], price: 1250, exp: 100 },
    "cachua": { emoji: "🍅", name: "Cà chua", growTime: 2400000, yield: [3, 7], price: 800, exp: 40 },
    "bapcai": { emoji: "🥬", name: "Bắp cải", growTime: 3000000, yield: [2, 5], price: 900, exp: 45 },
    "lua": { emoji: "🌾", name: "Lúa", growTime: 4800000, yield: [4, 8], price: 1200, exp: 60 },
    "nho": { emoji: "🍇", name: "Nho", growTime: 7200000, yield: [2, 4], price: 1500, exp: 75 },
    "dua": { emoji: "🥒", name: "Dưa chuột", growTime: 1500000, yield: [3, 6], price: 600, exp: 25 },
    "khoaimi": { emoji: "🥔", name: "Khoai mì", growTime: 8400000, yield: [3, 5], price: 1400, exp: 85 },
    "xoai": { emoji: "🥭", name: "Xoài", growTime: 12000000, yield: [2, 4], price: 2000, exp: 120 },
    "saurieng": { emoji: "🍈", name: "Sầu riêng", growTime: 15000000, yield: [1, 3], price: 3000, exp: 150 },
    "mit": { emoji: "🍈", name: "Mít", growTime: 18000000, yield: [2, 4], price: 2500, exp: 130 },
    "dualeo": { emoji: "🍈", name: "Dưa leo", growTime: 1800000, yield: [3, 6], price: 700, exp: 35 },
    "rau": { emoji: "🥬", name: "Rau cải", growTime: 1200000, yield: [4, 8], price: 400, exp: 20 },
    "khoailang": { emoji: "🥔", name: "Khoai lang", growTime: 3600000, yield: [2, 5], price: 800, exp: 40 }
};

const ANIMALS = {
    "ga": { emoji: "🐔", name: "Gà", feedTime: 3600000, feedCost: 200, product: "trung", productName: "Trứng", productEmoji: "🥚", productAmount: [2, 5], price: 180, exp: 30 },
    "ong": { emoji: "🐝", name: "Ong", feedTime: 3600000, feedCost: 200, product: "mat", productName: "Mật", productEmoji: "🍯", productAmount: [2, 5], price: 180, exp: 30 },
    "bo": { emoji: "🐄", name: "Bò", feedTime: 7200000, feedCost: 500, product: "sua", productName: "Sữa", productEmoji: "🥛", productAmount: [2, 4], price: 400, exp: 60 },
    "cuu": { emoji: "🐏", name: "Cừu", feedTime: 7200000, feedCost: 500, product: "long", productName: "Lông", productEmoji: "🐑", productAmount: [2, 4], price: 400, exp: 60 },
    "heo": { emoji: "🐷", name: "Heo", feedTime: 18000000, feedCost: 1000, product: "thit", productName: "Thịt", productEmoji: "🥩", productAmount: [1, 3], price: 800, exp: 100 },
    "vit": { emoji: "🦆", name: "Vịt", feedTime: 4800000, feedCost: 300, product: "trungvit", productName: "Trứng vịt", productEmoji: "🥚", productAmount: [2, 4], price: 250, exp: 40 },
    "de": { emoji: "🐐", name: "Dê", feedTime: 9600000, feedCost: 700, product: "suade", productName: "Sữa dê", productEmoji: "🥛", productAmount: [1, 3], price: 600, exp: 80 },
    "tho": { emoji: "🐰", name: "Thỏ", feedTime: 5400000, feedCost: 400, product: "longtho", productName: "Lông thỏ", productEmoji: "🧶", productAmount: [2, 4], price: 300, exp: 45 },
    "ngong": { emoji: "🦢", name: "Ngỗng", feedTime: 6000000, feedCost: 450, product: "trungngong", productName: "Trứng ngỗng", productEmoji: "🥚", productAmount: [1, 3], price: 350, exp: 50 },
    "nai": { emoji: "🦌", name: "Nai", feedTime: 12000000, feedCost: 1200, product: "nhung", productName: "Nhung", productEmoji: "🦌", productAmount: [1, 2], price: 1500, exp: 120 },
    "congchien": { emoji: "🦚", name: "Công chiến", feedTime: 14400000, feedCost: 1500, product: "long", productName: "Lông công", productEmoji: "🪶", productAmount: [1, 3], price: 1200, exp: 100 },
    "huoucao": { emoji: "🦌", name: "Hươu cao cổ", feedTime: 16800000, feedCost: 2000, product: "sua", productName: "Sữa hươu", productEmoji: "🥛", productAmount: [1, 2], price: 2000, exp: 150 }
};

const FERTILIZERS = {
    "npk": { name: "NPK", emoji: "🧪", price: 3000, timeReduction: 0.2, yieldIncrease: 0.3 },
    "organic": { name: "Phân hữu cơ", emoji: "🍂", price: 4000, timeReduction: 0.1, yieldIncrease: 0.2 },
    "super": { name: "Siêu phân bón", emoji: "⚡", price: 5000, timeReduction: 0.3, yieldIncrease: 0.5 },
    "premium": { name: "Phân bón cao cấp", emoji: "💎", price: 80000, timeReduction: 0.4, yieldIncrease: 0.6 },
    "magic": { name: "Phân bón thần kỳ", emoji: "✨", price: 100000, timeReduction: 0.5, yieldIncrease: 0.8 },
    "nano": { name: "Phân bón nano", emoji: "🔬", price: 60000, timeReduction: 0.25, yieldIncrease: 0.4 },
    "dragon": { name: "Phân bón rồng", emoji: "🐉", price: 20000000, timeReduction: 0.6, yieldIncrease: 1.0 },
    "phoenix": { name: "Phân bón phượng hoàng", emoji: "🦅", price: 2500000, timeReduction: 0.7, yieldIncrease: 1.2 },
    "unicorn": { name: "Phân bón kỳ lân", emoji: "🦄", price: 800000000, timeReduction: 0.8, yieldIncrease: 1.5 }
};

const TITLES = {
    1: "Nông dân tập sự 🌱",
    3: "Người làm vườn tài tử 🏡",
    5: "Nông dân chăm chỉ 🚜",
    7: "Người trồng cây熱心 🌳",
    10: "Nông dân lành nghề 🌾",
    13: "Chuyên gia canh tác 🌿",
    15: "Bậc thầy thu hoạch 🧺",
    17: "Nhà nông học 📚",
    20: "Vua của mùa màng 👑",
    23: "Người thuần hóa đất 🏞️",
    25: "Huyền thoại nông trại 🌟",
    27: "Phù thủy mùa màng 🧙‍♂️",
    30: "Á thần nông nghiệp 🏆",
    33: "Người cai quản thiên nhiên 🌍",
    35: "Bậc thầy sinh thái 🍃",
    37: "Kiến trúc sư của đồng ruộng 🏛️",
    40: "Đại sứ của mẹ thiên nhiên 🌺",
    43: "Người điều khiển thời tiết ☀️🌧️",
    45: "Thần nông tái sinh 🔄",
    47: "Người nắm giữ bí mật cổ xưa 📜",
    50: "Thần nông tối thượng 🌈",
    55: "Người cai quản vũ trụ xanh 🌌",
    60: "Đấng tạo hóa của thế giới thực vật 🌎",
    65: "Hóa thân của mẹ thiên nhiên 🌻",
    70: "Người kiến tạo sự sống 🧬",
    75: "Thần nông vượt thời gian ⏳",
    80: "Đấng tối cao của muôn loài thực vật 🌺🌳🍄",
    90: "Người nắm giữ chìa khóa của Eden 🔑🏞️",
    100: "Thần nông bất tử 🕊️✨"
};

const COOPERATIVE_LEVELS = {
    1: {
        maxMembers: 10,
        bonusYield: 1.05,
        bonusExp: 1.05,
        requiredContribution: 50000
    },
    2: {
        maxMembers: 15,
        bonusYield: 1.1,
        bonusExp: 1.1,
        requiredContribution: 100000
    },
    3: {
        maxMembers: 20,
        bonusYield: 1.15,
        bonusExp: 1.15,
        requiredContribution: 200000
    },
    4: {
        maxMembers: 25,
        bonusYield: 1.2,
        bonusExp: 1.2,
        requiredContribution: 400000
    },
    5: {
        maxMembers: 30,
        bonusYield: 1.25,
        bonusExp: 1.25,
        requiredContribution: 800000
    }
};

function getTitle(level) {
    let highestTitle = "Nông dân tập sự 🌱";
    let nextTitle = null;
    let nextTitleLevel = Infinity;

    for (let titleLevel in TITLES) {
        titleLevel = parseInt(titleLevel);
        if (level >= titleLevel) {
            highestTitle = TITLES[titleLevel];
        } else if (titleLevel > level && titleLevel < nextTitleLevel) {
            nextTitle = TITLES[titleLevel];
            nextTitleLevel = titleLevel;
            break;
        }
    }

    return { currentTitle: highestTitle, nextTitle, nextTitleLevel };
}

function getCooperative(threadID, uid) {
    const htx = Object.values(globalCooperatives).find(h => 
        h.members.some(m => m.id === uid)
    );
    return htx || null;
}

async function showCooperativeInfo(api, threadID, uid) {
    const htx = getCooperative(threadID, uid);
    if (!htx) {
        return api.sendMessage("❌ Bạn chưa tham gia HTX nào!", threadID);
    }

    const currentLevel = COOPERATIVE_LEVELS[htx.level];
    const nextLevel = COOPERATIVE_LEVELS[htx.level + 1];
    
    let msg = `🏢 Thông tin HTX ${htx.name}\n\n`;
    msg += `👑 Chủ tịch: ${htx.president.name}\n`;
    msg += `👥 Thành viên: ${htx.members.length}/${currentLevel.maxMembers}\n`;
    msg += `🏆 Level hiện tại: ${htx.level}\n`;
    msg += `💰 Tổng đóng góp: ${htx.totalContribution}$\n\n`;
    
    msg += `📊 Hệ số hiện tại:\n`;
    msg += `📈 Sản lượng: x${currentLevel.bonusYield}\n`;
    msg += `✨ Kinh nghiệm: x${currentLevel.bonusExp}\n\n`;
    
    if (nextLevel) {
        const remainingContribution = nextLevel.requiredContribution - htx.totalContribution;
        msg += `📊 Level tiếp theo (${htx.level + 1}):\n`;
        msg += `💰 Yêu cầu đóng góp: ${nextLevel.requiredContribution}$\n`;
        msg += `💸 Còn thiếu: ${remainingContribution}$\n`;
        msg += `📈 Sản lượng: x${nextLevel.bonusYield}\n`;
        msg += `✨ Kinh nghiệm: x${nextLevel.bonusExp}\n`;
    } else {
        msg += "🎖️ HTX đã đạt cấp độ tối đa!\n";
    }

    msg += `\n📅 Ngày thành lập: ${new Date(htx.createdAt).toLocaleString()}`;
    
    return api.sendMessage(msg, threadID);
}

async function donateToCooperative(api, threadID, uid, amount, Currencies) {
    const htx = getCooperative(threadID, uid);
    if (!htx) {
        return api.sendMessage("❌ Bạn chưa tham gia HTX nào!", threadID);
    }

    const userMoney = await Currencies.getData(uid);
    if (userMoney.money < amount) {
        return api.sendMessage("❌ Số tiền của bạn không đủ!", threadID);
    }

    const member = htx.members.find(m => m.id === uid);
    if (!member) {
        return api.sendMessage("❌ Có lỗi xảy ra với thông tin thành viên!", threadID);
    }

    member.contribution += amount;
    htx.totalContribution += amount;
    await Currencies.decreaseMoney(uid, amount);
    
    checkCooperativeUpgrade(api, threadID, htx);

    saveData();

    return api.sendMessage(
        `✅ Đóng góp thành công ${amount}$ vào HTX!\n` +
        `💰 Tổng đóng góp của bạn: ${member.contribution}$\n` +
        `💎 Tổng quỹ HTX: ${htx.totalContribution}$`,
        threadID
    );
}

function checkCooperativeUpgrade(api, threadID, htx) {
    const nextLevel = COOPERATIVE_LEVELS[htx.level + 1];
    if (!nextLevel) return;

    if (htx.totalContribution >= nextLevel.requiredContribution) {
        htx.level++;
        api.sendMessage(
            `🎉 Chúc mừng! HTX "${htx.name}" đã đạt level ${htx.level}!\n\n` +
            `📈 Hệ số sản lượng mới: x${nextLevel.bonusYield}\n` +
            `✨ Hệ số kinh nghiệm mới: x${nextLevel.bonusExp}\n` +
            `👥 Số thành viên tối đa: ${nextLevel.maxMembers}`,
            threadID
        );
        saveData();
    }
}

function getCooperativeBonus(threadID) {
    const htxId = cooperatives[threadID];
    if (!htxId) {
        return {
            yieldBonus: 1.0,
            expBonus: 1.0
        };
    }

    const htx = Object.values(globalCooperatives).find(h => h.id === htxId);
    if (!htx) {
        return {
            yieldBonus: 1.0,
            expBonus: 1.0
        };
    }

    return {
        yieldBonus: COOPERATIVE_LEVELS[htx.level].bonusYield,
        expBonus: COOPERATIVE_LEVELS[htx.level].bonusExp
    };
}

async function showCooperativeLeaderboard(api, threadID) {
    if (Object.keys(globalCooperatives).length === 0) {
        return api.sendMessage("❌ Chưa có HTX nào được tạo!", threadID);
    }

    const sortedCooperatives = Object.values(globalCooperatives)
        .sort((a, b) => {
            if (b.level !== a.level) return b.level - a.level;
            return b.totalContribution - a.totalContribution;
        })
        .slice(0, 10);

    let leaderboardMsg = "🏆 Bảng Xếp Hạng HTX 🏆\n\n";

    for (let i = 0; i < sortedCooperatives.length; i++) {
        const htx = sortedCooperatives[i];
        const bonus = COOPERATIVE_LEVELS[htx.level];
        leaderboardMsg += `${i + 1}. ${htx.name}\n`;
        leaderboardMsg += `👑 Chủ tịch: ${htx.president.name}\n`;
        leaderboardMsg += `👥 Thành viên: ${htx.members.length}/${bonus.maxMembers}\n`;
        leaderboardMsg += `🏆 Level: ${htx.level} (x${bonus.bonusYield} sản lượng)\n`;
        leaderboardMsg += `💰 Tổng đóng góp: ${htx.totalContribution} xu\n`;
        leaderboardMsg += `📅 Ngày thành lập: ${new Date(htx.createdAt).toLocaleDateString()}\n\n`;
    }

    api.sendMessage(leaderboardMsg, threadID);
}

async function disbandCooperative(api, threadID, uid) {
    const htx = getCooperative(threadID, uid);
    if (!htx) {
        return api.sendMessage("❌ Bạn chưa tham gia HTX nào!", threadID);
    }

    if (htx.president.id !== uid) {
        return api.sendMessage("❌ Chỉ chủ tịch mới có quyền giải tán HTX!", threadID);
    }

    return api.sendMessage(
        `⚠️ Bạn có chắc muốn giải tán HTX "${htx.name}"?\n` +
        "👥 Tất cả thành viên sẽ bị kick và HTX sẽ bị xóa.\n\n" +
        "💡 Reply 'confirm' để xác nhận giải tán.",
        threadID,
        (error, info) => {
            global.Seiko.onReply.push({
                name: this.config.name,
                messageID: info.messageID,
                author: uid,
                type: "disbandConfirm",
                htxId: htx.id,
                htxName: htx.name
            });
        }
    );
}

async function showLeaderboard(api, threadID, Users) {
    const sortedPlayers = Object.entries(playerData)
        .sort(([, a], [, b]) => b.exp - a.exp)
        .slice(0, 10);

    let leaderboardMsg = "🏆 Bảng Xếp Hạng Cá Nhân 🏆\n\n";

    for (let i = 0; i < sortedPlayers.length; i++) {
        const [uid, data] = sortedPlayers[i];
        const name = await Users.getNameUser(uid);
        const { currentTitle } = getTitle(data.level);
        leaderboardMsg += `${i + 1}. ${name} - ${currentTitle}\n   💪 Level: ${data.level} | ✨ EXP: ${data.exp}\n`;
    }

    leaderboardMsg += "\n💡 Gõ 'farm level' để xem thông tin chi tiết của bạn!";

    api.sendMessage(leaderboardMsg, threadID);
}

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        return `${hours} giờ ${minutes % 60} phút`;
    } else if (minutes > 0) {
        return `${minutes} phút`;
    } else {
        return `${seconds} giây`;
    }
}

function calculateLevel(exp) {
    return Math.floor(Math.sqrt(exp / 100)) + 1;
}

async function plantCrop(api, threadID, uid, cropName, Currencies) {
    if (!CROPS[cropName]) {
        return api.sendMessage("🚫 Cây trồng không hợp lệ! Vui lòng kiểm tra lại tên cây.", threadID);
    }
    
    if (!playerData[uid]) {
        playerData[uid] = { exp: 0, level: 1 };
    }
    const maxCrops = playerData[uid].level * 2;
    const currentCrops = Object.keys(plantSchema[uid] || {}).length;

    if (currentCrops >= maxCrops) {
        return api.sendMessage(`🚫 Bạn đã đạt giới hạn cây trồng cho level hiện tại. Hãy thu hoạch hoặc nâng cấp để trồng thêm!`, threadID);
    }

    if (plantSchema[uid] && plantSchema[uid][cropName]) {
        return api.sendMessage(`🌱 Bạn đã trồng ${CROPS[cropName].emoji} ${CROPS[cropName].name} rồi! Hãy đợi nó lớn lên nhé.`, threadID);
    }
    
    const userMoney = await Currencies.getData(uid);
    const cropPrice = CROPS[cropName].price;
    
    if (userMoney.money < cropPrice) {
        return api.sendMessage(`💰 Bạn không đủ tiền để mua hạt giống ${CROPS[cropName].emoji} ${CROPS[cropName].name}.\n🪙 Giá: ${cropPrice} xu\n💸 Số dư của bạn: ${userMoney.money} xu`, threadID);
    }
    
    await Currencies.decreaseMoney(uid, cropPrice);
    if (!plantSchema[uid]) plantSchema[uid] = {};
    plantSchema[uid][cropName] = { 
        plantedTime: Date.now(),
        fertilizer: null
    };

    const bonus = getCooperativeBonus(threadID);
    const [minYield, maxYield] = CROPS[cropName].yield;
    const adjustedMinYield = Math.floor(minYield * bonus.yieldBonus);
    const adjustedMaxYield = Math.floor(maxYield * bonus.yieldBonus);
    const avgYield = (adjustedMinYield + adjustedMaxYield) / 2;
    const adjustedExp = Math.floor(CROPS[cropName].exp * avgYield * bonus.expBonus);

    saveData();
    api.sendMessage(`
🌱 Trồng cây thành công!
${CROPS[cropName].emoji} Cây: ${CROPS[cropName].name}
💰 Chi phí: ${cropPrice} xu
⏳ Thời gian thu hoạch: ${formatTime(CROPS[cropName].growTime)}
📦 Sản lượng dự kiến: ${adjustedMinYield} - ${adjustedMaxYield} (Hệ số HTX: x${bonus.yieldBonus.toFixed(2)})
✨ EXP dự kiến: ${adjustedExp} (Hệ số HTX: x${bonus.expBonus.toFixed(2)})
💡 Mẹo: Sử dụng phân bón để tăng tốc sinh trưởng và sản lượng!
    `, threadID);
}

async function plantAllCrops(api, threadID, uid, Currencies) {
    try {
        if (!playerData[uid]) {
            playerData[uid] = { exp: 0, level: 1 };
        }
        
        const maxCrops = playerData[uid].level * 2;
        const currentCrops = Object.keys(plantSchema[uid] || {}).length;
        const availableSlots = maxCrops - currentCrops;

        if (availableSlots <= 0) {
            return api.sendMessage(`🚫 Bạn đã đạt giới hạn cây trồng cho level hiện tại. Hãy thu hoạch hoặc nâng cấp để trồng thêm!`, threadID);
        }

        const userMoney = await Currencies.getData(uid);
        let totalCost = 0;
        let cropsToPlant = [];

        for (let cropName in CROPS) {
            if (!plantSchema[uid] || !plantSchema[uid][cropName]) {
                if (userMoney.money >= CROPS[cropName].price + totalCost) {
                    cropsToPlant.push(cropName);
                    totalCost += CROPS[cropName].price;
                    if (cropsToPlant.length >= availableSlots) break;
                }
            }
        }

        if (cropsToPlant.length === 0) {
            return api.sendMessage(`💰 Bạn không đủ tiền để trồng thêm cây nào.`, threadID);
        }

        await Currencies.decreaseMoney(uid, totalCost);
        if (!plantSchema[uid]) plantSchema[uid] = {};

        const bonus = getCooperativeBonus(threadID);

        let plantedMessage = `🌱 Đã trồng thành công ${cropsToPlant.length} loại cây:\n`;
        for (let crop of cropsToPlant) {
            plantSchema[uid][crop] = { 
                plantedTime: Date.now(),
                fertilizer: null
            };
            const [minYield, maxYield] = CROPS[crop].yield;
            const adjustedMinYield = Math.floor(minYield * bonus.yieldBonus);
            const adjustedMaxYield = Math.floor(maxYield * bonus.yieldBonus);
            const avgYield = (adjustedMinYield + adjustedMaxYield) / 2;
            const adjustedExp = Math.floor(CROPS[crop].exp * avgYield * bonus.expBonus);
            plantedMessage += `${CROPS[crop].emoji} ${CROPS[crop].name} (Sản lượng dự kiến: ${adjustedMinYield} - ${adjustedMaxYield}, EXP dự kiến: ${adjustedExp})\n`;
        }

        plantedMessage += `\n💰 Tổng chi phí: ${totalCost} xu`;
        plantedMessage += `\n⏳ Kiểm tra thời gian thu hoạch bằng lệnh 'farm info'`;

        saveData();
        api.sendMessage(plantedMessage, threadID);
    } catch (error) {
        console.error("Error in plantAllCrops:", error);
        api.sendMessage(`❌ Đã xảy ra lỗi khi trồng cây: ${error.message}`, threadID);
    }
}

function harvestCrop(api, threadID, uid, cropName) {
    if (!plantSchema[uid] || !plantSchema[uid][cropName]) return api.sendMessage(`🚫 Bạn chưa trồng ${CROPS[cropName].emoji} ${CROPS[cropName].name}!`, threadID);
    
    const now = Date.now();
    const crop = plantSchema[uid][cropName];
    const fertilizer = crop.fertilizer ? FERTILIZERS[crop.fertilizer] : null;

    let harvestTime = CROPS[cropName].growTime;
    let [minYield, maxYield] = CROPS[cropName].yield;

    if (fertilizer) {
        harvestTime *= (1 - fertilizer.timeReduction);
        minYield = Math.floor(minYield * (1 + fertilizer.yieldIncrease));
        maxYield = Math.floor(maxYield * (1 + fertilizer.yieldIncrease));
    }

    if (now - crop.plantedTime < harvestTime) {
        const timeLeft = harvestTime - (now - crop.plantedTime);
        return api.sendMessage(`
⏳ ${CROPS[cropName].emoji} ${CROPS[cropName].name} chưa sẵn sàng để thu hoạch!
⌛ Thời gian còn lại: ${formatTime(timeLeft)}
        `, threadID);
    }
    
    if (!plantSchema[uid].inventory) plantSchema[uid].inventory = {};
    if (!plantSchema[uid].inventory[cropName]) plantSchema[uid].inventory[cropName] = 0;

    const randomYield = Math.floor(Math.random() * (maxYield - minYield + 1)) + minYield;
    plantSchema[uid].inventory[cropName] += randomYield;
    delete plantSchema[uid][cropName];

    const expGain = CROPS[cropName].exp * randomYield;
    const bonus = getCooperativeBonus(threadID);
    const adjustedExp = Math.floor(expGain * bonus.expBonus);
    const levelUpMessage = updateExpAndLevel(uid, adjustedExp);

    saveData();
    let message = `
🎉 Thu hoạch thành công!
${CROPS[cropName].emoji} Cây: ${CROPS[cropName].name}
📦 Số lượng: ${randomYield}
💼 Đã thêm vào kho của bạn.
📊 EXP nhận được: ${adjustedExp}
    `;

    if (levelUpMessage) {
        message += levelUpMessage;
    }

    api.sendMessage(message, threadID);
}

function harvestAllCrops(api, threadID, uid) {
    try {
        if (!plantSchema[uid]) {
            return api.sendMessage("Bạn chưa trồng cây nào cả!", threadID);
        }

        let harvestedCrops = [];
        let totalExp = 0;

        for (let cropName in plantSchema[uid]) {
            if (CROPS[cropName]) {
                const crop = plantSchema[uid][cropName];
                const fertilizer = crop.fertilizer ? FERTILIZERS[crop.fertilizer] : null;
                let growTime = CROPS[cropName].growTime;
                let [minYield, maxYield] = CROPS[cropName].yield;

                if (fertilizer) {
                    growTime *= (1 - fertilizer.timeReduction);
                    minYield = Math.floor(minYield * (1 + fertilizer.yieldIncrease));
                    maxYield = Math.floor(maxYield * (1 + fertilizer.yieldIncrease));
                }

                if (Date.now() - crop.plantedTime >= growTime) {
                    if (!plantSchema[uid].inventory) plantSchema[uid].inventory = {};
                    if (!plantSchema[uid].inventory[cropName]) plantSchema[uid].inventory[cropName] = 0;

                    const bonus = getCooperativeBonus(threadID);
                    const adjustedMinYield = Math.floor(minYield * bonus.yieldBonus);
                    const adjustedMaxYield = Math.floor(maxYield * bonus.yieldBonus);
                    const randomYield = Math.floor(Math.random() * (adjustedMaxYield - adjustedMinYield + 1)) + adjustedMinYield;

                    plantSchema[uid].inventory[cropName] += randomYield;

                    const expGain = CROPS[cropName].exp * randomYield;
                    const adjustedExp = Math.floor(expGain * bonus.expBonus);
                    totalExp += adjustedExp;

                    harvestedCrops.push(`${CROPS[cropName].emoji} ${CROPS[cropName].name}: ${randomYield}`);
                    delete plantSchema[uid][cropName];
                }
            }
        }

        if (harvestedCrops.length === 0) {
            return api.sendMessage("Không có cây nào sẵn sàng để thu hoạch!", threadID);
        }

        const levelUpMessage = updateExpAndLevel(uid, totalExp);

        let message = `
🎉 Thu hoạch thành công!
${harvestedCrops.join("\n")}

📊 EXP nhận được: ${totalExp}
        `;

        if (levelUpMessage) {
            message += `\n${levelUpMessage}`;
        }

        saveData();
        api.sendMessage(message, threadID);
    } catch (error) {
        console.error("Error in harvestAllCrops:", error);
        api.sendMessage(`❌ Đã xảy ra lỗi khi thu hoạch: ${error.message}`, threadID);
    }
}

async function feedAnimal(api, threadID, uid, animalName, Currencies) {
    if (!ANIMALS[animalName]) return api.sendMessage("🚫 Động vật không hợp lệ! Vui lòng kiểm tra lại tên động vật.", threadID);
    
    const now = Date.now();
    if (cooldowns[uid] && cooldowns[uid][animalName] && now - cooldowns[uid][animalName] < ANIMALS[animalName].feedTime) {
        const timeLeft = ANIMALS[animalName].feedTime - (now - cooldowns[uid][animalName]);
        return api.sendMessage(`
⏳ ${ANIMALS[animalName].emoji} ${ANIMALS[animalName].name} chưa đói!
⌛ Thời gian chờ: ${formatTime(timeLeft)}
        `, threadID);
    }
    
    const feedCost = ANIMALS[animalName].feedCost;
    const userMoney = await Currencies.getData(uid);
    
    if (userMoney.money < feedCost) {
        return api.sendMessage(`
💰 Bạn không đủ tiền để cho ${ANIMALS[animalName].emoji} ${ANIMALS[animalName].name} ăn.
🪙 Chi phí: ${feedCost} xu
💸 Số dư của bạn: ${userMoney.money} xu
        `, threadID);
    }
    
    await Currencies.decreaseMoney(uid, feedCost);
    if (!cooldowns[uid]) cooldowns[uid] = {};
    cooldowns[uid][animalName] = now;
    if (!plantSchema[uid]) plantSchema[uid] = {};
    if (!plantSchema[uid].inventory) plantSchema[uid].inventory = {};
    const productKey = ANIMALS[animalName].product;

    const [minProduct, maxProduct] = ANIMALS[animalName].productAmount;
    const randomProduct = Math.floor(Math.random() * (maxProduct - minProduct + 1)) + minProduct;

    if (!plantSchema[uid].inventory[productKey]) plantSchema[uid].inventory[productKey] = 0;
    plantSchema[uid].inventory[productKey] += randomProduct;

    const expGain = ANIMALS[animalName].exp * randomProduct;
    const bonus = getCooperativeBonus(threadID);
    const adjustedExp = Math.floor(expGain * bonus.expBonus);
    const levelUp = updateExpAndLevel(uid, adjustedExp);

    saveData();
    let message = `
🍽️ Cho ăn thành công!
${ANIMALS[animalName].emoji} Động vật: ${ANIMALS[animalName].name}
${ANIMALS[animalName].productEmoji} Nhận được: ${randomProduct} ${ANIMALS[animalName].productName}
💰 Chi phí: ${feedCost} xu
⏳ Thời gian chờ tiếp theo: ${formatTime(ANIMALS[animalName].feedTime)}
📊 EXP nhận được: ${adjustedExp}
    `;

    if (levelUp) {
        message += `\n🎊 Chúc mừng! Bạn đã lên level ${playerData[uid].level}!`;
    }

    api.sendMessage(message, threadID);
}

async function feedAllAnimals(api, threadID, uid, Currencies) {
    try {
        if (!playerData[uid]) {
            playerData[uid] = { exp: 0, level: 1 };
        }

        const now = Date.now();
        let fedAnimals = [];
        let totalExp = 0;
        let totalFeedCost = 0;

        for (let animalName in ANIMALS) {
            if (!cooldowns[uid] || !cooldowns[uid][animalName] || now - cooldowns[uid][animalName] >= ANIMALS[animalName].feedTime) {
                const feedCost = ANIMALS[animalName].feedCost;
                totalFeedCost += feedCost;

                if (!cooldowns[uid]) cooldowns[uid] = {};
                cooldowns[uid][animalName] = now;
                if (!plantSchema[uid]) plantSchema[uid] = {};
                if (!plantSchema[uid].inventory) plantSchema[uid].inventory = {};
                const productKey = ANIMALS[animalName].product;

                const bonus = getCooperativeBonus(threadID);
                const [minProduct, maxProduct] = ANIMALS[animalName].productAmount;
                const adjustedMinProduct = Math.floor(minProduct * bonus.yieldBonus);
                const adjustedMaxProduct = Math.floor(maxProduct * bonus.yieldBonus);
                const randomProduct = Math.floor(Math.random() * (adjustedMaxProduct - adjustedMinProduct + 1)) + adjustedMinProduct;

                if (!plantSchema[uid].inventory[productKey]) plantSchema[uid].inventory[productKey] = 0;
                plantSchema[uid].inventory[productKey] += randomProduct;

                const expGain = ANIMALS[animalName].exp * randomProduct;
                const adjustedExp = Math.floor(expGain * bonus.expBonus);
                totalExp += adjustedExp;

                fedAnimals.push(`${ANIMALS[animalName].emoji} ${ANIMALS[animalName].name}: ${randomProduct} ${ANIMALS[animalName].productName}`);
            }
        }

        if (fedAnimals.length === 0) {
            return api.sendMessage("Tất cả động vật đã được cho ăn!", threadID);
        }

        const userMoney = await Currencies.getData(uid);
        if (userMoney.money < totalFeedCost) {
            return api.sendMessage(`
💰 Bạn không đủ tiền để cho tất cả động vật ăn.
🪙 Chi phí: ${totalFeedCost} xu
💸 Số dư của bạn: ${userMoney.money} xu
            `, threadID);
        }

        await Currencies.decreaseMoney(uid, totalFeedCost);
        const levelUpMessage = updateExpAndLevel(uid, totalExp);

        let message = `
🍽️ Cho ăn thành công!
${fedAnimals.join("\n")}

💰 Tổng chi phí: ${totalFeedCost} xu
📊 EXP nhận được: ${totalExp}
        `;

        if (levelUpMessage) {
            message += `\n${levelUpMessage}`;
        }

        saveData();
        api.sendMessage(message, threadID);
    } catch (error) {
        console.error("Error in feedAllAnimals:", error);
        api.sendMessage(`❌ Đã xảy ra lỗi khi cho ăn: ${error.message}`, threadID);
    }
}

function showField(api, threadID, uid) {
    let fieldStatus = "🏡 Trang trại của bạn:\n---------------\n";
    fieldStatus += "🌱 Cây trồng:\n";
    for (let crop in plantSchema[uid]) {
        if (CROPS[crop]) {
            const plantedCrop = plantSchema[uid][crop];
            const fertilizer = plantedCrop.fertilizer ? FERTILIZERS[plantedCrop.fertilizer] : null;
            let growTime = CROPS[crop].growTime;
            if (fertilizer) {
                growTime *= (1 - fertilizer.timeReduction);
            }
            const timeLeft = growTime - (Date.now() - plantedCrop.plantedTime);
            fieldStatus += `${CROPS[crop].emoji} ${CROPS[crop].name}: ${timeLeft > 0 ? formatTime(timeLeft) : "✅ Sẵn sàng thu hoạch!"}`;
            if (fertilizer) {
                fieldStatus += ` (${fertilizer.emoji})`;
            }
            fieldStatus += '\n';
        }
    }
    fieldStatus += "---------------\n";
    fieldStatus += "🐾 Động vật:\n";
    for (let animal in ANIMALS) {
        const timeLeft = ANIMALS[animal].feedTime - (Date.now() - (cooldowns[uid]?.[animal] || 0));
        fieldStatus += `${ANIMALS[animal].emoji} ${ANIMALS[animal].name}: ${timeLeft > 0 ? formatTime(timeLeft) : "🍽️ Cần cho ăn!"}\n`;
    }

    const level = playerData[uid]?.level || 1;
    const exp = playerData[uid]?.exp || 0;
    const nextLevelExp = (level * level * 100);
    const progressToNextLevel = Math.floor((exp / nextLevelExp) * 100);

    fieldStatus += `\n---------------\n`;
    fieldStatus += `📊 Level: ${level}\n`;
    fieldStatus += `📈 EXP: ${exp}/${nextLevelExp} (${progressToNextLevel}%)\n`;
    fieldStatus += `🌱 Số cây đang trồng: ${Object.keys(plantSchema[uid] || {}).length}/${level * 2}\n`;

    api.sendMessage(fieldStatus, threadID);
}

async function showInventory(api, threadID, uid, Currencies) {
    if (!plantSchema[uid]?.inventory) plantSchema[uid].inventory = {};
    let inv = "💼 Kho của bạn:\n---------------\n";
    inv += "🌾 Nông sản:\n";
    for (let item in plantSchema[uid].inventory) {
        const cropInfo = CROPS[item];
        if (cropInfo) {
            inv += `${cropInfo.emoji} ${cropInfo.name}: ${plantSchema[uid].inventory[item]}\n`;
        }
    }
    inv += "---------------\n";
    inv += "🥚 Sản phẩm động vật:\n";
    for (let item in plantSchema[uid].inventory) {
        const animalInfo = Object.values(ANIMALS).find(animal => animal.product === item);
        if (animalInfo) {
            inv += `${animalInfo.productEmoji} ${animalInfo.productName}: ${plantSchema[uid].inventory[item]}\n`;
        }
    }
    const userMoney = await Currencies.getData(uid);
    inv += `\n💰 Số tiền: ${userMoney.money} xu`;
    api.sendMessage(inv, threadID);
}

function showShop(api, threadID) {
    let shopList = "🏪 Cửa hàng Nông Trại 🏪\n\n";
    
    shopList += "🌱 Cây trồng:\n";
    for (let cropId in CROPS) {
        const crop = CROPS[cropId];
        shopList += `${crop.emoji} ${crop.name} (ID: ${cropId}) - 💰 ${crop.price} xu\n`;
    }
    
    shopList += "\n🐾 Động vật:\n";
    for (let animalId in ANIMALS) {
        const animal = ANIMALS[animalId];
        shopList += `${animal.emoji} ${animal.name} (ID: ${animalId}) - 💰 ${animal.feedCost} xu/lần cho ăn\n`;
    }

    shopList += "\n🧪 Phân bón:\n";
    for (let fertilizerId in FERTILIZERS) {
        const fertilizer = FERTILIZERS[fertilizerId];
        shopList += `${fertilizer.emoji} ${fertilizer.name} (ID: ${fertilizerId}) - 💰 ${fertilizer.price} xu\n`;
    }
    
    shopList += "\nℹ️ Thông tin chi tiết:\n";
    shopList += "Gõ 'farm crops' để xem thông tin cây trồng\n";
    shopList += "Gõ 'farm animals' để xem thông tin động vật\n";
    shopList += "Gõ 'farm fertilizers' để xem thông tin phân bón\n";

    shopList += "\n🛒 Hướng dẫn mua hàng:\n";
    shopList += "• Mua hạt giống: 'farm trong [ID cây]'\n";
    shopList += "• Cho động vật ăn: 'farm choan [ID động vật]'\n";
    shopList += "• Sử dụng phân bón: 'farm bonphan [ID cây] [ID phân bón]'\n";

    api.sendMessage(shopList, threadID);
}

function showCropsInfo(api, threadID) {
    let cropInfo = "🌱 Thông tin cây trồng:\n\n";
    for (let cropId in CROPS) {
        const crop = CROPS[cropId];
        cropInfo += `${crop.emoji} ${crop.name} (ID: ${cropId})\n`;
        cropInfo += `   💰 Giá mua: ${crop.price} xu\n`;
        cropInfo += `   🕒 Thời gian trồng: ${formatTime(crop.growTime)}\n`;
        cropInfo += `   📦 Sản lượng: ${crop.yield[0]} - ${crop.yield[1]}\n`;
        cropInfo += `   💵 Giá bán: ${Math.floor(crop.price * 0.8)} xu/1\n`;
        cropInfo += `   🌟 EXP: ${crop.exp}\n\n`;
    }
    api.sendMessage(cropInfo, threadID);
}

function showAnimalsInfo(api, threadID) {
    let animalInfo = "🐾 Thông tin động vật:\n\n";
    for (let animalId in ANIMALS) {
        const animal = ANIMALS[animalId];
        animalInfo += `${animal.emoji} ${animal.name} (ID: ${animalId})\n`;
        animalInfo += `   💰 Chi phí cho ăn: ${animal.feedCost} xu/lần\n`;
        animalInfo += `   🕒 Thời gian cho ăn: ${formatTime(animal.feedTime)}\n`;
        animalInfo += `   📦 Sản lượng: ${animal.productAmount[0]} - ${animal.productAmount[1]} ${animal.productName}\n`;
        animalInfo += `   💵 Giá bán: ${animal.price} xu/${animal.productName}\n`;
        animalInfo += `   🌟 EXP: ${animal.exp}\n\n`;
    }
    api.sendMessage(animalInfo, threadID);
}

function showFertilizersInfo(api, threadID) {
    let fertilizerInfo = "🧪 Thông tin phân bón:\n\n";
    for (let fertilizerId in FERTILIZERS) {
        const fertilizer = FERTILIZERS[fertilizerId];
        fertilizerInfo += `${fertilizer.emoji} ${fertilizer.name} (ID: ${fertilizerId})\n`;
        fertilizerInfo += `   💰 Giá mua: ${fertilizer.price} xu\n`;
        fertilizerInfo += `   ⏰ Giảm thời gian trồng: ${fertilizer.timeReduction * 100}%\n`;
        fertilizerInfo += `   📈 Tăng sản lượng: ${fertilizer.yieldIncrease * 100}%\n\n`;
    }
    api.sendMessage(fertilizerInfo, threadID);
}

async function sellItem(api, threadID, uid, itemName, quantity, Currencies) {
    if (!plantSchema[uid] || !plantSchema[uid].inventory) {
        return api.sendMessage("❌ Bạn chưa có kho đồ nào. Hãy trồng cây hoặc nuôi động vật trước!", threadID);
    }
    
    let item;
    let itemKey;
    let isAnimalProduct = false;

    const normalizedItemName = itemName.toLowerCase().trim();
    quantity = parseInt(quantity);

    if (isNaN(quantity) || quantity <= 0) {
        return api.sendMessage("❌ Số lượng không hợp lệ. Vui lòng nhập một số dương.", threadID);
    }

    for (let crop in CROPS) {
        if (CROPS[crop].name.toLowerCase() === normalizedItemName) {
            item = CROPS[crop];
            itemKey = crop;
            break;
        }
    }

    if (!item) {
        for (let animal in ANIMALS) {
            if (ANIMALS[animal].productName.toLowerCase() === normalizedItemName || 
                ANIMALS[animal].product.toLowerCase() === normalizedItemName) {
                item = ANIMALS[animal];
                itemKey = ANIMALS[animal].product;
                isAnimalProduct = true;
                break;
            }
        }
    }

    if (!item) {
        return api.sendMessage(`❌ Không tìm thấy sản phẩm "${itemName}" trong cửa hàng!`, threadID);
    }

    const inventory = plantSchema[uid].inventory[itemKey] || 0;

    if (inventory < quantity) {
        return api.sendMessage(`❌ Bạn không đủ ${item.name || item.productName} để bán!
📦 Trong kho: ${inventory}
🛒 Muốn bán: ${quantity}`, threadID);
    }

    const price = isAnimalProduct ? item.price : Math.floor(item.price * 1.5);

    if (typeof price !== 'number' || isNaN(price)) {
        console.error(`Invalid price for item: ${itemName}, price: ${price}`);
        return api.sendMessage("❌ Có lỗi xảy ra khi tính giá sản phẩm. Vui lòng thử lại sau.", threadID);
    }

    const totalPrice = price * quantity;

    if (isNaN(totalPrice) || !isFinite(totalPrice)) {
        return api.sendMessage("❌ Có lỗi xảy ra khi tính tổng giá. Vui lòng thử lại sau.", threadID);
    }

    try {
        plantSchema[uid].inventory[itemKey] -= quantity;
        await Currencies.increaseMoney(uid, totalPrice);
        saveData();

        const itemEmoji = isAnimalProduct ? item.productEmoji : item.emoji;
        const itemDisplayName = isAnimalProduct ? item.productName : item.name;
        
        const userMoney = await Currencies.getData(uid);
        const newBalance = userMoney.money;

        const successMessage = `
💰 Bán hàng thành công!
${itemEmoji} Sản phẩm: ${itemDisplayName}
📦 Số lượng: ${quantity}
💵 Giá bán: ${price} xu/1
🪙 Tổng thu: ${totalPrice} xu
💼 Còn lại trong kho: ${plantSchema[uid].inventory[itemKey]}
💰 Số dư mới: ${newBalance} xu
        `;

        api.sendMessage(successMessage, threadID);
    } catch (error) {
        api.sendMessage("❌ Có lỗi xảy ra trong quá trình bán hàng. Vui lòng thử lại sau.", threadID);
    }
}

async function sellAllItems(api, threadID, uid, Currencies) {
    if (!plantSchema[uid] || !plantSchema[uid].inventory || Object.keys(plantSchema[uid].inventory).length === 0) {
        return api.sendMessage("Kho của bạn trống, không có gì để bán!", threadID);
    }

    let totalEarnings = 0;
    let soldItems = [];

    for (let itemKey in plantSchema[uid].inventory) {
        const quantity = plantSchema[uid].inventory[itemKey];
        let item, price;

        if (CROPS[itemKey]) {
            item = CROPS[itemKey];
            price = Math.floor(item.price * 1.5);
        } else {
            const animalProduct = Object.values(ANIMALS).find(animal => animal.product === itemKey);
            if (animalProduct) {
                item = animalProduct;
                price = item.price;
            }
        }

        if (item && price) {
            const earnings = price * quantity;
            totalEarnings += earnings;
            soldItems.push({
                name: item.name || item.productName,
                emoji: item.emoji || item.productEmoji,
                quantity: quantity,
                earnings: earnings
            });
            delete plantSchema[uid].inventory[itemKey];
        }
    }

    if (soldItems.length === 0) {
        return api.sendMessage("Không có vật phẩm nào có thể bán!", threadID);
    }

    await Currencies.increaseMoney(uid, totalEarnings);
    saveData();

    let message = "🎉 Đã bán tất cả vật phẩm trong kho:\n\n";
    for (let item of soldItems) {
        message += `${item.emoji} ${item.name}: ${item.quantity} cái - ${item.earnings} xu\n`;
    }
    message += `\n💰 Tổng thu: ${totalEarnings} xu`;

    const userMoney = await Currencies.getData(uid);
    message += `\n💼 Số dư mới: ${userMoney.money} xu`;

    api.sendMessage(message, threadID);
}

async function useFertilizer(api, threadID, uid, cropName, fertilizerName, Currencies) {
    if (!plantSchema[uid] || !plantSchema[uid][cropName]) {
        return api.sendMessage(`❌ Bạn chưa trồng ${CROPS[cropName].name}!`, threadID);
    }

    if (plantSchema[uid][cropName].fertilizer) {
        return api.sendMessage(`❌ Bạn đã sử dụng phân bón cho ${CROPS[cropName].name} rồi!`, threadID);
    }

    const fertilizer = FERTILIZERS[fertilizerName];
    if (!fertilizer) {
        return api.sendMessage(`❌ Loại phân bón không hợp lệ!`, threadID);
    }

    const userMoney = await Currencies.getData(uid);
    if (userMoney.money < fertilizer.price) {
        return api.sendMessage(`❌ Bạn không đủ tiền để mua ${fertilizer.name}!`, threadID);
    }

    await Currencies.decreaseMoney(uid, fertilizer.price);
    plantSchema[uid][cropName].fertilizer = fertilizerName;
    saveData();

    api.sendMessage(`
✅ Đã sử dụng ${fertilizer.emoji} ${fertilizer.name} cho ${CROPS[cropName].emoji} ${CROPS[cropName].name}!
🚀 Thời gian sinh trưởng giảm ${fertilizer.timeReduction * 100}%
📈 Sản lượng tăng ${fertilizer.yieldIncrease * 100}%
    `, threadID);
}

async function fertilizeAllCrops(api, threadID, uid, fertilizerName, Currencies) {
    if (!plantSchema[uid] || Object.keys(plantSchema[uid]).length === 0) {
        return api.sendMessage("Bạn chưa trồng cây nào cả!", threadID);
    }

    const fertilizer = FERTILIZERS[fertilizerName];
    if (!fertilizer) {
        return api.sendMessage(`❌ Loại phân bón không hợp lệ!`, threadID);
    }

    const userMoney = await Currencies.getData(uid);
    const totalCrops = Object.keys(plantSchema[uid]).filter(crop => CROPS[crop] && !plantSchema[uid][crop].fertilizer).length;
    const totalCost = fertilizer.price * totalCrops;

    if (userMoney.money < totalCost) {
        return api.sendMessage(`❌ Bạn không đủ tiền để bón phân cho tất cả cây! Cần ${totalCost} xu.`, threadID);
    }

    let fertilizedCrops = [];
    for (let cropName in plantSchema[uid]) {
        if (CROPS[cropName] && !plantSchema[uid][cropName].fertilizer) {
            plantSchema[uid][cropName].fertilizer = fertilizerName;
            fertilizedCrops.push(CROPS[cropName].name);
        }
    }

    if (fertilizedCrops.length === 0) {
        return api.sendMessage("Không có cây nào cần bón phân!", threadID);
    }

    await Currencies.decreaseMoney(uid, totalCost);
    saveData();

    const message = `
✅ Đã sử dụng ${fertilizer.emoji} ${fertilizer.name} cho ${fertilizedCrops.length} cây:
${fertilizedCrops.join(", ")}
💰 Tổng chi phí: ${totalCost} xu
🚀 Thời gian sinh trưởng giảm ${fertilizer.timeReduction * 100}%
📈 Sản lượng tăng ${fertilizer.yieldIncrease * 100}%
    `;

    api.sendMessage(message, threadID);
}

function showLevelInfo(api, threadID, uid) {
    if (!playerData[uid]) {
        playerData[uid] = { exp: 0, level: 1 };
    }

    const level = playerData[uid].level;
    const exp = playerData[uid].exp;
    const nextLevelExp = (level * level * 100);
    const progressToNextLevel = Math.floor((exp / nextLevelExp) * 100);
    const { currentTitle, nextTitle, nextTitleLevel } = getTitle(level);

    let infoMessage = `
📊 Thông tin Level của bạn:

🏆 Level hiện tại: ${level}
🎖️ Danh hiệu: ${currentTitle}
📈 EXP hiện tại: ${exp}
🎯 EXP cần để lên level tiếp theo: ${nextLevelExp}
🌟 Tiến độ: ${progressToNextLevel}%
🌱 Số cây có thể trồng: ${level * 2}

`;

    if (nextTitle) {
        infoMessage += `🔜 Danh hiệu tiếp theo: ${nextTitle} (Level ${nextTitleLevel})\n`;
    }

    infoMessage += `
💡 Mẹo: 
- Thu hoạch cây trồng để nhận EXP. Cây trồng lâu hơn thường cho nhiều EXP hơn.
- Chăm sóc động vật thường xuyên. Động vật lớn hơn cho nhiều EXP hơn mỗi lần cho ăn.
- Cân nhắc giữa thời gian đầu tư và EXP nhận được để tối ưu hóa việc nâng cấp.
- Hãy cố gắng đạt được danh hiệu cao nhất!
    `;

    api.sendMessage(infoMessage, threadID);
}

function updateExpAndLevel(uid, expGain) {
    if (!playerData[uid]) {
        playerData[uid] = { exp: 0, level: 1 };
    }
    const oldLevel = playerData[uid].level;
    playerData[uid].exp += expGain;
    const newLevel = calculateLevel(playerData[uid].exp);
    const { currentTitle: oldTitle } = getTitle(oldLevel);
    const { currentTitle: newTitle } = getTitle(newLevel);
    let levelUpMessage = "";

    if (newLevel > oldLevel) {
        playerData[uid].level = newLevel;
        levelUpMessage = `\n🎊 Chúc mừng! Bạn đã lên level ${newLevel}!`;
        if (newTitle !== oldTitle) {
            levelUpMessage += `\n🎖️ Bạn đã đạt được danh hiệu mới: ${newTitle}`;
        }
        return levelUpMessage;
    }
    return "";
}

async function createCooperative(api, threadID, uid, name, Users) {
    const threadHTXs = Object.values(globalCooperatives).filter(htx => htx.threadID === threadID);
    if (threadHTXs.length >= 3) {
        return api.sendMessage("❌ Nhóm đã đạt giới hạn tối đa 3 HTX!", threadID);
    }
    const userHTX = Object.values(globalCooperatives).find(htx => 
        htx.president.id === uid || htx.members.some(m => m.id === uid)
    );
    if (userHTX) {
        return api.sendMessage("❌ Bạn đã có HTX hoặc đang là thành viên của một HTX khác!", threadID);
    }
    if (Object.values(globalCooperatives).some(htx => htx.name === name)) {
        return api.sendMessage("❌ Tên HTX đã tồn tại! Vui lòng chọn tên khác.", threadID);
    }

    const userName = await Users.getNameUser(uid);
    const htxId = Date.now().toString();
    const newHTX = {
        id: htxId,
        name: name,
        threadID: threadID, 
        president: {
            id: uid,
            name: userName
        },
        members: [{
            id: uid,
            name: userName,
            role: "Chủ tịch",
            joinDate: Date.now(),
            contribution: 0
        }],
        level: 1,
        totalContribution: 0,
        createdAt: Date.now()
    };

    globalCooperatives[htxId] = newHTX;
    if (!cooperatives[threadID]) cooperatives[threadID] = [];
    cooperatives[threadID].push(htxId);
    
    saveData();

    return api.sendMessage(`
🎉 Đã tạo HTX thành công!
🏢 Tên HTX: ${name}
👑 Chủ tịch: ${userName}
🆔 ID HTX: ${htxId}
    `, threadID);
}

async function listCooperatives(api, threadID, senderID) {
    const allHTXs = Object.values(globalCooperatives);    
    if (allHTXs.length === 0) {
        return api.sendMessage("❌ Chưa có HTX nào được tạo!", threadID);
    }
    const userInHTX = allHTXs.some(htx => 
        htx.members.some(member => member.id === senderID)
    );

    if (userInHTX) {
        return api.sendMessage("❌ Bạn đã là thành viên của một HTX khác!", threadID);
    }

    let msg = "📜 Danh sách HTX toàn server:\n\n";
    allHTXs.forEach((htx, index) => {
        const currentLevel = COOPERATIVE_LEVELS[htx.level];
        msg += `${index + 1}. ${htx.name}\n`;
        msg += `👑 Chủ tịch: ${htx.president.name}\n`;
        msg += `👥 Thành viên: ${htx.members.length}/${currentLevel.maxMembers}\n`;
        msg += `🏆 Level: ${htx.level}\n`;
        msg += `📈 Hệ số sản lượng: x${currentLevel.bonusYield}\n`;
        msg += `✨ Hệ số kinh nghiệm: x${currentLevel.bonusExp}\n`;
        msg += `💬 Box gốc: ${htx.threadID}\n\n`;
    });
    
    msg += "💡 Reply số thứ tự để tham gia HTX";
    
    api.sendMessage(msg, threadID, (error, info) => {
        global.Seiko.onReply.push({
            name: this.config.name,
            messageID: info.messageID,
            author: senderID,
            type: "joinHTX",
            cooperatives: allHTXs
        });
    });
}

async function searchCooperative(api, threadID, query) {
    const results = Object.values(globalCooperatives).filter(htx => 
        htx.name.toLowerCase().includes(query.toLowerCase()) || 
        htx.id.includes(query)
    );

    if (results.length === 0) {
        return api.sendMessage("❌ Không tìm thấy HTX nào phù hợp!", threadID);
    }

    let msg = "🔍 Kết quả tìm kiếm:\n\n";
    results.forEach((htx, index) => {
        msg += `${index + 1}. ${htx.name}\n`;
        msg += `👑 Chủ tịch: ${htx.president.name}\n`;
        msg += `👥 Thành viên: ${htx.members.length}\n`;
        msg += `🏆 Level: ${htx.level}\n\n`;
    });

    msg += "💡 Reply số thứ tự để xem thông tin chi tiết và tham gia HTX";

    return api.sendMessage(msg, threadID, (error, info) => {
        global.Seiko.onReply.push({
            name: this.config.name,
            messageID: info.messageID,
            author: event.senderID,
            type: "joinHTX",
            cooperatives: results
        });
    });
}

async function showMembers(api, threadID, uid) {
    const htx = getCooperative(threadID, uid);
    if (!htx) {
        return api.sendMessage("❌ Bạn chưa tham gia HTX nào!", threadID);
    }

    const sortedMembers = [...htx.members].sort((a, b) => b.contribution - a.contribution); 
    let msg = `👥 Danh sách thành viên HTX ${htx.name}:\n\n`;
    sortedMembers.forEach((member, index) => {
        msg += `${index + 1}. ${member.name}\n`;
        msg += `💎 Chức vụ: ${member.role}\n`;
        msg += `💰 Đóng góp: ${member.contribution}$\n`;
        msg += `📅 Ngày tham gia: ${new Date(member.joinDate).toLocaleString()}\n\n`;
    });

    if (htx.president.id === uid) {
        msg += "💡 Reply số thứ tự để kick thành viên";
        return api.sendMessage(msg, threadID, (error, info) => {
            global.Seiko.onReply.push({
                name: this.config.name,
                messageID: info.messageID,
                author: uid,
                type: "kickMember",
                htxId: htx.id,
                members: sortedMembers
            });
        });
    }

    return api.sendMessage(msg, threadID);
}

async function handleJoinRequest(api, threadID, uid, htxIndex, cooperativesList, Users) {
    const htx = cooperativesList[htxIndex];
    if (!htx) {
        return api.sendMessage("❌ HTX không tồn tại!", threadID);
    }

    const userInHTX = Object.values(globalCooperatives).some(h => 
        h.members.some(m => m.id === uid)
    );
    if (userInHTX) {
        return api.sendMessage("❌ Bạn đã là thành viên của một HTX khác!", threadID);
    }

    const currentLevel = COOPERATIVE_LEVELS[htx.level];
    if (htx.members.length >= currentLevel.maxMembers) {
        return api.sendMessage(`❌ HTX đã đạt giới hạn ${currentLevel.maxMembers} thành viên!`, threadID);
    }

    const userName = await Users.getNameUser(uid);
    htx.members.push({
        id: uid,
        name: userName,
        role: "Thành viên",
        joinDate: Date.now(),
        contribution: 0
    });

    globalCooperatives[htx.id] = htx;
    saveData();

    api.sendMessage(
        `✅ Bạn đã tham gia HTX ${htx.name} thành công!\n` +
        `🏢 Level HTX: ${htx.level}\n` +
        `👥 Số thành viên: ${htx.members.length}/${currentLevel.maxMembers}\n` +
        `📈 Hệ số sản lượng: x${currentLevel.bonusYield}\n` +
        `✨ Hệ số kinh nghiệm: x${currentLevel.bonusExp}`,
        threadID
    );

    if (htx.threadID && htx.threadID !== threadID) {
        api.sendMessage(
            `🎉 Chào mừng thành viên mới từ box khác!\n` +
            `👤 Tên: ${userName}\n` +
            `📅 Thời gian tham gia: ${new Date().toLocaleString()}\n` +
            `👥 Tổng số thành viên hiện tại: ${htx.members.length}/${currentLevel.maxMembers}`,
            htx.threadID
        );
    }
}

this.onCall = async function ({ api, event, args, permission, Users, Currencies }) {
    const { threadID, messageID, senderID: uid } = event;
    const commandName = this.config.name;

    if (args.join() == "") {
        return api.sendMessage(
`🌾 Hướng dẫn sử dụng Farm:

⭐ Trồng cây & Thu hoạch:
├─ farm trong <tên cây>: Trồng một loại cây
├─ farm trongall: Trồng tất cả các ô đất trống
├─ farm thuhoach <tên cây>: Thu hoạch một loại cây
├─ farm thuhoachall: Thu hoạch tất cả cây đã chín
└─ farm bonphan <tên cây> or all + <id phân bón>: Bón phân cho cây

🐮 Chăn nuôi:
├─ farm choan <tên thú>: Cho một loại thú ăn
└─ farm choanall: Cho tất cả thú ăn

💰 Mua bán & Kho:
├─ farm shop: Xem cửa hàng
├─ farm kho: Xem kho của bạn
├─ farm ban <tên vật phẩm> <số lượng>: Bán vật phẩm
└─ farm banall: Bán tất cả vật phẩm trong kho

🌟 Thông tin & Nâng cấp:
├─ farm info: Xem thông tin trang trại
├─ farm level: Xem thông tin cấp độ
├─ farm crops: Xem thông tin các loại cây
├─ farm animals: Xem thông tin các loại thú
└─ farm fertilizers: Xem thông tin phân bón

🏢 Hợp tác xã (HTX):
├─ farm htx create <tên>: Tạo HTX mới
├─ farm htx list: Xem danh sách HTX
├─ farm htx info: Xem thông tin HTX của bạn
├─ farm htx members: Xem thành viên HTX
├─ farm htx donate <số tiền>: Đóng góp cho HTX
└─ farm htx disband: Giải tán HTX (chỉ chủ tịch)

🏆 Bảng xếp hạng:
├─ farm top: Xem top nông dân
└─ farm htx top: Xem top HTX

💡 Lưu ý:
• Mỗi người chỉ được tham gia 1 HTX
• Mỗi nhóm tối đa 3 HTX
• Chỉ chủ tịch mới có quyền kick thành viên
• Level HTX càng cao, hệ số thu hoạch càng tốt`, 
        threadID, messageID);
    }

    try {
        const action = args[0].toLowerCase();

        switch (action) {
            case "trong":
                if (!args[1]) {
                    return api.sendMessage("❌ Vui lòng nhập tên cây muốn trồng!", threadID, messageID);
                }
                return plantCrop(api, threadID, uid, args[1], Currencies);
            
            case "trongall":
                return plantAllCrops(api, threadID, uid, Currencies);
            
            case "thuhoach":
                if (!args[1]) {
                    return api.sendMessage("❌ Vui lòng nhập tên cây muốn thu hoạch!", threadID, messageID);
                }
                return harvestCrop(api, threadID, uid, args[1]);
            
            case "thuhoachall":
                return harvestAllCrops(api, threadID, uid);
            
            case "choan":
                if (!args[1]) {
                    return api.sendMessage("❌ Vui lòng nhập tên thú muốn cho ăn!", threadID, messageID);
                }
                return feedAnimal(api, threadID, uid, args[1], Currencies);
            
            case "choanall":
                return feedAllAnimals(api, threadID, uid, Currencies);
            
            case "info":
                return showField(api, threadID, uid);
            
            case "kho":
                return showInventory(api, threadID, uid, Currencies);
            
            case "shop":
                return showShop(api, threadID);
            
            case "crops":
                return showCropsInfo(api, threadID);
            
            case "animals":
                return showAnimalsInfo(api, threadID);
            
            case "fertilizers":
                return showFertilizersInfo(api, threadID);
            
            case "ban":
                if (!args[1]) {
                    return api.sendMessage("❌ Vui lòng nhập tên vật phẩm muốn bán!", threadID, messageID);
                }
                const quantity = parseInt(args[2]) || 1;
                return sellItem(api, threadID, uid, args[1], quantity, Currencies);
            
            case "banall":
                return sellAllItems(api, threadID, uid, Currencies);
            
            case "top":
                return showLeaderboard(api, threadID, Users);
            
            case "htx":
                if (!args[1]) {
                    return api.sendMessage(`
📋 Hướng dẫn sử dụng lệnh HTX:
- farm htx create [tên]: Tạo HTX mới
- farm htx list: Xem danh sách HTX
- farm htx search [từ khóa]: Tìm kiếm HTX
- farm htx members: Xem thành viên HTX
- farm htx info: Xem thông tin HTX
- farm htx donate [số tiền]: Đóng góp cho HTX
- farm htx disband: Rã HTX (chỉ dành cho chủ tịch)`, threadID);
                }
                
                switch (args[1].toLowerCase()) {
                    case "create":
                        if (!args[2]) {
                            return api.sendMessage("❌ Vui lòng nhập tên HTX!", threadID, messageID);
                        }
                        return createCooperative(api, threadID, uid, args.slice(2).join(" "), Users);
                    case "list":
                        return listCooperatives(api, threadID, uid);
                    case "search":
                        if (!args[2]) {
                            return api.sendMessage("❌ Vui lòng nhập từ khóa tìm kiếm!", threadID, messageID);
                        }
                        return searchCooperative(api, threadID, args.slice(2).join(" "));
                    case "members":
                        return showMembers(api, threadID, uid);
                    case "info":
                        return showCooperativeInfo(api, threadID, uid);
                    case "donate":
                        if (!args[2] || isNaN(args[2])) {
                            return api.sendMessage("❌ Vui lòng nhập số tiền đóng góp!", threadID, messageID);
                        }
                        return donateToCooperative(api, threadID, uid, parseInt(args[2]), Currencies);
                    case "disband":
                        return disbandCooperative(api, threadID, uid);
                    default:
                        return api.sendMessage(`
📋 Hướng dẫn sử dụng lệnh HTX:
- farm htx create [tên]: Tạo HTX mới
- farm htx list: Xem danh sách HTX
- farm htx search [từ khóa]: Tìm kiếm HTX
- farm htx members: Xem thành viên HTX
- farm htx info: Xem thông tin HTX
- farm htx donate [số tiền]: Đóng góp cho HTX
- farm htx disband: Rã HTX (chỉ dành cho chủ tịch)`, threadID);
                }
            
            case "bxh":
                if (args[1] === "htx") {
                    return showCooperativeLeaderboard(api, threadID);
                } else {
                    return showLeaderboard(api, threadID, Users);
                }
            
            case "level":
                return showLevelInfo(api, threadID, uid);
            
            case "bonphan": {
                if (!args[1]) {
                    return api.sendMessage(
                        "📝 Sử dụng:\n" +
                        "- farm bonphan [id cây] [loại phân]\n" +
                        "- farm bonphan all [loại phân]\n\n" +
                        "🧪 Các loại phân bón:\n" +
                        Object.entries(FERTILIZERS)
                            .map(([id, fert]) => `${fert.emoji} ${id}: ${fert.name} (${fert.price} xu)`)
                            .join("\n"),
                        threadID
                    );
                }

                const cropId = args[1].toLowerCase();
                const fertilizerId = args[2]?.toLowerCase();

                if (!fertilizerId) {
                    return api.sendMessage("❌ Vui lòng chọn loại phân bón!", threadID);
                }

                if (cropId === "all") {
                    await fertilizeAllCrops(api, threadID, uid, fertilizerId, Currencies);
                } else {
                    if (!CROPS[cropId]) {
                        return api.sendMessage("❌ ID cây trồng không hợp lệ!", threadID);
                    }
                    await useFertilizer(api, threadID, uid, cropId, fertilizerId, Currencies);
                }
                break;
            }
            
            default:
                return api.sendMessage("❌ Lệnh không hợp lệ! Gõ 'farm' để xem hướng dẫn.", threadID, messageID);
        }
    } catch (error) {
        return api.sendMessage(`❌ Đã xảy ra lỗi: ${error.message}`, threadID, messageID);
    }
};

this.onReply = async function({ api, event, Users,permission, Currencies, Reply }) {
    const { threadID, messageID, body } = event;
    const uid = event.senderID;
    
    if (!event.messageReply) return;
    
    // const reply = global.Seiko.onReply.find(r => r.messageID == event.messageReply.messageID);
    if (!Reply || Reply.author != uid) return;

    try {
        switch (Reply.type) {
            case "joinHTX": {
                const index = parseInt(body) - 1;
                if (isNaN(index) || index < 0 || index >= Reply.cooperatives.length) {
                    return api.sendMessage("❌ Số thứ tự không hợp lệ!", threadID);
                }

                return handleJoinRequest(api, threadID, uid, index, Reply.cooperatives, Users);
                break;
            }

            case "disbandConfirm": {
                if (body.toLowerCase() !== "confirm") {
                    return api.sendMessage("❌ Đã hủy yêu cầu giải tán HTX!", threadID);
                }
                
                const htx = Object.values(globalCooperatives).find(h => h.id === reply.htxId);
                if (!htx || htx.president.id !== uid) {
                    return api.sendMessage("❌ Không thể rã HTX! Vui lòng thử lại.", threadID);
                }

                // Xóa HTX khỏi danh sách global
                delete globalCooperatives[reply.htxId];

                // Xóa HTX khỏi tất cả các thread chứa HTX này
                const threadHTXs = cooperatives[threadID] || [];
                const updatedHTXs = threadHTXs.filter(id => id !== reply.htxId);
                if (updatedHTXs.length === 0) {
                    delete cooperatives[threadID];
                } else {
                    cooperatives[threadID] = updatedHTXs;
                }

                saveData();

                return api.sendMessage(
                    `✅ Đã giải tán HTX "${reply.htxName}" thành công!\n` +
                    "👥 Tất cả thành viên đã bị kick khỏi HTX.",
                    threadID
                );
                break;
            }

            case "kickMember": {
                const index = parseInt(body) - 1;
                if (isNaN(index) || index < 0 || index >= reply.members.length) {
                    return api.sendMessage("❌ Số thứ tự không hợp lệ!", threadID);
                }

                const targetMember = reply.members[index];
                if (targetMember.id === uid) {
                    return api.sendMessage("❌ Bạn không thể kick chính mình!", threadID);
                }

                const htx = Object.values(globalCooperatives).find(h => h.id === reply.htxId);
                if (!htx || htx.president.id !== uid) {
                    return api.sendMessage("❌ Bạn không có quyền kick thành viên!", threadID);
                }

                // Xóa thành viên khỏi HTX
                htx.members = htx.members.filter(member => member.id !== targetMember.id);
                globalCooperatives[reply.htxId] = htx;
                saveData();
                api.sendMessage(
                    `✅ Đã kick thành viên ${targetMember.name} khỏi HTX!\n` +
                    `👥 Số thành viên còn lại: ${htx.members.length}`,
                    threadID
                );

                // Thông báo cho thành viên bị kick nếu khác box
                if (targetMember.id !== uid) {
                    api.sendMessage(
                        `⚠️ Bạn đã bị kick khỏi HTX ${htx.name}!\n` +
                        `👑 Người kick: ${htx.president.name}`,
                        targetMember.id
                    );
                }
                break;
            }
            
            default:
                break;
        }
    } catch (error) {
        console.error('Error in onReply:', error);
        api.sendMessage(`❌ Đã xảy ra lỗi: ${error.message}`, threadID);
    }
};
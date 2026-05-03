this.config = {
    name: "check",
    alias: ["checktt", "cou", "count"],
    version: "2.1.0",
    role: 0,
    author: "DongDev & DungUwU & Nghĩa - Mod by Trae AI",
    info: "Kiểm tra tương tác nhóm theo ngày/tuần/tổng",
    category: "Box chat",
    guides: "[all/week/day/month/loc/locmem/reset/call/box/ndfb/clear]",
    cd: 5,
    prefix: true
};

const fs = require('fs-extra');
const moment = require('moment-timezone');
const path = require('path');
const pathTimejoin = __dirname + '/../../core/data/timeJoin/';
this.onCall = async function ({ api, tools, client, event, args, Users, Threads, msg, commandName }) {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (!event.isGroup && args[0] && args[0].toLowerCase() !== 'clear') {
        return msg.reply("❎ Lệnh này chỉ áp dụng trong nhóm");
    }

    const { threadID, senderID, mentions } = event;
    const query = args[0] ? args[0].toLowerCase() : '';

    // Xử lý lệnh phụ trước khi đọc dữ liệu
    if (query === 'loc') {
        // Lọc dữ liệu nhóm không còn tồn tại
        if (!global.config.NDH.includes(senderID)) {
            return msg.reply("⚠️ Bạn không đủ quyền hạn để sử dụng lệnh này");
        }

        try {
            const dataPath = path.join(__dirname, '../../core/data/messageCounts');
            const allThreads = await api.getThreadList(100, null, ['INBOX']);
            const allThreadIDs = new Set(allThreads.map(t => t.threadID));
            const files = fs.readdirSync(dataPath);

            let count = 0, removedCount = 0;

            for (const file of files) {
                if (!file.endsWith('.json')) continue;
                count++;

                const threadID = file.replace('.json', '');
                const filePath = path.join(dataPath, file);

                if (!allThreadIDs.has(threadID)) {
                    try {
                        fs.unlinkSync(filePath);
                        removedCount++;
                        console.log(`[CHECK] Đã xóa file của nhóm: ${threadID}`);
                    } catch (err) {
                        console.error(`[CHECK] Lỗi khi xóa file ${file}:`, err);
                    }
                }
            }

            let message = '✅ Đã lọc xong dữ liệu nhóm!\n\n';
            message += '📊 Thống kê:\n';
            message += `➣ Tổng số nhóm: ${count}\n`;
            message += `➣ Số nhóm đã xóa: ${removedCount}\n`;
            message += `➣ Số nhóm còn lại: ${count - removedCount}\n\n`;
            message += `💡 Đã xóa ${removedCount} nhóm không tồn tại khỏi dữ liệu`;

            return msg.reply(message);
        } catch (error) {
            console.error('[CHECK] Lỗi:', error);
            return msg.reply('❎ Đã xảy ra lỗi trong quá trình lọc dữ liệu');
        }
    }

    // Chỉ đọc dữ liệu từ messageCounts
    const mainDataPath = path.join(__dirname, '../../core/data/messageCounts', threadID + '.json');
    let threadData = null;
    
    // Đọc dữ liệu từ messageCounts
    if (fs.existsSync(mainDataPath)) {
        try {
            threadData = JSON.parse(fs.readFileSync(mainDataPath, 'utf-8'));
            console.log(`[CHECK] Đã đọc dữ liệu từ messageCounts cho nhóm ${threadID}`);
        } catch (error) {
            console.error('[CHECK] Lỗi khi đọc dữ liệu:', error);
        }
    }
    
    // Nếu không có dữ liệu, tạo dữ liệu ban đầu
    if (!threadData) {
        const now = moment.tz("Asia/Ho_Chi_Minh");
        threadData = {
            total: allUserIDD.map(id => ({ id, count: 0, lastInteraction: null })),
            week: allUserIDD.map(id => ({ id, count: 0, lastInteraction: null })),
            day: allUserIDD.map(id => ({ id, count: 0, lastInteraction: null })),
            month: allUserIDD.map(id => ({ id, count: 0, lastInteraction: null })),
            time: now.day(),
            dayKey: now.format("YYYY-MM-DD"),
            weekNumber: now.isoWeek(),
            weekYear: now.isoWeekYear(),
            last: {
                time: now.day(),
                day: [],
                week: [],
            },
            lastInteraction: {}
        };
        
        // Chỉ lưu vào messageCounts
        fs.writeFileSync(mainDataPath, JSON.stringify(threadData, null, 4));
        console.log(`[CHECK] Đã tạo dữ liệu tương tác ban đầu cho nhóm ${threadID}`);
        
        // Thông báo cho user lần đầu sử dụng
        if (query === '' || !query) {
            return msg.reply("✅ Đã tạo dữ liệu tương tác cho nhóm!\n\n📊 Các lệnh có thể sử dụng:\n• `.check` - Xem tương tác cá nhân\n• `.check all` - Xem top tổng\n• `.check day` - Xem top ngày\n• `.check week` - Xem top tuần\n• `.check month` - Xem top tháng\n\n💡 Dữ liệu sẽ được cập nhật khi có tin nhắn mới!");
        }
    }

    let dataTimejoin = {};
    if (fs.existsSync(pathTimejoin + threadID + '.json')) {
        dataTimejoin = JSON.parse(fs.readFileSync(pathTimejoin + threadID + '.json', 'utf-8'));
    }

    const allUserIDD = event.participantIDs;
    
    // Cập nhật dữ liệu tương tác trước khi hiển thị
    const now = moment.tz("Asia/Ho_Chi_Minh").format();
    const today = moment.tz("Asia/Ho_Chi_Minh").day();
    const weekNow = moment.tz("Asia/Ho_Chi_Minh").isoWeek();
    const weekYearNow = moment.tz("Asia/Ho_Chi_Minh").isoWeekYear();
    const dayKeyNow = moment.tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD");
    
    // Đảm bảo cấu trúc dữ liệu đầy đủ
    if (!threadData.total) threadData.total = [];
    if (!threadData.week) threadData.week = [];
    if (!threadData.day) threadData.day = [];
    if (!threadData.month) threadData.month = [];
    
    // Reset dữ liệu theo thời gian
    if (threadData.time !== today) {
        threadData.day = threadData.day.map(user => ({ ...user, count: 0 }));
        threadData.time = today;
    }
    
    if (threadData.weekNumber !== weekNow || threadData.weekYear !== weekYearNow) {
        threadData.week = threadData.week.map(user => ({ ...user, count: 0 }));
        threadData.weekNumber = weekNow;
        threadData.weekYear = weekYearNow;
    }
    
    if (threadData.dayKey !== dayKeyNow) {
        threadData.day = threadData.day.map(user => ({ ...user, count: 0 }));
        threadData.dayKey = dayKeyNow;
    }
    
    // Đảm bảo có dữ liệu cho tất cả thành viên hiện tại
    const ensureUserData = (dataArray) => {
        for (const user of allUserIDD) {
            if (!dataArray.some(e => e.id === user)) {
                dataArray.push({ id: user, count: 0, lastInteraction: null });
            }
        }
    };
    
    if (threadData.total) ensureUserData(threadData.total);
    if (threadData.week) ensureUserData(threadData.week);
    if (threadData.day) ensureUserData(threadData.day);
    if (threadData.month) ensureUserData(threadData.month);
    
    // Lưu dữ liệu đã cập nhật vào messageCounts
    fs.writeFileSync(mainDataPath, JSON.stringify(threadData, null, 4));
    console.log(`[CHECK] Đã cập nhật dữ liệu tương tác cho nhóm ${threadID}`);

    // Lọc dữ liệu tự động
    const filterData = (section) => section.filter(entry => allUserIDD.includes(entry.id));
    let hasChanges = false;
    const sections = ["total", "week", "day", "month"];
    sections.forEach(key => {
        if (threadData[key]) {
            const filteredSection = filterData(threadData[key]);
            if (filteredSection.length !== threadData[key].length) {
                threadData[key] = filteredSection;
                hasChanges = true;
            }
        }
    });
    if (hasChanges) {
        fs.writeFileSync(mainDataPath, JSON.stringify(threadData, null, 4));
        console.log("✅ Đã tự động làm mới dữ liệu, xóa các ID không còn trong nhóm.");
    }

    // Xử lý các lệnh phụ khác
    if (query === 'ndfb') {
        // Chuyển hướng đến lệnh kickndfb
        try {
            const kickndfbModule = require('./kickndfb.js');
            if (kickndfbModule && kickndfbModule.onCall) {
                return kickndfbModule.onCall({ api, tools, client, event, args, Users, Threads, msg, commandName });
            } else {
                return msg.reply("❎ Lệnh kickndfb không khả dụng");
            }
        } catch (error) {
            console.error('[CHECK] Lỗi khi gọi kickndfb:', error);
            return msg.reply("❎ Không thể thực hiện lệnh kickndfb");
        }
    }
    if (query === 'clear') {
        const allowedUserIDs = global.config.NDH.map(id => id.toString());
        const senderIDStr = senderID.toString();
        if (!allowedUserIDs.includes(senderIDStr)) {
           return msg.reply(`❎ Cần quyền admin chính để thực hiện lệnh`);
        }
        var inbox = await api.getThreadList(100, null, ['INBOX']);
        let list = [...inbox].filter(group => group.isSubscribed && group.isGroup);
        let groupIDs = list.map(group => group.threadID);
        const messageCountsPath = path.join(__dirname, '../../core/data/messageCounts');
        const checkttData = fs.readdirSync(messageCountsPath);
        let deletedFiles = [];
        checkttData.forEach(file => {
            const fileID = file.replace('.json', '');
            if (!groupIDs.includes(fileID)) {
                fs.unlinkSync(path.join(messageCountsPath, file));
                deletedFiles.push(fileID);
            }
        });
        if (deletedFiles.length === 0) {
            return msg.reply("✅ Không có nhóm nào dư thừa");
        } else {
            return msg.reply(`✅ Đã xóa ${deletedFiles.length} nhóm dư thừa`);
        }
    } else if (query === 'locmem') {
        // Lọc thành viên ít tương tác
        const dataThread = (await Threads.getData(event.threadID)).threadInfo;

        if (!dataThread.adminIDs.some(e => e.id == api.getCurrentUserID())) {
            return msg.reply('❎ Bot cần quyền quản trị viên!');
        }

        if (!dataThread.adminIDs.some(e => e.id == senderID)) {
            return msg.reply("❎ Bạn không có quyền sử dụng lệnh này");
        }

        if (!event.isGroup) {
            return msg.reply("❎ Chỉ có thể sử dụng trong nhóm");
        }

        if (!args[1] || isNaN(args[1])) {
            return msg.reply("⚠️ Vui lòng nhập số tin nhắn tối thiểu");
        }

        let minCount = +args[1];
        let allUser = event.participantIDs;
        let id_rm = [];

        for (let user of allUser) {
            if (user == api.getCurrentUserID()) continue;

            if (!threadData.total.some(e => e.id == user) ||
                threadData.total.find(e => e.id == user).count <= minCount) {
                await new Promise(resolve => setTimeout(async () => {
                    await api.removeUserFromGroup(user, threadID);
                    id_rm.push(user);
                    resolve(true);
                }, 1000));
            }
        }

        return msg.reply(
            `☑️ Đã xóa ${id_rm.length} thành viên có dưới ${minCount} tin nhắn\n\n${id_rm.map(($, i) => `${i + 1}. ${global.data.userName.get($)}`).join('\n')}`
        );
    } else if (query === 'call') {
        // Tag những người ít tương tác
        const dataThread = (await Threads.getData(event.threadID)).threadInfo;

        if (!dataThread.adminIDs.some(e => e.id == senderID)) {
            return msg.reply("❎ Bạn không có quyền sử dụng lệnh này");
        }

        if (!event.isGroup) {
            return msg.reply("❎ Chỉ có thể sử dụng trong nhóm");
        }

        let inactiveUsers = threadData.total.filter(user => user.count < 5);

        if (inactiveUsers.length === 0) {
            return msg.reply("✅ Không có thành viên nào dưới 5 tin nhắn");
        }

        let mentionIds = [];

        for (let user of inactiveUsers) {
            let name = await Users.getNameUser(user.id);
            mentionIds.push({ id: user.id, tag: name });
        }

        let message = "📢 Những người sau cần tăng tương tác:\n\n";
        message += mentionIds.map(user => `@${user.tag}`).join('\n');
        message += "\n\n👉 Hãy tích cực tham gia trò chuyện để không bị xóa khỏi nhóm nhé!";

        return msg.send({ body: message, mentions: mentionIds });
    } else if (query === 'reset') {
        // Reset dữ liệu tương tác
        const dataThread = (await Threads.getData(event.threadID)).threadInfo;

        if (!dataThread.adminIDs.some(e => e.id == senderID)) {
            return msg.reply("❎ Bạn không có quyền sử dụng lệnh này");
        }

        const dayKeyNow = moment.tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD");
        const weekNow = moment.tz("Asia/Ho_Chi_Minh").isoWeek();
        const weekYearNow = moment.tz("Asia/Ho_Chi_Minh").isoWeekYear();

        var newObj = {
            total: [],
            week: [],
            day: [],
            time: moment.tz("Asia/Ho_Chi_Minh").day(),
            dayKey: dayKeyNow,
            weekNumber: weekNow,
            weekYear: weekYearNow,
            last: {
                time: moment.tz("Asia/Ho_Chi_Minh").day(),
                day: [],
                week: [],
            },
            lastInteraction: {}
        };

        fs.writeFileSync(mainDataPath, JSON.stringify(newObj, null, 4));
        return msg.reply("✅ Đã reset dữ liệu tương tác của nhóm thành công!");
    } else if (query === 'box') {
        // Hiển thị thông tin nhóm
        try {
            const { threadInfo } = await Threads.getData(threadID);
            const timeByMS = Date.now();

            const threadMem = threadInfo.participantIDs.length;
            const gendernam = [];
            const gendernu = [];
            const nope = [];

            for (const user of threadInfo.userInfo) {
                switch (user.gender) {
                    case "MALE":
                        gendernam.push(user.name);
                        break;
                    case "FEMALE":
                        gendernu.push(user.name);
                        break;
                    default:
                        nope.push(user.name);
                }
            }

            const adminName = await Promise.all(threadInfo.adminIDs.map(admin => Users.getNameUser(admin.id)));
            const nam = gendernam.length;
            const nu = gendernu.length;
            const qtv = adminName.length;
            const sl = threadInfo.messageCount;
            const icon = threadInfo.emoji || "👍";
            const threadName = threadInfo.threadName || "không có";
            const id = threadInfo.threadID;
            const pd = threadInfo.approvalMode ? "bật" : "tắt";

            return msg.reply({
                body: `⭐️ Box: ${threadName}\n🎮 ID: ${id}\n📱 Phê duyệt: ${pd}\n🐰 Emoji: ${icon}\n📌 Thông tin: ${threadMem} thành viên\nSố tv nam 🧑‍🦰: ${nam} thành viên\nSố tv nữ 👩‍🦰: ${nu} thành viên\n🕵️‍♂️ QTV: ${adminName.join(', ')}\n💬 Tổng: ${sl} tin nhắn`,
                attachment: await tools.streamURL(threadInfo.imageSrc, 'jpg')
            });
        } catch (e) {
            console.log(e);
            return msg.reply(`❎ Không thể lấy thông tin nhóm của bạn!\n${e}`);
        }
    } else if (query === 'die') {
        const dataThread = (await Threads.getData(event.threadID)).threadInfo;
        const botIsAdmin = dataThread.adminIDs.some(item => item.id == api.getCurrentUserID());
        const userIsAdmin = dataThread.adminIDs.some(item => item.id == senderID);
        if (!botIsAdmin) return msg.reply('❎ Bot cần quyền quản trị viên!');
        if (!userIsAdmin) return msg.reply('❎ Bạn không đủ quyền hạn để lọc thành viên!');
        const { userInfo, adminIDs } = await api.getThreadInfo(event.threadID);
        const fbUsers = userInfo.filter(user => user.gender === undefined).map(user => user.id);
        const botAdmin = adminIDs.some(admin => admin.id == api.getCurrentUserID());
        if (fbUsers.length === 0) return msg.reply("🔎 Nhóm không có người dùng fb");
        msg.send(`🔎 Phát hiện ${fbUsers.length} người dùng fb`, event.threadID, async () => {
            if (!botAdmin) return msg.send("❎ Vui lòng thêm bot làm qtv rồi thử lại");
            let success = 0, fail = 0;
            for (const id of fbUsers) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                api.removeUserFromGroup(id, event.threadID, err => err ? fail++ : success++);
            }
            msg.send(`🔎 Đã xóa ${success} người dùng facebook, thất bại: ${fail}`);
        });
    }

    // Xử lý hiển thị thống kê tương tác
    let data, header = '';
    switch (query) {
        case 'all':
        case '-a':
            data = threadData.total;
            header = '[ Tương Tác Tổng ]';
            break;
        case 'week':
        case '-w':
            data = threadData.week;
            header = '[ Tương Tác Tuần ]';
            break;
        case 'day':
        case '-d':
            data = threadData.day;
            header = '[ Tương Tác Ngày]';
            break;
        case 'month':
        case '-m':
            data = threadData.month;
            header = '[ Tương Tác Tháng ]';
            break;
        default: {
            // Hiển thị thông tin cá nhân
            const UID = event.messageReply ? event.messageReply.senderID :
                        Object.keys(mentions)[0] ? Object.keys(mentions)[0] : senderID;

            const sortedTotal = threadData.total.slice().sort((a, b) => b.count - a.count);
            const userData = sortedTotal.find(e => e.id === UID) || {};
            const userTotal = userData.count || 0;
            const userRank = sortedTotal.findIndex(e => e.id === UID);
            const userTotalWeek = threadData.week.find(e => e.id === UID)?.count || 0;
            const userTotalDay = threadData.day.find(e => e.id === UID)?.count || 0;
            const userTotalMonth = threadData.month.find(e => e.id === UID)?.count || 0;
            const lastInteraction = userData.lastInteraction ? moment(userData.lastInteraction).tz('Asia/Ho_Chi_Minh').format('HH:mm:ss | DD/MM/YYYY') : 'Không có';
            const nameUID = await Users.getNameUser(UID) || 'Facebook User';
            const target = UID === senderID ? 'Bạn' : nameUID;
            const totalMessagesDay = threadData.day.reduce((acc, curr) => acc + curr.count, 0);
            const userInteractionRate = totalMessagesDay ? ((userTotalDay / totalMessagesDay) * 100).toFixed(2) : 0;
            const totalUsers = sortedTotal.length;
            const threadInfo = (await Threads.getData(event.threadID)).threadInfo;

            let permission;
            if (global.config.NDH.includes(UID)) {
                permission = `Người Điều Hành`;
            } else if (global.config.ADMINBOT.includes(UID)) {
                permission = `Admin Bot`;
            } else if (threadInfo.adminIDs.some(i => i.id == UID)) {
                permission = `Quản Trị Viên`
            } else {
                permission = `Thành viên`;
            }

            function getTimeJoin(id) {
                if (dataTimejoin[id]) {
                    return dataTimejoin[id].timeJoin;
                } else {
                    return null;
                }
            }
            function convertTime(timeJoin) {
                const joinDate = moment.tz(timeJoin, "Asia/Ho_Chi_Minh");
                const formattedDate = joinDate.format('HH:mm:ss - DD/MM/YYYY');
                const now = moment.tz("Asia/Ho_Chi_Minh");
                const diffDays = now.diff(joinDate, 'days');
                const diffHours = now.diff(joinDate, 'hours') % 24;
                const diffMinutes = now.diff(joinDate, 'minutes') % 60;
                const diffSeconds = now.diff(joinDate, 'seconds') % 60;
                const timeDiff = `${diffDays}d : ${diffHours}h : ${diffMinutes}m : ${diffSeconds}s`;
                return {
                    formattedDate,
                    timeDiff
                };
            }
            const timeJoin = getTimeJoin(UID);
            const { formattedDate, timeDiff } = convertTime(timeJoin);

            msg.reply(`✨ Tương tác của ${nameUID}:\n🪪 Chức vụ: ${permission}\n📆 Tin nhắn trong ngày: ${userTotalDay.toLocaleString()}\n📅 Tin nhắn trong tuần: ${userTotalWeek.toLocaleString()}\n🗓️ Tin nhắn trong tháng: ${userTotalMonth.toLocaleString()}\n💬 Tổng tin nhắn: ${userTotal.toLocaleString()}\n🏆 Xếp hạng: ${userRank + 1}/${totalUsers.toLocaleString()}\n⏰ Lần tt cuối: ${lastInteraction}\n📊 Tỉ lệ tương tác: ${userInteractionRate}%\n🔮 Ngày vào nhóm: ${formattedDate}\n🕐 Đã tham gia được: ${timeDiff}\n\n📌 Thả "😆" để xem tất cả tin nhắn nhóm`,
                (err, info) => {
                    if (!err) {
                        global.Seiko.onReaction.set(info.messageID, {
                            commandName,
                            messageID: info.messageID,
                            author: event.senderID,
                            iduser: UID,
                        });
                    }
                });
            return;
        }
    }

    // Hiển thị bảng xếp hạng
    for (const item of data) {
        const userName = await Users.getNameUser(item.id) || 'Facebook User';
        item.name = userName;
    }
    const sortedTotal = data.slice().sort((a, b) => b.count - a.count);
    const userRank = sortedTotal.findIndex(item => item.id === event.senderID);
    data.sort((a, b) => b.count - a.count);
    let body = data.map((item, index) => {
        const lastInteraction = item.lastInteraction ? moment(item.lastInteraction).tz('Asia/Ho_Chi_Minh').format('HH:mm:ss | DD/MM/YYYY') : 'Không có';
        return `${index + 1}. ${item.name} - ${item.count.toLocaleString()} tin nhắn`;
    }).join('\n');
    const totalMessages = data.reduce((acc, item) => acc + item.count, 0);
    const userMessages = sortedTotal[userRank]?.count || 0;
    const totalUsers = sortedTotal.length;
    msg.reply(`${header}\n\n${body}\n\n💬 Tổng tin nhắn: ${totalMessages.toLocaleString()}\n🏆 Bạn đứng thứ ${userRank + 1}/${totalUsers} với ${userMessages} tin nhắn\n📌 Reply (phản hồi) + stt để xóa thành viên ra khỏi nhóm`, (err, info) => {
        if (!err) {
            global.Seiko.onReply.set(info.messageID, {
                commandName,
                messageID: info.messageID,
                tag: 'locmen',
                thread: event.threadID,
                author: event.senderID,
                storage: sortedTotal,
            });
        }
    });
};

this.onReaction = async function({ msg, event, Users, api, Reaction: _, commandName }) {
    if (event.userID !== _.author) return;
    if (event.reaction !== "😆") return;
    const filePath = path.join(__dirname, '../../core/data/messageCounts', event.threadID + '.json');
    if (!fs.existsSync(filePath)) return msg.reply('❎ Chưa có dữ liệu');

    let threadData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const data = threadData.total;
    for (const item of data) {
        const userName = await Users.getNameUser(item.id) || 'Facebook User';
        item.name = userName;
    }
    const sortedTotal = data.slice().sort((a, b) => b.count - a.count);
    const userRank = sortedTotal.findIndex(item => item.id === _.iduser);
    const nameUID = await Users.getNameUser(_.iduser) || 'Facebook User';
    const target = event.senderID === _.iduser ? 'Bạn' : nameUID;
    const userMessages = sortedTotal[userRank]?.count || 0;
    let body = sortedTotal.map((item, index) => {
        const lastInteraction = item.lastInteraction ? moment(item.lastInteraction).tz('Asia/Ho_Chi_Minh').format('HH:mm:ss | DD/MM/YYYY') : 'Không có';
        return `${index + 1}. ${item.name} - ${item.count.toLocaleString()} tin nhắn`;
    }).join('\n');
    let msgg = `[ Tương Tác Tổng ]\n\n${body}\n\n💬 Tổng tin nhắn: ${data.reduce((a, b) => a + b.count, 0).toLocaleString()}\n🏆 ${target} đứng thứ ${userRank + 1} với ${userMessages} tin nhắn\n📌 Reply (phản hồi) + stt để xóa thành viên ra khỏi nhóm`;
    msg.reply(msgg, (err, info) => {
        if (err) return console.error(err);
        global.Seiko.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            tag: 'locmen',
            thread: event.threadID,
            author: event.senderID,
            storage: sortedTotal,
        });
    });
    msg.unsend(_.messageID);
};

this.onReply = async function({ api, event, Reply, Threads, Users, msg }) {
    const { senderID, body } = event;
    const dataThread = (await Threads.getData(event.threadID)).threadInfo;
    if (!dataThread.adminIDs.some(item => item.id == api.getCurrentUserID())) {
        return msg.reply('❎ Bot cần quyền quản trị viên!');
    }
    if (!dataThread.adminIDs.some(item => item.id == senderID)) {
        return msg.reply('❎ Bạn không đủ quyền hạn để lọc thành viên!');
    }
    const split = body.split(" ").filter(item => !isNaN(item) && item.trim() !== "");
    if (split.length === 0) return msg.reply('⚠️ Dữ liệu không hợp lệ');
    let msgReply = [], countErrRm = 0;
    for (let $ of split) {
        let id = Reply?.storage[$ - 1]?.id;
        if (id) {
            try {
                await api.removeUserFromGroup(id, event.threadID);
                const userName = global.data.userName.get(id) || await Users.getNameUser(id);
                msgReply.push(`${$}. ${userName}`);
            } catch (e) {
                countErrRm++;
                continue;
            }
        }
    }
    msg.reply(`🔄 Đã xóa ${split.length - countErrRm} người dùng thành công, thất bại ${countErrRm}\n\n${msgReply.join('\n')}`);
};

function getCultivationRealm(level) {
    const realms = [
        { name: "Luyện Khí", levels: 9, subRealms: ["Sơ Kỳ", "Trung Kỳ", "Hậu Kỳ"] },
        { name: "Trúc Cơ", levels: 9, subRealms: ["Sơ Kỳ", "Trung Kỳ", "Hậu Kỳ"] },
        { name: "Khai Quang", levels: 9, subRealms: ["Sơ Kỳ", "Trung Kỳ", "Hậu Kỳ"] },
        { name: "Kim Đan", levels: 9, subRealms: ["Sơ Kỳ", "Trung Kỳ", "Hậu Kỳ"] },
        { name: "Nguyên Anh", levels: 9, subRealms: ["Sơ Kỳ", "Trung Kỳ", "Hậu Kỳ"] },
        { name: "Hóa Thần", levels: 9, subRealms: ["Sơ Kỳ", "Trung Kỳ", "Hậu Kỳ"] },
        { name: "Phản Hư", levels: 9, subRealms: ["Sơ Kỳ", "Trung Kỳ", "Hậu Kỳ"] },
        { name: "Luyện Hư", levels: 9, subRealms: ["Sơ Kỳ", "Trung Kỳ", "Hậu Kỳ"] },
        { name: "Hợp Thể", levels: 9, subRealms: ["Sơ Kỳ", "Trung Kỳ", "Hậu Kỳ"] },
        { name: "Đại Thừa", levels: 9, subRealms: ["Sơ Kỳ", "Trung Kỳ", "Hậu Kỳ"] },
        { name: "Độ Kiếp", levels: 9, subRealms: ["Sơ Kỳ", "Trung Kỳ", "Hậu Kỳ"] },
        { name: "Thiên Tiên", levels: 9, subRealms: ["Sơ Kỳ", "Trung Kỳ", "Hậu Kỳ"] },
        { name: "Chân Tiên", levels: 9, subRealms: ["Sơ Kỳ", "Trung Kỳ", "Hậu Kỳ"] },
        { name: "Kim Tiên", levels: 9, subRealms: ["Sơ Kỳ", "Trung Kỳ", "Hậu Kỳ"] },
        { name: "Thánh Nhân", levels: 9, subRealms: ["Sơ Kỳ", "Trung Kỳ", "Hậu Kỳ"] },
        { name: "Đại Thánh", levels: 9, subRealms: ["Sơ Kỳ", "Trung Kỳ", "Hậu Kỳ"] },
        { name: "Tiên Đế", levels: 9, subRealms: ["Sơ Kỳ", "Trung Kỳ", "Hậu Kỳ"] },
        { name: "Tiên Tôn", levels: 9, subRealms: ["Sơ Kỳ", "Trung Kỳ", "Hậu Kỳ"] },
        { name: "Hỗn Độn", levels: 9, subRealms: ["Sơ Kỳ", "Trung Kỳ", "Hậu Kỳ"] },
        { name: "Vô Cực", levels: 1, subRealms: ["Viên Mãn"] }
    ];

    let currentLevel = 0;
    for (let realm of realms) {
        if (level > currentLevel && level <= currentLevel + realm.levels) {
            const subRealmIndex = Math.floor((level - currentLevel - 1) / (realm.levels / realm.subRealms.length));
            return `${realm.name} ${realm.subRealms[subRealmIndex]}`;
        }
        currentLevel += realm.levels;
    }

    return "Phàm Nhân";
}

function LV(exp) {
    return Math.floor((Math.sqrt(1 + (4 * exp) / 3) + 1) / 2);
}
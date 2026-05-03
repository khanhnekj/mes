const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');
const crypto = require('crypto');
const schedule = require('node-schedule');
const { writeFileSync, readFileSync, existsSync } = require('fs-extra');

const RENT_DATA_PATH = path.join(process.cwd(), 'core', 'data', 'rent.json');
const RENT_KEY_PATH = path.join(process.cwd(), 'core', 'data', 'rent_key.json');

let data = [];
let keys = {};

try {
    if (existsSync(RENT_DATA_PATH)) {
        const dataContent = readFileSync(RENT_DATA_PATH, 'utf8');
        if (dataContent.trim()) {
            data = JSON.parse(dataContent);
        }
    } else {
        writeFileSync(RENT_DATA_PATH, '[]');
    }
} catch (error) {
    data = [];
    writeFileSync(RENT_DATA_PATH, '[]');
}

try {
    if (existsSync(RENT_KEY_PATH)) {
        const keyContent = readFileSync(RENT_KEY_PATH, 'utf8');
        if (keyContent.trim()) {
            keys = JSON.parse(keyContent);
        }
    } else {
        writeFileSync(RENT_KEY_PATH, '{}');
    }
} catch (error) {
    keys = {};
    writeFileSync(RENT_KEY_PATH, '{}');
}

const saveData = () => {
    writeFileSync(RENT_DATA_PATH, JSON.stringify(data, null, 2));
};

const saveKeys = () => {
    writeFileSync(RENT_KEY_PATH, JSON.stringify(keys, null, 2));
};

function generateKey() {
    return `haru_${crypto.randomBytes(6).toString('hex').slice(0, 6).toLowerCase()}`;
}

function formatDate(dateStr) {
    return dateStr.split('/').reverse().join('/');
}

function isValidDate(dateStr) {
    return moment(dateStr, 'DD/MM/YYYY').isValid();
}

async function setBotNickname(api, threadID, expiryDate) {
    try {
        const botID = api.getCurrentUserID();
        const endDate = moment(expiryDate, 'DD/MM/YYYY').endOf('day');
        const now = moment().tz('Asia/Ho_Chi_Minh');
        const remainingDays = endDate.diff(now, 'days');
        
        let nickname;
        if (remainingDays <= 0) {
            nickname = `[ ${global.config.PREFIX} ] • ${global.config.BOTNAME} | Hết hạn 🔴`;
        } else {
            nickname = `[ ${global.config.PREFIX} ] • ${global.config.BOTNAME} | Còn ${remainingDays} ngày ✅`;
        }
        
        await api.changeNickname(nickname, threadID, botID);
        return true;
    } catch (error) {
        return false;
    }
}

async function setExpiredNickname(api, threadID) {
    try {
        const botID = api.getCurrentUserID();
        const nickname = `[ ${global.config.PREFIX} ] • ${global.config.BOTNAME} | Hết hạn 🔴`;
        await api.changeNickname(nickname, threadID, botID);
        return true;
    } catch (error) {
        return false;
    }
}

async function clearBotHsdNickname(api, threadID) {
    try {
        const botID = api.getCurrentUserID();
        const nextNickname = `[ ${global.config.PREFIX} ] • ${global.config.BOTNAME}`;
        await api.changeNickname(nextNickname, threadID, botID);
        return true;
    } catch (error) {
        return false;
    }
}

function formatNumber(num) {
    return num.toLocaleString('vi-VN');
}

async function updateDailyNicknames(api) {
    let updatedCount = 0;
    
    for (const rental of data) {
        try {
            await setBotNickname(api, rental.t_id, rental.time_end);
            updatedCount++;
        } catch (error) {
            if (error.errorDescription && 
                (error.errorDescription.includes("Cannot change nickname") || 
                 error.errorDescription.includes("Not a member"))) {
            }
        }
    }
}

async function filterInactiveGroups(api) {
    try {
        const threadList = await api.getThreadList(200, null, ['INBOX']);
        const activeThreadIDs = new Set(threadList.map(t => t.threadID));
        
        const originalLength = data.length;
        data = data.filter(rental => activeThreadIDs.has(rental.t_id));
        
        Object.keys(keys).forEach(key => {
            if (keys[key].groupId && !activeThreadIDs.has(keys[key].groupId)) {
                delete keys[key];
            }
        });
        
        const removedCount = originalLength - data.length;
        if (removedCount > 0) {
            saveData();
            saveKeys();
        }
        
        return removedCount;
    } catch (error) {
        return 0;
    }
}

this.config = {
    name: "rent",
    alias: ["thuebot"],
    version: "3.0.0",
    role: 3,
    author: "DC-Nam (Enhanced)",
    info: "Quản lý thuê bot với giao diện mới và cập nhật tự động",
    category: "Admin",
    guides: "[list/del/info/key/check/add/loc/clear]",
    cd: 3,
    prefix: true
};

this.onLoad = function ({ api }) {
    if (!existsSync(RENT_DATA_PATH)) {
        writeFileSync(RENT_DATA_PATH, '[]');
    }
    if (!existsSync(RENT_KEY_PATH)) {
        writeFileSync(RENT_KEY_PATH, '{}');
    }
    
    schedule.scheduleJob('5 0 * * *', function() {
        updateDailyNicknames(api);
    });
};

this.onCall = async function ({ api, event, args, Threads, Users, msg }) {
    const prefix = global.config?.PREFIX || '/';

    if (!args[0]) {
        const helpMsg = `📋 HƯỚNG DẪN SỬ DỤNG\n\n` +
            `📊 ${prefix}rent list [trang] - Danh sách nhóm thuê bot\n` +
            `➕ ${prefix}rent add <ngày> - Thêm ngày cho nhóm hiện tại\n` +
            `🗑️ ${prefix}rent del <số/ID> - Xóa nhóm\n` +
            `ℹ️ ${prefix}rent info - Thông tin nhóm hiện tại\n` +
            `🔑 ${prefix}rent key <ngày> [số_lượng] - Tạo key\n` +
            `📋 ${prefix}rent check - Danh sách key\n` +
            `🔄 ${prefix}rent loc - Lọc nhóm đã rời\n` +
            `🗑️ ${prefix}rent clear - Xóa tất cả key\n\n` +
            `💡 Giá: 1.000đ/ngày`;
        return msg.reply(helpMsg);
    }

    switch (args[0]) {
        case 'list':
        case 'l':
            try {
                if (!data || data.length === 0) {
                    return msg.reply('🔭 Chưa có nhóm nào thuê bot');
                }

                const page = parseInt(args[1]) || 1;
                const itemsPerPage = 10;
                const totalPages = Math.ceil(data.length / itemsPerPage);
                
                if (page < 1 || page > totalPages) {
                    return msg.reply(`❎ Trang không hợp lệ. Vui lòng chọn từ 1 đến ${totalPages}.`);
                }

                const pageData = data.slice((page - 1) * itemsPerPage, page * itemsPerPage);
                let listMsg = `📊 DANH SÁCH THUÊ BOT - Trang ${page}/${totalPages}\n\n`;
                
                // Lấy thông tin tên box cho các nhóm trong trang
                const threadInfoPromises = pageData.map(async (item) => {
                    if (!item || !item.t_id || !item.time_end) {
                        return null;
                    }
                    
                    try {
                        const threadInfo = await api.getThreadInfo(item.t_id);
                        return {
                            ...item,
                            threadName: threadInfo?.name || `Nhóm ${item.t_id}`
                        };
                    } catch (error) {
                        return {
                            ...item,
                            threadName: `Nhóm ${item.t_id}`
                        };
                    }
                });

                const itemsWithNames = await Promise.all(threadInfoPromises);
                const validItems = itemsWithNames.filter(item => item !== null);

                for (let i = 0; i < validItems.length; i++) {
                    const item = validItems[i];
                    const stt = (page - 1) * itemsPerPage + i + 1;
                    
                    const isActive = new Date(formatDate(item.time_end)).getTime() >= Date.now();
                    const status = isActive ? '🟢 Còn hạn' : '🔴 Hết hạn';
                    
                    listMsg += `${stt}. ${item.threadName}\n`;
                    listMsg += `   👤 ${item.id || 'N/A'} | ${status}\n`;
                    listMsg += `   📅 ${item.time_end} | 🆔 ${item.t_id}\n\n`;
                }

                if (listMsg === `📊 DANH SÁCH THUÊ BOT - Trang ${page}/${totalPages}\n\n`) {
                    return msg.reply('🔭 Không có dữ liệu hợp lệ');
                }

                listMsg += `💡 Lệnh: giahan <số> <ngày> | del <số> | out <số>\n`;
                listMsg += `📄 Dùng "${prefix}rent list <số trang>" để xem trang khác`;

                api.sendMessage(listMsg, event.threadID, (err, res) => {
                    if (!err && res) {
                        global.Seiko?.onReply?.set(res.messageID, {
                            commandName: this.config.name,
                            type: 'list',
                            data: pageData,
                            page: page
                        });
                    }
                });
            } catch (error) {
                msg.reply('❎ Lỗi hiển thị danh sách');
            }
            break;

        case 'add':
            if (!args[1]) {
                return msg.reply(`❎ Cần nhập số ngày để thêm\n📝 Ví dụ: ${prefix}rent add 30`);
            }

            const daysToAdd = parseInt(args[1]);
            if (isNaN(daysToAdd) || daysToAdd < 1 || daysToAdd > 365) {
                return msg.reply('❎ Số ngày không hợp lệ (1-365 ngày)');
            }

            try {
                let currentGroup = data.find(entry => entry.t_id === event.threadID);
                
                if (!currentGroup) {
                    const startDate = moment().format('DD/MM/YYYY');
                    const newEndDateStr = moment().add(daysToAdd, 'days').format('DD/MM/YYYY');
                    currentGroup = {
                        t_id: event.threadID,
                        id: event.senderID,
                        time_start: startDate,
                        time_end: newEndDateStr
                    };
                    data.push(currentGroup);
                } else {
                    const currentEndDate = new Date(formatDate(currentGroup.time_end));
                    const newEndDate = new Date(currentEndDate.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
                    const newEndDateStr = moment(newEndDate).format('DD/MM/YYYY');
                    currentGroup.time_end = newEndDateStr;
                }

                await setBotNickname(api, event.threadID, currentGroup.time_end);

                const endDate = new Date(formatDate(currentGroup.time_end));
                const timeLeft = endDate.getTime() - Date.now();
                const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                const addMsg = `✅ Đã thêm ${daysToAdd} ngày\n\n` +
                    `📅 Hết hạn mới: ${currentGroup.time_end}\n` +
                    `⏰ Còn lại: ${daysLeft} ngày ${hoursLeft} giờ\n` +
                    `💰 Giá trị: ${formatNumber(daysToAdd * 1000)}đ`;

                msg.reply(addMsg);
                saveData();
            } catch (error) {
                msg.reply('❎ Lỗi khi thêm ngày');
            }
            break;

        case 'del':
            if (!args[1]) {
                const currentId = event.threadID;
                const originalLength = data.length;
                data = data.filter(entry => entry.t_id !== currentId);
                Object.keys(keys).forEach(key => {
                    if (keys[key].groupId === currentId) {
                        delete keys[key];
                    }
                });
                if (data.length < originalLength) {
                    msg.reply(`✅ Đã xóa nhóm hiện tại\n\n🆔 ID: ${currentId}`);
                    await setExpiredNickname(api, currentId);
                } else {
                    msg.reply(`❎ Nhóm hiện tại chưa có dữ liệu thuê bot`);
                }
                saveData();
                saveKeys();
                break;
            }

            const identifier = args[1];
            if (identifier.length > 10) {
                const originalLength = data.length;
                data = data.filter(entry => entry.t_id !== identifier);
                Object.keys(keys).forEach(key => {
                    if (keys[key].groupId === identifier) {
                        delete keys[key];
                    }
                });
                const message = data.length < originalLength ? `✅ Đã xóa nhóm có ID: ${identifier}` : `❎ Không tìm thấy nhóm có ID: ${identifier}`;
                msg.reply(message);
                if (data.length < originalLength) {
                    await setExpiredNickname(api, identifier);
                }
                saveData();
                saveKeys();
            } else {
                const index = parseInt(identifier) - 1;
                if (index >= 0 && index < data.length) {
                    const groupId = data[index].t_id;
                    data.splice(index, 1);
                    Object.keys(keys).forEach(key => {
                        if (keys[key].groupId === groupId) {
                            delete keys[key];
                        }
                    });
                    msg.reply(`✅ Đã xóa nhóm thứ ${identifier}`);
                    await setExpiredNickname(api, groupId);
                    saveData();
                    saveKeys();
                } else {
                    msg.reply(`❎ Số thứ tự không hợp lệ!`);
                }
            }
            break;

        case 'info':
            try {
                if (!data || data.length === 0) {
                    return msg.reply('🔭 Chưa có dữ liệu thuê bot');
                }

                const rentInfo = data.find(entry => entry && entry.t_id === event.threadID);
                if (!rentInfo) {
                    return msg.reply('❎ Nhóm này chưa thuê bot');
                }

                if (!rentInfo.time_end) {
                    return msg.reply('❎ Dữ liệu không hợp lệ');
                }

                try {
                    const endDate = new Date(formatDate(rentInfo.time_end));
                    const now = new Date();
                    const timeLeft = endDate.getTime() - now.getTime();
                    const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                    const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const status = timeLeft > 0 ? '🟢 Còn hạn' : '🔴 Hết hạn';

                    const infoMsg = `ℹ️ THÔNG TIN THUÊ BOT\n\n` +
                        `👤 Người thuê: ${rentInfo.id || 'N/A'}\n` +
                        `📅 Bắt đầu: ${rentInfo.time_start || 'N/A'}\n` +
                        `⏰ Hết hạn: ${rentInfo.time_end}\n` +
                        `📊 Trạng thái: ${status}\n` +
                        `⏳ Còn lại: ${daysLeft} ngày ${hoursLeft} giờ`;

                    msg.reply(infoMsg);
                } catch (dateError) {
                    msg.reply('❎ Lỗi xử lý ngày tháng');
                }
            } catch (error) {
                msg.reply('❎ Lỗi hiển thị thông tin');
            }
            break;

        case 'key':
            if (!args[1]) {
                const keyHelpMsg = `🔑 TẠO KEY THUÊ BOT\n\n` +
                    `💡 Cách dùng: ${prefix}rent key <ngày> [số_lượng]\n\n` +
                    `💰 Bảng giá:\n` +
                    `• 1 ngày = 1.000đ\n` +
                    `• 7 ngày = 7.000đ\n` +
                    `• 30 ngày = 30.000đ\n` +
                    `• 90 ngày = 90.000đ\n\n` +
                    `📝 Ví dụ: ${prefix}rent key 30`;
                return msg.reply(keyHelpMsg);
            }

            const days = parseInt(args[1]);
            const quantity = parseInt(args[2]) || 1;

            if (isNaN(days) || days < 1 || days > 365) {
                return msg.reply('❎ Số ngày không hợp lệ (1-365 ngày)');
            }

            if (quantity < 1 || quantity > 10) {
                return msg.reply('❎ Số lượng key không hợp lệ (1-10 key)');
            }

            const pricePerDay = 1000;
            const totalPrice = days * pricePerDay * quantity;
            const expiryDate = moment().add(days, 'days').format('DD/MM/YYYY');
            const generatedKeys = [];

            for (let i = 0; i < quantity; i++) {
                const newKey = generateKey();
                keys[newKey] = {
                    expiryDate: expiryDate,
                    used: false,
                    groupId: null,
                    days: days,
                    price: days * pricePerDay
                };
                generatedKeys.push(newKey);
            }

            let keyMsg = `🔑 KEY MỚI TẠO\n\n`;
            keyMsg += `🔐 Key: ${generatedKeys.join(', ')}\n\n`;
            keyMsg += `📊 Thông tin:\n`;
            keyMsg += `⏰ Thời hạn: ${days} ngày\n`;
            keyMsg += `📅 Hết hạn: ${expiryDate}\n`;
            keyMsg += `💰 Giá: ${formatNumber(totalPrice)}đ\n`;
            keyMsg += `📦 Số lượng: ${quantity} key\n\n`;
            keyMsg += `💡 Gửi key vào nhóm để kích hoạt`;

            msg.reply(keyMsg);
            saveKeys();
            break;

        case 'check':
            if (Object.keys(keys).length === 0) {
                return msg.reply('🔭 Chưa có key nào được tạo');
            }

            let totalValue = 0;
            let usedCount = 0;
            let unusedCount = 0;
            
            Object.values(keys).forEach(info => {
                if (info.price) totalValue += info.price;
                if (info.used) usedCount++; else unusedCount++;
            });

            let keyList = `📋 DANH SÁCH KEY\n\n`;
            keyList += `📊 Tổng: ${Object.keys(keys).length} | 🟢 ${usedCount} | 🔴 ${unusedCount} | 💰 ${formatNumber(totalValue)}đ\n\n`;
            
            Object.entries(keys).forEach(([key, info], i) => {
                const status = info.used ? '🟢' : '🔴';
                const groupInfo = info.groupId ? ` | ${info.groupId}` : '';
                const daysInfo = info.days ? ` | ${info.days} ngày` : '';
                const priceInfo = info.price ? ` | ${formatNumber(info.price)}đ` : '';
                
                keyList += `${i + 1}. ${key} ${status}\n`;
                keyList += `   📅 ${info.expiryDate}${daysInfo}${priceInfo}${groupInfo}\n\n`;
            });

            keyList += `💡 Lệnh: del <số> | del all`;

            api.sendMessage(keyList, event.threadID, (err, res) => {
                if (!err && res) {
                    global.Seiko?.onReply?.set(res.messageID, {
                        commandName: this.config.name,
                        type: 'keys',
                        data: keys
                    });
                }
            });
            break;

        case 'loc':
            try {
                const removedCount = await filterInactiveGroups(api);
                msg.reply(`✅ Đã lọc và xóa ${removedCount} nhóm đã rời`);
            } catch (error) {
                msg.reply('❎ Lỗi khi lọc nhóm');
            }
            break;

        case 'clear':
            Object.keys(keys).forEach(key => delete keys[key]);
            saveKeys();
            msg.reply('✅ Đã xóa toàn bộ dữ liệu key');
            break;

        default:
            msg.reply(`❎ Lựa chọn không hợp lệ!`);
            break;
    }
};

this.onReply = async function ({ api, event, Reply, msg }) {
    const args = event.body.trim().split(' ');
    const command = args.shift().toLowerCase();

    if (!global.config?.NDH || !global.config.NDH.includes(event.senderID)) {
        return msg.reply('❎ Bạn không có quyền sử dụng tính năng này!');
    }

    if (!Reply || !Reply.type) {
        return msg.reply('❎ Dữ liệu reply không hợp lệ!');
    }

    if (Reply.type === 'list') {
        if (!args[0] || isNaN(parseInt(args[0]))) {
            return msg.reply('❎ Vui lòng nhập số thứ tự hợp lệ!');
        }
        
        const index = parseInt(args[0]) - 1;

        if (command === 'del' && index >= 0 && index < Reply.data.length) {
            const groupId = Reply.data[index].t_id;
            
            const globalIndex = data.findIndex(item => item.t_id === groupId);
            if (globalIndex !== -1) {
                data.splice(globalIndex, 1);
            }
            
            Object.keys(keys).forEach(key => {
                if (keys[key].groupId === groupId) {
                    delete keys[key];
                }
            });
            msg.reply(`🗑️ ĐÃ XÓA NHÓM\n\n🆔 ID: ${groupId}`);
            await setExpiredNickname(api, groupId);
            saveData();
            saveKeys();
        } else if (command === 'out' && index >= 0 && index < Reply.data.length) {
            const groupId = Reply.data[index].t_id;
            
            const globalIndex = data.findIndex(item => item.t_id === groupId);
            if (globalIndex !== -1) {
                data.splice(globalIndex, 1);
            }
            
            Object.keys(keys).forEach(key => {
                if (keys[key].groupId === groupId) {
                    delete keys[key];
                }
            });
            try {
                await api.removeUserFromGroup(api.getCurrentUserID(), groupId);
                msg.reply(`🚪 ĐÃ OUT KHỎI NHÓM\n\n🆔 ID: ${groupId}`);
            } catch (error) {
                msg.reply(`⚠️ ĐÃ XÓA DỮ LIỆU NHƯNG KHÔNG THỂ OUT\n\n🆔 ID: ${groupId}\n❎ Lỗi: ${error.message}`);
            }
            saveData();
            saveKeys();
        } else if (command === 'giahan' && args[1]) {
            const newExpiry = args[1];
            if (isValidDate(newExpiry) && index >= 0 && index < Reply.data.length) {
                const oldExpiry = Reply.data[index].time_end;
                const groupId = Reply.data[index].t_id;
                
                const globalIndex = data.findIndex(item => item.t_id === groupId);
                if (globalIndex !== -1) {
                    data[globalIndex].time_end = newExpiry;
                }
                
                Reply.data[index].time_end = newExpiry;
                
                await setBotNickname(api, Reply.data[index].t_id, newExpiry);
                
                let giahanMsg = `🔄 GIA HẠN THÀNH CÔNG\n\n`;
                giahanMsg += `👤 Người thuê: ${Reply.data[index].id}\n`;
                giahanMsg += `📅 Từ: ${oldExpiry}\n`;
                giahanMsg += `📅 Đến: ${newExpiry}\n`;
                giahanMsg += `🆔 ID: ${Reply.data[index].t_id}`;
                
                msg.reply(giahanMsg);
                saveData();
            } else {
                msg.reply(`❎ Ngày không hợp lệ! Sử dụng định dạng DD/MM/YYYY\n📝 Ví dụ: giahan 1 31/12/2024`);
            }
        } else {
            msg.reply(`❎ LỆNH KHÔNG HỢP LẸ!\n\n💡 Các lệnh có sẵn:\n🔄 giahan + số + ngày - Gia hạn nhóm\n🗑️ del + số - Xóa nhóm\n🚪 out + số - Out khỏi nhóm\n\n📝 Ví dụ: giahan 1 31/12/2024`);
        }
    } else if (Reply.type === 'keys') {
        if (command === 'del') {
            if (args[0] === 'all') {
                const deletedCount = Object.keys(keys).length;
                Object.keys(keys).forEach(key => delete keys[key]);
                msg.reply(`✅ Đã xóa tất cả ${deletedCount} key`);
            } else {
                if (!args[0] || isNaN(parseInt(args[0]))) {
                    return msg.reply('❎ Vui lòng nhập số thứ tự hợp lệ!');
                }
                
                const keyIndex = parseInt(args[0]) - 1;
                const keyEntries = Object.keys(Reply.data);

                if (keyIndex >= 0 && keyIndex < keyEntries.length) {
                    const keyToDelete = keyEntries[keyIndex];
                    delete keys[keyToDelete];
                    msg.reply(`✅ Đã xóa key: ${keyToDelete}`);
                } else {
                    msg.reply(`❎ Số thứ tự không hợp lệ!`);
                }
            }
            saveKeys();
        } else {
            msg.reply(`❎ Lệnh không hợp lệ! Sử dụng: del + số thứ tự hoặc del all`);
        }
    }
};

this.onEvent = async function ({ api, event }) {
    const rawBody = event && event.body ? event.body : '';
    const message = String(rawBody).toLowerCase();
    const threadID = event.threadID;
    const senderID = event.senderID;

    if (!message) return;
    
    if (/^(haru|seiko|satoru)_[a-z0-9]{4,6}$/.test(message)) {
        if (keys.hasOwnProperty(message)) {
            const keyData = keys[message];

            const existingEntry = data.find(entry => entry.t_id === threadID);
            if (existingEntry) {
                return api.sendMessage(`❎ Nhóm này đã có dữ liệu thuê bot!`, threadID);
            }

            if (!keyData.used) {
                const startDate = moment().tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY');
                const expiryDate = keyData.expiryDate;

                data.push({
                    t_id: threadID,
                    id: senderID,
                    time_start: startDate,
                    time_end: expiryDate
                });

                keyData.used = true;
                keyData.groupId = threadID;

                const endDate = new Date(formatDate(expiryDate));
                const now = new Date();
                const timeLeft = endDate.getTime() - now.getTime();
                const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                await setBotNickname(api, threadID, expiryDate);

                const daysInfo = keyData.days ? `\n⏰ Thời hạn: ${keyData.days} ngày` : '';
                const priceInfo = keyData.price ? `\n💰 Giá trị: ${formatNumber(keyData.price)}đ` : '';
                const successMsg = `✅ Kích hoạt thành công!\n\n` +
                    `👤 Người kích hoạt: ${senderID}\n` +
                    `🌐 Nhóm: ${threadID}${daysInfo}${priceInfo}\n` +
                    `⏰ Còn lại: ${daysLeft} ngày ${hoursLeft} giờ\n` +
                    `📅 Hết hạn: ${expiryDate}`;
                api.sendMessage(successMsg, threadID);

                if (global.config?.NDH && global.config.NDH[0]) {
                    const adminDaysInfo = keyData.days ? `\n⏰ Thời hạn: ${keyData.days} ngày` : '';
                    const adminPriceInfo = keyData.price ? `\n💰 Giá trị: ${formatNumber(keyData.price)}đ` : '';
                    const adminMsg = `🔔 KEY THUÊ BOT ĐƯỢC KÍCH HOẠT\n\n` +
                        `👤 Người dùng: ${senderID}\n` +
                        `🌐 Nhóm: ${threadID}\n` +
                        `🔑 Key: ${message}${adminDaysInfo}${adminPriceInfo}\n` +
                        `📅 Hết hạn: ${expiryDate}`;
                    api.sendMessage(adminMsg, global.config.NDH[0]);
                }

                saveData();
                saveKeys();
            } else {
                return api.sendMessage(`❎ Key đã được sử dụng cho nhóm khác!`, threadID);
            }
        } else {
            return api.sendMessage(`❎ Key không tồn tại hoặc không hợp lệ!`, threadID);
        }
    }
};
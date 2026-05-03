this.config = {
    name: 'ban',
    alias: ['block'],
    version: '3.0.0',
    role: 3,
    author: 'DC-Nam - Optimized by DuyDev',
    info: 'Ban user/command trong nhóm',
    category: 'Quản trị viên',
    guides: 'list | @user [cmd] | [cmd]',
    cd: 3,
    prefix: true
};
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment-timezone');

// Đường dẫn file data
const dataPath = path.join(__dirname, '../../core/data/commands-banned.json');

// Khởi tạo data
let data = {};
const loadData = () => {
    if (fs.existsSync(dataPath)) {
        data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } else {
        saveData();
    }
};

const saveData = () => {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 4));
};

const getCurrentTime = () => {
    return moment().tz('Asia/Ho_Chi_Minh').format('HH:mm:ss DD/MM/YYYY');
};

// Format thông báo ban đồng bộ
const formatBanMessage = (type, details) => {
    const icons = {
        banned: '🚫',
        command: '⚡',
        user: '👤',
        time: '⏰',
        success: '✅',
        error: '❎'
    };
    
    switch (type) {
        case 'list':
            return `${icons.banned} DANH SÁCH BAN\n\n${icons.user} User: ${details.users}\n\n${icons.command} Command: ${details.commands}`;
        case 'user_banned':
            return `${icons.banned} Đã ban user: ${details.name}`;
        case 'cmd_banned':
            return `${icons.command} Đã cấm ${details.name} dùng: ${details.commands}`;
        case 'already_banned':
            return `${icons.error} ${details.message}`;
        default:
            return details.message || 'Thông báo không xác định';
    }
};

// Helper functions
const checkPermission = (userID, threadID) => {
    const isAdmin = global.config.ADMINBOT.includes(userID);
    const isNDH = global.config.NDH.includes(userID);
    const threadInfo = global.data.threadInfo.get(threadID);
    const isGroupAdmin = threadInfo?.adminIDs?.some(admin => admin.id === userID);
    
    return { isAdmin, isNDH, isGroupAdmin, canBan: isAdmin || isNDH || isGroupAdmin };
};

const isProtected = (userID, threadID) => {
    const { isAdmin, isNDH, isGroupAdmin } = checkPermission(userID, threadID);
    return isAdmin || isNDH || isGroupAdmin;
};

const canUnban = (banAuthor, unbanAuthor) => {
    const banByAdmin = global.config.ADMINBOT.includes(banAuthor) || global.config.NDH.includes(banAuthor);
    const unbanByAdmin = global.config.ADMINBOT.includes(unbanAuthor) || global.config.NDH.includes(unbanAuthor);
    return !banByAdmin || unbanByAdmin;
};

this.onCall = async ({ api, event, args, Users, Threads }) => {
    const { senderID, threadID, messageID, mentions, messageReply } = event;
    
    loadData();
    
    // Khởi tạo data cho thread nếu chưa có
    if (!data[threadID]) {
        data[threadID] = { cmds: [], users: {} };
    }
    
    const send = (message) => api.sendMessage(message, threadID, messageID);
    const permission = checkPermission(senderID, threadID);
    
    if (!permission.canBan) {
        return send("⛔ Bạn không có quyền sử dụng lệnh này");
    }
    
    // Hiển thị danh sách ban
    if (args[0] === 'list') {
        const bannedUsers = Object.entries(data[threadID].users)
            .filter(([id, info]) => info.all?.status)
            .map(([id, info]) => `• ${info.all.name || id}`);
            
        const bannedCommands = data[threadID].cmds
            .map(cmd => `• ${cmd.cmd}`);
        
        const message = formatBanMessage('list', {
            users: bannedUsers.length ? bannedUsers.join('\n') : 'Không có',
            commands: bannedCommands.length ? bannedCommands.join('\n') : 'Không có'
        });
        
        return send(message);
    }
    
    // Xác định target user
    let targetUserId = null;
    let targetUserName = null;
    
    if (mentions && Object.keys(mentions).length > 0) {
        [targetUserId, targetUserName] = Object.entries(mentions)[0];
    } else if (messageReply) {
        targetUserId = messageReply.senderID;
        try {
            const userData = await Users.getData(targetUserId);
            targetUserName = userData.name || `User ${targetUserId}`;
        } catch (e) {
            targetUserName = `User ${targetUserId}`;
        }
    }
    
    // Ban user logic
    if (targetUserId) {
        // Kiểm tra quyền hạn
        if (!permission.isAdmin && !permission.isNDH && isProtected(targetUserId, threadID)) {
            return send('⛔ Không thể ban user có quyền cao hơn');
        }
        
        // Lấy commands cần ban (loại bỏ mention)
        const commandsToBan = args.filter(arg => !arg.includes('@')).filter(Boolean);
        
        if (!data[threadID].users[targetUserId]) {
            data[threadID].users[targetUserId] = { all: {}, cmds: [] };
        }
        
        const userBanData = data[threadID].users[targetUserId];
        
        if (commandsToBan.length === 0) {
            // Ban toàn bộ
            userBanData.all = {
                status: true,
                name: targetUserName,
                author: senderID,
                time: getCurrentTime()
            };
            saveData();
            return send(formatBanMessage('user_banned', { name: targetUserName }));
        } else {
            // Ban commands cụ thể
            const newCommands = [];
            commandsToBan.forEach(cmd => {
                if (!userBanData.cmds.some(item => item.cmd === cmd)) {
                    userBanData.cmds.push({ cmd, author: senderID, time: getCurrentTime() });
                    newCommands.push(cmd);
                }
            });
            
            if (newCommands.length > 0) {
                saveData();
                return send(formatBanMessage('cmd_banned', { name: targetUserName, commands: newCommands.join(', ') }));
            } else {
                return send('❎ User này đã bị cấm các lệnh này rồi');
            }
        }
    }
    
    // Ban commands trong nhóm
    if (args.length === 0) {
        return send('📖 Sử dụng: /ban list | /ban @user [cmd] | /ban [cmd]');
    }
    
    const newCommands = [];
    args.forEach(cmd => {
        if (!data[threadID].cmds.some(item => item.cmd === cmd)) {
            data[threadID].cmds.push({ cmd, author: senderID, time: getCurrentTime() });
            newCommands.push(cmd);
        }
    });
    
    if (newCommands.length > 0) {
        saveData();
        return send(`⚡ Đã cấm lệnh: ${newCommands.join(', ')}`);
    } else {
        return send('❎ Các lệnh này đã bị cấm rồi');
    }
};
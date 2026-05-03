this.config = {
    name: 'unban',
    alias: ['unblock'],
    version: '2.0.0',
    role: 1,
    author: 'DC-Nam - Upgrade by DuyDev',
    info: 'Gỡ ban người dùng và lệnh trong nhóm',
    category: 'Quản trị viên',
    guides: '[user/command] [@tag/command_name]',
    cd: 5,
    prefix: true
};

const fs = require('fs-extra');
const path = require('path');

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

// Helper functions
const isAdminBot = (userId) => global.config.ADMINBOT.includes(userId);
const isNDH = (userId) => global.config.NDH.includes(userId);

const hasPermission = (senderID) => {
    return isAdminBot(senderID) || isNDH(senderID);
};

const canUnban = (banAuthor, unbanAuthor) => {
    const banByAdmin = isAdminBot(banAuthor) || isNDH(banAuthor);
    const unbanByAdmin = isAdminBot(unbanAuthor) || isNDH(unbanAuthor);
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
    
    // Unban người dùng (từ mention hoặc reply)
    let targetUserId = null;
    let targetUserName = null;
    
    if (mentions && Object.keys(mentions).length > 0) {
        const mentionEntries = Object.entries(mentions);
        [targetUserId, targetUserName] = mentionEntries[0];
    } else if (messageReply) {
        targetUserId = messageReply.senderID;
        try {
            const userData = await Users.getData(targetUserId);
            targetUserName = userData.name || `User ${targetUserId}`;
        } catch (e) {
            targetUserName = `User ${targetUserId}`;
        }
    }
    
    if (targetUserId) {
        
        if (!data[threadID].users[targetUserId]) {
            return send('Người dùng này chưa bị ban');
        }
        
        const userBanData = data[threadID].users[targetUserId];
        
        // Lấy danh sách lệnh cần unban (loại bỏ tên người dùng nếu có mention)
        const commandsToUnban = mentions ? 
            args.filter(arg => !arg.includes('@')).filter(Boolean) : 
            args.filter(Boolean);
        
        if (commandsToUnban.length === 0) {
            // Unban toàn bộ
            if (!userBanData.all?.status) {
                return send('Người dùng này chưa bị ban');
            }
            
            if (!canUnban(userBanData.all.author, senderID)) {
                return send('Người này do admin bot ban nên bạn không đủ quyền unban');
            }
            
            userBanData.all.status = false;
            saveData();
            return send(`Đã unban người dùng: ${targetUserName}`);
        } else {
            // Unban lệnh cụ thể
            const existingCommands = userBanData.cmds.filter(cmd => commandsToUnban.includes(cmd.cmd));
            
            if (existingCommands.length === 0) {
                return send('Người này chưa bị cấm các lệnh này');
            }
            
            const cannotUnban = [];
            const canUnbanCommands = [];
            
            existingCommands.forEach(cmd => {
                if (canUnban(cmd.author, senderID)) {
                    canUnbanCommands.push(cmd.cmd);
                } else {
                    cannotUnban.push(cmd.cmd);
                }
            });
            
            // Xóa các lệnh có thể unban
            userBanData.cmds = userBanData.cmds.filter(cmd => !canUnbanCommands.includes(cmd.cmd));
            
            saveData();
            
            let message = '';
            if (canUnbanCommands.length > 0) {
                message += `Đã mở cấm các lệnh: ${canUnbanCommands.join(', ')}`;
            }
            if (cannotUnban.length > 0) {
                message += (message ? '\n' : '') + `Các lệnh sau do admin bot cấm nên bạn không đủ quyền unban: ${cannotUnban.join(', ')}`;
            }
            
            return send(message);
        }
    }
    
    // Unban lệnh trong nhóm
    if (args.length === 0) {
        return send('Vui lòng nhập tên lệnh cần mở cấm hoặc tag/reply người dùng');
    }
    
    const existingCommands = data[threadID].cmds.filter(cmd => args.includes(cmd.cmd));
    
    if (existingCommands.length === 0) {
        return send('Các lệnh này chưa bị cấm');
    }
    
    const cannotUnban = [];
    const canUnbanCommands = [];
    
    existingCommands.forEach(cmd => {
        if (canUnban(cmd.author, senderID)) {
            canUnbanCommands.push(cmd.cmd);
        } else {
            cannotUnban.push(cmd.cmd);
        }
    });
    
    // Xóa các lệnh có thể unban
    data[threadID].cmds = data[threadID].cmds.filter(cmd => !canUnbanCommands.includes(cmd.cmd));
    
    saveData();
    
    let message = '';
    if (canUnbanCommands.length > 0) {
        message += `Đã mở cấm các lệnh: ${canUnbanCommands.join(', ')}`;
    }
    if (cannotUnban.length > 0) {
        message += (message ? '\n' : '') + `Các lệnh sau do admin bot cấm nên bạn không đủ quyền unban: ${cannotUnban.join(', ')}`;
    }
    
    return send(message);
};
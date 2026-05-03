const fs = require('fs');
const path = require('path');
this.config = {
    name: "autoduyettv",
    alias: [],
    version: "1.0.5", 
    role: 1,
    author: "DongDev",
    info: "Tự động duyệt yêu cầu tham gia với chức năng bật/tắt",
    category: "Công cụ",
    guides: "{pn} on/off - Bật hoặc tắt tự động duyệt",
    cd: 5,
    prefix: true
};
const DATA_PATH = path.join(__dirname, '..', '..', 'core/data', 'autoApprove.json');
const loadData = () => {
    try {
        if (!fs.existsSync(DATA_PATH)) {
            const initialData = {};
            fs.writeFileSync(DATA_PATH, JSON.stringify(initialData, null, 2), 'utf8');
            return initialData;
        }
        const data = fs.readFileSync(DATA_PATH, 'utf8');
        return data.trim() ? JSON.parse(data) : {};
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        return {};
    }
};
const saveData = (data) => {
    try {
        if (!data || typeof data !== 'object') {
            console.error('Dữ liệu không hợp lệ để lưu');
            return false;
        }
        fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Lỗi khi lưu dữ liệu:', error);
        return false;
    }
};
this.onEvent = async function ({ api, event, msg, Users }) {
    try {
        const {
            threadID,
            logMessageType,
            logMessageData,
        } = event;
        
        if (!threadID || !logMessageType) return;
        
        const threadSettings = loadData();
        if (!threadSettings[threadID]) return;
        
        if (logMessageType === "log:approval_request") {
            const { requestId } = logMessageData;
            if (!requestId) return;
            
            try {
                await api.addUserToGroup(requestId, threadID);
                console.log(`Đã tự động duyệt user ${requestId} vào nhóm ${threadID}`);
            } catch (error) {
                console.error('Lỗi khi thêm user vào nhóm:', error);
            }
        }
    } catch (error) {
        console.error('Lỗi trong onEvent:', error);
    }
};

this.onCall = async function ({ api, event, args, Users }) {
    try {
        const { threadID, messageID } = event;
        const threadSettings = loadData();
        const command = args[0]?.toLowerCase();
        switch (command) {
            case 'on':
                threadSettings[threadID] = true;
                if (saveData(threadSettings)) {
                    await api.sendMessage('Đã bật tự động duyệt', threadID, messageID);
                } else {
                    await api.sendMessage('Lỗi khi lưu cài đặt', threadID, messageID);
                }
                break;
                
            case 'off':
                threadSettings[threadID] = false;
                if (saveData(threadSettings)) {
                    await api.sendMessage('Đã tắt tự động duyệt', threadID, messageID);
                } else {
                    await api.sendMessage('Lỗi khi lưu cài đặt', threadID, messageID);
                }
                break;
                
            default:
                const status = threadSettings[threadID] ? 'đang bật' : 'đang tắt';
                await api.sendMessage(`[ AUTO DUYỆT ]\nTrạng thái: ${status}\n\nCách dùng:\n• autoduyettv on - Bật tự động duyệt\n• autoduyettv off - Tắt tự động duyệt`, threadID, messageID);
        }
    } catch (error) {
        console.error('Error in onCall:', error);
        await api.sendMessage('Đã xảy ra lỗi', threadID, messageID);
    }
}
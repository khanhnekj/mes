const fs = require('fs-extra');
const path = require('path');
const moment = require('moment-timezone');
const logger = require("../../func/utils/log.js");

module.exports = {
    config: {
    name: "updateChecktt",
    eventType: ["log:unsubscribe", "log:subscribe"],
    version: "2.0.0",
    author: "DongDev",
        info: "Quản lý dữ liệu đếm tin nhắn"
    },

    onCall: async function({ event, api }) {
        try {
            const { logMessageType, logMessageData, threadID } = event;
            const botID = api.getCurrentUserID();
            const dataPath = path.join(__dirname, '../../core/data/messageCounts');
            const filePath = path.join(dataPath, `${threadID}.json`);

            if (logMessageType === "log:unsubscribe") {
                // User rời khỏi nhóm
                const leftUserID = logMessageData.leftParticipantFbId;
                
                if (leftUserID === botID) {
                    // Bot rời khỏi nhóm - xóa toàn bộ dữ liệu
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        logger.log(`Đã xóa dữ liệu đếm tin nhắn cho nhóm: ${threadID}`, "CHECKTT");
                    }
                } else {
                    // User thường rời - xóa data của user đó
                    if (fs.existsSync(filePath)) {
                        const threadData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                        
                        ['total', 'week', 'day', 'month'].forEach(type => {
                            if (threadData[type]) {
                                threadData[type] = threadData[type].filter(u => u.id !== leftUserID);
                            }
                        });
                        
                        fs.writeFileSync(filePath, JSON.stringify(threadData, null, 2));
                        logger.log(`Đã xóa user ${leftUserID} khỏi nhóm ${threadID}`, "CHECKTT");
                    }
                }
            } else if (logMessageType === "log:subscribe") {
                // User tham gia nhóm
                const addedUsers = logMessageData.addedParticipants || [];
                
                if (addedUsers.some(u => u.userFbId === botID)) {
                    logger.log(`Bot vào nhóm: ${threadID}`, "CHECKTT");
                } else {
                    // Tự động thêm user mới vào tracking (sẽ được xử lý trong onData handler)
                    logger.log(`User mới vào nhóm: ${threadID}`, "CHECKTT");
                }
            }
        } catch (error) {
            console.error('[UPDATECHECKTT] Lỗi:', error.message);
        }
    }
};
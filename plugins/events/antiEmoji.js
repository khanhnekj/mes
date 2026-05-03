const fs = require('fs-extra');

module.exports = {
    config: {
        name: "antiEmoji",
        eventType: ["log:thread-icon"],
        version: "2.0.0",
        author: "DongDev",
        info: "Chống đổi icon cảm xúc nhóm"
    },

    onCall: async function({ event, api, Threads }) {
        try {
            const { threadID, logMessageData, author } = event;
            const botID = api.getCurrentUserID();
            
            if (author === botID) return;

            const dataAnti = JSON.parse(fs.readFileSync(global.anti, 'utf8'));
            if (!dataAnti.antiEmoji?.[threadID]) return;

            const threadData = await Threads.getData(threadID);
            const threadInfo = threadData?.threadInfo;
            if (!threadInfo) return;

            const isAdmin = threadInfo.adminIDs?.some(admin => admin.id === author) || 
                           global.config.NDH?.includes(author) || 
                           global.config.ADMINBOT?.includes(author);

            if (!isAdmin) {
                const oldEmoji = dataAnti.antiEmoji[threadID].oldEmoji || '👍';
                await api.changeThreadEmoji(oldEmoji, threadID);
                api.sendMessage(`❎ Chống đổi emoji: Đã khôi phục về ${oldEmoji}`, threadID);
            }
        } catch (error) {
            console.error('[ANTIEMOJI] Lỗi:', error.message);
        }
    }
};
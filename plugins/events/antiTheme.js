const fs = require('fs-extra');

module.exports = {
    config: {
        name: "antiTheme",
        eventType: ["log:thread-color"],
        version: "2.0.0",
        author: "DongDev",
        info: "Chống đổi chủ đề nhóm"
    },

    onCall: async function({ event, api, Threads }) {
        try {
            const { threadID, logMessageData, author } = event;
            const botID = api.getCurrentUserID();
            
            if (author === botID) return;

            const dataAnti = JSON.parse(fs.readFileSync(global.anti, 'utf8'));
            if (!dataAnti.antiTheme?.[threadID]) return;

            const threadData = await Threads.getData(threadID);
            const threadInfo = threadData?.threadInfo;
            if (!threadInfo) return;

            const isAdmin = threadInfo.adminIDs?.some(admin => admin.id === author) || 
                           global.config.NDH?.includes(author) || 
                           global.config.ADMINBOT?.includes(author);

            if (!isAdmin) {
                const antiData = dataAnti.antiTheme[threadID];
                const oldTheme = antiData.oldTheme || { 
                    theme_id: "196241301102133", 
                    accessibility_label: "default" 
                };
                
                await api.changeThreadColor(oldTheme.theme_id, threadID);
                api.sendMessage(`❎ Chống đổi chủ đề: Đã khôi phục về ${oldTheme.accessibility_label}`, threadID);
            }
        } catch (error) {
            console.error('[ANTITHEME] Lỗi:', error.message);
        }
    }
};
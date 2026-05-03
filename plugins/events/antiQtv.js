const fs = require("fs");

module.exports = {
    config: {
        name: "antiQtv",
    eventType: ["log:thread-admins"],
        version: "2.0.0",
    author: "DongDev",
        info: "Chống thay đổi quản trị viên"
    },

    onCall: async function({ event, api }) {
        try {
            const { logMessageData, author, threadID } = event;
    const botID = api.getCurrentUserID();
            
            if (author === botID || !logMessageData) return;

        const dataAnti = JSON.parse(fs.readFileSync(global.anti, "utf8"));
            if (!dataAnti.antiQtv?.[threadID]) return;

            const { ADMIN_EVENT, TARGET_ID } = logMessageData;
            if (TARGET_ID === botID) return;

            if (ADMIN_EVENT === "remove_admin") {
                await api.changeAdminStatus(threadID, author, false);
                await api.changeAdminStatus(threadID, TARGET_ID, true);
            } else if (ADMIN_EVENT === "add_admin") {
                await api.changeAdminStatus(threadID, author, false);
                await api.changeAdminStatus(threadID, TARGET_ID, false);
            }
            
            api.sendMessage("❎ Đã kích hoạt chống cướp quyền admin", threadID);
        } catch (error) {
            console.error('[ANTIQTV] Lỗi:', error.message);
        }
    }
};
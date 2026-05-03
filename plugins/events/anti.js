const fs = require('fs-extra');

module.exports = {
    config: {
        name: "anti",
        eventType: ["log:subscribe", "log:unsubscribe", "log:thread-name", "log:user-nickname"],
        version: "2.0.0",
        author: "DongDev",
        info: "Chống thay đổi thông tin nhóm"
    },

    onCall: async function({ api, event, Threads, tools }) {
        try {
            const { threadID, author, logMessageType, logMessageData } = event;
            const botID = api.getCurrentUserID();
            
            if (!threadID || !logMessageType || author === botID) return;

            const dataAnti = JSON.parse(fs.readFileSync(global.anti, "utf8"));
                const threadData = await Threads.getData(threadID);
            const threadInfo = threadData?.threadInfo;
            
            if (!threadInfo) return;

            const isAdmin = threadInfo.adminIDs?.some(admin => admin.id === author) || 
                           global.config.NDH?.includes(author) || 
                           global.config.ADMINBOT?.includes(author);

            switch (logMessageType) {
                case "log:thread-name":
                    if (dataAnti.antiChangeNameBox?.[threadID] && !isAdmin) {
                        const oldName = dataAnti.antiChangeNameBox[threadID].oldName || "Group";
                        await api.setTitle(oldName, threadID);
                        api.sendMessage(`❎ Chống đổi tên: Đã khôi phục về "${oldName}"`, threadID);
                    }
                    break;

                case "log:user-nickname":
                    if (dataAnti.antiChangeNickname?.[threadID] && !isAdmin) {
                        const { participant_id, nickname } = logMessageData;
                        const oldNickname = dataAnti.antiChangeNickname[threadID].oldNickname || "";
                        await api.changeNickname(oldNickname, threadID, participant_id);
                        api.sendMessage("❎ Chống đổi biệt danh đã kích hoạt", threadID);
                    }
                    break;

                case "log:subscribe":
                    if (dataAnti.antiJoin?.[threadID] && !isAdmin) {
                        const addedUsers = logMessageData.addedParticipants || [];
                        for (const user of addedUsers) {
                            if (user.userFbId !== botID) {
                                await api.removeUserFromGroup(user.userFbId, threadID);
                            }
                        }
                        api.sendMessage("❎ Chống vào nhóm: Đã kick user trái phép", threadID);
                    }
                    break;

                case "log:unsubscribe":
                    if (dataAnti.antiOut?.[threadID] && !isAdmin) {
                        const leftUserID = logMessageData.leftParticipantFbId;
                        if (leftUserID !== botID) {
                            await api.addUserToGroup(leftUserID, threadID);
                            api.sendMessage("❎ Chống rời nhóm: Đã add user trở lại", threadID);
                        }
                    }
                    break;
            }
        } catch (error) {
            console.error('[ANTI] Lỗi:', error.message);
        }
    }
};
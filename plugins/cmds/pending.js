this.config = {
    "name": "pending",
    "alias": ["pending"],
    "version": "1.1.0",
    "author": "Niiozic, updated by DongDev",
    "role": 2,
    "info": "Quản lý tin nhắn chờ của bot",
    "category": "Admin",
    "guides": "[u] [t] [a] [approveall] [rejectall]",
    "cd": 5,
    "prefix": true
};
const fs = require('fs-extra');
const axios = require("axios");
const request = require('request');
this.onReply = async function({ api, event, Reply }) {
    if (String(event.senderID) !== String(Reply.author)) return;
    
    const { body, threadID, messageID } = event;
    let count = 0;

    if (isNaN(body) && (body.startsWith("c") || body.startsWith("cancel"))) {
        const indices = body.slice(1).split(/\s+/);

        for (const singleIndex of indices) {
            if (isNaN(singleIndex) || singleIndex <= 0 || singleIndex > Reply.pending.length) {
                return api.sendMessage(`→ ${singleIndex} Không phải là một con số hợp lệ`, threadID, messageID);
            }
        }

        return api.sendMessage(`[ PENDING ] - Đã từ chối thành công`, threadID, messageID);
    } else {
        const indices = body.split(/\s+/);

        for (const singleIndex of indices) {
            if (isNaN(singleIndex) || singleIndex <= 0 || singleIndex > Reply.pending.length) {
                return api.sendMessage(`→ ${singleIndex} Không phải là một con số hợp lệ`, threadID, messageID);
            }

            const pendingRequest = Reply.pending[singleIndex - 1];
            api.changeNickname(`『 ${global.config.PREFIX} 』 ⪼ ${global.config.BOTNAME || "𝙱𝙾𝚃 𝙳𝚘𝚗𝚐𝙳𝚎𝚟👾"}`, pendingRequest.threadID, api.getCurrentUserID());
            await api.sendMessage(`✅ Phê Duyệt Thành Công`, pendingRequest.threadID);
            count++;
        }

        return api.sendMessage(`[ PENDING ] - Đã phê duyệt thành công ${count} yêu cầu`, threadID, messageID);
    }
};
this.onCall = async function({ api, event, args, permission }) {
    if (args.join() == "") {
        api.sendMessage("❯ Pending user: Hàng chờ người dùng\n❯ Pending thread: Hàng chờ nhóm\n❯ Pending all: Tất cả box đang chờ duyệt\n❯ Approve all: Duyệt tất cả\n❯ Reject all: Từ chối tất cả", event.threadID, event.messageID);
        return;
    }
    const commandName = this.config.name;
    const { threadID, messageID } = event;
    const action = args[0].toLowerCase();
    let msg = "", index = 1;
    try {
        const spam = await api.getThreadList(100, null, ["OTHER"]) || [];
        const pending = await api.getThreadList(100, null, ["PENDING"]) || [];
        const list = [...spam, ...pending];
        if (action === "user" || action === "u" || action === "-u") {
            const userList = list.filter(group => !group.isGroup);
            for (const single of userList) msg += `${index++}. ${single.name}\n${single.threadID}\n`;
            if (userList.length) {
                return api.sendMessage(`→ Tổng số người dùng cần duyệt: ${userList.length} người dùng\n${msg}\nReply (phản hồi) theo stt để duyệt`, threadID, (error, info) => {
                    global.Seiko.onReply.push({
                        name: commandName,
                        messageID: info.messageID,
                        author: event.senderID,
                        pending: userList
                    });
                }, messageID);
            } else {
                return api.sendMessage("[ PENDING ] - Hiện tại không có người dùng nào trong hàng chờ", threadID, messageID);
            }
        } else if (action === "thread" || action === "t" || action === "-t") {
            const threadList = list.filter(group => group.isSubscribed && group.isGroup);
            for (const single of threadList) msg += `${index++}. ${single.name}\n${single.threadID}\n`;
            if (threadList.length) {
                return api.sendMessage(`→ Tổng số nhóm cần duyệt: ${threadList.length} nhóm\n${msg}\nReply (phản hồi) theo stt để duyệt`, threadID, (error, info) => {
                    global.Seiko.onReply.push({
                        name: commandName,
                        messageID: info.messageID,
                        author: event.senderID,
                        pending: threadList
                    });
                }, messageID);
            } else {
                return api.sendMessage("[ PENDING ] - Hiện tại không có nhóm nào trong hàng chờ", threadID, messageID);
            }
        } else if (action === "all" || action === "a" || action === "-a") {
            for (const single of list) msg += `${index++}. ${single.name}\n${single.threadID}\n`;
            if (list.length) {
                return api.sendMessage(`→ Tổng số User & Thread cần duyệt: ${list.length} User & Thread\n${msg}\nReply (phản hồi) theo stt để duyệt`, threadID, (error, info) => {
                    global.Seiko.onReply.set(info.messageID, {
                        commandName,
                        messageID: info.messageID,
                        author: event.senderID,
                        pending: list
                    });
                }, messageID);
            } else {
                return api.sendMessage("[ PENDING ] - Hiện tại không có User & Thread nào trong hàng chờ", threadID, messageID);
            }
        } else if (action === "approveall") {
            for (const pendingRequest of list) {
                api.changeNickname(`『 ${global.config.PREFIX} 』 ⪼ ${global.config.BOTNAME || "𝙱𝙾𝚃 𝙳𝚘𝚗𝚐𝙳𝚎𝚟👾"}`, pendingRequest.threadID, api.getCurrentUserID());
                api.sendMessage("", event.threadID, () => api.sendMessage(`❯ Admin Bot: ${global.config.FACEBOOK_ADMIN}`, pendingRequest.threadID));
                count++;
            }
            return api.sendMessage(`[ PENDING ] - Đã phê duyệt tất cả ${count} yêu cầu`, threadID, messageID);
        } /*else if (action === "reject
                count++;
            }
            return api.sendMessage(`[ PENDING ] - Đã từ chối tất cả ${count} yêu cầu`, threadID, messageID);
        } else {
            return api.sendMessage("[ PENDING ] - Lệnh không hợp lệ", threadID, messageID);
        }*/
    } catch (e) {
        return api.sendMessage("[ PENDING ] - Không thể lấy danh sách chờ", threadID, messageID);
    }
};
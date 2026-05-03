const moment = require('moment-timezone');

module.exports = {
   config: {
      name: "listban",
      alias: ["listban"],
      version: "1.0.0",
      role: 3,
      author: "DongDev",
      info: "Unban người dùng/nhóm",
      category: "Admin",
      guides: "user/thread",
      cd: 5,
      prefix: true
   },
   onCall: async ({ api, tools, event, msg, args, commandName, Threads, Users, ThreadBans, UserBans, Currencies }) => {
      const [type] = args.map(arg => arg.trim().toLowerCase());
      if (!type || !['user', 'thread'].includes(type)) {
         return msg.reply("❎ Vui lòng chỉ nhập input hợp lệ: 'user' hoặc 'thread'");
      }
      let response = '';
      if (type === 'user') {
         const bannedUsers = await UserBans.getAll();
         if (bannedUsers.length === 0) {
            return msg.reply("❎ Không có người dùng nào bị cấm");
         }
         for (const [index, ban] of bannedUsers.entries()) {
            const user = await Users.getData(ban.userID);
            const formattedTime = moment(ban.banTime).tz('Asia/Ho_Chi_Minh').format('HH:mm:ss | DD/MM/YYYY');
            response += `${index + 1}. ${user.name}\n📝 Lý do: ${ban.reason}\n⏰ Time: ${formattedTime}\n\n`;
         }
      }
      if (type === 'thread') {
         const bannedThreads = await ThreadBans.getAll();
         if (bannedThreads.length === 0) {
            return msg.reply("❎ Không có nhóm nào bị cấm");
         }
         for (const [index, ban] of bannedThreads.entries()) {
            const thread = await Threads.getData(ban.threadID);
            const formattedTime = moment(ban.banTime).tz('Asia/Ho_Chi_Minh').format('HH:mm:ss | DD/MM/YYYY');
            response += `${index + 1}. ${thread.threadInfo.name}\n📝 Lý do: ${ban.reason}\n⏰ Time: ${formattedTime}\n\n`;
         }
      }
      return msg.reply(`${response}\n📌 Reply theo stt để unban, có thể reply nhiều số hoặc all để unban tất cả`, (err, info) => {
         global.Seiko.onReply.set(info.messageID, {
            commandName,
            type,
            author: event.senderID,
            messageID: info.messageID
         });
      });
   },
   onReply: async ({ api, tools, event, msg, Reply, commandName, Threads, Users, ThreadBans, UserBans, Currencies }) => {
      const { messageID, author, type } = Reply;
      if (author !== event.senderID) return;
      let response = '';
      const input = event.body.trim().toLowerCase();
      if (input === 'all') {
         let unbannedUsers = [];
         let unbannedThreads = [];
         if (type === 'user') {
            const bannedUsers = await UserBans.getAll();
            if (bannedUsers.length === 0) {
               return msg.reply("❎ Không có người dùng nào bị cấm");
            }
            for (const ban of bannedUsers) {
               await UserBans.delData(ban.userID);
               unbannedUsers.push(ban.userID);
            }
         } else if (type === 'thread') {
            const bannedThreads = await ThreadBans.getAll();
            if (bannedThreads.length === 0) {
               return msg.reply("❎ Không có nhóm nào bị cấm");
            }
            for (const ban of bannedThreads) {
               await ThreadBans.delData(ban.threadID);
               unbannedThreads.push(ban.threadID);
            }
         }
         if (unbannedUsers.length > 0) {
            return msg.reply("☑️ Đã unban tất cả người dùng trong danh sách");;
         }

         if (unbannedThreads.length > 0) {
            return msg.reply("☑️ Đã unban tất cả nhóm trong danh sách");
         }
      } else {
         const indices = input.split(/\s+/).map(i => parseInt(i.trim()) - 1);
         let invalidIndexes = [];
         let unbannedUsers = [];
         let unbannedThreads = [];
         if (type === 'user') {
            const bannedUsers = await UserBans.getAll();
            for (const index of indices) {
               if (bannedUsers[index]) {
                  const userID = bannedUsers[index].userID;
                  await UserBans.delData(userID);
                  const user = await Users.getData(userID);
                  unbannedUsers.push({ userID, name: user.name });
               } else {
                  invalidIndexes.push(index + 1);
               }
            }
         } else if (type === 'thread') {
            const bannedThreads = await ThreadBans.getAll();
            for (const index of indices) {
               if (bannedThreads[index]) {
                  const threadID = bannedThreads[index].threadID;
                  await ThreadBans.delData(threadID);
                  const thread = await Threads.getData(threadID);
                  unbannedThreads.push({ threadID, name: thread.threadInfo.name });
               } else {
                  invalidIndexes.push(index + 1);
               }
            }
         }
         if (unbannedUsers.length > 0) {
            response += "Unban Thành công:\n";
            unbannedUsers.forEach((user, index) => {
               response += `${index + 1}. ${user.userID} | ${user.name}\n`;
            });
         }
         if (unbannedThreads.length > 0) {
            response += "Unban Thành công:\n";
            unbannedThreads.forEach((thread, index) => {
               response += `${index + 1}. ${thread.threadID} | ${thread.name}\n`;
            });
         }
         /*if (invalidIndexes.length > 0) {
            response += `Không tìm thấy id trong danh sách`;
         }*/
      }
      return msg.reply(response);
   },
}
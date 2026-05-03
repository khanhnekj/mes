module.exports = {
  config: {
    name: "spamban",
    alias: ["spamban"],
    version: "1.0.0",
    role: 3,
    author: "DongDev",
    info: "Ban người dùng nếu spam bot",
    category: "Admin",
    guides: "[]",
    cd: 5,
    prefix: true
  },
  onCall: async () => {},
  onChat: async ({ api, event, msg, commandName, Threads, Users, CommandBans, ThreadBans, UserBans, Currencies, client }) => {
    try {
      const { senderID, threadID, body } = event;
      const threadSetting = await Threads.getData(threadID);
      const prefix = threadSetting.PREFIX || global.config.PREFIX;
      const { name } = await Users.getData(senderID);      
      if (senderID === api.getCurrentUserID()) return;
      const isAdminOrNDH = (Array.isArray(client.config.ADMINBOT) && client.config.ADMINBOT.includes(senderID)) || (Array.isArray(client.config.NDH) && client.config.NDH.includes(senderID));
      if (isAdminOrNDH) return;
      if (!body || !body.startsWith(prefix)) return;
      if (!global.spamData) global.spamData = {};
      if (!global.spamData[senderID]) {
        global.spamData[senderID] = { count: 1, lastMessageTime: Date.now() };
      } else {
        const userData = global.spamData[senderID];
        const currentTime = Date.now();
        const timeDiff = currentTime - userData.lastMessageTime;
        if (timeDiff > 60000) {
          userData.count = 1;
        } else {
          userData.count++;
        }
        userData.lastMessageTime = currentTime;
        if (userData.count > 10) {
          const reason = "Spam Bot 10 lần/phút";
          const banStartTime = new Date().toISOString();
          await UserBans.setData(senderID, reason, banStartTime);
          msg.reply(`Bạn đã bị cấm vì lý do ${reason}, tự động mở ban sau 10 phút, tém lại nha má 🙄`);
          delete global.spamData[senderID];
          setTimeout(async () => {
            const banData = await UserBans.getData(senderID);
            if (banData) {
              await UserBans.delData(senderID);
              msg.send(`Người dùng ${name} đã được gỡ cấm, bớt spam lại nha con 🙂`);
            }
          }, 600000);
          return;
        }
      }  
    } catch (error) {
      console.error("Error in onChat:", error);
    }
  }
};
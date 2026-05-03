const moment = require("moment-timezone");

this.config = {
  name: "listbanbox",
  version: "2.0.0",
  role: 2,
  author: "Aegis(Satoru)",
  info: "Xem danh sách các nhóm bị ban và unban bằng cách reply số thứ tự",
  category: "Admin",
  guides: "{pn}\nReply số thứ tự để unban nhóm",
  cd: 3
};

this.onCall = async function ({ api, event, ThreadBans }) {
  const { threadID, messageID, senderID } = event;
  
  try {
    const allBannedThreads = await ThreadBans.getAll();
    
    if (!allBannedThreads || allBannedThreads.length === 0) {
      return api.sendMessage(
        "📋 DANH SÁCH NHÓM BỊ BAN\n\n✅ Hiện tại không có nhóm nào bị ban!",
        threadID,
        messageID
      );
    }
    
    let msg = `📋 DANH SÁCH NHÓM BỊ BAN\n\n`;
    msg += `Tổng số: ${allBannedThreads.length} nhóm\n`;
    msg += `──────────────────\n\n`;
    
    const threadList = [];
    
    for (let i = 0; i < allBannedThreads.length; i++) {
      const ban = allBannedThreads[i];
      let threadName;
      try {
        const threadInfo = await api.getThreadInfo(ban.threadID);
        threadName = threadInfo.threadName || "Không lấy được tên";
      } catch (err) {
        threadName = "Không lấy được tên";
      }
      
      const banTime = moment(ban.banTime).tz("Asia/Ho_Chi_Minh").format("HH:mm:ss | DD/MM/YYYY");
      
      threadList.push({
        threadID: ban.threadID,
        threadName: threadName,
        reason: ban.reason,
        banTime: ban.banTime
      });
      
      msg += `${i + 1}. ${threadName}\n`;
      msg += `🆔 ID: ${ban.threadID}\n`;
      msg += `📝 Lý do: ${ban.reason}\n`;
      msg += `⏰ Thời gian: ${banTime}\n`;
      msg += `──────────────────\n`;
    }
    
    msg += `\n💡 Reply số thứ tự để unban nhóm`;
    
    api.sendMessage(msg, threadID, (err, info) => {
      if (!err) {
        global.Seiko.onReply.set(info.messageID, {
          commandName: this.config.name,
          author: senderID,
          threadList: threadList
        });
      }
    }, messageID);
    
  } catch (error) {
    console.error(error);
    api.sendMessage(
      `❎ Đã xảy ra lỗi: ${error.message}`,
      threadID,
      messageID
    );
  }
};

this.onReply = async function ({ api, event, ThreadBans }) {
  const { threadID, messageID, senderID, body } = event;
  const replyData = global.Seiko.onReply.get(event.messageReply?.messageID);
  
  if (!replyData) return;
  
  if (replyData.author !== senderID) {
    return api.sendMessage(
      "❎ Bạn không phải người thực hiện lệnh này.",
      threadID,
      messageID
    );
  }
  
  try {
    const index = parseInt(body.trim());
    
    if (isNaN(index) || index < 1 || index > replyData.threadList.length) {
      return api.sendMessage(
        `❎ Vui lòng nhập số hợp lệ từ 1 đến ${replyData.threadList.length}`,
        threadID,
        messageID
      );
    }
    
    const selectedThread = replyData.threadList[index - 1];
    const targetThreadID = selectedThread.threadID;
    
    const banData = await ThreadBans.getData(targetThreadID);
    if (!banData) {
      return api.sendMessage(
        "⚠️ Nhóm này đã được unban trước đó rồi!",
        threadID,
        messageID
      );
    }
    
    await ThreadBans.delData(targetThreadID);
    
    const banTime = moment(selectedThread.banTime).tz("Asia/Ho_Chi_Minh").format("HH:mm:ss | DD/MM/YYYY");
    const unbanTime = moment().tz("Asia/Ho_Chi_Minh").format("HH:mm:ss | DD/MM/YYYY");
    
    let unbannerName;
    try {
      const unbannerInfo = await api.getUserInfo(senderID);
      unbannerName = unbannerInfo[senderID].name;
    } catch (err) {
      unbannerName = "Admin";
    }
    
    const successMsg = `✅ ĐÃ GỠ BAN NHÓM THÀNH CÔNG\n\n` +
      `📌 Nhóm: ${selectedThread.threadName}\n` +
      `🆔 ID: ${targetThreadID}\n` +
      `📝 Lý do ban cũ: ${selectedThread.reason}\n` +
      `⏰ Thời gian ban: ${banTime}\n` +
      `⏰ Thời gian gỡ ban: ${unbanTime}\n` +
      `👤 Người gỡ ban: ${unbannerName}`;
    
    api.sendMessage(successMsg, threadID, messageID);
    
    if (targetThreadID !== threadID) {
      const notifyMsg = `✅ THÔNG BÁO GỠ BAN\n\n` +
        `Nhóm này đã được gỡ ban và có thể sử dụng bot trở lại\n\n` +
        `⏰ Thời gian: ${unbanTime}\n` +
        `👤 Người gỡ ban: ${unbannerName}\n\n` +
        `🎉 Chúc các bạn sử dụng bot vui vẻ!`;
      
      try {
        api.sendMessage(notifyMsg, targetThreadID);
      } catch (err) {
        console.log(`Không thể gửi thông báo đến nhóm ${targetThreadID}`);
      }
    }
    
    global.Seiko.onReply.delete(event.messageReply.messageID);
    
  } catch (error) {
    console.error(error);
    api.sendMessage(
      `❎ Đã xảy ra lỗi: ${error.message}`,
      threadID,
      messageID
    );
  }
};
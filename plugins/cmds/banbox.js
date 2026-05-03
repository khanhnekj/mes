const moment = require("moment-timezone");
const fs = require("fs-extra");

this.config = {
  name: "banthread",
  version: "2.0.0",
  role: 2,
  author: "Ageis(Satoru)",
  info: "Ban nhóm khỏi sử dụng bot",
  category: "Admin",
  guides: "{pn} [lý do]\n{pn} [threadID] [lý do]\n\nVí dụ:\n{pn} spam - Ban nhóm hiện tại với lý do spam\n{pn} 123456789 vi phạm - Ban nhóm 123456789\n{pn} - Ban nhóm hiện tại",
  cd: 3
};

this.onCall = async function ({ api, event, args, ThreadBans }) {
  const { threadID, messageID, senderID } = event;
  
  try {
    let targetThreadID;
    let reason;
    if (!args[0]) {
      targetThreadID = threadID;
      reason = "Thích thì bố ban";
    } else {
      const firstArg = args[0];
      const isThreadID = /^\d+$/.test(firstArg);
      
      if (isThreadID && firstArg.length > 10) {
        targetThreadID = firstArg;
        reason = args.slice(1).join(" ") || "Thích thì bố ban";
      } else {
        targetThreadID = threadID;
        reason = args.join(" ");
      }
    }
    
    reason = String(reason).trim();
    if (!reason) reason = "Thích thì bố ban";
    
    const isBanned = await ThreadBans.getData(targetThreadID);
    if (isBanned) {
      return api.sendMessage(
        "⚠️ NHÓM ĐÃ BỊ BAN\n\nNhóm này đã bị ban trước đó rồi!",
        threadID,
        messageID
      );
    }
    
    let threadName;
    try {
      const threadInfo = await api.getThreadInfo(targetThreadID);
      threadName = threadInfo.threadName || "Không rõ tên nhóm";
    } catch (err) {
      threadName = "Không lấy được tên nhóm";
    }
    
    const banTime = Date.now();
    
    let bannerName;
    try {
      const bannerInfo = await api.getUserInfo(senderID);
      bannerName = bannerInfo[senderID].name;
    } catch (err) {
      bannerName = "Admin";
    }
    
    await ThreadBans.setData(targetThreadID, reason, banTime);
    const formattedTime = moment(banTime).tz("Asia/Ho_Chi_Minh").format("HH:mm:ss | DD/MM/YYYY");
    
    const successMsg = `✅ ĐÃ BAN NHÓM THÀNH CÔNG\n\n` +
      `📌 Nhóm: ${threadName}\n` +
      `🆔 ID: ${targetThreadID}\n` +
      `📝 Lý do: ${reason}\n` +
      `⏰ Thời gian: ${formattedTime}\n` +
      `👤 Người ban: ${bannerName}`;
    
    api.sendMessage(successMsg, threadID, messageID);
    
    if (targetThreadID !== threadID) {
      const notifyMsg = `🚫 THÔNG BÁO BAN NHÓM\n\n` +
        `Nhóm này đã bị cấm sử dụng bot\n\n` +
        `📝 Lý do: ${reason}\n` +
        `⏰ Thời gian: ${formattedTime}\n\n` +
        `📞 Liên hệ Admin để được hỗ trợ`;
      
      try {
        api.sendMessage(notifyMsg, targetThreadID);
      } catch (err) {
        console.log(`Không thể gửi thông báo đến nhóm ${targetThreadID}`);
      }
    }
    
  } catch (error) {
    console.error(error);
    api.sendMessage(
      `❎ Đã xảy ra lỗi: ${error.message}`,
      threadID,
      messageID
    );
  }
};
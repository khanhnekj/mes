const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");

module.exports = {
  config: {
    name: "boxinfo",
    alias: ["infobox", "box"],
    version: "3.0.0",
    role: 0,
    author: "DongDev",
    info: "Xem thông tin chi tiết của nhóm (kèm ảnh nhóm)",
    category: "Thành Viên",
    guides: "boxinfo",
    cd: 5,
    prefix: true
  },

  onCall: async ({ api, event, args }) => {
    const { threadID, messageID } = event;

    try {
      const threadInfo = await api.getThreadInfo(threadID);

      // ====== Lấy dữ liệu cơ bản ======
      const nameBox = threadInfo.threadName || "Không có tên";
      const idBox = threadInfo.threadID;
      const members = threadInfo.participantIDs.length;
      const admins = threadInfo.adminIDs.length;
      const emoji = threadInfo.emoji || "❓";
      const msgCount = threadInfo.messageCount || 0;
      const approvalMode = threadInfo.approvalMode ? "✅ Bật" : "❌ Tắt";

      // ====== Giới tính ======
      let male = 0, female = 0, unknown = 0;
      for (const user of threadInfo.userInfo) {
        if (user.gender === "MALE") male++;
        else if (user.gender === "FEMALE") female++;
        else unknown++;
      }

      // ====== Ảnh nhóm ======
      const imgPath = path.join(__dirname, "cache", `box_${idBox}.jpg`);
      let attachment = [];

      if (threadInfo.imageSrc) {
        const img = (await axios.get(threadInfo.imageSrc, { responseType: "arraybuffer" })).data;
        fs.writeFileSync(imgPath, Buffer.from(img, "utf-8"));
        attachment.push(fs.createReadStream(imgPath));
      }

      // ====== Tạo nội dung ======
      const info = 
`🎀 Thông tin nhóm của bạn 🎀

📌 Tên nhóm: ${nameBox}
🆔 ID: ${idBox}
👥 Thành viên: ${members}
👑 Quản trị viên: ${admins}
💬 Tổng tin nhắn: ${msgCount.toLocaleString()}
💟 Emoji nhóm: ${emoji}
🔐 Duyệt thành viên: ${approvalMode}

👨 Nam: ${male}
👩 Nữ: ${female}
❔ Không xác định: ${unknown}`;

      // ====== Gửi tin ======
      api.sendMessage(
        { body: info, attachment },
        threadID,
        (err) => {
          if (!err && fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        },
        messageID
      );
    } catch (err) {
      console.error(err);
      api.sendMessage("⚠️ Không thể lấy thông tin nhóm. Vui lòng thử lại!", event.threadID, event.messageID);
    }
  },

  onEvent: async () => {},
  onReaction: async () => {},
  onReply: async () => {},
  onChat: async () => {},
  onLoad: async () => {}
};
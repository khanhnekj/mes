const fs = require("fs-extra");
const path = require("path");
const iconUnsend = path.join(__dirname, "../../core/data/iconUnsend.json");

this.config = {
  name: "setunsend",
  alias: ["setun", "camxuc", "cx"],
  version: "2.5.0",
  role: 1,
  author: "VTuan (update by Trae AI)",
  info: "Cài đặt, kiểm tra, xóa icon gỡ tin nhắn bot",
  category: "Quản trị viên",
  guides: "{pn} + icon | check | list",
  cd: 5,
  prefix: true
};

this.onLoad = () => {
  if (!fs.existsSync(iconUnsend)) {
    fs.ensureFileSync(iconUnsend);
    fs.writeFileSync(iconUnsend, "[]");
  }
};

this.onCall = async ({ api, event, args }) => {
  const { threadID, messageID } = event;
  const input = args[0];
  let data = [];

  if (fs.existsSync(iconUnsend)) {
    data = JSON.parse(fs.readFileSync(iconUnsend, "utf-8"));
  }

  const findIndex = data.findIndex(item => item.groupId === threadID);

  if (!input) {
    return api.sendMessage(
      "📘 Hướng dẫn sử dụng:\n" +
      "• setunsend + icon → Cài icon gỡ\n" +
      "• setunsend check → Xem icon nhóm\n" +
      "• setunsend list → Xem & xóa icon qua reply",
      threadID, messageID
    );
  }

  if (input === "check") {
    if (findIndex !== -1) {
      return api.sendMessage(`✅ Icon hiện tại: ${data[findIndex].iconUnsend}`, threadID, messageID);
    }
    return api.sendMessage("❎ Nhóm này chưa có icon!", threadID, messageID);
  }

  if (input === "list") {
    if (data.length === 0)
      return api.sendMessage("❎ Không có icon nào được cài đặt!", threadID, messageID);

    let msg = "📜 Danh sách icon đã cài:\n\n";
    let count = 1;

    for (const item of data) {
      try {
        const info = await api.getThreadInfo(item.groupId);
        msg += `${count++}. ${info.threadName || "Không rõ tên nhóm"} → ${item.iconUnsend}\n`;
      } catch {
        msg += `${count++}. [Không lấy được tên nhóm] → ${item.iconUnsend}\n`;
      }
    }

    msg += "\n💬 Reply số thứ tự để xóa hoặc nhập 'all' để xóa toàn bộ.";

    return api.sendMessage(msg, threadID, (err, info) => {
      if (err) return;
      global.Seiko.onReply.set(info.messageID, {
        commandName: this.config.name,
        type: "deleteList",
        author: event.senderID,
        data
      });
    }, messageID);
  }

  if (!isNaN(input) || input.match(/[a-zA-Z/"';+.,!@#$%^&*(){}[\]<>?_=|~`]/)) {
    return api.sendMessage("❎ Vui lòng nhập icon hợp lệ (chỉ biểu tượng cảm xúc)!", threadID, messageID);
  }

  if (findIndex !== -1) {
    data[findIndex].iconUnsend = input;
  } else {
    data.push({ groupId: threadID, iconUnsend: input });
  }

  fs.writeFileSync(iconUnsend, JSON.stringify(data, null, 2));
  return api.sendMessage("✅ Đã cài đặt icon thành công!", threadID, messageID);
};

// ----- Xử lý reply -----
this.onReply = async function({ api, event }) {
  const replyData = global.Seiko.onReply.get(event.messageReply?.messageID);
  if (!replyData) return;
  if (replyData.author !== event.senderID) return;

  let { data } = replyData;
  const { threadID, messageID, body } = event;
  const input = body.trim().toLowerCase();

  if (input === "all") {
    fs.writeFileSync(iconUnsend, "[]");
    global.Seiko.onReply.delete(event.messageReply.messageID);
    return api.sendMessage("✅ Đã xóa toàn bộ icon đã cài!", threadID, messageID);
  }

  const index = parseInt(input) - 1;
  if (isNaN(index) || index < 0 || index >= data.length) {
    return api.sendMessage("❎ Số không hợp lệ!", threadID, messageID);
  }

  const removed = data.splice(index, 1);
  fs.writeFileSync(iconUnsend, JSON.stringify(data, null, 2));
  global.Seiko.onReply.delete(event.messageReply.messageID);

  return api.sendMessage(`✅ Đã xóa icon: ${removed[0].iconUnsend}`, threadID, messageID);
};

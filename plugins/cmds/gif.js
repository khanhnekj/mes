const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "gif",
  version: "2.0.1",
  role: 2,
  author: "nvh",
  info: "Tạo, quản lý và nhận giftcode",
  category: "Box",
  guide: "[code] [số tiền] [số lượt nhận] [thời gian(h)] | hoặc gõ gif list để xem danh sách",
  cd: 5,
  Prefix: true
};

// ====== PATH LƯU CACHE ======
const dataPath = path.join(__dirname, "cache", "giftcodes.json");

// ====== BIẾN LƯU GIFT HOẠT ĐỘNG ======
let activeGiftcodes = new Map();

// ====== HÀM LOAD CACHE ======
function loadGiftcodes() {
  if (!fs.existsSync(dataPath)) return;
  try {
    const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    const now = Date.now();
    for (let code in data) {
      const info = data[code];
      if (info.expire > now) {
        info.claimedUsers = new Set(info.claimedUsers || []);
        activeGiftcodes.set(code, info);
      }
    }
  } catch (err) {
    console.error("❌ Lỗi khi đọc giftcodes.json:", err);
  }
}

// ====== HÀM LƯU CACHE ======
function saveGiftcodes() {
  const obj = {};
  for (let [code, info] of activeGiftcodes) {
    obj[code] = {
      ...info,
      claimedUsers: Array.from(info.claimedUsers)
    };
  }
  fs.writeFileSync(dataPath, JSON.stringify(obj, null, 2));
}

// ====== KHỞI CHẠY LẦN ĐẦU ======
loadGiftcodes();

// ====== HẾT HẠN TỰ XÓA ======
setInterval(() => {
  const now = Date.now();
  let removed = 0;
  for (let [code, info] of activeGiftcodes) {
    if (info.expire <= now) {
      activeGiftcodes.delete(code);
      removed++;
    }
  }
  if (removed > 0) saveGiftcodes();
}, 60 * 1000); // kiểm tra mỗi phút

// ====== NHẬN GIFTCODE ======
this.onEvent = async function ({ event, api, Currencies, Users }) {
  const { body, threadID, messageID, senderID } = event;
  if (!body) return;

  const botID = api.getCurrentUserID();
  if (senderID == botID) return; // ✅ bỏ qua tin nhắn bot gửi

  for (let [code, giftData] of activeGiftcodes) {
    if (body.toLowerCase().includes(code.toLowerCase())) {
      if (giftData.creator && senderID == giftData.creator)
        return; // ✅ người tạo code không được nhận chính code của mình

      if (giftData.claimedUsers.has(senderID))
        return api.sendMessage("⚠️ Bạn đã nhận giftcode này rồi!", threadID, messageID);

      if (giftData.totalClaimed >= giftData.maxClaims)
        return api.sendMessage("❌ Giftcode này đã hết lượt nhận!", threadID, messageID);

      try {
        await Currencies.increaseMoney(senderID, giftData.amount);
        giftData.claimedUsers.add(senderID);
        giftData.totalClaimed++;
        saveGiftcodes();

        const userName = (await Users.getData(senderID)).name;
        return api.sendMessage(
          `🎁 Chúc mừng ${userName}!\n💰 Bạn đã nhận ${giftData.amount.toLocaleString()}$ từ giftcode: ${code}\n📊 Còn lại: ${giftData.maxClaims - giftData.totalClaimed}/${giftData.maxClaims} lượt`,
          threadID,
          messageID
        );
      } catch (e) {
        console.error(e);
        return api.sendMessage("❌ Có lỗi xảy ra khi nhận giftcode!", threadID, messageID);
      }
    }
  }
};

// ====== TẠO & QUẢN LÝ ======
this.onCall = async function ({ event, api, args, Users }) {
  const { threadID, messageID, senderID } = event;

  if (args.length === 0)
    return api.sendMessage(
      `🎁 Hướng dẫn sử dụng lệnh giftcode:\n\n` +
        `• ${global.config.PREFIX}giftcode [code] [số tiền] [số lượt] [thời hạn(h)] → tạo giftcode mới\n` +
        `• ${global.config.PREFIX}giftcode list → xem danh sách giftcode còn hoạt động`,
      threadID,
      messageID
    );

  if (args[0].toLowerCase() === "list") {
    if (activeGiftcodes.size === 0)
      return api.sendMessage("📭 Hiện không có giftcode nào đang hoạt động!", threadID, messageID);

    const now = Date.now();
    let msg = "🎉 DANH SÁCH GIFTCODE ĐANG HOẠT ĐỘNG 🎉\n\n";
    for (let [code, info] of activeGiftcodes) {
      const remain = ((info.expire - now) / (60 * 60 * 1000)).toFixed(1);
      msg += `🔹 Code: ${code}\n💰 Tiền: ${info.amount.toLocaleString()}$\n👥 Lượt: ${info.totalClaimed}/${info.maxClaims}\n⏰ Hết hạn: ${remain} giờ\n─────────────────\n`;
    }
    return api.sendMessage(msg, threadID, messageID);
  }

  const code = args[0];
  const amount = parseInt(args[1]);
  const maxClaims = parseInt(args[2]);
  const hours = parseFloat(args[3] || 1);

  if (!code || isNaN(amount) || isNaN(maxClaims))
    return api.sendMessage(
      `⚠️ Cú pháp sai!\n${global.config.PREFIX}giftcode [code] [số tiền] [số lượt] [thời hạn(h)]\nVí dụ: ${global.config.PREFIX}giftcode FREEMONEY 10000 10 6`,
      threadID,
      messageID
    );

  if (activeGiftcodes.has(code))
    return api.sendMessage(`⚠️ Giftcode "${code}" đã tồn tại!`, threadID, messageID);

  const expireTime = Date.now() + hours * 60 * 60 * 1000;

  activeGiftcodes.set(code, {
    amount,
    maxClaims,
    totalClaimed: 0,
    claimedUsers: new Set(),
    expire: expireTime,
    creator: senderID // ✅ Lưu ID người tạo
  });
  saveGiftcodes();

  const creator = (await Users.getData(senderID)).name;
  const message =
    `🎉 ═══ GIFTCODE MỚI ═══ 🎉\n\n` +
    `🎁 Mã code: ${code}\n` +
    `💰 Phần thưởng: ${amount.toLocaleString()}$\n` +
    `👥 Số lượt nhận: ${maxClaims}\n` +
    `⏰ Hạn sử dụng: ${hours} giờ\n` +
    `👤 Người tạo: ${creator}\n\n` +
    `💡 Cách nhận: Nhắn tin chứa code "${code}" để nhận thưởng!\n⚠️ Mỗi người chỉ được nhận 1 lần.`;

  const threadList = await api.getThreadList(100, null, ["INBOX"]);
  let sent = 0,
    failed = 0;

  for (const thread of threadList) {
    if (thread.isGroup) {
      try {
        await api.sendMessage(message, thread.threadID);
        sent++;
        await new Promise((res) => setTimeout(res, 400));
      } catch {
        failed++;
      }
    }
  }

  return api.sendMessage(
    `✅ Đã tạo giftcode thành công!\n🎁 Code: ${code}\n💰 ${amount.toLocaleString()}$\n👥 Lượt: ${maxClaims}\n⏰ Hết hạn sau ${hours}h\n📢 Gửi đến ${sent} nhóm${failed ? ` (lỗi ${failed})` : ""}`,
    threadID,
    messageID
  );
};
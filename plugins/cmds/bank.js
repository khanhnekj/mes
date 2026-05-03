const moment = require("moment-timezone");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "bank",
    alias: ["banking"],
    version: "4.0.0",
    role: 0,
    author: "GiaLong (rework)",
    info: "Ngân hàng ảo: gửi, rút, vay, trả, xóa, khóa tự động, mở khóa (admin) + top",
    category: "Công cụ",
    cd: 5,
    prefix: true
  },

  // ====== ONLOAD ======
  onLoad: async function () {
    const bankPath = path.join(__dirname, "data/bank.json");
    await fs.ensureFile(bankPath);
    const data = (await fs.readFile(bankPath, "utf8")) || "";
    if (!data || data.trim() === "") await fs.writeJson(bankPath, {}, { spaces: 2 });
  },

  // ====== ONCALL ======
  onCall: async function ({ api, event, args, Users, Currencies }) {
    const { threadID, senderID, messageID, mentions } = event;
    const adminIDs = ["61564114700108"]; // sửa nếu cần
    const bankPath = path.join(__dirname, "data/bank.json");

    // Load users bank data
    let users = {};
    try { users = JSON.parse(await fs.readFile(bankPath, "utf8") || "{}"); } catch (e) { users = {}; }

    const save = async () => await fs.writeFile(bankPath, JSON.stringify(users, null, 2));

    // Ensure user account exists
    const ensure = (id) => {
      if (!users[id]) users[id] = {
        money: "0",
        debt: "0",
        debtTime: 0,
        debtDays: 0,
        lastDaily: 0,
        isLocked: false
      };
      return users[id];
    };

    // formatter cho BigInt/string số -> "1,234,567"
    const format = (value) => {
      try {
        const s = (typeof value === "bigint") ? value.toString() : String(value || "0");
        return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      } catch { return "0"; }
    };

    const now = Date.now();

    // Auto-lock nếu quá hạn nợ
    for (const id in users) {
      const acc = users[id];
      try {
        if (BigInt(acc.debt || "0") > 0n && acc.debtTime > 0 && !acc.isLocked) {
          const days = moment().diff(moment(acc.debtTime), "days");
          if (days >= (acc.debtDays || 0)) acc.isLocked = true;
        }
      } catch (e) { /* ignore malformed */ }
    }
    await save();

    const type = args[0]?.toLowerCase();
    const acc = ensure(senderID);

    if (!type) {
      return api.sendMessage(
`🏦 𝗡𝗴𝗮̂𝗻 𝗵𝗮̀𝗻𝗴 𝗮̉𝗼 - 𝗕𝗮𝗻𝗸 𝗣𝗿𝗼

Các lệnh khả dụng:
• bank gửi <số tiền | all>
• bank rút <số tiền | all>
• bank info
• bank daily
• bank vay <số tiền> <số ngày> (tối đa 100000$)
• bank trả <số tiền | all>
• bank ds
• bank top
• bank del <@tag hoặc uid> (admin)
• bank unlock <@tag hoặc uid> (admin)
• bank reset money all (admin)

⚠️ Quá hạn trả nợ sẽ bị khóa tài khoản tự động.`,
        threadID, messageID
      );
    }

    if (acc.isLocked && type !== "info") {
      return api.sendMessage("🔒 Tài khoản của bạn đã bị khóa do nợ quá hạn. Liên hệ admin để mở khóa.", threadID, messageID);
    }

    switch (type) {
      // ===== GỬI =====
      case "gửi": {
        const wallet = await Currencies.getData(senderID);
        const walletMoney = BigInt(wallet.money || 0);
        let amount = 0n;

        if (!args[1]) return api.sendMessage("💬 Dùng: bank gửi <số tiền | all>", threadID, messageID);
        if (args[1].toLowerCase() === "all") amount = walletMoney;
        else {
          try { amount = BigInt(args[1]); } catch { return api.sendMessage("❌ Số tiền không hợp lệ.", threadID, messageID); }
        }

        if (amount <= 0n) return api.sendMessage("❌ Số tiền gửi phải lớn hơn 0.", threadID, messageID);
        if (walletMoney < amount) return api.sendMessage("💰 Bạn không đủ tiền trong ví.", threadID, messageID);

        acc.money = (BigInt(acc.money || 0) + amount).toString();
        if (amount > 0n) await Currencies.decreaseMoney(senderID, Number(amount));
        await save();

        return api.sendMessage(`✅ Gửi ${format(amount)}$ vào bank thành công!`, threadID, messageID);
      }

      // ===== RÚT =====
      case "rút": {
        const bankMoney = BigInt(acc.money || 0);
        let amount = 0n;

        if (!args[1]) return api.sendMessage("💬 Dùng: bank rút <số tiền | all>", threadID, messageID);
        if (args[1].toLowerCase() === "all") amount = bankMoney;
        else {
          try { amount = BigInt(args[1]); } catch { return api.sendMessage("❌ Số tiền không hợp lệ.", threadID, messageID); }
        }

        if (amount <= 0n) return api.sendMessage("❌ Số tiền rút phải lớn hơn 0.", threadID, messageID);
        if (bankMoney < amount) return api.sendMessage("💳 Số dư trong bank không đủ.", threadID, messageID);

        acc.money = (bankMoney - amount).toString();
        if (amount > 0n) await Currencies.increaseMoney(senderID, Number(amount));
        await save();

        return api.sendMessage(`💵 Rút ${format(amount)}$ từ bank thành công!`, threadID, messageID);
      }

      // ===== INFO =====
      case "info": {
        const msg =
`🏦 𝗧𝗵𝗼̂𝗻𝗴 𝘁𝗶𝗻 𝗕𝗮𝗻𝗸
💰 Trong bank: ${format(acc.money)}$
💸 Nợ: ${format(acc.debt)}$
📅 Thời hạn nợ: ${acc.debtDays || 0} ngày
📆 Trạng thái: ${acc.isLocked ? "🔒 Đã khóa" : "🟢 Hoạt động"}
⏰ Nợ từ: ${acc.debtTime ? moment(acc.debtTime).format("DD/MM/YYYY HH:mm") : "Không có"}`;
        return api.sendMessage(msg, threadID, messageID);
      }

      // ===== DAILY =====
      case "daily": {
        if (now - (acc.lastDaily || 0) < 86400000)
          return api.sendMessage("⏳ Bạn đã nhận daily hôm nay rồi!", threadID, messageID);
        const bonus = 5000n;
        acc.money = (BigInt(acc.money || 0) + bonus).toString();
        acc.lastDaily = now;
        await save();
        return api.sendMessage("🎁 Bạn nhận được 5,000$ tiền gửi daily!", threadID, messageID);
      }

      // ===== VAY =====
      case "vay": {
        const amount = BigInt(args[1] || 0);
        const days = Number(args[2] || 0);
        if (amount <= 0n) return api.sendMessage("❌ Số tiền vay không hợp lệ.", threadID, messageID);
        if (amount > 100000n) return api.sendMessage("⚠️ Số tiền vay tối đa là 100,000$.", threadID, messageID);
        if (days <= 0) return api.sendMessage("📅 Vui lòng nhập số ngày muốn vay.", threadID, messageID);
        if (BigInt(acc.debt || 0) > 0n) return api.sendMessage("⚠️ Bạn đang có khoản nợ chưa trả.", threadID, messageID);

        acc.debt = amount.toString();
        acc.debtTime = now;
        acc.debtDays = days;
        acc.isLocked = false;

        await Currencies.increaseMoney(senderID, Number(amount));
        await save();

        return api.sendMessage(`💳 Vay ${format(amount)}$ trong ${days} ngày thành công! Hãy trả trước khi quá hạn.`, threadID, messageID);
      }

      // ===== TRẢ =====
      case "trả": {
        const wallet = await Currencies.getData(senderID);
        let amount = 0n;
        if (!args[1]) return api.sendMessage("💬 Dùng: bank trả <số tiền | all>", threadID, messageID);
        if (args[1].toLowerCase() === "all") amount = BigInt(acc.debt || 0);
        else {
          try { amount = BigInt(args[1]); } catch { return api.sendMessage("❌ Số tiền không hợp lệ.", threadID, messageID); }
        }

        if (amount <= 0n) return api.sendMessage("❌ Số tiền trả phải lớn hơn 0.", threadID, messageID);
        if (BigInt(acc.debt || 0) <= 0n) return api.sendMessage("✅ Bạn không có khoản nợ nào.", threadID, messageID);
        if (BigInt(wallet.money || 0) < amount) return api.sendMessage("💰 Bạn không đủ tiền để trả nợ.", threadID, messageID);

        await Currencies.decreaseMoney(senderID, Number(amount));
        acc.debt = (BigInt(acc.debt || 0) - amount).toString();
        if (BigInt(acc.debt || 0) <= 0n) {
          acc.debt = "0";
          acc.debtTime = 0;
          acc.debtDays = 0;
          acc.isLocked = false;
        }
        await save();
        return api.sendMessage(`💸 Đã trả ${format(amount)}$, nợ còn lại: ${format(acc.debt)}$`, threadID, messageID);
      }

      // ===== DS =====
      case "ds": {
        let msg = "📋 𝗗𝗮𝗻𝗵 𝘀𝗮́𝗰𝗵 𝗕𝗮𝗻𝗸\n";
        const ids = Object.keys(users);
        let index = 1;

        for (const id of ids) {
          let name = "Người dùng";
          try { name = await Users.getNameUser(id); } catch {}
          msg += `\n${index++}. 👤 ${name}: 💰 ${format(users[id].money)}$ | Nợ: ${format(users[id].debt)}$ ${users[id].isLocked ? "🔒" : ""}`;
        }

        msg += `\n\n📌 Reply số để xóa (Admin).`;

        return api.sendMessage(msg, threadID, (err, info) => {
          if (!err)
            global.seiko.onReply.set(info.messageID, {
              name: module.exports.config.name,
              author: senderID,
              messageID: info.messageID,
              ids
            });
        }, messageID);
      }

      // ===== TOP (MỚI) =====
      case "top": {
        const list = Object.entries(users)
          .map(([id, d]) => ({ id, money: BigInt(d.money || "0") }))
          .sort((a, b) => (b.money > a.money ? 1 : (b.money < a.money ? -1 : 0)))
          .slice(0, 10);

        if (list.length === 0) return api.sendMessage("📭 Chưa có người nào trong bank.", threadID, messageID);

        let msg = "💎 Top 10 người giàu nhất Bank:\n";
        let i = 1;
        for (const item of list) {
          let name = "Người dùng";
          try { name = await Users.getNameUser(item.id); } catch {}
          msg += `\n${i++}. ${name}: ${format(item.money)}$`;
        }
        return api.sendMessage(msg, threadID, messageID);
      }

      // ===== ADMIN: DEL =====
      case "del": {
        if (!adminIDs.includes(senderID))
          return api.sendMessage("❌ Bạn không có quyền dùng lệnh này!", threadID, messageID);
        const targetID = Object.keys(mentions)[0] || args[1];
        if (!targetID) return api.sendMessage("⚠️ Tag hoặc nhập UID người cần xóa.", threadID, messageID);
        if (!users[targetID]) return api.sendMessage("❌ Người này chưa có tài khoản bank.", threadID, messageID);
        let name = "Người dùng";
        try { name = await Users.getNameUser(targetID); } catch {}
        delete users[targetID];
        await save();
        return api.sendMessage(`🗑️ Đã xóa tài khoản bank của ${name}`, threadID, messageID);
      }

      // ===== ADMIN: UNLOCK =====
      case "unlock": {
        if (!adminIDs.includes(senderID))
          return api.sendMessage("❌ Bạn không có quyền dùng lệnh này!", threadID, messageID);
        const targetID = Object.keys(mentions)[0] || args[1];
        if (!targetID) return api.sendMessage("⚠️ Tag hoặc nhập UID người cần mở khóa.", threadID, messageID);
        ensure(targetID);
        users[targetID].isLocked = false;
        await save();
        let name = "Người dùng";
        try { name = await Users.getNameUser(targetID); } catch {}
        return api.sendMessage(`🔓 Đã mở khóa tài khoản của ${name}`, threadID, messageID);
      }

      // ===== ADMIN: RESET =====
      case "reset": {
        if (!adminIDs.includes(senderID))
          return api.sendMessage("❌ Bạn không có quyền dùng lệnh này!", threadID, messageID);
        if (args[1] === "money" && args[2] === "all") {
          for (const id in users) users[id].money = "0";
          await save();
          return api.sendMessage("✅ Đã reset toàn bộ tiền trong bank.", threadID, messageID);
        }
        return api.sendMessage("⚙️ Dùng: bank reset money all", threadID, messageID);
      }

      default:
        return api.sendMessage("⚠️ Lệnh không hợp lệ. Dùng: bank để xem hướng dẫn.", threadID, messageID);
    }
  },

  // ===== XỬ LÝ REPLY XOÁ BANK TỪ DS =====
  onReply: async function({ api, event, Users, Reply }) {
    const { threadID, senderID, body, messageID } = event;
    const adminIDs = ["61564114700108"];
    const bankPath = path.join(__dirname, "data/bank.json");

    if (!adminIDs.includes(senderID))
      return api.sendMessage("❌ Bạn không có quyền dùng chức năng này!", threadID, messageID);

    let users = {};
    try { users = JSON.parse(await fs.readFile(bankPath, "utf8") || "{}"); } 
    catch { users = {}; }

    const replyIndex = parseInt(body);
    if (isNaN(replyIndex) || replyIndex <= 0)
      return api.sendMessage("⚠️ Vui lòng reply số hợp lệ để xóa.", threadID, messageID);

    const ids = Reply.ids;
    if (!ids || replyIndex > ids.length)
      return api.sendMessage("❌ Số bạn nhập vượt quá danh sách!", threadID, messageID);

    const targetID = ids[replyIndex - 1];
    let name = "Người dùng";
    try { name = await Users.getNameUser(targetID); } catch {}

    delete users[targetID];
    await fs.writeFile(bankPath, JSON.stringify(users, null, 2));

    // Gỡ message DS cũ (nếu cần)
    try { api.unsendMessage(Reply.messageID); } catch(e){}

    return api.sendMessage(`🗑️ Đã xóa tài khoản bank của ${name}`, threadID, messageID);
  }
};
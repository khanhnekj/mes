this.config = {
    name: "money",
    alias: ["mon"],
    version: "3.3.0",
    role: 0,
    author: "DongDev x GPT-5",
    info: "Xem ví tiền và chuyển tiền giữa người dùng (reply hoặc tag)",
    category: "Công cụ",
    prefix: true
};

this.onCall = async function ({ api, event, Currencies, Users, args }) {
    try {
        const { threadID, messageID, senderID, messageReply, mentions } = event;
        const moment = require("moment-timezone");
        const timeNow = moment.tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY - HH:mm");

        // === Lệnh xem ví ===
        if (!args[0]) {
            const userData = (await Currencies.getData(senderID)) || {};
            const moneyStored = userData.money ?? "0";
            const userMoney = typeof moneyStored === "bigint" ? moneyStored : BigInt(moneyStored.toString());
            const userName = await Users.getNameUser(senderID) || "Bạn";
            const formattedMoney = Number(userMoney).toLocaleString("vi-VN");

            const msg = `
┏━━━━━━━━━━━━━━━━━━━┓
┃ 💰  Ví của bạn 💰 ┃
┣━━━━━━━━━━━━━━━━━━━┫
┃ 👤 ${userName}
┃ 💵 Số dư: ${formattedMoney}$
┃ 🕒 ${timeNow}
┗━━━━━━━━━━━━━━━━━━━┛
`;
            return api.sendMessage(msg, threadID, messageID);
        }

        // === Lệnh chuyển tiền (reply hoặc tag) ===
        if (args[0].toLowerCase() === "pay") {
            // Lấy ID người nhận từ reply hoặc tag
            let receiverID = null;

            if (messageReply) {
                receiverID = messageReply.senderID;
            } else if (Object.keys(mentions).length > 0) {
                receiverID = Object.keys(mentions)[0];
            }

            if (!receiverID)
                return api.sendMessage("⚠️ Bạn cần reply hoặc tag người muốn chuyển tiền cho.", threadID, messageID);

            // Lấy số tiền
            let amountRaw = args[1];
            if (!amountRaw) {
                const match = (event.body || "").match(/pay\s+([0-9]+)/i);
                amountRaw = match ? match[1] : null;
            }

            if (!amountRaw)
                return api.sendMessage("⚠️ Vui lòng nhập số tiền cần chuyển. Ví dụ: reply hoặc tag ai đó → money pay 5000", threadID, messageID);

            amountRaw = amountRaw.toString().replace(/[^\d]/g, "");
            if (!amountRaw) return api.sendMessage("⚠️ Số tiền không hợp lệ.", threadID, messageID);

            const amount = BigInt(amountRaw);

            if (amount <= 0n)
                return api.sendMessage("⚠️ Số tiền phải lớn hơn 0.", threadID, messageID);

            if (receiverID === senderID)
                return api.sendMessage("❌ Bạn không thể tự chuyển tiền cho chính mình.", threadID, messageID);

            // Lấy dữ liệu người gửi và nhận
            const senderData = (await Currencies.getData(senderID)) || {};
            const receiverData = (await Currencies.getData(receiverID)) || {};

            const senderMoney = BigInt(senderData.money ?? 0);
            const receiverMoney = BigInt(receiverData.money ?? 0);

            if (senderMoney < amount)
                return api.sendMessage("💸 Bạn không đủ tiền để thực hiện giao dịch này.", threadID, messageID);

            senderData.money = (senderMoney - amount).toString();
            receiverData.money = (receiverMoney + amount).toString();

            await Currencies.setData(senderID, senderData);
            await Currencies.setData(receiverID, receiverData);

            const senderName = await Users.getNameUser(senderID) || "Người gửi";
            const receiverName = await Users.getNameUser(receiverID) || "Người nhận";
            const formattedAmount = Number(amount).toLocaleString("vi-VN");

            const confirmMsg = `
┏━━━━━━━━━━━━━━━━━━━┓
┃ 💸 GIAO DỊCH THÀNH CÔNG 💸
┣━━━━━━━━━━━━━━━━━━━┫
┃ 👤 Người gửi: ${senderName}
┃ 🎁 Người nhận: ${receiverName}
┃ 💵 Số tiền: ${formattedAmount}$
┃ 🕒 ${timeNow}
┗━━━━━━━━━━━━━━━━━━━┛
`;

            await api.sendMessage(confirmMsg, threadID, messageID);

            try {
                await api.sendMessage(`💰 Bạn vừa nhận được ${formattedAmount}$ từ ${senderName}!`, receiverID);
            } catch { }

            return;
        }

        // === Sai cú pháp ===
        return api.sendMessage(
            "❗ Dùng đúng cú pháp:\n- money → xem ví\n- reply/tag ai đó + money pay <số tiền> → chuyển tiền",
            threadID,
            messageID
        );
    } catch (err) {
        console.error("Lỗi money module:", err);
        return api.sendMessage("❌ Lỗi khi xử lý lệnh money. Kiểm tra console để xem chi tiết.", event.threadID, event.messageID);
    }
};
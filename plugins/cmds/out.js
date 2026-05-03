this.config = {
    name: "out",
    alias: ["leave", "exit", "bye"],
    version: "1.1.0",
    role: 3,
    author: "DongDev & Update by GiaLong",
    info: "Bot rời khỏi nhóm (chỉ ADMINBOT có quyền)",
    category: "Admin",
    guides: "[lý do]",
    cd: 5,
    prefix: true
};

this.onCall = async function({ api, event, args, msg }) {
    const { threadID, senderID } = event;
    const botID = api.getCurrentUserID();
    const reason = args.join(" ") || "Không có lý do";

    // 🔒 Kiểm tra quyền chỉ ADMINBOT
    const adminBotList = global.config.NDH?.map(id => id.toString()) || [];
    if (!adminBotList.includes(senderID.toString())) {
        return msg.reply("❎ Chỉ admin bot mới có quyền cho bot rời nhóm!");
    }

    // 📝 Thông báo rời nhóm
    await msg.reply(`👋 Bot sẽ rời nhóm này!\n📝 Lý do: ${reason}`);

    // 🕒 Out sau 3 giây
    setTimeout(async () => {
        try {
            await api.removeUserFromGroup(botID, threadID);
        } catch (error) {
            console.error("Lỗi khi bot rời nhóm:", error);
            msg.reply("⚠️ Không thể rời nhóm, có thể bot không phải admin nhóm.");
        }
    }, 3000);
};

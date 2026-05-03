const { kickUser, kickMultipleUsers } = require("../../func/utils/kickUser.js");
const logger = require("../../func/utils/log.js");

module.exports = {
    config: {
        name: "kick",
        aliases: ["remove", "ban", "out"],
        version: "1.1.0",
        author: "DongDev & Update GPT-5",
        info: "Kick người dùng khỏi nhóm hoặc toàn bộ thành viên (kick all) với kiểm soát quyền an toàn",
        usage: "{prefix}kick @tag | [userID] | all [lý do]",
        description: "Kick người dùng hoặc tất cả thành viên khỏi nhóm.",
        category: "Admin",
        cooldown: 3,
        dependencies: {
            "kickUser": "../../func/utils/kickUser.js"
        }
    },

    onCall: async function({ api, event, Threads, msg }) {
        try {
            const { threadID, senderID, body, mentions } = event;
            const botID = api.getCurrentUserID();

            let threadInfo;
            try {
                threadInfo = (await Threads.getData(threadID)).threadInfo;
            } catch (error) {
                logger.log(`Lỗi lấy thông tin nhóm ${threadID}: ${error.message}`, "Error");
                return msg.reply("❌ Không thể lấy thông tin nhóm!");
            }

            const threadName = threadInfo?.threadName || `Nhóm ${threadID}`;
            const adminIDs = threadInfo.adminIDs?.map(a => a.id) || [];
            const isAdmin = adminIDs.includes(senderID);
            const isBotAdmin = adminIDs.includes(botID);

            if (!isAdmin) return msg.reply("❌ Chỉ admin nhóm mới có thể sử dụng lệnh này!");
            if (!isBotAdmin) return msg.reply("❌ Bot không có quyền kick người dùng trong nhóm này!");

            const args = body.trim().split(/\s+/).slice(1);
            if (args.length === 0) {
                return msg.reply(`📋 **Cách dùng lệnh kick:**

🔹 Kick 1 người: \`${global.config.PREFIX}kick @tag [lý do]\`
🔹 Kick nhiều người: \`${global.config.PREFIX}kick @tag1 @tag2 [lý do]\`
🔹 Kick bằng ID: \`${global.config.PREFIX}kick [userID]\`
🔹 Kick tất cả: \`${global.config.PREFIX}kick all [lý do]\`

📝 Ví dụ:
\`${global.config.PREFIX}kick @John spam\`
\`${global.config.PREFIX}kick all reset nhóm\``);
            }

            let reason = "Không có lý do cụ thể";
            let userIDs = [];

            // 🧨 Nếu dùng "kick all"
            if (args[0].toLowerCase() === "all") {
                reason = args.slice(1).join(" ") || "Kick toàn bộ thành viên";
                const allMembers = threadInfo.participantIDs || [];

                // Lọc ra trừ bot, admin và người gọi lệnh
                userIDs = allMembers.filter(
                    id => id !== botID && id !== senderID && !adminIDs.includes(id)
                );

                if (userIDs.length === 0)
                    return msg.reply("⚠️ Không có thành viên nào để kick (có thể chỉ còn admin và bot).");

                await msg.reply(`🚨 **Xác nhận Kick All**

📢 Sẽ kick **${userIDs.length} thành viên** khỏi nhóm
📝 Lý do: ${reason}
👑 Người thực hiện: ${senderID}
⏳ Bắt đầu trong 3 giây...`);

                // Delay 3 giây để người gọi kịp hủy nếu muốn
                await new Promise(res => setTimeout(res, 3000));

                const result = await kickMultipleUsers(api, userIDs, threadID, {
                    checkPermission: false,
                    maxRetries: 2,
                    retryDelay: 1500,
                    delay: 800
                });

                if (result.success) {
                    return msg.reply(`✅ **Kick All hoàn tất!**

📊 Tổng số: ${result.total}
✔️ Thành công: ${result.successCount}
❌ Thất bại: ${result.failCount}
📝 Lý do: ${reason}
⏰ ${new Date().toLocaleString('vi-VN')}`);
                } else {
                    return msg.reply(`❌ Kick All thất bại!
⚠️ Lỗi: ${result.error || "Không xác định"}`);
                }
            }

            // 🧍 Nếu là kick người cụ thể
            if (mentions && Object.keys(mentions).length > 0) {
                userIDs = Object.keys(mentions);
                const reasonArgs = args.filter(arg => !arg.startsWith('@'));
                if (reasonArgs.length > 0) reason = reasonArgs.join(' ');
            } else {
                const firstArg = args[0];
                if (firstArg && /^\d+$/.test(firstArg)) {
                    userIDs = [firstArg];
                    reason = args.slice(1).join(' ') || reason;
                } else {
                    return msg.reply("❌ Vui lòng tag người dùng hoặc nhập ID hợp lệ!");
                }
            }

            if (userIDs.includes(senderID)) return msg.reply("❌ Bạn không thể kick chính mình!");
            if (userIDs.includes(botID)) return msg.reply("❌ Bạn không thể kick bot!");

            await msg.reply(`🚫 **Bắt đầu kick người dùng...**
👥 Số lượng: ${userIDs.length}
📝 Lý do: ${reason}`);

            const result = userIDs.length === 1
                ? await kickUser(api, userIDs[0], threadID, { checkPermission: false, maxRetries: 2 })
                : await kickMultipleUsers(api, userIDs, threadID, { checkPermission: false, maxRetries: 2, delay: 1000 });

            if (result.success) {
                await msg.reply(`✅ **Kick thành công!**
👤 ${userIDs.length === 1 ? userIDs[0] : `${result.successCount}/${result.total} người`}
📝 Lý do: ${reason}`);
            } else {
                await msg.reply(`❌ Kick thất bại!
⚠️ ${result.error || "Không xác định"}`);
            }

            logger.log(`Kick hoàn tất: ${userIDs.length} người - ${reason}`, "Kick");
        } catch (error) {
            logger.log(`Lỗi trong lệnh kick: ${error.message}`, "Error");
            await msg.reply("❌ Có lỗi xảy ra khi thực hiện lệnh kick!");
        }
    }
};

module.exports = {
  config: {
    name: "vd",
    alias: [],
    version: "1.2.4",
    role: 0,
    author: "nvh x GPT-5",
    info: "Phản hồi video theo prefix: !video anime, !video cos, !video gái, !video chill, !video trai (chỉ ID NDH được phép bật/tắt)",
    category: "Công cụ",
    guides: "video [anime|gái|cos|chill|trai|on|off]",
    cd: 5,
    prefix: true
  },

  onLoad: async () => {
    if (!global.Seiko) global.Seiko = {};
    if (typeof global.Seiko.allinoneEnabled === "undefined")
      global.Seiko.allinoneEnabled = true;

    // đảm bảo các hàng đợi luôn tồn tại
    const queueNames = ["animeQueues", "cosQueues", "queues", "traiQueues", "chillQueues"];
    for (const name of queueNames) {
      if (!Array.isArray(global.Seiko[name])) global.Seiko[name] = [];
    }
  },

  onCall: async ({ api, event, args }) => {
    const { threadID, messageID, senderID } = event;
    const key = args[0]?.toLowerCase();

    if (!key)
      return api.sendMessage("⚙️ Dùng: video [anime|gái|cos|chill|trai|on|off]", threadID, messageID);

    // ✅ ID NDH được phép bật/tắt
    const NDH_ID = "61564114700108";

    if (key === "on" || key === "off") {
      if (senderID !== NDH_ID)
        return api.sendMessage("❌ Bạn không có quyền bật/tắt phản hồi video.", threadID, messageID);

      global.Seiko.allinoneEnabled = key === "on";
      return api.sendMessage(
        key === "on"
          ? "✅ Đã bật phản hồi video!"
          : "🚫 Đã tắt phản hồi video!",
        threadID,
        messageID
      );
    }

    // Nếu đang tắt thì không phản hồi video
    if (!global.Seiko.allinoneEnabled)
      return api.sendMessage("⚠️ Tính năng phản hồi video đang tắt!", threadID, messageID);

    // Map queue
    const queuesMap = {
      anime: "animeQueues",
      cos: "cosQueues",
      gái: "queues",
      gai: "queues",
      trai: "traiQueues",
      chill: "chillQueues"
    };

    const queueName = queuesMap[key];
    if (!queueName)
      return api.sendMessage("⚠️ Lệnh không hợp lệ! Dùng: video [anime|gái|cos|chill|trai]", threadID, messageID);

    const queue = global.Seiko[queueName];
    if (!queue || queue.length === 0)
      return api.sendMessage(`⚠️ Không còn video ${key} để gửi!`, threadID, messageID);

    const attachment = queue.splice(0, 1);
    await api.sendMessage({ body: `🎬 Video ${key} của bạn đây!`, attachment }, threadID, messageID);
  }
};
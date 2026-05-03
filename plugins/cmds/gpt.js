const axios = require("axios");

this.config = {
  name: "gemini",
  alias: ["ai", "gpt"],
  version: "2.5.3",
  role: 0,
  author: "DongDev x GPT",
  info: "Chat AI Gemini 2.5 (phiên bản cân bằng độ dài)",
  category: "AI",
  guides: "[câu hỏi]",
  cd: 5,
  prefix: false
};

this.onCall = async function({ args, event, msg }) {
  const apiKey = "AIzaSyB1I1dlUE7JUtSxD949dd_I2i0fNKy86lU"; // 🔹 Key của bạn
  const model = "gemini-2.5-flash"; // hoặc "gemini-2.5-pro"

  try {
    msg.react("⏳");

    // 🧠 Tạo câu hỏi
    let query = args.join(" ");
    if (!query && event.type !== "message_reply") {
      msg.react("✅");
      return msg.reply("Xin chào! Tôi là Gemini 2.5 — bạn muốn hỏi gì?");
    }
    if (event.type === "message_reply") {
      query += " " + event.messageReply.body;
    }

    // 🚀 Gửi đến Gemini
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: `${query}\n\nHãy trả lời bằng tiếng Việt, với độ dài vừa phải: không quá ngắn, không lan man. Cần đủ ý, dễ hiểu, trình bày mạch lạc, tự nhiên. Nếu có thể, chia câu trả lời thành các đoạn rõ ràng.`
              }
            ]
          }
        ]
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 60000
      }
    );

    const reply =
      res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "⚠️ Gemini không phản hồi nội dung.";

    msg.react("✅");
    msg.reply(reply);
  } catch (error) {
    console.error("Gemini 2.5 Error:", error?.response?.data || error.message);
    msg.react("❎");
    msg.reply(
      "❌ | Đã xảy ra lỗi khi gọi Gemini 2.5:\n" +
        (error?.response?.data?.error?.message || error.message)
    );
  }
};

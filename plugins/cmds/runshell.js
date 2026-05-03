const { exec } = require("child_process");

module.exports = {
  config: {
    name: "runshell",
    alias: ["sh", "shell", "cmd"],
    version: "7.3.2",
    role: 3, // chỉ dev / admin
    author: "nvh",
    info: "Chạy lệnh shell trực tiếp trên VPS hoặc host",
    category: "Công cụ",
    cd: 0
  },

  onCall: async ({ api, msg, args, event }) => {
    const permission = ["61564114700108", ""]; // UID dev cho phép

    if (!permission.includes(event.senderID)) {
      return msg.reply("⛔ | [ DEV MODE ] Lệnh này chỉ dành cho Nhà Phát Triển 💻");
    }

    const text = args.join(" ");
    if (!text) return msg.reply("⚙️ | Nhập lệnh shell cần chạy!");

    exec(text, (error, stdout, stderr) => {
      if (error) return msg.reply(`❌ | Lỗi:\n${error.message}`);
      if (stderr) return msg.reply(`⚠️ | stderr:\n${stderr}`);

      msg.reply(`✅ | stdout:\n${stdout || "Không có output."}`);
    });
  }
};
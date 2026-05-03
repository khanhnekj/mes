const fs = require("fs");
const path = require("path");
const axios = require("axios");
const request = require("request");
const cheerio = require("cheerio");
const moment = require("moment-timezone");
const { resolve } = require("path");

module.exports = {
  config: {
    name: "adc",
    alias: ["applycode", "updatecode"],
    version: "1.2.1",
    role: 3,
    author: "D-Jukie mod by VH",
    info: "Áp dụng code từ link/raw hoặc upload code local lên dpaste",
    category: "Công cụ",
    guides: "adc <tên-file> (reply link/raw hoặc không để up code local lên dpaste)",
    cd: 0,
    prefix: true
  },

  // không cần onLoad nữa
  onLoad: async () => {},

  onCall: async ({ api, event, args }) => {
    const DP_API = "https://dpaste.com/api/v2/";
    const DP_TOKEN = "f64e286c58e1490b";

    async function downloadFile(url, dest) {
      const writer = fs.createWriteStream(dest);
      const res = await axios.get(url, { responseType: "stream" });
      await new Promise((resolve, reject) => {
        res.data.pipe(writer);
        writer.on("finish", resolve);
        writer.on("error", reject);
      });
    }

    const { threadID, messageID, messageReply, type, senderID } = event;
    const fileName = args[0];
    let text = type === "message_reply" ? messageReply.body : null;

    // check quyền admin
    if (!global.config.NDH.includes(senderID))
      api.sendMessage(
        "⚠️ Đã báo cáo về admin vì tội dùng lệnh cấm",
        threadID,
        messageID
      );

    const idad = global.config.NDH;
    const name = global.data.userName.get(senderID);
    const threadInfo = await api.getThreadInfo(threadID);
    const nameBox = threadInfo.threadName;
    const time = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss | DD/MM/YYYY");

    if (!idad.includes(senderID))
      return api.sendMessage(
        `📌 Box: ${nameBox}\n👤 ${name} đã dùng lệnh ${this.config.name}\n📎 Link Facebook: https://www.facebook.com/profile.php?id=${senderID}\n⏰ Time: ${time}`,
        idad
      );

    if (!text && !fileName)
      return api.sendMessage(
        "⚠️ Vui lòng reply link muốn áp dụng code hoặc ghi tên file để up code local lên dpaste!",
        threadID,
        messageID
      );

    // ===== CASE 1: UP CODE LOCAL LÊN DPASTE =====
    if (!text && fileName) {
      return fs.readFile(`${__dirname}/${fileName}.js`, "utf-8", async (err, data) => {
        if (err)
          return api.sendMessage(
            `❎ Lệnh ${fileName} không tồn tại trên hệ thống!`,
            threadID,
            messageID
          );

        try {
          const payload = new URLSearchParams({
            content: data,
            syntax: "js",
            title: `${fileName}.js`,
            expiry_days: "365",
          });

          const response = await axios.post(DP_API, payload, {
            headers: {
              Authorization: `Bearer ${DP_TOKEN}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            responseType: "text",
          });

          const link = (response.data || "").toString().trim();
          const rawLink = link.replace(/\/$/, "") + ".txt";

          return api.sendMessage(
            `✅ Tạo paste thành công!\nLink: ${link}\nRaw: ${rawLink}`,
            threadID,
            messageID
          );
        } catch (e) {
          return api.sendMessage(
            `❎ Lỗi khi upload lên dpaste: ${e.response?.status || ""} ${e.response?.data || e.message}`,
            threadID,
            messageID
          );
        }
      });
    }

    // ===== CASE 2: ÁP CODE TỪ LINK RAW =====
    const urlR =
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    const urls = text ? text.match(urlR) : null;
    if (!urls || !urls[0])
      return api.sendMessage(
        "❎ Không tìm thấy link hợp lệ trong tin nhắn reply.",
        threadID,
        messageID
      );

    const url = urls[0];

    // buildtool/tinyurl
    if (url.includes("buildtool") || url.includes("tinyurl.com")) {
      const options = { method: "GET", url: messageReply.body };
      request(options, function (error, response, body) {
        if (error)
          return api.sendMessage(
            "⚠️ Vui lòng chỉ reply link raw (không chứa gì khác ngoài link)",
            threadID,
            messageID
          );
        const load = cheerio.load(body);
        load(".language-js").each((index, el) => {
          if (index !== 0) return;
          const code = el.children[0].data;
          fs.writeFile(`${__dirname}/${fileName}.js`, code, "utf-8", (err) => {
            if (err)
              return api.sendMessage(
                `❎ Đã xảy ra lỗi khi áp dụng code mới cho "${fileName}.js".`,
                threadID,
                messageID
              );
            return api.sendMessage(
              `☑️ Đã thêm code này vào "${fileName}.js", sử dụng load để update modules mới!`,
              threadID,
              messageID
            );
          });
        });
      });
      return;
    }

    // google drive
    if (url.includes("drive.google")) {
      const id = url.match(/[-\w]{25,}/);
      const filePath = resolve(__dirname, `${fileName}.js`);
      try {
        await downloadFile(
          `https://drive.google.com/u/0/uc?id=${id}&export=download`,
          filePath
        );
        return api.sendMessage(
          `☑️ Đã thêm code này vào "${fileName}.js". Nếu lỗi, đổi file drive thành .txt nhé!`,
          threadID,
          messageID
        );
      } catch (e) {
        return api.sendMessage(
          `❎ Đã xảy ra lỗi khi áp dụng code mới cho "${fileName}.js".`,
          threadID,
          messageID
        );
      }
    }

    // link raw chuẩn
    try {
      const i = await axios.get(url);
      const data = i.data;
      fs.writeFile(`${__dirname}/${fileName}.js`, data, "utf-8", (err) => {
        if (err)
          return api.sendMessage(
            `❎ Đã xảy ra lỗi khi áp dụng code vào ${fileName}.js`,
            threadID,
            messageID
          );
        api.sendMessage(
          `☑️ Đã áp dụng code vào ${fileName}.js, sử dụng load để update modules mới!`,
          threadID,
          messageID
        );
      });
    } catch (e) {
      return api.sendMessage(
        `❎ Lỗi tải code từ link: ${e.message}`,
        threadID,
        messageID
      );
    }
  },

  onEvent: async () => {},
  onReaction: async () => {},
  onReply: async () => {},
  onChat: async () => {},
};
const fs = require("fs-extra");
const axios = require("axios");
const Youtube = require("youtube-search-api");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

this.config = {
  name: "sing1",
  version: "6.2.0",
  role: 0,
  author: "DuyDev & NVH & LêChii - Canvas card by DuyDev",
  info: "Phát hoặc tải nhạc từ YouTube qua từ khóa, có card nhạc đẹp",
  category: "Tiện ích",
  guides: "{pn} <từ khóa>",
  cd: 3
};

// ===== Hình nền card =====
const backgrounds = [
  "https://files.catbox.moe/by4sla.jpg",
  "https://files.catbox.moe/ldlp30.jpg",
  "https://files.catbox.moe/vzp5uy.jpg",
  "https://files.catbox.moe/yosh6e.jpg",
  "https://files.catbox.moe/ujjnt2.jpg",
  "https://files.catbox.moe/8iubt6.jpg",
  "https://files.catbox.moe/1kv9e0.jpg",
  "https://files.catbox.moe/zs8cfv.jpg"
];

// ===== Tạo card canvas =====
async function createCard(info) {
  const canvas = createCanvas(800, 400);
  const ctx = canvas.getContext("2d");

  const bgUrl = backgrounds[Math.floor(Math.random() * backgrounds.length)];
  const bg = await loadImage(bgUrl);
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let thumb;
  try {
    thumb = await loadImage(info.thumbnail);
  } catch {
    thumb = await loadImage("https://i.imgur.com/ZKZC4Qb.png");
  }
  ctx.drawImage(thumb, 40, 70, 250, 250);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 32px sans-serif";
  ctx.fillText(info.title, 320, 150, 450);
  ctx.font = "24px sans-serif";
  ctx.fillText(`🗣️ ${info.channel || "Không rõ kênh"}`, 320, 200);
  ctx.fillText(`⏰ ${info.length || "Không rõ"}`, 320, 250);
  ctx.font = "20px sans-serif";
  ctx.fillText("🎶 YouTube Music Downloader", 320, 330);

  const cardPath = path.join(__dirname, "cache", `card-${Date.now()}.png`);
  fs.writeFileSync(cardPath, canvas.toBuffer());
  return cardPath;
}

// ===== Hàm tải nhạc =====
async function getLunarAudio(link, savePath) {
  const apiUrl = `https://api.lunarkrystal.site/ytmp3?url=${encodeURIComponent(link)}`;
  const res = await axios.get(apiUrl);
  const data = res.data;

  if (!data || data.status !== "ok" || !data.link)
    throw new Error("API Lunarkrystal không trả về link hợp lệ.");

  const headers = { "User-Agent": "Mozilla/5.0" };
  let attempt = 0;

  while (attempt < 3) {
    try {
      const response = await axios.get(data.link, { responseType: "arraybuffer", headers });
      fs.writeFileSync(savePath, response.data);
      break;
    } catch (err) {
      attempt++;
      if (attempt >= 3) throw new Error(`Lỗi tải file (${err.message})`);
    }
  }

  return {
    title: data.title || "Không rõ tiêu đề",
    size: data.filesize || 0
  };
}

// ===== Command chính =====
this.onCall = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  if (!args[0])
    return api.sendMessage("❎ Bạn cần nhập từ khóa tìm kiếm.", threadID, messageID);

  const keyword = args.join(" ");
  const cachePath = path.join(__dirname, "cache", `sing-${senderID}.mp3`);
  if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);

  try {
    const data = await Youtube.GetListByKeyword(keyword, false, 8);
    const items = data.items || [];
    if (!items.length)
      return api.sendMessage("❎ Không tìm thấy kết quả nào.", threadID, messageID);

    const results = items.map(v => ({
      id: v.id,
      title: v.title,
      channel: v.channelTitle,
      length: v.length?.simpleText,
      thumbnail: v.thumbnail?.thumbnails?.pop()?.url || "https://i.imgur.com/ZKZC4Qb.png"
    }));

    const msg = results
      .map((v, i) => `${i + 1}. ${v.title}\n🗣️ ${v.channel || "Không rõ"}\n⏰ ${v.length || "Không rõ"}\n──────────────────`)
      .join("\n");

    api.sendMessage(
      `🎵 Có ${results.length} kết quả với từ khóa “${keyword}”:\n──────────────────\n${msg}\n\n📌 Reply STT để tải nhạc (có card).`,
      threadID,
      (err, info) => {
        if (!err)
          global.Seiko.onReply.set(info.messageID, {
            commandName: this.config.name,
            author: senderID,
            results
          });
      },
      messageID
    );
  } catch (err) {
    console.error(err);
    api.sendMessage(`❎ Đã xảy ra lỗi: ${err.message}`, threadID, messageID);
  }
};

// ===== Reply Handler =====
this.onReply = async function ({ api, event }) {
  const { threadID, messageID, senderID, body } = event;
  const replyData = global.Seiko.onReply.get(event.messageReply?.messageID);
  if (!replyData) return;
  if (replyData.author !== senderID)
    return api.sendMessage("❎ Bạn không phải người thực hiện lệnh này.", threadID, messageID);

  const index = parseInt(body.trim());
  if (isNaN(index) || index < 1 || index > replyData.results.length)
    return api.sendMessage("❎ Vui lòng nhập số hợp lệ.", threadID, messageID);

  const video = replyData.results[index - 1];
  const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
  const savePath = path.join(__dirname, "cache", `sing-${senderID}.mp3`);

  // Thu hồi tin nhắn tìm kiếm ngay
  api.unsendMessage(event.messageReply.messageID);

  try {
    // Tạo card và tải nhạc
    const cardPath = await createCard(video);
    const info = await getLunarAudio(videoUrl, savePath);

    // Giới hạn 25MB
    if (fs.statSync(savePath).size > 25 * 1024 * 1024) {
      fs.unlinkSync(savePath);
      fs.unlinkSync(cardPath);
      return api.sendMessage("❎ File quá lớn, vui lòng chọn bài khác!", threadID, messageID);
    }

    // Gửi card trước
    await api.sendMessage({ attachment: fs.createReadStream(cardPath) }, threadID);

    // Gửi file MP3 (chỉ gửi file, không body)
    await api.sendMessage(
      { attachment: fs.createReadStream(savePath) },
      threadID,
      () => {
        fs.unlinkSync(savePath);
        fs.unlinkSync(cardPath);
      }
    );

  } catch (err) {
    console.error(err);
    api.sendMessage(`❎ Lỗi khi tải nhạc: ${err.message}`, threadID, messageID);
  }
};

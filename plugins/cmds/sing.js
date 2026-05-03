const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const ytdl = require("ytdl-core-enhanced");
const ffmpeg = require("fluent-ffmpeg");
const PQueue = require("p-queue").default;
ffmpeg.setFfmpegPath(require("@ffmpeg-installer/ffmpeg").path);

const queue = new PQueue({ concurrency: 100 });
const mediaSavePath = path.join(__dirname, "cache", "youtube");
fs.ensureDirSync(mediaSavePath);

const YT_API_KEY = "AIzaSyAygWrPYHFVzL0zblaZPkRcgIFZkBNAW9g";

const backgrounds = [
  "https://files.catbox.moe/by4sla.jpg",
  "https://files.catbox.moe/ldlp30.jpg",
  "https://files.catbox.moe/vzp5uy.jpg",
  "https://files.catbox.moe/yosh6e.jpg",
  "https://files.catbox.moe/ujjnt2.jpg",
  "https://files.catbox.moe/8iubt6.jpg",
  "https://files.catbox.moe/1kv9e0.jpg",
  "https://files.catbox.moe/zs8cfv.jpg",
  "https://files.catbox.moe/gofxea.jpg"
];

this.config = {
  name: "sing",
  version: "6.0.0",
  role: 0,
  author: "NVH - format lại bởi DuyDev",
  info: "Tải nhạc YouTube với card âm nhạc đẹp",
  category: "Tiện ích",
  guides: "{pn} <từ khóa hoặc link YouTube>",
  cd: 3
};

// ======= Hàm vẽ card =======
async function createCard(videoInfo) {
  const bgUrl = backgrounds[Math.floor(Math.random() * backgrounds.length)];
  const canvas = createCanvas(1280, 600);
  const ctx = canvas.getContext("2d");

  const bg = await loadImage(bgUrl);
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 4;
  roundRect(ctx, 40, 40, canvas.width - 80, canvas.height - 80, 25, true, true);

  const thumb = await loadImage(videoInfo.snippet.thumbnails.high.url);
  ctx.save();
  roundRect(ctx, 80, 120, 300, 300, 25, true, false);
  ctx.clip();
  ctx.drawImage(thumb, 80, 120, 300, 300);
  ctx.restore();

  ctx.fillStyle = "#fff";
  ctx.font = "bold 42px sans-serif";
  ctx.fillText(videoInfo.snippet.title, 420, 220, 750);

  ctx.fillStyle = "#ccc";
  ctx.font = "28px sans-serif";
  ctx.fillText(videoInfo.snippet.channelTitle, 420, 270);

  ctx.fillStyle = "#777";
  ctx.fillRect(420, 320, 750, 8);

  ctx.fillStyle = "#1db954";
  const progress = Math.floor(Math.random() * 750);
  ctx.fillRect(420, 320, progress, 8);

  const icons = ["⏮️", "▶️", "⏭️", "🔁", "🔀"];
  ctx.font = "40px sans-serif";
  ctx.fillStyle = "#fff";
  icons.forEach((icon, i) => ctx.fillText(icon, 500 + i * 100, 400));

  const cardPath = path.join(mediaSavePath, `card_${Date.now()}.png`);
  const out = fs.createWriteStream(cardPath);
  const stream = canvas.createPNGStream();
  stream.pipe(out);

  return new Promise(resolve => out.on("finish", () => resolve(cardPath)));
}

function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  if (typeof r === "number") r = { tl: r, tr: r, br: r, bl: r };
  ctx.beginPath();
  ctx.moveTo(x + r.tl, y);
  ctx.lineTo(x + w - r.tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r.tr);
  ctx.lineTo(x + w, y + h - r.br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
  ctx.lineTo(x + r.bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r.bl);
  ctx.lineTo(x, y + r.tl);
  ctx.quadraticCurveTo(x, y, x + r.tl, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

// ======= Hàm tải nhạc =======
async function downloadAudio(videoID, userID) {
  const filePath = path.join(mediaSavePath, `${Date.now()}_${userID}.mp3`);
  while (true) {
    try {
      return await new Promise((resolve, reject) => {
        const stream = ytdl(videoID, {
          quality: "highestaudio",
          filter: "audioonly",
          highWaterMark: 1 << 26
        });
        ffmpeg(stream)
          .audioBitrate(192)
          .toFormat("mp3")
          .save(filePath)
          .on("end", () => resolve(filePath))
          .on("error", reject);
      });
    } catch {
      // thử lại im lặng
    }
  }
}

// ======= Format thời lượng =======
function formatDuration(duration) {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const h = (match[1] || "").replace("H", "") || 0;
  const m = (match[2] || "").replace("M", "") || 0;
  const s = (match[3] || "").replace("S", "") || 0;
  return `${h > 0 ? h + ":" : ""}${m.toString().padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}`;
}

// ======= onCall chính =======
this.onCall = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  if (!args[0])
    return api.sendMessage("❎ Nhập từ khoá hoặc URL YouTube.", threadID, messageID);

  const input = args.join(" ");
  queue.add(async () => {
    try {
      const urlPattern = /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.be)\/.+/;
      let videoID;

      // --- Nếu là link ---
      if (urlPattern.test(input)) {
        const match = input.match(/(?<=v=|\/|vi=)[a-zA-Z0-9_-]{11}/);
        if (match) videoID = match[0];
      } else {
        // --- Nếu là từ khóa ---
        const search = await axios.get(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(
            input
          )}&key=${YT_API_KEY}`
        );

        if (!search.data.items.length)
          return api.sendMessage("❎ Không tìm thấy kết quả nào.", threadID, messageID);

        const ids = search.data.items.map(i => i.id.videoId).join(",");
        const details = await axios.get(
          `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids}&key=${YT_API_KEY}`
        );

        const msg = search.data.items
          .map(
            (item, i) =>
              `${i + 1}. ${item.snippet.title}\n📺 ${item.snippet.channelTitle}\n⏳ ${formatDuration(
                details.data.items[i].contentDetails.duration
              )}\n──────────────────`
          )
          .join("\n");

        return api.sendMessage(
          `🎶 Kết quả tìm thấy:\n──────────────────\n${msg}\n\n📌 Reply STT để tải.`,
          threadID,
          (err, info) => {
            if (!err)
              global.Seiko.onReply.set(info.messageID, {
                commandName: this.config.name,
                author: senderID,
                results: search.data.items
              });
          },
          messageID
        );
      }

      if (videoID) await handleDownload(api, threadID, messageID, senderID, videoID);
    } catch (err) {
      api.sendMessage(`❎ Lỗi khi xử lý yêu cầu: ${err.message}`, threadID, messageID);
    }
  });
};

// ======= onReply =======
this.onReply = async function ({ api, event }) {
  const { threadID, messageID, senderID, body } = event;
  const replyData = global.Seiko.onReply.get(event.messageReply?.messageID);
  if (!replyData) return;
  if (replyData.author !== senderID)
    return api.sendMessage("❎ Bạn không phải người chọn lệnh này.", threadID, messageID);

  const index = parseInt(body.trim());
  if (isNaN(index) || index < 1 || index > replyData.results.length)
    return api.sendMessage("❎ Vui lòng chọn số hợp lệ.", threadID, messageID);

  api.unsendMessage(event.messageReply.messageID);
  const videoID = replyData.results[index - 1].id.videoId;
  await handleDownload(api, threadID, messageID, senderID, videoID);
};

// ======= Hàm xử lý tải và gửi =======
async function handleDownload(api, threadID, messageID, senderID, videoID) {
  try {
    const info = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoID}&key=${YT_API_KEY}`
    );
    const videoInfo = info.data.items[0];

    api.sendMessage("⏳ Đang tải nhạc, vui lòng chờ...", threadID, messageID);
    const audioPath = await downloadAudio(videoID, senderID);
    const cardPath = await createCard(videoInfo);

    await api.sendMessage({ attachment: fs.createReadStream(cardPath) }, threadID);
    await api.sendMessage(
      { attachment: fs.createReadStream(audioPath) },
      threadID,
      () => {
        fs.unlinkSync(audioPath);
        fs.unlinkSync(cardPath);
      }
    );
  } catch (err) {
    api.sendMessage(`❎ Lỗi khi tải bài hát: ${err.message}`, threadID, messageID);
  }
}
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");
const GIFEncoder = require("gifencoder");
const fetch = require("node-fetch");

const CACHE_PATH = path.join(process.cwd(), "cache", "SoundCloud");
fs.ensureDirSync(CACHE_PATH);

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

async function getClientID() {
  const { data } = await axios.get("https://soundcloud.com/");
  const urls = data.split('<script crossorigin src="')
    .filter(r => r.startsWith("https"))
    .map(r => r.split('"')[0]);
  const js = await axios.get(urls[urls.length - 1]);
  const id = js.data.split(',client_id:"')[1]?.split('"')[0];
  if (!id) throw new Error("Không lấy được client_id");
  return id;
}

this.config = {
  name: "scl",
  version: "3.2.0",
  role: 0,
  author: "DongDev + GPT5",
  info: "Tìm kiếm và tải nhạc SoundCloud (kèm GIF động Now Playing)",
  category: "Tiện ích",
  guides: "{pn} <từ khóa>",
  cd: 5,
  prefix: true
};

function formatDuration(ms) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

async function searchSoundCloud(url, params = {}) {
  const clientId = await getClientID();
  const { data } = await axios.get(url, { params: { ...params, client_id: clientId } });
  return data;
}

async function downloadFile(url, filePath) {
  const writer = fs.createWriteStream(filePath);
  const res = await axios({ url, method: "GET", responseType: "stream" });
  res.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

// --- Helper: Rounded rectangle ---
function roundRect(ctx, x, y, w, h, r = 6) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// --- Helper: Wrap text ---
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let curY = y;
  for (let n = 0; n < words.length; n++) {
    const test = line + words[n] + " ";
    if (ctx.measureText(test).width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, curY);
      line = words[n] + " ";
      curY += lineHeight;
    } else line = test;
  }
  ctx.fillText(line.trim(), x, curY);
}

// --- Canvas GIF Now Playing ---
async function createGIF(track) {
  const width = 900, height = 360, frames = 36, delay = 60;
  const encoder = new GIFEncoder(width, height);
  const gifPath = path.join(CACHE_PATH, `nowplaying_${Date.now()}.gif`);
  const stream = fs.createWriteStream(gifPath);
  encoder.createReadStream().pipe(stream);

  encoder.start();
  encoder.setRepeat(0);
  encoder.setDelay(delay);
  encoder.setQuality(10);

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  const bgUrl = backgrounds[Math.floor(Math.random() * backgrounds.length)];

  const [bg, thumb] = await Promise.all([
    loadImage(bgUrl).catch(() => null),
    loadImage(track.thumbnail).catch(() => null)
  ]);

  const bars = Array(40).fill(0).map(() => Math.random());

  for (let f = 0; f < frames; f++) {
    ctx.clearRect(0, 0, width, height);
    if (bg) ctx.drawImage(bg, 0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, width, height);

    // Disc
    const cx = 130, cy = height / 2, size = 220;
    const rot = (f / frames) * Math.PI * 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.translate(-cx, -cy);
    ctx.beginPath();
    ctx.arc(cx, cy, size / 2 + 8, 0, Math.PI * 2);
    ctx.fillStyle = "#0f8f51";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
    ctx.clip();
    if (thumb) ctx.drawImage(thumb, cx - size / 2, cy - size / 2, size, size);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fillStyle = "#111";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();

    // Text
    const tx = 300;
    ctx.fillStyle = "#fff";
    ctx.font = "bold 28px Arial";
    wrapText(ctx, track.title, tx, 120, 540, 30);
    ctx.font = "22px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText(track.artist, tx, 180);
    ctx.font = "18px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText(`⏱ ${track.duration}`, tx, 210);

    // Waveform
    const wfX = tx, wfY = height - 90, wfW = 540;
    const barW = 10;
    for (let i = 0; i < bars.length; i++) {
      const val = Math.abs(Math.sin(f * 0.3 + i * 0.6)) * bars[i];
      const h = 50 * val + 5;
      const x = wfX + i * (barW + 3);
      const y = wfY - h;
      ctx.fillStyle = `rgba(255,255,255,${0.3 + val * 0.7})`;
      ctx.fillRect(x, y, barW, h);
    }

    // Progress bar
    const prog = f / frames;
    const barY = wfY + 30;
    roundRect(ctx, wfX, barY, wfW, 10, 6);
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fill();
    ctx.fillStyle = "#1db954";
    roundRect(ctx, wfX, barY, wfW * prog, 10, 6);
    ctx.fill();

    encoder.addFrame(ctx);
  }
  encoder.finish();

  await new Promise(res => stream.on("finish", res));
  return gifPath;
}

// --- Command ---
this.onCall = async function({ api, event, args, msg }) {
  const query = args.join(" ");
  if (!query) return msg.reply("⚠️ Vui lòng nhập từ khóa tìm kiếm SoundCloud.");

  try {
    const { collection } = await searchSoundCloud("https://api-v2.soundcloud.com/search", { q: query, limit: 10 });
    const list = (collection || [])
      .filter(i => i.title && i.user?.username)
      .slice(0, 6)
      .map(i => ({
        title: i.title,
        artist: i.user.username,
        permalink_url: i.permalink_url,
        duration: formatDuration(i.duration),
        artwork_url: i.artwork_url || i.user.avatar_url || ""
      }));

    if (!list.length) return msg.reply("❎ Không tìm thấy kết quả.");
    const body = list.map((t, i) => `\n${i + 1}. 🎧 ${t.title}\n👤 ${t.artist}\n⏱ ${t.duration}`).join("");
    msg.reply(`🎵 Kết quả cho “${query}”${body}\n\n📩 Reply số để tải nhạc.`, (e, info) => {
      if (!e)
        global.Seiko.onReply.set(info.messageID, {
          commandName: this.config.name,
          author: event.senderID,
          results: list
        });
    });
  } catch (err) {
    console.error(err);
    msg.reply("❎ Lỗi khi tìm kiếm SoundCloud.");
  }
};

// --- Reply ---
this.onReply = async function({ api, event, Reply, msg }) {
  const { senderID, body, messageReply } = event;
  if (Reply.author !== senderID) return;
  const choice = parseInt(body);
  if (isNaN(choice) || choice < 1 || choice > Reply.results.length)
    return msg.reply("❎ Số không hợp lệ.");

  // ✅ Thu hồi tin nhắn danh sách
  api.unsendMessage(messageReply.messageID);

  const track = Reply.results[choice - 1];
  const waiting = await msg.reply(`⏳ Đang tải “${track.title}”`);

  try {
    const trackInfo = await searchSoundCloud("https://api-v2.soundcloud.com/resolve", { url: track.permalink_url });
    const transcoding = trackInfo.media.transcodings.find(t => t.format.protocol === "progressive");
    const stream = await searchSoundCloud(transcoding.url);
    const mp3Path = path.join(CACHE_PATH, `${Date.now()}.mp3`);
    await downloadFile(stream.url, mp3Path);

    const thumb = (track.artwork_url || trackInfo.user?.avatar_url || "").replace("-large", "-t500x500");
    const gifPath = await createGIF({
      title: track.title,
      artist: track.artist,
      duration: track.duration,
      thumbnail: thumb || "https://i.imgur.com/Do5F5.png"
    });

    await api.sendMessage({ attachment: fs.createReadStream(gifPath) }, event.threadID);
    await api.sendMessage({ attachment: fs.createReadStream(mp3Path) }, event.threadID, () => {
      fs.unlinkSync(mp3Path);
      fs.unlinkSync(gifPath);
    });

    api.unsendMessage(waiting.messageID);
  } catch (err) {
    console.error(err);
    msg.reply("❎ Lỗi khi tải hoặc tạo GIF.");
  }
};
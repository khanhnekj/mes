const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const CACHE_DIR = path.join(__dirname, "cache");
const SETTINGS_PATH = path.join(__dirname, "../../core/data/autodown.json");
fs.ensureDirSync(CACHE_DIR);
if (!fs.existsSync(SETTINGS_PATH)) fs.writeJsonSync(SETTINGS_PATH, {}, { spaces: 2 });

// ==== Hàm đọc & lưu cài đặt ====
function readSettings() {
  try { return fs.readJsonSync(SETTINGS_PATH); }
  catch { fs.writeJsonSync(SETTINGS_PATH, {}, { spaces: 2 }); return {}; }
}
function saveSettings(data) {
  fs.writeJsonSync(SETTINGS_PATH, data, { spaces: 2 });
}

// ==== Cooldown chống spam (rất nhẹ, chỉ 1s) ====
const COOLDOWN = new Map();
function setCooldown(id, time = 1000) {
  const now = Date.now();
  if (COOLDOWN.has(id) && now - COOLDOWN.get(id) < time) return true;
  COOLDOWN.set(id, now);
  return false;
}

// ==== Hàm gọi API an toàn ====
async function safeAxiosPost(url, data, retries = 2) {
  for (let i = 0; i < retries; i++) {
    try {
      return await axios.post(url, data, { timeout: 15000 });
    } catch (err) {
      if (i === retries - 1) throw err;
    }
  }
}

// ==== Danh sách API dự phòng ====
const API_ENDPOINTS = [
  "https://downr.org/.netlify/functions/download",
  "https://api.tiklydown.eu.org/api/download",
  "https://api.vevioz.com/api/button/videos"
];

// ==== Gọi nhiều API cùng lúc, lấy cái nào trả về hợp lệ ====
async function tryDownload(url) {
  const tasks = API_ENDPOINTS.map(ep => safeAxiosPost(ep, { url }).catch(() => null));
  const results = await Promise.all(tasks);
  const valid = results.find(r => r?.data?.medias?.length);
  if (!valid) throw new Error("Không thể tải media từ bất kỳ API nào");
  return valid.data;
}

// ==== Tải file tạm (ảnh/video/audio) ====
async function streamURL(url, ext) {
  const temp = path.join(CACHE_DIR, `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`);
  const writer = fs.createWriteStream(temp);
  const response = await axios.get(url, { responseType: "stream", timeout: 20000 });
  response.data.pipe(writer);
  await new Promise((res, rej) => {
    writer.on("finish", res);
    writer.on("error", rej);
  });
  const stream = fs.createReadStream(temp);
  stream.on("close", () => fs.remove(temp).catch(() => {}));
  return stream;
}

// ==== Lấy tiêu đề & tác giả ====
function extractMeta(data) {
  const medias = Array.isArray(data?.medias) ? data.medias : [];
  const titleFields = ["title","caption","description","name","song","track","text","headline","filename"];
  const authorFields = ["author","uploader","username","owner","creator","artist","channel","publisher","user","nickname","profile_name","page_name"];

  const deepFind = (obj, keys) => {
    if (!obj || typeof obj !== "object") return null;
    for (const k of keys) if (obj[k]) return obj[k];
    for (const v of Object.values(obj)) {
      if (typeof v === "object") {
        const found = deepFind(v, keys);
        if (found) return found;
      }
    }
    return null;
  };

  let title = deepFind(data, titleFields) || deepFind(medias[0], titleFields);
  let author = deepFind(data, authorFields) || deepFind(medias[0], authorFields);

  if (!author && title?.includes(" - ")) {
    const [possibleAuthor] = title.split(" - ");
    if (possibleAuthor && possibleAuthor.length < 50) author = possibleAuthor;
  }

  const clean = str => str ? str.toString().replace(/\s+/g, " ").replace(/https?:\/\/\S+/gi, "").trim() : "";
  return { title: clean(title || ""), author: clean(author || "") };
}

// ==== Chọn media phù hợp ====
function chooseMedia(medias) {
  const videos = medias.filter(m => m.type === "video");
  if (videos.length) {
    const v360 = videos.find(m => /360/i.test(m.quality));
    return v360 || videos[0];
  }
  const audios = medias.filter(m => m.type === "audio");
  if (audios.length) return audios[0];
  return medias[0];
}

// ==== Map nguồn ====
const SOURCE_MAP = {
  facebook: "Facebook", fb: "Facebook",
  tiktok: "TikTok", douyin: "Douyin",
  instagram: "Instagram", "instagr.am": "Instagram",
  youtube: "YouTube", "youtu.be": "YouTube",
  twitter: "Twitter", "x.com": "Twitter",
  capcut: "CapCut", pinterest: "Pinterest",
  reddit: "Reddit", soundcloud: "SoundCloud",
  spotify: "Spotify", imgur: "Imgur", tumblr: "Tumblr"
};

function detectSource(url) {
  if (!url) return "AutoDown";
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const pathname = u.pathname.toLowerCase();
    for (const key of Object.keys(SOURCE_MAP)) if (host.includes(key)) return SOURCE_MAP[key];
    for (const key of Object.keys(SOURCE_MAP)) if (pathname.includes(key)) return SOURCE_MAP[key];
    for (const key of Object.keys(SOURCE_MAP)) if (url.toLowerCase().includes(key)) return SOURCE_MAP[key];
    return "AutoDown";
  } catch {
    for (const key of Object.keys(SOURCE_MAP)) if ((url || "").toLowerCase().includes(key)) return SOURCE_MAP[key];
    return "AutoDown";
  }
}

// ==== Regex hỗ trợ ====
const SUPPORTED_REGEX = [
  /facebook\.com|fb\.com/i, /tiktok\.com|vt\.tiktok\.com/i, /douyin\.com/i,
  /instagram\.com|instagr\.am/i, /youtube\.com|youtu\.be/i, /capcut\.(com|net)/i,
  /twitter\.com|x\.com/i, /pinterest\.com/i, /reddit\.com|redd\.it/i,
  /soundcloud\.com/i, /spotify\.com/i, /imgur\.com/i, /tumblr\.com/i
];

// ==== Config chính ====
this.config = {
  name: "autodown",
  alias: ["down", "atd"],
  version: "7.6.0",
  role: 0,
  author: "GiaLong x GPT-5",
  info: "Tự động tải video (360p), audio hoặc ảnh từ MXH (tối ưu không delay)",
  category: "Tiện ích"
};

// ==== Sự kiện chính ====
this.onEvent = async function({ api, event }) {
  if (event.senderID == api.getCurrentUserID()) return;
  const settings = readSettings();
  if (settings[event.threadID] === false) return;
  if (setCooldown(event.threadID)) return;

  const urls = event.body?.match(/https?:\/\/[^\s]+/g);
  if (!urls) return;

  for (const url of urls) {
    if (!SUPPORTED_REGEX.some(r => r.test(url))) continue;
    const source = detectSource(url);

    try {
      const data = await tryDownload(url);
      if (!data || !Array.isArray(data.medias)) {
        api.sendMessage(`⚠️ Không thể tải nội dung từ ${source}.`, event.threadID);
        continue;
      }

      const { title, author } = extractMeta(data);
      const medias = data.medias;
      const images = medias.filter(m => m.type === "image");

      const parts = [`📥 AutoDown | ${source}`, "—————-"];
      if (title) parts.push(`🎬 ${title}`);
      if (author) parts.push(`👤 Tác giả: ${author}`);
      parts.push("━━━━━━━━━━", "🌸 Chúc bạn xem vui vẻ 🌸");
      const bodyMsg = parts.join("\n");

      // ==== Nếu là ảnh ====
      if (images.length > 0 && medias.every(m => m.type === "image")) {
        const attachments = (
          await Promise.all(images.map(async img => {
            try { return await streamURL(img.url, "jpg"); } catch { return null; }
          }))
        ).filter(Boolean);

        if (attachments.length) {
          await api.sendMessage({ body: bodyMsg, attachment: attachments }, event.threadID, event.messageID);
          console.log(`[✅] AutoDown OK (${source}) - ${attachments.length} ảnh`);
        } else {
          api.sendMessage(`⚠️ Không thể tải ảnh từ ${source}.`, event.threadID);
        }
        continue;
      }

      // ==== Video / Audio ====
      const media = chooseMedia(medias);
      if (!media?.url) {
        api.sendMessage(`⚠️ Không có media hợp lệ từ ${source}.`, event.threadID);
        continue;
      }

      if (media.size && media.size > 25 * 1024 * 1024) {
        api.sendMessage(`⚠️ File quá lớn (${(media.size / 1048576).toFixed(1)}MB).`, event.threadID);
        continue;
      }

      const ext = media.type === "audio" ? "mp3" : "mp4";
      const stream = await streamURL(media.url, ext);
      await api.sendMessage({ body: bodyMsg, attachment: stream }, event.threadID, event.messageID);
      console.log(`[✅] AutoDown OK (${source}) - ${ext.toUpperCase()}`);
    } catch (err) {
      console.log(`[⚠️] AutoDown lỗi (${url}): ${err.message}`);
      api.sendMessage(`⚠️ Lỗi tải ${source}: ${err.message}`, event.threadID);
    }
  }
};

// ==== Bật / tắt thủ công ====
this.onCall = async function({ api, event, args }) {
  const settings = readSettings();
  const act = args[0]?.toLowerCase();

  if (act === "on") {
    settings[event.threadID] = true;
    saveSettings(settings);
    return api.sendMessage("✅ AutoDown đã bật", event.threadID, event.messageID);
  } else if (act === "off") {
    settings[event.threadID] = false;
    saveSettings(settings);
    return api.sendMessage("🚫 AutoDown đã tắt", event.threadID, event.messageID);
  }

  const status = settings[event.threadID] !== false ? "BẬT ✅" : "TẮT ❌";
  api.sendMessage(`📥 AutoDown hiện đang ${status}\nTải video (360p), audio hoặc ảnh từ MXH`, event.threadID, event.messageID);
};
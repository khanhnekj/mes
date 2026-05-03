const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const PQueue = require("p-queue").default;
const fetch = require("node-fetch");

const queue = new PQueue({ concurrency: 20 });
const mediaSavePath = path.join(process.cwd(), "cache", "Spotify");
fs.ensureDirSync(mediaSavePath);

const API_KEYS = {
    spotify: {
        clientId: '6fb0b33cce89444db936233f5f87e250',
        clientSecret: '30547fb6613d42c8851b967123ecc132'
    }
};

const API_ENDPOINTS = {
    spotify: {
        token: 'https://accounts.spotify.com/api/token',
        search: 'https://api.spotify.com/v1/search',
    },
    lyrics: 'https://api.lyrics.ovh/v1',
};

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

this.config = {
    name: "spt",
    version: "1.1.0",
    role: 0,
    author: "nvh + gpt5-opt",
    info: "Tìm kiếm nhạc Spotify, tải MP3 + card nhạc",
    category: "Tiện ích",
    guides: "{pn} <từ khóa> | -lyrics <tên bài hát>",
    cd: 3
};

// ===============================
// TOKEN CACHE
// ===============================
let cachedToken = null;
let tokenExpireAt = 0;

async function getSpotifyToken() {
    const now = Date.now();
    if (cachedToken && now < tokenExpireAt) return cachedToken;

    const res = await axios.post(API_ENDPOINTS.spotify.token, 'grant_type=client_credentials', {
        headers: {
            'Authorization': 'Basic ' + Buffer.from(`${API_KEYS.spotify.clientId}:${API_KEYS.spotify.clientSecret}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    cachedToken = res.data.access_token;
    tokenExpireAt = now + (res.data.expires_in - 60) * 1000; // trừ 1 phút để chắc chắn
    return cachedToken;
}

// ===============================
// SEARCH SPOTIFY
// ===============================
async function searchSpotify(query, limit = 5) {
    const token = await getSpotifyToken();
    const res = await axios.get(API_ENDPOINTS.spotify.search, {
        headers: { Authorization: `Bearer ${token}` },
        params: { q: query, type: 'track', limit, market: 'VN' }
    });
    if (!res.data.tracks?.items?.length) return [];
    return res.data.tracks.items.map(track => ({
        id: track.id,
        title: track.name,
        artist: track.artists.map(a => a.name).join(', '),
        duration: track.duration_ms,
        thumbnail: track.album.images[0]?.url,
        album: track.album.name
    }));
}

// ===============================
// LYRICS
// ===============================
async function getLyrics(artist, title) {
    try {
        const res = await axios.get(`${API_ENDPOINTS.lyrics}/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`);
        return res.data.lyrics || "Không tìm thấy lyrics.";
    } catch {
        return "Không tìm thấy lyrics.";
    }
}

// ===============================
// CANVAS CARD
// ===============================
async function createCard(track) {
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext("2d");

    const bgUrl = backgrounds[Math.floor(Math.random() * backgrounds.length)];
    const bg = await loadImage(bgUrl);
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const thumb = await loadImage(track.thumbnail);
    ctx.drawImage(thumb, 40, 70, 250, 250);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 32px Arial";
    ctx.fillText(track.title, 320, 150, 450);
    ctx.font = "24px Arial";
    ctx.fillText(track.artist, 320, 200);
    ctx.fillText(`⏳ ${Math.floor(track.duration / 60000)}:${String(Math.floor(track.duration / 1000 % 60)).padStart(2, "0")}`, 320, 250);

    const filePath = path.join(mediaSavePath, `card_${Date.now()}.png`);
    fs.writeFileSync(filePath, canvas.toBuffer());
    return filePath;
}

// ===============================
// DOWNLOAD MP3
// ===============================
async function downloadSpotify(track) {
    try {
        const trackUrl = `https://open.spotify.com/track/${track.id}`;
        const res = await fetch("https://downr.org/.netlify/functions/download", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: trackUrl })
        });
        const data = await res.json();
        if (!data?.medias) throw new Error("Không tìm thấy audio.");
        const audios = data.medias.filter(m => m.type === "audio" && m.extension === "mp3");
        const media = audios.find(a => /320/.test(a.quality)) || audios[0];
        if (!media?.url) throw new Error("Không có URL hợp lệ.");
        const mp3Path = path.join(mediaSavePath, `${track.id}.mp3`);
        const audioRes = await fetch(media.url);
        fs.writeFileSync(mp3Path, Buffer.from(await audioRes.arrayBuffer()));
        return mp3Path;
    } catch (e) {
        throw new Error("Không tải được MP3: " + e.message);
    }
}

// ===============================
// MAIN COMMAND
// ===============================
this.onCall = async function({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    if (!args[0])
        return api.sendMessage("❗Nhập từ khóa hoặc dùng:\n• {pn} <từ khóa>\n• {pn} -lyrics <tên bài hát>", threadID, messageID);

    const input = args.join(" ");
    const isLyrics = /-lyrics/i.test(input);
    const query = input.replace(/-lyrics/i, "").trim();

    queue.add(async () => {
        try {
            const tracks = await searchSpotify(query, 5);
            if (!tracks.length) return api.sendMessage("❌ Không tìm thấy kết quả nào.", threadID, messageID);

            if (isLyrics) {
                const lyrics = await getLyrics(tracks[0].artist.split(",")[0], tracks[0].title);
                return api.sendMessage(`🎵 ${tracks[0].title}\n👤 ${tracks[0].artist}\n\n${lyrics.substring(0, 1500)}`, threadID, messageID);
            }

            let msg = "🎶 Kết quả tìm thấy:\n";
            tracks.forEach((t, i) => msg += `\n${i + 1}. ${t.title}\n   👤 ${t.artist}`);
            msg += "\n\n👉 Reply số để tải MP3 + card nhạc.";

            api.sendMessage(msg, threadID, (err, info) => {
                global.Seiko.onReply.set(info.messageID, {
                    commandName: this.config.name,
                    author: senderID,
                    results: tracks
                });
            }, messageID);

        } catch (e) {
            api.sendMessage("⚠️ Lỗi khi tìm kiếm Spotify.", threadID, messageID);
        }
    });
};

// ===============================
// REPLY HANDLER
// ===============================
this.onReply = async function({ api, event }) {
    const { threadID, messageID, senderID, body } = event;
    const replyData = global.Seiko.onReply.get(event.messageReply?.messageID);
    if (!replyData) return;
    if (replyData.author !== senderID) return api.sendMessage("⛔ Bạn không phải người dùng lệnh này.", threadID, messageID);

    const choice = parseInt(body);
    if (isNaN(choice) || choice < 1 || choice > replyData.results.length)
        return api.sendMessage("❗Vui lòng chọn số hợp lệ.", threadID, messageID);

    api.unsendMessage(event.messageReply.messageID);
    const track = replyData.results[choice - 1];

    const wait = await api.sendMessage(`⏳ Đang tải “${track.title}”...`, threadID);

    try {
        const [mp3Path, cardPath] = await Promise.all([
            downloadSpotify(track),
            createCard(track)
        ]);

        await api.sendMessage({ attachment: fs.createReadStream(cardPath) }, threadID);
        await api.sendMessage({ attachment: fs.createReadStream(mp3Path) }, threadID, () => {
            fs.unlinkSync(mp3Path);
            fs.unlinkSync(cardPath);
        });

        api.unsendMessage(wait.messageID);
    } catch (err) {
        api.sendMessage("❌ Lỗi khi tải bài hát: " + err.message, threadID);
    }
};
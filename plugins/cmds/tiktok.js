const axios = require('axios');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const limit = 12; // số video trả về

async function downloadAndConvertToJpg(url) {
    const cachePath = path.join(__dirname, 'cache');
    if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath);

    const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const jpgPath = path.join(cachePath, `${fileName}.jpg`);

    try {
        const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 });
        if (!res.data) throw new Error("Không có dữ liệu trả về");
        await sharp(res.data).jpeg({ quality: 90 }).toFile(jpgPath);
        return jpgPath;
    } catch (err) {
        console.error(`❌ Lỗi convert thumbnail (${url}): ${err.message}`);
        try {
            const ext = path.extname(url.split('?')[0]) || '.jpg';
            const fallbackPath = path.join(cachePath, `${fileName}${ext}`);
            const res2 = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 });
            if (!res2.data) return null;
            fs.writeFileSync(fallbackPath, res2.data);
            return fallbackPath;
        } catch (e) {
            console.error(`❌ Lỗi tải fallback thumbnail (${url}): ${e.message}`);
            return null;
        }
    }
}

async function downloadFile(url, type) {
    try {
        const cachePath = path.join(__dirname, 'cache');
        if (!fs.existsSync(cachePath)) fs.mkdirSync(cachePath);
        const filePath = path.join(cachePath, `${Date.now()}_${Math.floor(Math.random() * 1000)}.${type}`);
        const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 });
        fs.writeFileSync(filePath, res.data);
        return filePath;
    } catch (err) {
        console.error(`❌ Lỗi tải file (${url}): ${err.message}`);
        return null;
    }
}

this.config = {
    name: "tiktok_all",
    alias: ["tiktok", "tinfo", "tsearch"],
    version: "2.0.0",
    role: 0,
    author: "Anh Kiệt + GPT",
    info: "Xem thông tin TikTok và tìm kiếm video",
    category: "Tiện ích",
    guides: '["tiktok info <username>", "tiktok search <keyword>"]',
    cd: 5,
    prefix: true
};

this.onCall = async function({ api, tools, event, args, client, msg }) {
    const { threadID: tid, messageID: mid, senderID: sid } = event;
    if (!args[0]) return api.sendMessage("❌ Vui lòng nhập lệnh: info hoặc search", tid, mid);

    const command = args[0].toLowerCase();

    if (command === 'info') {
        const username = args.slice(1).join(" ");
        if (!username) return api.sendMessage("❌ Vui lòng nhập username TikTok!", tid, mid);

        try {
            const userData = await client.api.tiktok.infov2(username);
            const { user, stats } = userData;

            msg.reply({
                body: `╭─────────────⭓\n` +
                      `│ Tên: ${user.nickname}\n` +
                      `│ Username: ${user.uniqueId}\n` +
                      `│ Tiểu sử: ${user.signature || 'Không có'}\n` +
                      `│ Quốc gia: ${user.region}\n` +
                      `│ Ngôn ngữ: ${user.language}\n` +
                      `│ Tích xanh: ${user.verified ? "Có" : "Không"}\n` +
                      `│ Thời gian tạo: ${new Date(user.createTime * 1000).toLocaleString()}\n` +
                      `│ Người theo dõi: ${stats.followerCount.toLocaleString()}\n` +
                      `│ Đang theo dõi: ${stats.followingCount.toLocaleString()}\n` +
                      `│ Tổng lượt thích: ${stats.heartCount.toLocaleString()}\n` +
                      `│ Video đã đăng: ${stats.videoCount.toLocaleString()}\n` +
                      `│ Bạn bè: ${stats.friendCount.toLocaleString()}\n╰─────────────⭓`,
                attachment: await tools.streamURL(user.avatarLarger, 'jpg')
            });
        } catch (err) {
            console.error(err);
            api.sendMessage(`❌ Không tìm thấy người dùng "${username}" hoặc tài khoản riêng tư.`, tid, mid);
        }

    } else if (command === 'search') {
        const keyword = args.slice(1).join(" ");
        if (!keyword) return api.sendMessage("❌ Vui lòng nhập từ khóa tìm kiếm!", tid, mid);

        try {
            const res = await axios.get("https://www.tikwm.com/api/feed/search", {
                params: { keywords: keyword, count: limit },
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            });

            const data = res.data.data?.videos;
            if (!data || data.length === 0) {
                return api.sendMessage(`⚠ Không tìm thấy kết quả cho "${keyword}"`, tid, mid);
            }

            let message = `🔍 Kết quả tìm kiếm cho "${keyword}":\n\n`;
            data.forEach((video, i) => {
                message += `${i + 1}. ${video.title || 'Không có tiêu đề'}\n`;
                message += `👤 ${video.author.nickname} (@${video.author.unique_id})\n`;
                message += `👁 ${video.play_count} | ❤️ ${video.digg_count}\n\n`;
            });
            message += "📌 Reply số thứ tự video bạn muốn tải.";

            const thumbPaths = [];
            for (let video of data) {
                const thumbUrl = video.origin_cover || video.cover;
                const jpgPath = await downloadAndConvertToJpg(thumbUrl);
                if (jpgPath) thumbPaths.push(jpgPath);
            }

            api.sendMessage({
                body: message,
                attachment: thumbPaths.map(p => fs.createReadStream(p))
            }, tid, (err, info) => {
                if (err) return console.error(err);

                global.Seiko.onReply.set(info.messageID, {
                    type: "search",
                    commandName: "tiktok_all",
                    author: sid,
                    messageID: info.messageID,
                    result: data
                });

                thumbPaths.forEach(p => { try { fs.unlinkSync(p); } catch {} });
            }, mid);

        } catch (err) {
            console.error(err);
            api.sendMessage("❌ Lỗi khi tìm kiếm video TikTok.", tid, mid);
        }
    } else {
        api.sendMessage("❌ Lệnh không hợp lệ! Sử dụng: info hoặc search", tid, mid);
    }
};

this.onReply = async function({ event, api, Reply }) {
    const { threadID: tid, messageID: mid, body, senderID: sid } = event;
    if (sid !== Reply.author) return api.sendMessage("🚫 Bạn không có quyền chọn video này.", tid, mid);

    const choose = parseInt(body);
    if (isNaN(choose) || choose < 1 || choose > Reply.result.length) {
        return api.sendMessage("⚠ Số thứ tự không hợp lệ!", tid, mid);
    }

    const selectedVideo = Reply.result[choose - 1];
    try {
        const videoPath = await downloadFile(selectedVideo.play, 'mp4');
        if (!videoPath) return api.sendMessage("❌ Lỗi khi tải video!", tid, mid);

        api.unsendMessage(Reply.messageID);
        api.sendMessage({
            body: `🎬 ${selectedVideo.title || 'Không có tiêu đề'}\n` +
                  `👤 ${selectedVideo.author.nickname} (@${selectedVideo.author.unique_id})\n` +
                  `👁 ${selectedVideo.play_count} | ❤️ ${selectedVideo.digg_count} | 💬 ${selectedVideo.comment_count}`,
            attachment: fs.createReadStream(videoPath)
        }, tid, () => { try { fs.unlinkSync(videoPath); } catch {} });
    } catch (err) {
        console.error(err);
        api.sendMessage("❌ Lỗi khi tải video!", tid, mid);
    }
};

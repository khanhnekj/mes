const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const API = "http://theone-api-3416.ddnsgeek.com:3040";

this.config = {
   name: "ytb",
   alias: ["ado"],
   version: "3.4.2",
   role: 0,
   author: "nvh",
   info: "xem video từ YouTube",
   category: "Tiện ích", 
   guides: " {pn} keyword",
   cd: 5,
   prefix: true 
};

// --- Hàm search video trên YouTube ---
async function search(keyWord) {
  try {
     const res = await axios.get(`https://www.youtube.com/results?search_query=${encodeURIComponent(keyWord)}`);
     const splitData = res.data.split("ytInitialData = ");
     if (!splitData[1]) throw new Error("Không lấy được dữ liệu từ YouTube");
     const getJson = JSON.parse(splitData[1].split(";</script>")[0]);
     const videos = getJson.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0].itemSectionRenderer.contents;
     const results = [];
     for (const video of videos) {
         if (video.videoRenderer && video.videoRenderer.lengthText?.simpleText) {
             results.push({
                 id: video.videoRenderer.videoId,
                 title: video.videoRenderer.title.runs[0].text,
                 thumbnail: video.videoRenderer.thumbnail.thumbnails.pop().url,
                 time: video.videoRenderer.lengthText.simpleText,
                 channel: {
                     id: video.videoRenderer.ownerText.runs[0].navigationEndpoint.browseEndpoint.browseId,
                     name: video.videoRenderer.ownerText.runs[0].text,
                     thumbnail: video.videoRenderer.channelThumbnailSupportedRenderers.channelThumbnailWithLinkRenderer.thumbnail.thumbnails.pop().url.replace(/s[0-9]+\-c/g, '-c')
                 }
             });
         }
     }
     return results;
  } catch (e) {
     const error = new Error("Cannot search video");
     error.code = "SEARCH_VIDEO_ERROR";
     throw error;
  }
}

// --- Hàm download video từ API (480p ưu tiên, fallback < 360p) ---
async function downloadVideoFromAPI(videoId, savePath) {
    const timestart = Date.now();
    try {
        const detailRes = await axios.get(`${API}/?url=https://youtu.be/${videoId}`);
        const data = detailRes.data;

        if (!data.media || !Array.isArray(data.media)) throw new Error("Không tìm thấy media khả dụng từ API");

        // Chọn video 480p ưu tiên
        let file = data.media.find(m => !m.quality.includes("kbps") && m.quality === "480p");

        // fallback: chọn video < 480p thấp nhất
        if (!file) {
            file = data.media
                .filter(m => !m.quality.includes("kbps") && parseInt(m.quality) < 480)
                .sort((a, b) => parseInt(a.quality) - parseInt(b.quality))[0];
        }

        if (!file) throw new Error("Không tìm thấy video 480p hoặc dưới 1080p");

        const response = await axios({ url: file.url, method: "GET", responseType: "stream" });
        await new Promise((resolve, reject) => {
            response.data.pipe(fs.createWriteStream(savePath))
                .on("finish", resolve)
                .on("error", reject);
        });

        return {
            title: data.title,
            dur: data.duration || 0,
            viewCount: data.viewCount || 0,
            likes: data.likes || 0,
            uploadDate: data.uploadDate || "Unknown",
            author: data.channel || "Unknown",
            file,
            timestart
        };
    } catch (err) {
        throw new Error(`Download video từ API thất bại: ${err.message}`);
    }
}

// --- Command chính ---
this.onCall = async function ({ args, event, api }) {
    const send = (msg, cb) => api.sendMessage(msg, event.threadID, cb, event.messageID);
    if (!args.length) return send("❎ Phần tìm kiếm không được để trống!");

    const keywordSearch = args.join(" ");

    try {
        let keyWord = keywordSearch.includes("?feature=share") ? keywordSearch.replace("?feature=share", "") : keywordSearch;
        const maxResults = 8;
        let result = await search(keyWord);
        result = result.slice(0, maxResults);
        if (!result.length) return send(`❎ Không có kết quả tìm kiếm nào phù hợp với từ khóa ${keyWord}`);

        let msgText = "";
        const arrayID = [];
        result.forEach((info, i) => {
            arrayID.push(info.id);
            msgText += `${i + 1}. ${info.title}\n⏱ ${info.time}\n📺 ${info.channel.name}\n\n`;
        });

        send({ body: `${msgText}⩺ Reply số để tải video` }, (err, info) => {
            if (err) return send(`❎ Lỗi: ${err.message}`);
            global.Seiko.onReply.set(info.messageID, {
                commandName: this.config.name,
                messageID: info.messageID,
                author: event.senderID,
                arrayID,
                result,
                step: "chooseSong"
            });
        });

    } catch (err) {
        send(`❎ Đã xảy ra lỗi: ${err.message}`);
    }
};

// --- Xử lý reply ---
this.onReply = async function ({ api, event, Reply: _ }) {
    const send = (msg, cb) => api.sendMessage(msg, event.threadID, cb, event.messageID);
    try {
        if (!_) return send("❌ Không tìm thấy dữ liệu để reply!");
        if (_.step === "chooseSong") {
            const index = parseInt(event.body);
            if (isNaN(index) || index < 1 || index > _.result.length) return send("❌ Số bạn nhập không hợp lệ!");

            const videoId = _.arrayID[index - 1];

            // --- Tạo tên file video duy nhất ---
            const timestamp = Date.now();
            const fileName = `${videoId}_${timestamp}.mp4`;
            const cacheDir = path.join(__dirname, "cache");
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
            const savePath = path.join(cacheDir, fileName);

            send(`⬇️ Đang tải xuống video \"${_.result[index - 1].title}\"...`, async (errMsg, info) => {
                try {
                    const videoInfo = await downloadVideoFromAPI(videoId, savePath);
                    api.unsendMessage(_.messageID);

                    send({
                        body: `🎬 Tiêu đề: ${videoInfo.title}\n👤 Kênh: ${videoInfo.author}\n⏳ Xử lý: ${Math.floor((Date.now() - videoInfo.timestart)/1000)} giây`,
                        attachment: fs.createReadStream(savePath)
                    }, () => fs.unlinkSync(savePath));

                } catch (err) {
                    send(`❌ Lỗi khi tải video: ${err.message}`);
                }
            });
        }

    } catch (err) {
        send(`❌ Đã xảy ra lỗi: ${err.message}`);
    }
};
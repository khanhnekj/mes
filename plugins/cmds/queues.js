this.config = {
    name: "queues",
    alias: ["queues", "q", "status"],
    version: "1.0.0",
    role: 0,
    author: "DongDev",
    info: "Hiển thị trạng thái các global queues",
    category: "Tiện ích",
    guides: "{pn}",
    cd: 2,
    prefix: true
};

this.onCall = async function ({ api, event, msg }) {
    const { threadID, messageID } = event;
    
    try {
        // Lấy thông tin về các queues
        const vdgaiCount = global.Seiko.queues ? global.Seiko.queues.length : 0;
        const animeCount = global.Seiko.animeQueues ? global.Seiko.animeQueues.length : 0;
        const cosCount = global.Seiko.cosQueues ? global.Seiko.cosQueues.length : 0;
        const chillCount = global.Seiko.chillQueues ? global.Seiko.chillQueues.length : 0;
        const traiCount = global.Seiko.traiQueues ? global.Seiko.traiQueues.length : 0;

        // Tạo emoji cho trạng thái
        const getStatusEmoji = (count) => {
            if (count >= 15) return "🟢"; // Tốt
            if (count >= 10) return "🟡"; // Trung bình
            if (count >= 5) return "🟠"; // Thấp
            return "🔴"; // Rất thấp
        };

        // Tạo thông báo
        const message = `📊 **TRẠNG THÁI GLOBAL QUEUES**

🎬 **Vdgai Videos**: ${getStatusEmoji(vdgaiCount)} ${vdgaiCount}/20
🎭 **Anime Videos**: ${getStatusEmoji(animeCount)} ${animeCount}/20  
👗 **Cosplay Videos**: ${getStatusEmoji(cosCount)} ${cosCount}/20
🎵 **Chill Videos**: ${getStatusEmoji(chillCount)} ${chillCount}/20
🧑‍🦱 **Trai Videos**: ${getStatusEmoji(traiCount)} ${traiCount}/20

📈 **Tổng cộng**: ${vdgaiCount + animeCount + cosCount + chillCount + traiCount}/100 videos

${(vdgaiCount === 0 && animeCount === 0 && cosCount === 0 && chillCount === 0 && traiCount === 0) ? 
    "⚠️ Tất cả queues đang trống! Bot đang tải video..." : 
    "✅ Bot đang hoạt động bình thường!"}`;

        return msg.reply(message);
        
    } catch (error) {
        console.error("❌ Lỗi trong lệnh queues:", error);
        return msg.reply("❎ Đã xảy ra lỗi khi kiểm tra trạng thái!");
    }
};

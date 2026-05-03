this.config = {
    name: "",
    alias: [],
    version: "1.2.9",
    role: 0,
    author: "DongDev",
    info: "",
    category: "Admin",
    guides: [],
    cd: 0,
    prefix: true
};

this.onCall = async ({ msg, event, api }) => {
    const getUptime = () => {
        const secs = process.uptime();
        const days = Math.floor(secs / 86400);
        const hours = String(Math.floor((secs % 86400) / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
        const seconds = String(Math.floor(secs % 60)).padStart(2, '0');
        return days ? `${days} ngày ${hours}:${minutes}:${seconds}` : `${hours}:${minutes}:${seconds}`;
    };

    const pingReal = Date.now() - event.timestamp;

    api.sendMessage({
        body: `🌸`,
        attachment: global.Seiko.queues.splice(0, 1)
    }, event.threadID, async (err, info) => {
        if (!err) {
            // Đợi 60 giây rồi thu hồi tin nhắn
            await new Promise(resolve => setTimeout(resolve, 60 * 1000));
            api.unsendMessage(info.messageID);
        }
    }, event.messageID);
};
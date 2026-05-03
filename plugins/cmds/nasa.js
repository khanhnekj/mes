const axios = require("axios");
const Canvas = require("canvas");
const fs = require("fs-extra");
const moment = require("moment-timezone");
const path = require("path");

const config = {
    name: "nasa",
    alias: ["weather", "space"],
    version: "2.0.0",
    role: 0,
    author: "DC-Nam & Trae AI",
    info: "Gửi dự báo thời tiết có ảnh NASA-style",
    category: "Công cụ",
    guides: "{pn} [tỉnh/thành phố]",
    cd: 5,
    prefix: true
};

const scheduleList = [
    { timer: "08:00:00", message: ["{abc}"] },
    { timer: "12:00:00", message: ["{abc}"] },
    { timer: "20:00:00", message: ["{abc}"] },
    { timer: "01:00:00", message: ["{abc}"] }
];

const weekdayMap = {
    Sunday: "Chủ Nhật", Monday: "Thứ Hai", Tuesday: "Thứ Ba",
    Wednesday: "Thứ Tư", Thursday: "Thứ Năm", Friday: "Thứ Sáu", Saturday: "Thứ Bảy"
};
const loMap = {
    Sunny: "Trời Nắng", "Mostly Sunny": "Nhiều Nắng", "Partly Sunny": "Nắng Vài Nơi",
    "Rain Showers": "Mưa Rào", "T-Storms": "Có Bão", "Light Rain": "Mưa Nhỏ",
    "Mostly Cloudy": "Trời Nhiều Mây", Rain: "Trời Mưa", "Heavy T-Storms": "Bão Lớn",
    "Partly Cloudy": "Mây Rải Rác", "Mostly Clear": "Trời Trong Xanh", Cloudy: "Trời Nhiều Mây",
    Clear: "Trời Trong Xanh, Không Mây"
};
const windMap = {
    Northeast: "Hướng Đông Bắc", Northwest: "Hướng Tây Bắc",
    Southeast: "Hướng Đông Nam", Southwest: "Hướng Tây Nam",
    East: "Hướng Đông", West: "Hướng Tây", North: "Hướng Bắc", South: "Hướng Nam"
};

async function createWeatherCanvas(city, data) {
    const width = 1000, height = 600;
    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    const bg = await Canvas.loadImage("https://upload.wikimedia.org/wikipedia/commons/9/97/The_Earth_seen_from_Apollo_17.jpg");
    ctx.drawImage(bg, 0, 0, width, height);

    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, width, height);

    const nasaLogo = await Canvas.loadImage("https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg");
    ctx.drawImage(nasaLogo, width - 180, height - 180, 150, 150);

    ctx.fillStyle = "#00BFFF";
    ctx.font = "bold 45px Sans-serif";
    ctx.fillText("🌎 BÁO CÁO THỜI TIẾT NASA", 40, 90);

    ctx.fillStyle = "#ffffff";
    ctx.font = "30px Sans-serif";
    const textLines = [
        `📍 Khu vực: ${city}`,
        `🗓️ Ngày: ${moment.tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY")} (${weekdayMap[moment.tz("Asia/Ho_Chi_Minh").format("dddd")]})`,
        `🌡️ Nhiệt độ: ${data.current.temperature}°${data.location.degreetype}`,
        `🌤️ Dự báo: ${loMap[data.current.skytext] || data.current.skytext}`,
        `💧 Độ ẩm: ${data.current.humidity}%`,
        `🌬️ Gió: ${data.current.windspeed} ${windMap[data.current.winddisplay.split(" ")[2]] || ""}`,
        `🛰️ Ghi nhận lúc: ${data.current.observationtime}`
    ];
    let y = 160;
    for (const line of textLines) {
        ctx.fillText(line, 60, y);
        y += 55;
    }

    ctx.strokeStyle = "#00BFFF";
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    ctx.font = "22px Sans-serif";
    ctx.fillStyle = "#aaa";
    ctx.fillText("Nguồn dữ liệu vệ tinh NASA — module by Trae AI", 40, height - 40);

    const imgPath = path.join(__dirname, "nasa_temp.png");
    const out = fs.createWriteStream(imgPath);
    const stream = canvas.createPNGStream();
    stream.pipe(out);

    await new Promise(resolve => out.on("finish", resolve));
    return imgPath;
}

async function onCall({ api, event, args }) {
    try {
        const city = args.join(" ");
        if (!city)
            return api.sendMessage("Vui lòng nhập tên tỉnh/thành phố cần xem thời tiết!", event.threadID);

        const res = await axios.get(`https://api.popcat.xyz/weather?q=${encodeURI(city)}`);
        const data = res.data[0];
        const imgPath = await createWeatherCanvas(city, data);

        api.sendMessage({
            body: `📡 Dữ liệu vệ tinh NASA cho ${city}:`,
            attachment: fs.createReadStream(imgPath)
        }, event.threadID, () => fs.unlinkSync(imgPath));
    } catch (e) {
        api.sendMessage(`❌ Không thể lấy dữ liệu: ${e.message}`, event.threadID);
    }
}

function onLoad(o) {
    setInterval(async () => {
        try {
            const now = moment().tz("Asia/Ho_Chi_Minh").format("HH:mm:ss");
            const found = scheduleList.find(i => i.timer === now);
            if (!found) return;

            const res = await axios.get(`https://api.popcat.xyz/weather?q=${encodeURI("Hồ Chí Minh")}`);
            const data = res.data[0];
            const imgPath = await createWeatherCanvas("Hồ Chí Minh", data);

            const msg = {
                body: found.message[0].replace("{abc}", "Cập nhật dự báo thời tiết từ NASA 🚀"),
                attachment: fs.createReadStream(imgPath)
            };
            for (const thread of global.data.allThreadID) {
                o.api.sendMessage(msg, thread);
            }
            fs.unlinkSync(imgPath);
        } catch (err) {
            console.log("[NASA AUTO ERROR]", err.message);
        }
    }, 1000);
}

module.exports = { config, onCall, onLoad };

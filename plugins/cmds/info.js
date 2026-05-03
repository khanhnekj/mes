const fs = require("fs");
const path = require("path");
const axios = require("axios");

function convert(time) {
  const date = new Date(time);
  if (isNaN(date.getTime())) return "Không xác định";
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${h}:${m}:${s} | ${d}/${mo}/${y}`;
}

async function getBio(uid, api) {
  if (!uid) return "Vui lòng nhập UID cần lấy tiểu sử";
  const form = {
    av: api.getCurrentUserID(),
    fb_api_req_friendly_name: "ProfileCometBioTextEditorPrivacyIconQuery",
    fb_api_caller_class: "RelayModern",
    doc_id: "5009284572488938",
    variables: JSON.stringify({ id: uid }),
  };
  try {
    const res = await api.httpPost("https://www.facebook.com/api/graphql/", form);
    const bio = JSON.parse(res).data?.user?.profile_intro_card;
    return bio?.bio ? bio.bio?.text : "Không có";
  } catch {
    return "Không có";
  }
}

function isValidURL(url) {
  return /^https?:\/\/\S+$/.test(url);
}

this.config = {
  name: "info",
  alias: ["in4"],
  version: "3.1.0",
  role: 0,
  author: "Deku mod by Niio-team | formatted by Gia Long",
  info: "Lấy thông tin người dùng Facebook",
  category: "Công cụ",
  guides: " {pn} [reply/uid/link/@tag]",
  cd: 5,
  prefix: true,
};

this.onCall = async function ({ api, event, args, Currencies }) {
  let send = (msg) => api.sendMessage(msg, event.threadID, event.messageID);
  let id;

  if (Object.keys(event.mentions).length > 0) {
    id = Object.keys(event.mentions)[0];
  } else if (event.type === "message_reply") {
    id = event.messageReply.senderID;
  } else if (args[0]) {
    if (isValidURL(args[0])) {
      try {
        id = await api.getUID(args[0]);
      } catch {
        return send("❎ Không thể lấy UID từ liên kết này!");
      }
    } else if (!isNaN(args[0])) {
      id = args[0];
    }
  } else {
    id = event.senderID;
  }

  if (!id) return send("❎ Đầu vào không hợp lệ!");

  send("🔄 Đang lấy thông tin người dùng...");

  const token =
    global.account?.token?.EAAD6V7 ||
    "EAAD6V7os0gcBP1ka8GHBWVAx5dAWKaLJAmT1JqMGI4DT3veDpq6P4nao48pzgTYDJioxXumizdq1dyegF2UOpJWklSvCvNFeuz77ozoCE53vaZA4d1857FYcOhT7ZCs1Q4aGhzygo2rAlRHME3eLj4mh7tuSvXRS5dZBEPyaLUWuvDXOMXEJrhsy2Br8liLfAZDZD";

  try {
    const resp = await axios.get(
      `https://graph.facebook.com/${id}?fields=id,name,first_name,username,link,gender,relationship_status,significant_other,birthday,hometown,about,website,locale,created_time,updated_time,is_verified,subscribers.limit(0)&access_token=${token}`
    );

    const d = resp.data;
    const bio = await getBio(id, api);
    const money = ((await Currencies.getData(id)) || {}).money || 0;

    const avatar = `https://graph.facebook.com/${id}/picture?width=1500&height=1500&access_token=1174099472704185|0722a7d5b5a4ac06b11450f7114eb2e9`;
    const cover = d.cover?.source || null;

    // tải ảnh
    const downloadImage = async (url, name) => {
      if (!url) return null;
      try {
        const res = await axios.get(url, { responseType: "stream" });
        const file = path.join(__dirname, `cache/${name}.jpg`);
        const writer = fs.createWriteStream(file);
        res.data.pipe(writer);
        await new Promise((r) => writer.on("finish", r));
        return fs.createReadStream(file);
      } catch {
        return null;
      }
    };

    const [avatarStream, coverStream] = await Promise.all([
      downloadImage(avatar, "avatar"),
      downloadImage(cover, "cover"),
    ]);

    const body = `Thông tin người dùng
━━━━━━━━━━━━━━━━
👤 Tên: ${d.name || "❎"}
🧑 Họ: ${d.first_name || "❎"}
🏷️ Username: ${d.username || "❎"}
🆔 UID: ${d.id || "❎"}
🔗 Liên kết: ${d.link || "❎"}
🚻 Giới tính: ${d.gender == "male" ? "Nam" : d.gender == "female" ? "Nữ" : "❎"}
❤️ Mối quan hệ: ${d.relationship_status || "❎"} ${d.significant_other?.name || ""}
${d.significant_other?.id ? `🔗 Liên kết người liên quan: https://www.facebook.com/${d.significant_other.id}` : ""}
📝 Tiểu sử: ${bio || "❎"}
🏡 Nơi sinh: ${d.hometown?.name || "❎"}
🎓 Trường:
không có
💼 Làm việc:
không có
👪 Thành viên gia đình:
không có
👥 Theo dõi: ${(d.subscribers?.summary?.total_count || 0).toLocaleString("vi-VN")}
🌐 Ngôn ngữ/Khu vực: ${d.locale || "❎"}
📅 ${convert(d.created_time)}
♻️ ${convert(d.updated_time)}
💰 Tiền: ${money.toLocaleString("vi-VN")}$`;

    api.sendMessage(
      {
        body,
        attachment: [avatarStream, coverStream].filter(Boolean),
      },
      event.threadID,
      () => {
        // dọn file
        try {
          if (fs.existsSync(__dirname + "/cache/avatar.jpg"))
            fs.unlinkSync(__dirname + "/cache/avatar.jpg");
          if (fs.existsSync(__dirname + "/cache/cover.jpg"))
            fs.unlinkSync(__dirname + "/cache/cover.jpg");
        } catch {}
      },
      event.messageID
    );
  } catch (e) {
    send("❎ Lỗi: " + e.message);
  }
};

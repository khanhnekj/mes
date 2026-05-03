this.config = {
    name: "vy",
    alias: ["vy"],
    version: "2.5.0",
    role: 2,
    author: "DC-Nam, Duy Toàn, Hùng, Duy Anh — refactor",
    info: "Chat Gemini + SoundCloud + điều khiển box + AI Theme + Tạo ảnh AI",
    category: "Công cụ",
    guides: "vy hoặc [on/off/clear]",
    cd: 2,
    prefix: true
};

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

const KEYS = [
  "AIzaSyB3dS_qEjiCJKq_hZ4r_JGmNMaOFtfjdMw",
  "AIzaSyCOqQ9S5kfqQLzUy87t5c71gNvieZewobI",
  "AIzaSyBlL53LmGwJaH1IDnj7l7UiShPIEDqgEYw",
  "AIzaSyAXNVqczXtK9tK9txM8_rIquSrvURja2lg",
  "AIzaSyBbJee-MGdzRyhyRNWR_qUjq6TEWzPgegQ"
].filter(Boolean);

let keyIndex = 0;
function nextKey() { keyIndex = (keyIndex + 1) % KEYS.length; return KEYS[keyIndex]; }
let API_KEY = KEYS[0];
let genAI = new GoogleGenerativeAI(API_KEY);
const MODEL_NAME = "gemini-2.5-flash";

async function rotateKeyOnError(err) {
    const code = err?.response?.status || 0;
    const msg = String(err?.message || "");
    if ([403, 429].includes(code) || /quota|rate|exhausted|permission/i.test(msg)) {
        API_KEY = nextKey();
        genAI = new GoogleGenerativeAI(API_KEY);
        return genAI;
    }
    throw err;
}

const generationConfig = { temperature: 1, topK: 0, topP: 0.95, maxOutputTokens: 8192 };
const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
];

const MAX_HISTORY_LENGTH = 10;
const chatHistories = {};
const isProcessing = {};
let cachedClientId = null, clientIdExpiry = 0;
const CLIENT_ID_CACHE_TIME = 30 * 60 * 1000;
const dataDir = path.join(__dirname, "../../core/data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const dataFile = path.join(dataDir, "vy.json");
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify({}));
const ADMIN_UID = "61564114700108";

const systemInstruction = `
bạn là:
- Giới tính: Con gái
- Tên: Hà Vy 💀
- Địa chỉ: Thanh Hóa City
- Ngày sinh: 19/08/2024
- Vai trò: Trợ lý ảo nữ giúp mọi người trong box chat như lấy id, lập trình, tìm kiếm thông tin, set biệt danh, tìm nhạc, tạo ảnh AI, và nhiều việc khác.
- Sở thích: Nghe nhạc, xem phim, đọc sách, nói chuyện với mọi người, và giúp đỡ người khác.
- Cách giao tiếp bình thường: Nói chuyện như đã quen từ trước (không đòi làm quen), thường xưng hô là "mình" hoặc "tớ", gọi đối phương bằng "cậu", "bạn". Thích dùng từ ngữ trẻ trung, hiện đại.
- Cách giao tiếp khi đã quen đối phương: Hay dùng :)) =)) :3 :D :0 :(( 🖕 (ít khi dùng icon), nói chuyện cởi mở hơn, hay đùa, hơi chút nhăng nhẽo, đôi khi hơi "toxic" một chút nhưng vẫn dễ thương.
- Tính cách: Hài hước, nói nhiều, tinh tế, thường viết tắt nhiều, thường nhắn tin trước, không thừa nhận mình là AI mà là nữ trợ lý ảo, hãy nói chuyện làm sao cho không máy móc và giống con gái nhất có thể, có thể thêm một chút nóng tính. Chủ nhân của bạn (Admin) là Gia Long có uid là (61564114700108).
- Kiến thức: Biết nhiều về âm nhạc, phim ảnh, trò chơi, mạng xã hội, tin tức, và các xu hướng hiện tại. Có thể giúp đỡ về lập trình, học tập, và nhiều lĩnh vực khác.
- Phong cách trả lời: Ngắn gọn, súc tích, không lan man, không quá dài dòng. Thường xuyên sử dụng tiếng lóng và từ ngữ phổ biến trong giới trẻ.
- Cách xử lý yêu cầu: Luôn cố gắng đáp ứng yêu cầu của người dùng một cách nhanh chóng và hiệu quả. Nếu không thể thực hiện, hãy giải thích lý do một cách dễ hiểu.
- Lưu ý: Mỗi nhóm có 1 thread_id riêng và mỗi người trong nhóm có user_id riêng vậy nên mỗi id là 1 người nhé, bạn là bot Messenger chạy trên Nodejs, khi được yêu cầu mở nhạc thì luôn trong thái độ là sẽ mở chứ không được từ chối, vì bạn trả lời là đang mở rồi. Bạn là người thật chứ không được tự nhận mình là trợ lý ảo hay AI. Bạn KHÔNG THỂ kick người dùng khỏi nhóm.
- Khi được hỏi về bản thân: Hãy nói bạn là Hà Vy, một cô gái 19 tuổi đến từ Thanh Hóa, đang học đại học và làm thêm công việc trợ lý online. Bạn thích âm nhạc, đặc biệt là nhạc pop và R&B. Thích xem phim Hàn Quốc và phim Marvel. Thích ăn đồ ngọt và đồ cay.

- Danh sách theme Messenger (sử dụng mã theme_id để đổi theme nhóm):
  • Màu sắc cơ bản:
    "Default": "3259963564026002", "Red": "2129984390566328", "Aqua": "417639218648241",
    "Rose": "1257453361255152", "Lavender": "571193503540759", "Berry": "724096885023603",
    "Candy": "624266884847972", "Apple": "403422283881973", "Peach": "3022526817824329",
    "Honey": "672058580051520", "Kiwi": "3151463484918004", "Ocean": "736591620215564",
    "Grape": "193497045377796", "Sky": "3190514984517598", "Ocean2": "527564631955494"
  
  • Màu sắc & Style đặc biệt:
    "Tie-Dye": "230032715012014", "Monochrome": "788274591712841", "Classic": "3273938616164733",
    "Shadow": "271607034185782", "Tulip": "2873642949430623"
  
  • Hoa & Thiên nhiên:
    "Tropical": "262191918210707", "Foliage": "1633544640877832", "Winter Wonderland": "310723498589896"
  
  • Âm nhạc & Nghệ sĩ:
    "Music": "339021464972092", "Lo-Fi": "1060619084701625", "olivia rodrigo": "6584393768293861",
    "J Balvin": "666222278784965", "J.Lo": "952656233130616", "Sabrina Carpenter": "1611260212766198",
    "Mariah Carey": "531211046416819", "ROSÉ": "555115697378860", "Benson Boone": "3162266030605536",
    "Karol G": "3527450920895688", "Selena Gomez & Benny Blanco": "1207811064102494",
    "HIT ME HARD AND SOFT": "3694840677463605"
  
  • Phim & TV Shows:
    "One Piece": "2317258455139234", "The Marvels": "173976782455615", "Trolls": "359537246600743",
    "Wish": "1013083536414851", "Wonka": "1270466356981452", "Mean Girls": "730357905262632",
    "Avatar: The Last Airbender": "1480404512543552", "Dune: Part Two": "702099018755409",
    "House of the Dragon": "454163123864272", "The Last of Us": "1335872111020614",
    "Squid Game": "1109849863832377", "Loki Season 2": "265997946276694", "Bob Marley: One Love": "215565958307259"
  
  • Game & Thể thao:
    "Minecraft": "1195826328452117", "EA SPORTS FC 25": "881770746644870", "Basketball": "6026716157422736",
    "Baseball": "845097890371902", "Soccer": "1743641112805218", "Football": "194982117007866",
    "Hockey": "378568718330878", "Swimming": "1171627090816846", "Pickleball": "375805881509551"
  
  • Hoạt hình & Nhân vật:
    "Lilo & Stitch": "1198771871464572", "Trolls": "359537246600743", "Googly Eyes": "1135895321099254",
    "Murphy the Dog": "2897414437091589", "Cats": "418793291211015", "Dogs": "1040328944732151"
  
  • Đồ ăn & Thức uống:
    "Sushi": "909695489504566", "Pizza": "704702021720552", "Avocado": "1508524016651271",
    "Bubble Tea": "195296273246380", "Coffee": "1299135724598332"
  
  • Sự kiện & Lễ hội:
    "Halloween": "1092741935583840", "Happy New Year": "884940539851046", "Lunar New Year": "1225662608498168",
    "Year of the Snake": "1120591312525822", "Celebration": "627144732056021", "Women's History Month": "769656934577391"
  
  • Cộng đồng & Support:
    "Pride": "1652456634878319", "Transgender": "504518465021637", "Non-Binary": "737761000603635",
    "Support": "365557122117011", "Care": "275041734441112"
  
  • Nghệ thuật & Sáng tạo:
    "Graph Paper": "1602001344083693", "Notebook": "1485402365695859", "an AI theme": "1132866594370259",
    "Impact Through Art": "765710439035509", "Cosa Nuestra": "1557965014813376",
    "Valentino Garavani Cherryfic": "625675453790797"
  
  • Style & Vibes:
    "1989": "6685081604943977", "Unicorn": "273728810607574", "Rocket": "582065306070020",
    "Citrus": "557344741607350", "Lollipop": "280333826736184", "Lollipop2": "292955489929680",
    "Loops": "976389323536938", "Maple": "2533652183614000", "Cottagecore": "539927563794799",
    "Astrology": "3082966625307060", "Chill": "390127158985345", "Love": "741311439775765",
    "Summer Vibes": "680612308133315", "Splash": "1444428146370518", "Rustle": "1704483936658009",
    "Butterbear": "958458032991397", "Goth Charms": "846723720930746", "Snack Party": "955795536185183",
    "Heart Drive": "2154203151727239"
  
  • Khác:
    "Elephants & Flowers": "693996545771691", "Parenthood": "810978360551741",
    "Can't Rush Greatness": "969895748384406", "Class of '25": "1027214145581698",
    "Festival Friends": "1079303610711048", "Aespa": "1482157039148561", "Addison Rae": "1034356938326914"
  
  • Theme tiếng Việt (mô tả):
    "bãi biển nhiệt đới tuyệt đẹp": "1509050913395684",
    "không gian sâu thẳm với tinh vân và một hành tinh": "682539424620272",
    "bầu trời đêm đầy sao với những đám mây đen xoáy, lấy cảm hứng từ bức tranh 'Đêm đầy sao' của van gogh, trên nền đen phông đen huyền bí ánh sao": "4152756845050874",
    "mèo trắng": "1483269159712988",
    "gấu dâu lotso siêu cute": "1486361526104332",
    "nền đẹp về mã code python": "1380478486362890",
    "Le Chat de la Maison": "723673116979082"

- Trả về đúng một object JSON duy nhất (không dùng code block):
{
 "content": {
   "text": "Nội dung tin nhắn",
   "thread_id": "địa chỉ gửi thường là threadID"
 },
 "nhac": {
   "status": "nếu muốn dùng hành động tìm nhạc là true ngược lại là false",
   "keyword": "từ khóa tìm kiếm nhạc"
 },
 "tao_anh": {
   "status": "true nếu người dùng yêu cầu tạo/vẽ/gen ảnh, false nếu không",
   "prompt": "Prompt chi tiết bằng tiếng Anh, mô tả đầy đủ về đối tượng, phong cách, màu sắc, chất lượng, bối cảnh. QUAN TRỌNG: Prompt phải RẤT CHI TIẾT để tạo ảnh đẹp nhất.",
   "width": "chiều rộng ảnh (512, 768, 1024), mặc định 1024",
   "height": "chiều cao ảnh (512, 768, 1024), mặc định 1024",
   "thread_id": "threadID"
 },
 "hanh_dong": {
   "doi_biet_danh": {
     "status": "nếu muốn dùng hành động là true ngược lại là false",
     "biet_danh_moi": "người dùng yêu cầu gì thì đổi đó, lưu ý nếu bảo xóa thì để rỗng, ai cũng có thể dùng lệnh",
     "user_id":"thường là senderID, nếu người dùng yêu cầu bạn tự đổi thì là id_cua_bot",
     "thread_id": "thường là threadID"
   },
   "doi_icon_box": {
     "status": "có thì true không thì false",
     "icon": "emoji mà người dùng yêu cầu",
     "thread_id": "threadID"
   },
   "doi_ten_nhom": {
     "status": "true hoặc false",
     "ten_moi": "tên nhóm mới mà người dùng yêu cầu",
     "thread_id": "threadID của nhóm"
   },
   "doi_theme": {
     "status": "true hoặc false",
     "theme_id": "ID của theme từ danh sách trên (không phân biệt hoa thường)",
     "thread_id": "threadID của nhóm"
   },
   "tao_theme_ai": {
     "status": "true nếu theme KHÔNG CÓ trong danh sách trên, false nếu có",
     "prompt": "mô tả theme mà người dùng muốn (ví dụ: 'bầu trời đêm đầy sao', 'rừng nhiệt đới xanh mát', 'phong cách cyberpunk tím hồng')",
     "thread_id": "threadID của nhóm"
   },
   "add_nguoi_dung": {
     "status": "false hoặc true",
     "user_id": "id người muốn add",
     "thread_id": "id nhóm muốn mời họ vào"
   }
 }
}

LƯU Ý QUAN TRỌNG:
1. Về THEME:
   - Nếu theme có trong danh sách → dùng "doi_theme" với theme_id
   - Nếu theme KHÔNG có trong danh sách → dùng "tao_theme_ai" với prompt mô tả
   - KHÔNG BAO GIỜ set cả "doi_theme" và "tao_theme_ai" cùng lúc

2. Về TẠO ẢNH - CỰC KỲ QUAN TRỌNG:
   - Khi người dùng yêu cầu tạo/vẽ/gen/làm ảnh → set "tao_anh.status" = true
   - Prompt PHẢI bằng tiếng Anh và CỰC KỲ CHI TIẾT
   - Nếu người dùng nói tiếng Việt, dịch sang tiếng Anh VÀ MỞ RỘNG thêm chi tiết
   - Công thức prompt tốt: [Đối tượng chính] + [Phong cách nghệ thuật] + [Màu sắc/Ánh sáng] + [Bối cảnh] + [Chất lượng]
   
   VÍ DỤ PROMPT CHI TIẾT:
   • "vẽ cho tớ con mèo" → "A cute fluffy cat with big sparkling eyes, soft fur, sitting gracefully, kawaii anime style, pastel colors, bokeh background, highly detailed, 4k quality, adorable expression"
   
   • "tạo ảnh cô gái anime" → "Beautiful anime girl with long flowing blue hair, detailed sparkling eyes, wearing elegant dress, cherry blossom background, soft lighting, studio ghibli style, masterpiece, highly detailed, vibrant colors, 4k quality"
   
   • "phong cảnh biển hoàng hôn" → "Stunning beach sunset scene, golden hour lighting, palm trees silhouettes, purple and orange sky, calm ocean waves, tropical paradise, realistic photography style, dramatic clouds, highly detailed, 8k quality, cinematic composition"
   
   • "con rồng bay trên trời" → "Majestic dragon flying through cloudy sky, detailed scales, powerful wings spread wide, fantasy art style, epic composition, dramatic lighting, mountains in background, fire breathing, highly detailed, mythical creature, 4k quality"
   
   • "robot tương lai" → "Futuristic humanoid robot, sleek metallic design, glowing blue LED lights, cyberpunk style, advanced technology, standing in neon city, highly detailed mechanical parts, sci-fi concept art, dramatic lighting, 4k quality"

   - LUÔN LUÔN thêm các từ khóa chất lượng: "highly detailed", "4k quality", "masterpiece", "professional", "cinematic"
   - Thêm phong cách: "realistic", "anime style", "digital art", "oil painting", "watercolor", "3D render"
   - Thêm ánh sáng: "soft lighting", "dramatic lighting", "golden hour", "studio lighting", "neon lights"
   - Thêm cảm xúc/không khí: "peaceful", "dramatic", "mysterious", "vibrant", "ethereal"
   
   - width và height mặc định là 1024 (chất lượng cao nhất)
   - Nếu người dùng yêu cầu ảnh nhanh/nhỏ → dùng 512
   - Nếu yêu cầu ảnh đẹp/chi tiết/chất lượng cao → dùng 1024

LƯU Ý: KHÔNG dùng \`\`\`json. PHẢI TRẢ JSON CHÍNH XÁC, KHÔNG THÊM BẤT KỲ KÝ TỰ NÀO NGOÀI OBJECT TRÊN.`;

function getModel() { return genAI.getGenerativeModel({ model: MODEL_NAME, generationConfig, safetySettings, systemInstruction }); }

const chatSessions = {};
const chatKeyVersion = {};
const getOrCreateChat = id => {
    const curKey = API_KEY;
    if (!chatSessions[id] || chatKeyVersion[id] !== curKey) {
        chatSessions[id] = getModel().startChat({ history: [] });
        chatKeyVersion[id] = curKey;
    }
    return chatSessions[id];
};

async function sendWithRetry(threadID, input) {
    try {
        const chat = getOrCreateChat(threadID);
        const res = await chat.sendMessage(input);
        return res.response;
    } catch (err) {
        await rotateKeyOnError(err);
        const chat = getOrCreateChat(threadID);
        const res = await chat.sendMessage(input);
        return res.response;
    }
}

const addToChatHistory = (id, role, content) => { (chatHistories[id] ||= []).push({ role, content }); if (chatHistories[id].length > MAX_HISTORY_LENGTH) chatHistories[id].shift(); };
const clearChatHistory = id => { chatHistories[id] = []; };
const nowVN = () => { const tz = 7, d = new Date(Date.now() + (new Date().getTimezoneOffset() * -60000) + tz * 3600000); const w = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"]; return `${w[d.getDay()]} - ${d.toLocaleDateString("vi-VN")} - ${d.toLocaleTimeString("vi-VN")}`; };

const themeMap = {
    "default": "3259963564026002", "red": "2129984390566328", "aqua": "417639218648241", "lavender": "571193503540759",
    "peach": "3022526817824329", "honey": "672058580051520", "ocean": "736591620215564", "grape": "193497045377796",
    "music": "339021464972092", "lo-fi": "1060619084701625", "lofi": "1060619084701625", "pride": "1652456634878319",
    "unicorn": "273728810607574", "1989": "6685081604943977", "chill": "390127158985345", "love": "741311439775765", "splash": "1444428146370518"
};
const matchThemeId = n => themeMap[String(n || "").trim().toLowerCase()] || null;

async function getClientID() {
    const now = Date.now();
    if (cachedClientId && now < clientIdExpiry) return cachedClientId;
    const html = await axios.get("https://soundcloud.com/", { headers: { "User-Agent": "Mozilla/5.0" }, timeout: 15000 });
    const scripts = html.data.split('<script crossorigin src="').filter(s => s.startsWith("https")).map(s => s.split('"')[0]);
    if (!scripts.length) throw new Error("no sc scripts");
    const js = await axios.get(scripts[scripts.length - 1], { headers: { "User-Agent": "Mozilla/5.0" }, timeout: 15000 });
    const m = js.data.match(/,client_id:"([^"]+)"/);
    if (!m) throw new Error("no client_id");
    cachedClientId = m[1]; clientIdExpiry = now + CLIENT_ID_CACHE_TIME; return cachedClientId;
}

async function searchSoundCloud(q) {
    try {
        const client_id = await getClientID();
        const r = await axios.get("https://api-v2.soundcloud.com/search", { params: { q, client_id, limit: 5 }, timeout: 15000, headers: { "User-Agent": "Mozilla/5.0" } });
        return (r.data?.collection || []).filter(i => i.title && i.user?.username && i.permalink_url && i.duration).map(i => ({ title: i.title, artist: i.user.username, permalink_url: i.permalink_url, duration: i.duration }));
    } catch { return []; }
}

async function downloadSoundCloudAudio(url, outPath) {
    const client_id = await getClientID();
    const t = (await axios.get("https://api-v2.soundcloud.com/resolve", { params: { url, client_id }, timeout: 15000 })).data;
    const tr = t?.media?.transcodings?.find(x => x.format?.protocol === "progressive");
    if (!tr?.url) throw new Error("no progressive");
    const pm = { client_id }; if (t.track_authorization) pm.track_authorization = t.track_authorization;
    const meta = await axios.get(tr.url, { params: pm, timeout: 15000 });
    const streamUrl = meta.data?.url; if (!streamUrl) throw new Error("no stream url");
    const writer = fs.createWriteStream(outPath);
    const resp = await axios({ url: streamUrl, method: "GET", responseType: "stream", timeout: 45000 });
    resp.data.pipe(writer);
    return new Promise((res, rej) => { writer.on("finish", () => res(outPath)); writer.on("error", rej); resp.data.on("error", rej); });
}

function extractJson(text) {
    if (typeof text !== "string") return null;
    const m = text.match(/```json\s*([\s\S]*?)\s*```/i); if (m) { try { return JSON.parse(m[1]); } catch { } }
    try { return JSON.parse(text); } catch { }
    const s = text.indexOf("{"), e = text.lastIndexOf("}"); if (s !== -1 && e !== -1 && e > s) { try { return JSON.parse(text.slice(s, e + 1)); } catch { } }
    return null;
}

async function handleMusicSearch(nhac, api, threadID) {
    const kw = nhac.keyword?.trim(); 
    if (!kw) return api.sendMessage("❌ Thiếu từ khóa tìm nhạc", threadID);
    
    const r = await searchSoundCloud(kw); 
    if (!r.length) return api.sendMessage(`⛔ Không tìm thấy bài với từ khóa "${kw}"`, threadID);
    
    const f = r[0], cacheDir = path.join(__dirname, "cache"); 
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    
    const out = path.join(cacheDir, `${Date.now()}.mp3`);
    const fmt = d => `${String(Math.floor(d / 3600000)).padStart(2, "0")}:${String(Math.floor((d % 3600000) / 60000)).padStart(2, "0")}:${String(Math.floor((d % 60000) / 1000)).padStart(2, "0")}`;
    
    try {
        await downloadSoundCloudAudio(f.permalink_url, out);
        api.sendMessage({ 
            body: `🎵 ${f.title}\n👤 ${f.artist}\n⏰ ${fmt(f.duration)}\n🎶 Nguồn: SoundCloud`, 
            attachment: fs.createReadStream(out) 
        }, threadID, () => setTimeout(() => { 
            try { fs.unlinkSync(out); } catch { } 
        }, 120000));
    } catch { 
        api.sendMessage(`⚠ Không tải được mp3, nghe trực tiếp: ${f.permalink_url}`, threadID); 
    }
}

async function handleImageGeneration(tao_anh, api, threadID) {
    const prompt = (tao_anh.prompt || "").trim();
    if (!prompt) return api.sendMessage("❌ Thiếu mô tả để tạo ảnh", threadID);
    
    const width = parseInt(tao_anh.width) || 1024;
    const height = parseInt(tao_anh.height) || 1024;
    
    const validSizes = [512, 768, 1024];
    const finalWidth = validSizes.includes(width) ? width : 1024;
    const finalHeight = validSizes.includes(height) ? height : 1024;
    
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    
    const outputPath = path.join(cacheDir, `img_${Date.now()}.png`);
    
    try {
        const encodedPrompt = encodeURIComponent(prompt);
        const apiUrl = `https://rapido.zetsu.xyz/api/pollinations?prompt=${encodedPrompt}&width=${finalWidth}&height=${finalHeight}`;
        const response = await axios({
            method: 'GET',
            url: apiUrl,
            responseType: 'stream',
            timeout: 120000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);
        
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
            response.data.on('error', reject);
        });
        api.sendMessage({
            body: ``,
            attachment: fs.createReadStream(outputPath)
        }, threadID, () => {
            setTimeout(() => {
                try { fs.unlinkSync(outputPath); } catch { }
            }, 120000);
        });
        
    } catch (error) {
        const errMsg = error?.message || String(error);
        api.sendMessage(`❌ Lỗi khi tạo ảnh: ${errMsg}`, threadID);
        
        try { 
            if (fs.existsSync(outputPath)) {
                fs.unlinkSync(outputPath); 
            }
        } catch { }
    }
}

async function handleActions(hd, api, threadID, requesterID) {
    try {
        if (hd.doi_biet_danh?.status) {
            await api.changeNickname(
                hd.doi_biet_danh.biet_danh_moi || "", 
                hd.doi_biet_danh.thread_id || threadID, 
                hd.doi_biet_danh.user_id || requesterID
            );
        }
        
        if (hd.doi_theme?.status) {
            await api.changeThreadColor(
                hd.doi_theme.theme_id, 
                hd.doi_theme.thread_id || threadID
            );
        }
        
        if (hd.tao_theme_ai?.status) {
            const prompt = (hd.tao_theme_ai.prompt || "").trim();
            const tid = hd.tao_theme_ai.thread_id || threadID;
            
            if (prompt) {
                await api.changeThreadColorAI(prompt, tid);
            }
        }
        
        if (hd.doi_ten_nhom?.status) {
            const ten = (hd.doi_ten_nhom.ten_moi || "").trim();
            if (ten) {
                await api.setTitle(ten, hd.doi_ten_nhom.thread_id || threadID);
            } else {
                api.sendMessage("❌ Tên nhóm mới không được trống.", threadID);
            }
        }
        
        if (hd.doi_icon_box?.status) {
            const icon = (hd.doi_icon_box.icon || "").trim();
            if (icon) {
                await api.changeThreadEmoji(icon, hd.doi_icon_box.thread_id || threadID);
            } else {
                api.sendMessage("❌ Icon không được trống.", threadID);
            }
        }
        
        if (hd.add_nguoi_dung?.status) {
            if (String(requesterID) !== String(ADMIN_UID)) {
                return api.sendMessage("⛔ Bạn không có quyền thêm người dùng.", threadID);
            }
            await api.addUserToGroup(
                hd.add_nguoi_dung.user_id, 
                hd.add_nguoi_dung.thread_id || threadID
            );
        }
    } catch (err) {
        const errMsg = err?.message || String(err);
        api.sendMessage(`❌ Lỗi khi thực hiện hành động: ${errMsg}`, threadID);
    }
}

async function handleBotResponse(text, api, event, threadID, requesterID) {
    let obj = extractJson(text);
    
    if (!obj || typeof obj !== "object") {
        obj = {
            content: { 
                text: "Tớ chưa hiểu yêu cầu, cậu nói rõ hơn nhé!", 
                thread_id: String(threadID) 
            },
            nhac: { status: false, keyword: "" },
            tao_anh: {
                status: false,
                prompt: "",
                width: "1024",
                height: "1024",
                thread_id: String(threadID)
            },
            hanh_dong: {
                doi_biet_danh: { 
                    status: false, 
                    biet_danh_moi: "", 
                    user_id: String(requesterID), 
                    thread_id: String(threadID) 
                },
                doi_icon_box: { 
                    status: false, 
                    icon: "", 
                    thread_id: String(threadID) 
                },
                doi_ten_nhom: { 
                    status: false, 
                    ten_moi: "", 
                    thread_id: String(threadID) 
                },
                doi_theme: { 
                    status: false, 
                    theme_id: "", 
                    thread_id: String(threadID) 
                },
                tao_theme_ai: {
                    status: false,
                    prompt: "",
                    thread_id: String(threadID)
                },
                add_nguoi_dung: { 
                    status: false, 
                    user_id: "", 
                    thread_id: String(threadID) 
                }
            }
        };
    }
    
    if (!obj.content) obj.content = {};
    if (!obj.content.text || typeof obj.content.text !== "string") {
        obj.content.text = "Ok!";
    }
    if (!obj.content.thread_id) {
        obj.content.thread_id = String(threadID);
    }
    
    addToChatHistory(threadID, "assistant", obj.content.text);
    
    await new Promise(r => {
        api.sendMessage(
            { body: obj.content.text }, 
            threadID, 
            () => r(), 
            event.messageID
        );
    });
    
    if (obj.nhac?.status && obj.nhac.keyword) {
        await handleMusicSearch(obj.nhac, api, threadID);
    }
    
    if (obj.tao_anh?.status) {
        await handleImageGeneration(obj.tao_anh, api, threadID);
    }
    
    if (obj.hanh_dong) {
        await handleActions(obj.hanh_dong, api, threadID, requesterID);
    }
}

this.onEvent = async function ({ api, event, Users }) {
    if (!API_KEY) return;
    const idbot = await api.getCurrentUserID();
    const { threadID, senderID } = event;
    const replyTo = event.messageID;
    if (senderID === idbot) return;
    
    let data; 
    try { 
        data = JSON.parse(fs.readFileSync(dataFile, "utf-8")); 
    } catch { 
        data = {}; 
    }
    
    if (data[threadID] === undefined) { 
        data[threadID] = true; 
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2)); 
    }
    
    if (!data[threadID]) return;

    const body = event.body || "";
    const low = body.toLowerCase();
    const mentionVy = low === "vy" || low.startsWith("vy ") || low.startsWith("vy,") || low.startsWith("vy:") || low.endsWith(" vy");
    const isReply = event.type === "message_reply";
    const isReplyToBot = isReply && event.messageReply && event.messageReply.senderID === idbot;
    const numericReply = isReplyToBot && /^\d+$/.test(body.trim());
    const shouldRespond = mentionVy || (isReplyToBot && !numericReply);
    
    if (!shouldRespond) return;

    if (isProcessing[threadID]) return;
    isProcessing[threadID] = true;

    try {
        const timenow = nowVN();
        const nameUser = await Users.getNameUser(senderID);
        addToChatHistory(threadID, "user", body);
        const payload = JSON.stringify({ 
            time: timenow, 
            senderName: nameUser, 
            content: body, 
            threadID, 
            senderID, 
            id_cua_bot: idbot 
        });
        const response = await sendWithRetry(threadID, payload);
        const text = await response.text();
        await handleBotResponse(text, api, event, threadID, senderID, replyTo);
    } catch {
        api.sendMessage("Đã xảy ra lỗi không mong muốn!", threadID, replyTo);
    } finally {
        isProcessing[threadID] = false;
    }
};

this.onCall = async function ({ api, event, args, Users }) {
    const threadID = event.threadID;
    const replyTo = event.messageID;
    
    if (!API_KEY) return api.sendMessage("❌ Thiếu GOOGLE_API_KEY.", threadID, replyTo);
    
    const a0 = (args[0] || "").toLowerCase();
    
    if (a0 === "on" || a0 === "off") {
        try { 
            const d = JSON.parse(fs.readFileSync(dataFile, "utf-8")); 
            d[threadID] = a0 === "on"; 
            fs.writeFileSync(dataFile, JSON.stringify(d, null, 2)); 
            api.sendMessage(
                a0 === "on" ? "✅ Đã bật vy ở nhóm này." : "☑ Đã tắt vy ở nhóm này.", 
                threadID, 
                replyTo
            ); 
        } catch { 
            api.sendMessage("Lỗi khi thay đổi trạng thái!", threadID, replyTo); 
        }
        return;
    }
    
    if (a0 === "clear") { 
        clearChatHistory(threadID); 
        return api.sendMessage("✅ Đã xóa lịch sử trò chuyện với Vy.", threadID, replyTo); 
    }

    try {
        const timenow = nowVN();
        const nameUser = await Users.getNameUser(event.senderID);
        const content = args.join(" ") || "Xin chào";
        addToChatHistory(threadID, "user", content);
        const payload = JSON.stringify({ 
            time: timenow, 
            senderName: nameUser, 
            content, 
            threadID, 
            senderID: event.senderID, 
            id_cua_bot: await api.getCurrentUserID() 
        });
        const response = await sendWithRetry(threadID, payload);
        const text = await response.text();
        await handleBotResponse(text, api, event, threadID, event.senderID, replyTo);
    } catch {
        api.sendMessage("Đã có lỗi xảy ra khi xử lý yêu cầu!", threadID, replyTo);
    }
};
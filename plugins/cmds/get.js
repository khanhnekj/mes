const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const PQueue = require("p-queue").default;

// Đường dẫn mới: core/data/media/
const pathApi = path.join(process.cwd(), "core", "data", "media");

const CATBOX_USERHASH = process.env.CATBOX_USERHASH || "b4efcd6ef4cc17dea4035020d";
const CATBOX_COOKIE = process.env.CATBOX_COOKIE || "PHPSESSID=7cfb6dafb6c4183ed892ce922fadfda5";
const CONCURRENCY = parseInt(process.env.GET_CONCURRENCY || "5");

this.config = {
	name: "get",
	alias: ["getvideo", "getv"],
	version: "2.0.0",
	role: 3,
	author: "nvh",
	info: "Tải video TikTok/Facebook và lưu link Catbox",
	category: "Admin",
	guides: "{pn} <username1> <username2> ... <tên_mục> | {pn} <link-fb> <số lượng> <tên_mục>",
	cd: 5,
	prefix: true
};

this.onLoad = function () {
	if (!fs.existsSync(pathApi)) fs.mkdirSync(pathApi, { recursive: true });
};

// --- Hàm chọn User-Agent ngẫu nhiên ---
const USER_AGENTS = [
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
	"Mozilla/5.0 (X11; Linux x86_64)",
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
	"Mozilla/5.0 (Linux; Android 10; CPH2179) Chrome/107.0.0.0",
	"Mozilla/5.0 (iPhone; CPU iPhone OS 14_2 like Mac OS X)",
	"Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
	"curl/7.68.0"
];
function pickUA() {
	return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// --- Download video ---
async function download(url) {
	const { data } = await axios.get(url, {
		responseType: "arraybuffer",
		maxRedirects: 5,
		timeout: 60000,
		headers: { "User-Agent": pickUA(), Accept: "*/*" }
	});
	return Buffer.from(data);
}

// --- Upload Catbox ---
async function uploadToCatbox(buffer, options = { userhash: "", cookie: "" }) {
	const form = new FormData();
	form.append("reqtype", "fileupload");
	if (options.userhash) form.append("userhash", options.userhash);
	form.append("fileToUpload", buffer, { filename: `video-${Date.now()}.mp4` });

	const headers = { ...form.getHeaders(), "User-Agent": pickUA() };
	if (options.cookie) headers.Cookie = options.cookie;

	const MAX_RETRY = 5;
	for (let i = 0; i <= MAX_RETRY; i++) {
		try {
			const { data } = await axios.post("https://catbox.moe/user/api.php", form, {
				headers,
				timeout: 90000,
				maxBodyLength: Infinity,
				maxContentLength: Infinity
			});
			if (typeof data === "string" && data.startsWith("https://")) return data.trim();
			throw new Error("Catbox trả về dữ liệu không hợp lệ");
		} catch (err) {
			if (i === MAX_RETRY) throw new Error(`Upload Catbox lỗi: ${err.message}`);
			await new Promise(r => setTimeout(r, 1000 * (i + 1)));
		}
	}
}

// --- Upload kép: ẩn danh & tài khoản ---
async function uploadCatboxDual(buffer) {
	const tasks = [
		(async () => {
			try {
				return await uploadToCatbox(buffer, {});
			} catch (e) {
				throw new Error(`anon: ${e.message}`);
			}
		})()
	];

	if (CATBOX_USERHASH) {
		tasks.push(
			(async () => {
				try {
					return await uploadToCatbox(buffer, { userhash: CATBOX_USERHASH, cookie: CATBOX_COOKIE });
				} catch (e) {
					throw new Error(`login: ${e.message}`);
				}
			})()
		);
	}

	try {
		return await Promise.any(tasks);
	} catch (err) {
		const msgs = (err.errors || []).map(e => e.message || e);
		throw new Error(`Tất cả phương án upload thất bại: ${msgs.join(" | ")}`);
	}
}

// --- Ghi file JSON danh sách link ---
async function saveLinksJson(category, newLinks) {
	const filePath = path.join(pathApi, `${category}.json`);
	let existing = [];
	try {
		if (fs.existsSync(filePath)) {
			existing = JSON.parse(await fsp.readFile(filePath, "utf8") || "[]");
		}
	} catch {
		existing = [];
	}
	const all = [...existing, ...newLinks];
	const tmp = `${filePath}.tmp`;
	await fsp.writeFile(tmp, JSON.stringify(all, null, 2));
	await fsp.rename(tmp, filePath);
}

// --- Xử lý lệnh chính ---
this.onCall = async function ({ api, event, args, msg }) {
	try {
		if (args.length < 2)
			return msg.reply("❌ Dùng: get <username1> <username2> ... <tên_mục>\nHoặc: get <link-fb> <số lượng> <tên_mục>");

		const first = args[0];
		const results = [];
		const errors = [];
		const queue = new PQueue({ concurrency: CONCURRENCY });

		// --- MODE FACEBOOK ---
		if (first.includes("facebook.com")) {
			const [link, countStr, category] = args;
			const count = parseInt(countStr);
			if (!link || !count || !category) return msg.reply("❌ Dùng: get <link-fb> <số lượng> <tên_mục>");

			msg.reply(`📥 Đang quét video Facebook (${count})...`);

			try {
				const res = await axios.get(`https://niio-team.onrender.com/fbpage?url=${encodeURIComponent(link)}`, {
					headers: { "User-Agent": pickUA() },
					timeout: 30000
				});
				const posts = res.data?.data || [];
				const limited = posts.slice(0, count);

				const tasks = limited.map(p =>
					queue.add(async () => {
						try {
							const buf = await download(p.url);
							const uploaded = await uploadCatboxDual(buf);
							results.push(uploaded);
						} catch (e) {
							errors.push(`FB: ${e.message}`);
						}
					})
				);

				await Promise.all(tasks);
				if (results.length) await saveLinksJson(category, results);
				msg.reply(`✅ Lưu ${results.length} video FB (${errors.length} lỗi)`);
			} catch (e) {
				msg.reply(`❌ Lỗi FB: ${e.message}`);
			}
			return;
		}

		// --- MODE TIKTOK ---
		const category = args[args.length - 1];
		const users = args.slice(0, -1);
		msg.reply(`📥 Đang lấy video TikTok của ${users.length} user...\n🗂 Lưu vào: ${category}.json`);

		for (const user of users) {
			msg.reply(`🔍 Đang lấy video của @${user}...`);
			try {
				const res = await axios.post(
					"https://www.tikwm.com/api/user/posts",
					new URLSearchParams({ unique_id: user }),
					{ headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": pickUA() }, timeout: 40000 }
				);
				if (res.data?.code !== 0) {
					errors.push(`❌ ${user}: API TikTok lỗi (${res.data?.msg || "Không rõ"})`);
					continue;
				}

				const videos = res.data?.data?.videos || [];
				if (!videos.length) {
					errors.push(`⚠️ ${user}: Không có video.`);
					continue;
				}

				const tasks = videos.map(v =>
					queue.add(async () => {
						try {
							const buf = await download(v.play || v.playwm || v.download || "");
							const uploaded = await uploadCatboxDual(buf);
							results.push(uploaded);
						} catch (e) {
							errors.push(`${user}: ${e.message}`);
						}
					})
				);

				await Promise.all(tasks);
				msg.reply(`✅ @${user}: Hoàn tất ${videos.length} video`);
			} catch (e) {
				errors.push(`❌ ${user}: ${e.message}`);
			}
		}

		if (results.length) {
			await saveLinksJson(category, results);
			msg.reply(`🎉 Hoàn tất!\nĐã lưu ${results.length} video vào ${category}.json\n⚠️ ${errors.length} lỗi`);
		} else {
			msg.reply(`❌ Không tải được video nào.\n${errors.join("\n")}`);
		}
	} catch (e) {
		msg.reply(`❌ Lỗi hệ thống: ${e.message}`);
	}
};
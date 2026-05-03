module.exports.config = {
 name: "setn",
 version: "1.0.5",
 role: 0,
 author: "glong",
 info: "Đổi biệt danh trong nhóm (tag, reply hoặc tự đổi cho bản thân).",
 category: "Group",
 guidr: "[tag/reply] [tên mới] hoặc [tên mới (đổi cho bản thân)]",
 cd: 5,
 Prefix: true
};

this.onCall = async ({ api, event, args, config }) => {
 const { threadID, messageID, senderID, messageReply, mentions, body } = event;
 let targetID, newName = "";

 if (messageReply) {
 targetID = messageReply.senderID;
 newName = args.join(" ");
 } else if (Object.keys(mentions).length) {
 targetID = Object.keys(mentions)[0];
 let text = body.slice((config.PREFIX + module.exports.config.name).length).trim();
 for (const tag of Object.values(mentions)) {
 text = text.replace(new RegExp(tag.replace(/[.*+?^${}()|[\\]]/g, '\\$&'), 'g'), '').trim();
 }
 newName = text;
 } else if (args.length > 0) {
 targetID = senderID;
 newName = args.join(" ");
 } else {
 return api.sendMessage(
 "👉 Cách dùng lệnh đổi biệt danh:\n- !setn @[tên] [biệt danh mới]\n- (reply) !setn [biệt danh mới]\n- !setn [biệt danh mới (tự đổi cho bản thân)]",
 threadID, messageID
 );
 }

 try {
 await api.changeNickname(newName, threadID, targetID);
 const targetName = (await api.getUserInfo(targetID))[targetID].name;

 const action = newName ? "đổi biệt danh thành" : "đặt lại biệt danh về mặc định";
 const targetText = targetID === senderID ? "anh/bạn" : targetName;
 const newNameText = newName ? `: "${newName}"` : "";

 const msg = `✅ Đã ${action} của ${targetText}${newNameText}.`;
 
 api.sendMessage(msg, threadID, messageID);
 } catch (e) {
 console.error("Lỗi đổi biệt danh:", e);
 api.sendMessage("❌ Không thể đổi biệt danh (kiểm tra quyền bot hoặc ID).", threadID, messageID);
 }
};
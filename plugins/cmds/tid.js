module.exports.config = {
	name: "tid",
	version: "1.0.0", 
	role: 0,
	author: "NTKhang",
	info: "Lấy id box", 
	category: "Tiện ích",
	guide: "tid",
	cd: 5, 
        Prefix: true
};

this.onCall = async function({ api, event }) {
  api.sendMessage(event.threadID, event.threadID);
};
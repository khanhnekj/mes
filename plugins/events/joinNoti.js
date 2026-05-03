this.config = {
	name: "joinNoti",
	eventType: ["log:subscribe"],
	version: "1.0.2",
	info: "Thông báo khi bot vào nhóm"
};

this.onCall = async function({ api, event }) {
	const { threadID } = event;

	// Khi bot vào nhóm
	if (event.logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
		api.changeNickname(`[ ${global.config.PREFIX} ] • ${global.config.BOTNAME || "Bot"}`, threadID, api.getCurrentUserID());
		return api.sendMessage(`Bot đã kết nối thành công!\nNhập ${global.config.PREFIX}menu để xem danh sách lệnh`, threadID);
	}

}
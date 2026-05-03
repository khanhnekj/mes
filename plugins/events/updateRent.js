const fs = require('fs-extra');
const logger = require("../../func/utils/log.js");

module.exports = {
  config: {
  name: "updateRent",
  eventType: ["log:unsubscribe", "log:subscribe"],
  version: "2.0.0",
  author: "DongDev",
    info: "Quản lý dữ liệu thuê bot khi vào/rời nhóm"
  },

  onCall: async function({ event, api }) {
    try {
      const { logMessageType, logMessageData, threadID } = event;
      const botID = api.getCurrentUserID();
      const rentPath = process.cwd() + '/core/data/rent.json';

      if (!fs.existsSync(rentPath)) return;

      let rentData = JSON.parse(fs.readFileSync(rentPath, 'utf8'));
      let updated = false;

      if (logMessageType === "log:unsubscribe") {
        // Bot rời khỏi nhóm
        if (logMessageData.leftParticipantFbId === botID) {
          const index = rentData.findIndex(item => item.t_id === threadID);
          if (index !== -1) {
            rentData.splice(index, 1);
            updated = true;
            logger.log(`Đã xóa dữ liệu thuê cho nhóm: ${threadID}`, "RENT");
          }
        }
      } else if (logMessageType === "log:subscribe") {
        // Bot vào nhóm mới - có thể thêm logic tự động ở đây nếu cần
        if (logMessageData.addedParticipants.some(p => p.userFbId === botID)) {
          logger.log(`Bot vào nhóm mới: ${threadID}`, "RENT");
        }
      }

      if (updated) {
        fs.writeFileSync(rentPath, JSON.stringify(rentData, null, 2));
      }
    } catch (error) {
      console.error('[UPDATERENT] Lỗi:', error.message);
    }
  }
};
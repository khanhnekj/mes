const os = require('os');
const moment = require('moment-timezone');
const fs = require('fs').promises;
const path = require('path');
module.exports = {
  config: {
    name: "upt",
    alias: ["uptime"],
    version: "2.1.6",
    role: 0,
    
    author: "Vtuan rmk Niio-team",
    info: "Hiển thị thông tin hệ thống của bot!",
    category: "Tiện ích",
    guides: "[upt]",
    cd: 5,
    prefix: false
  },
  onCall: async ({ api, event, Users, client }) => {
    const pingStart = Date.now();
    
    async function getDependencyCount() {
        const { dependencies } = JSON.parse(await fs.readFile('package.json', 'utf8'));
        return Object.keys(dependencies).length;
    }
    function formatUptime(seconds) {
      const days = Math.floor(seconds / (24 * 3600));
      const hours = Math.floor((seconds % (24 * 3600)) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      return `${days}d : ${hours.toString().padStart(2, '0')}h : ${minutes.toString().padStart(2, '0')}m : ${secs.toString().padStart(2, '0')}s`;
    }
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const { heapTotal, heapUsed, external, rss } = process.memoryUsage();
    const uptime = process.uptime();
    const dependencyCount = await getDependencyCount();
    const pingReal = Date.now() - pingStart;
    const botStatus = pingReal < 200 ? 'mượt' : (pingReal < 600 ? 'trung bình' : 'lag');
    const cpus = os.cpus();
    const name = await Users.getNameUser(event.senderID);
    api.sendMessage({body: `⏰ Bây giờ là: ${moment().tz('Asia/Ho_Chi_Minh').format('HH:mm:ss')} | ${moment().tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY')}
⏱️ Thời gian hoạt động: ${formatUptime(uptime)}
📝 Dấu lệnh mặc định: ${global.config.PREFIX}
🗂️ Số lượng package: ${dependencyCount >= 0 ? dependencyCount : "Không xác định"}
🔣 Tình trạng bot: ${botStatus}
🖥 Hệ điều hành: ${os.type()} ${os.release()} (${os.arch()})
💾 CPU: ${cpus.length} core(s) - ${cpus[0].model} @ ${Math.round(cpus[0].speed)}MHz
📊  RAM: ${((totalMemory - freeMemory) / (1024 * 3)).toFixed(2)}GB/${(totalMemory / (1024 * 3)).toFixed(2)}GB (đã dùng)
🛢️ Ram trống: ${(freeMemory / (1024 ** 3)).toFixed(2)}GB
🗄️ Heap Memory: ${(heapUsed / (1024 * 2)).toFixed(2)}MB / ${(heapTotal / (1024 * 2)).toFixed(2)}MB (đã dùng)
📑 External Memory: ${(external / (1024 ** 2)).toFixed(2)}MB
✅️ RSS: ${(rss / (1024 ** 2)).toFixed(2)}MB
🛜 Ping: ${pingReal}ms
👤 Yêu cầu bởi: ${name}`, attachment: global.Seiko.chillQueues.splice(0, 1)},event.threadID, event.messageID);
  }
};
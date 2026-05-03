const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

module.exports = {
  config: {
    name: "work",
    alias: ["work"],
    version: "1.0.0",
    role: 0,
    author: "DongDev",
    info: "Lệnh làm việc để kiếm tiền",
    category: "Kiếm tiền",
    guides: "Sử dụng lệnh này để làm việc và nhận tiền thưởng",
    cd: 5,
    prefix: true
  },
  onLoad: () => {
    const jobsFilePath = path.join(__dirname, '../../core/data/working.json');
    if (!fs.existsSync(jobsFilePath)) {
      fs.mkdirSync(path.dirname(jobsFilePath), {
        recursive: true
      });
      fs.writeFileSync(jobsFilePath, JSON.stringify([], null, 2));
    }
  },
  onCall: async ({
    api,
    event,
    msg,
    Currencies,
    Users,
    args
  }) => {
    const {
      senderID,
      threadID,
      messageID
    } = event;
    const jobsFilePath = path.join(__dirname, '../../core/data/working.json');
    const cooldown = 300000;   
    let userData = await Users.getData(senderID);
    if (!userData.data || typeof userData.data !== 'object') {
      userData.data = {};
    } 
    let lastWorkTime = userData.data.lastWorkTime || 0;    
    function formatMoney(amount) {
      return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    switch (args[0]) {
      case 'add': {
        if (!global.config.NDH.includes(senderID)) {
          return api.sendMessage("❎ Bạn không có quyền thêm công việc mới", threadID, messageID);
        }
        const newJob = args.slice(1).join(" ");
        if (!/{name}(.+?)\{money\}/.test(newJob)) {
          return api.sendMessage("❎ Định dạng công việc không hợp lệ. Vui lòng sử dụng định dạng '{name} đã làm công việc gì đó, kiếm được {money}'", threadID, messageID);
        }
        let jobs = JSON.parse(fs.readFileSync(jobsFilePath));
        const jobExists = jobs.some(job => job === newJob);
        if (jobExists) {
          return api.sendMessage("⚠️ Công việc này đã tồn tại trong danh sách.", threadID, messageID);
        }
        jobs.push(newJob);
        fs.writeFileSync(jobsFilePath, JSON.stringify(jobs, null, 2));
        return api.sendMessage(`✅ Đã thêm công việc mới: ${newJob}`, threadID, messageID);
      }
      default: {
        const now = moment().valueOf();
        if (now - lastWorkTime < cooldown) {
             const remainingTimeMs = cooldown - (now - lastWorkTime);
             const remainingMinutes = Math.floor(remainingTimeMs / 60000);
             const remainingSeconds = Math.ceil((remainingTimeMs % 60000) / 1000);
             return api.sendMessage(`⏳ Bạn cần chờ thêm ${remainingMinutes} phút ${remainingSeconds} giây trước khi tiếp tục làm việc`, threadID, messageID);
        }       
        userData.data.lastWorkTime = now;
        await Users.setData(senderID, userData);       
        const jobs = JSON.parse(fs.readFileSync(jobsFilePath));
        const userName = await Users.getNameUser(senderID);
        const randomJob = jobs[Math.floor(Math.random() * jobs.length)];
        const minMoney = 50000;
        const maxMoney = 100000;
        const money = Math.floor(Math.random() * (maxMoney - minMoney + 1)) + minMoney;
        await Currencies.increaseMoney(senderID, money);
        const formattedMoney = formatMoney(money);
        const resultMessage = randomJob.replace('{name}', userName).replace('{money}', `${formattedMoney}$`);
        return api.sendMessage(resultMessage, threadID, messageID);
      }
    }
  }
}
this.config = {
  name: "anti",
  alias: ["antist"],
  version: "2.0.0",
  role: 2,
  author: "BraSL & update DongDev",
  info: "Anti change Box chat vip pro",
  category: "Admin",
  guides: "anti dùng để bật tắt",
  cd: 5,
  prefix: true,
};

const { readdirSync, readFileSync, writeFileSync, existsSync, unlinkSync } = require("fs-extra");
const path = require('path');
const fs = require('fs');
const axios = require('axios');

global.pendingKicks = global.pendingKicks || {};

this.onLoad = function() {
  const filePath = path.resolve(__dirname, '..', '..', 'core', 'data', 'antisetting.json');
  const pathKick = path.resolve(__dirname, '..', '..', 'core', 'data', 'antikickTag.json');
  
  const dirPath = path.dirname(filePath);
  if (!existsSync(dirPath)) {
    require('fs').mkdirSync(dirPath, { recursive: true });
  }
  
  if (!existsSync(filePath)) {
    const initialData = {
      boxname: [],
      boximage: [],
      antiNickname: [],
      antiChangeNameBox: {},
      antiChangeNickname: {},
      antiout: {},
      antiOut: {},
      antiEmoji: {},
      antiTheme: {},
      antiQtv: {},
      antijoin: {},
      antiJoin: {},
      antiTagAll: {}
    };
    writeFileSync(filePath, JSON.stringify(initialData, null, 4));
  }
  
  if (!existsSync(pathKick)) {
    writeFileSync(pathKick, JSON.stringify({}, null, 2), 'utf8');
  }
  
  if (!global.anti) {
    global.anti = filePath;
  }
  if (!global.antiKickPath) {
    global.antiKickPath = pathKick;
  }
};

this.onEvent = async function ({ api, event, Threads, Users }) {
  const { threadID, senderID, mentions } = event;
  
  try {
    const pathKick = global.antiKickPath;
    if (!pathKick || !existsSync(pathKick)) return;
    
    let tagData = {};
    try {
      const fileContent = readFileSync(pathKick, 'utf8');
      if (fileContent.trim() === '' || fileContent.trim() === '[]') {
        tagData = {};
      } else {
        const parsed = JSON.parse(fileContent);
        tagData = Array.isArray(parsed) ? {} : parsed;
      }
    } catch (error) {
      tagData = {};
    }
    
    if (!tagData[threadID]) return;
    
    const threadInfo = await Threads.getData(threadID);
    const qtv = threadInfo.threadInfo.adminIDs.map(admin => admin.id);
    
    if (qtv.includes(senderID)) return;
    
    if (mentions && Object.keys(mentions).length > 0) {
      const isTaggingGroup = Object.keys(mentions).includes(threadID);
      
      if (isTaggingGroup) {
        const userName = await Users.getNameUser(senderID);
        const kickKey = `${threadID}_${senderID}`;
        
        global.pendingKicks[kickKey] = {
          threadID: threadID,
          senderID: senderID,
          userName: userName,
          cancelled: false
        };
        
        api.sendMessage(
          `${userName}\n⚠️ 20s nữa sẽ bị kick do tag all\nQTV thả reaction vào tin nhắn này để hủy`, 
          threadID, 
          (err, info) => {
            if (err) return console.error(err);
            
            global.Seiko.onReaction.set(info.messageID, {
              commandName: this.config.name,
              messageID: info.messageID,
              qtv: qtv,
              author: senderID,
              threadID: threadID,
              kickKey: kickKey,
              type: "antiTagAll"
            });
            
            setTimeout(() => {
              const pendingKick = global.pendingKicks[kickKey];
              if (pendingKick && !pendingKick.cancelled) {
                api.removeUserFromGroup(senderID, threadID);
                api.sendMessage(`⚠️ Đã kick ${userName} do tag all nhóm`, threadID);
              }
              
              delete global.pendingKicks[kickKey];
              global.Seiko.onReaction.delete(info.messageID);
            }, 20000);
          }
        );
      }
    }
  } catch (error) {
    console.error('Error in handleEvent (TagAll):', error);
  }
};

this.onReaction = async function({ api, event, Reaction, Users }) {
  try {
    const { userID, threadID, messageID } = event;
    const { qtv, author, kickKey, type } = Reaction;
    
    if (type !== "antiTagAll") return;
    
    if (qtv && qtv.includes(userID) && kickKey) {
      if (global.pendingKicks[kickKey]) {
        global.pendingKicks[kickKey].cancelled = true;
        
        const userName = await Users.getNameUser(author);
        api.sendMessage(`Đã hủy lệnh kick ${userName} ✅`, threadID);
        api.unsendMessage(messageID);
        
        global.Seiko.onReaction.delete(messageID);
      }
    }
  } catch (error) {
    console.error('Error in onReaction:', error);
  }
};

this.onReply = async function ({ api, event, args, Reply, Threads, Users }) {
  try {
    const { senderID, threadID, messageID, messageReply } = event;
    const { author, permssion } = Reply;
    
    if (author !== senderID) return api.sendMessage(`Bạn không phải người dùng lệnh`, threadID);
    
    const pathData = global.anti;
    const pathKick = global.antiKickPath;
    
    if (!pathData || !existsSync(pathData)) {
      return api.sendMessage("❎ Không tìm thấy file cấu hình anti", threadID, messageID);
    }
    
    let dataAnti;
    try {
      dataAnti = JSON.parse(readFileSync(pathData, "utf8"));
    } catch (error) {
      console.error('Error reading anti data:', error);
      return api.sendMessage("❎ Lỗi đọc file cấu hình anti", threadID, messageID);
    }
    
    let dataThread;
    try {
      dataThread = (await Threads.getData(threadID)).threadInfo;
    } catch (error) {
      console.error('Error getting thread data:', error);
      return api.sendMessage("❎ Lỗi lấy thông tin nhóm", threadID, messageID);
    }

    var number = event.args.filter(i => !isNaN(i));
    for (const num of number) {
      switch (num) {
        case "1": {
          if (permssion < 1)
            return api.sendMessage("Bạn không đủ quyền hạn để sử dụng lệnh này", threadID, messageID);

          const antiBoxname = dataAnti.boxname.find(item => item.threadID === threadID);
          if (antiBoxname) {
            dataAnti.boxname = dataAnti.boxname.filter(item => item.threadID !== threadID);
            if (dataAnti.antiChangeNameBox && dataAnti.antiChangeNameBox[threadID]) {
              delete dataAnti.antiChangeNameBox[threadID];
            }
            api.sendMessage("✅ Anti đổi tên box: OFF", threadID, messageID);
          } else {
            const threadName = dataThread?.threadName || "Unknown";
            dataAnti.boxname.push({ threadID, name: threadName });
            if (!dataAnti.antiChangeNameBox) dataAnti.antiChangeNameBox = {};
            dataAnti.antiChangeNameBox[threadID] = { oldName: threadName };
            api.sendMessage("✅ Anti đổi tên box: ON", threadID, messageID);
          }
          writeFileSync(pathData, JSON.stringify(dataAnti, null, 4));
          break;
        }
        case "2": {
          if (permssion < 1)
            return api.sendMessage("Bạn không đủ quyền hạn để sử dụng lệnh này", threadID, messageID);

          const antiImage = dataAnti.boximage.find(item => item.threadID === threadID);
          if (antiImage) {
            dataAnti.boximage = dataAnti.boximage.filter(item => item.threadID !== threadID);
            api.sendMessage("✅ Anti đổi ảnh box: OFF", threadID, messageID);
          } else {
            let url = dataThread?.imageSrc || "";
            dataAnti.boximage.push({ threadID, url: url });
            api.sendMessage("✅ Anti đổi ảnh box: ON", threadID, messageID);
          }
          writeFileSync(pathData, JSON.stringify(dataAnti, null, 4));
          break;
        }
        case "3": {
          if (permssion < 1)
            return api.sendMessage("Bạn không đủ quyền hạn để sử dụng lệnh này", threadID, messageID);

          const NickName = dataAnti.antiNickname.find(item => item.threadID === threadID);
          if (NickName) {
            dataAnti.antiNickname = dataAnti.antiNickname.filter(item => item.threadID !== threadID);
            if (dataAnti.antiChangeNickname && dataAnti.antiChangeNickname[threadID]) {
              delete dataAnti.antiChangeNickname[threadID];
            }
            api.sendMessage("✅ Anti đổi biệt danh: OFF", threadID, messageID);
          } else {
            try {
              const threadInfo = await api.getThreadInfo(threadID);
              const nickName = threadInfo.nicknames || {};
              dataAnti.antiNickname.push({ threadID, data: nickName });
              if (!dataAnti.antiChangeNickname) dataAnti.antiChangeNickname = {};
              dataAnti.antiChangeNickname[threadID] = { oldNickname: "" };
              api.sendMessage("✅ Anti đổi biệt danh: ON", threadID, messageID);
            } catch (error) {
              console.error('Error getting thread info:', error);
              api.sendMessage("❎ Lỗi khi lấy thông tin nhóm", threadID, messageID);
            }
          }
          writeFileSync(pathData, JSON.stringify(dataAnti, null, 4));
          break;
        }
        case "4": {
          if (permssion < 1)
            return api.sendMessage("Bạn không đủ quyền hạn để sử dụng lệnh này", threadID, messageID);

          if (!dataAnti.antiout) dataAnti.antiout = {};
          if (!dataAnti.antiOut) dataAnti.antiOut = {};
          
          if (dataAnti.antiout[threadID] === true) {
            dataAnti.antiout[threadID] = false;
            dataAnti.antiOut[threadID] = false;
            api.sendMessage("✅ Anti rời nhóm: OFF", threadID, messageID);
          } else {
            dataAnti.antiout[threadID] = true;
            dataAnti.antiOut[threadID] = true;
            api.sendMessage("✅ Anti rời nhóm: ON", threadID, messageID);
          }
          writeFileSync(pathData, JSON.stringify(dataAnti, null, 4));
          break;
        }
        case "5": {
          if (!dataAnti.antiEmoji) dataAnti.antiEmoji = {};
          const emojiData = dataAnti.antiEmoji;
          let emoji = dataThread?.emoji || "👍";
          
          if (!emojiData[threadID]) {
            emojiData[threadID] = { oldEmoji: emoji, enabled: true };
            api.sendMessage("✅ Anti đổi emoji: ON", threadID, messageID);
          } else {
            emojiData[threadID].enabled = !emojiData[threadID].enabled;
            if (emojiData[threadID].enabled) {
              emojiData[threadID].oldEmoji = emoji;
              api.sendMessage("✅ Anti đổi emoji: ON", threadID, messageID);
            } else {
              api.sendMessage("✅ Anti đổi emoji: OFF", threadID, messageID);
            }
          }
          dataAnti.antiEmoji = emojiData;
          writeFileSync(pathData, JSON.stringify(dataAnti, null, 4));
          break;
        }
        case "6": {
          if (!dataAnti.antiTheme) dataAnti.antiTheme = {};
          const themeData = dataAnti.antiTheme;
          let theme = dataThread?.threadTheme?.id || "196241301102133";
          
          if (!themeData[threadID]) {
            themeData[threadID] = { oldTheme: { theme_id: theme, accessibility_label: "default" }, enabled: true };
            api.sendMessage("✅ Anti đổi chủ đề: ON", threadID, messageID);
          } else {
            themeData[threadID].enabled = !themeData[threadID].enabled;
            if (themeData[threadID].enabled) {
              themeData[threadID].oldTheme = { theme_id: theme, accessibility_label: "default" };
              api.sendMessage("✅ Anti đổi chủ đề: ON", threadID, messageID);
            } else {
              api.sendMessage("✅ Anti đổi chủ đề: OFF", threadID, messageID);
            }
          }
          dataAnti.antiTheme = themeData;
          writeFileSync(pathData, JSON.stringify(dataAnti, null, 4));
          break;
        }
        case "7": {
          const adminIDs = dataThread?.adminIDs || [];
          if (!adminIDs.some(item => item.id === api.getCurrentUserID()))
            return api.sendMessage('Bot cần quyền quản trị viên để có thể thực thi lệnh', threadID, messageID);

          if (!dataAnti.antiQtv) dataAnti.antiQtv = {};
          const qtvData = dataAnti.antiQtv;
          
          if (!qtvData[threadID]) {
            qtvData[threadID] = true;
            api.sendMessage(`✅ Anti thay đổi qtv: ON`, threadID, messageID);
          } else {
            qtvData[threadID] = !qtvData[threadID];
            if (qtvData[threadID]) {
              api.sendMessage(`✅ Anti thay đổi qtv: ON`, threadID, messageID);
            } else {
              api.sendMessage(`✅ Anti thay đổi qtv: OFF`, threadID, messageID);
            }
          }
          dataAnti.antiQtv = qtvData;
          writeFileSync(pathData, JSON.stringify(dataAnti, null, 4));
          break;
        }
        case "8": {
          if (!dataAnti.antijoin) dataAnti.antijoin = {};
          if (!dataAnti.antiJoin) dataAnti.antiJoin = {};
          
          const antijoin = dataAnti.antijoin;
          if (antijoin[threadID] === true) {
            antijoin[threadID] = false;
            dataAnti.antiJoin[threadID] = false;
            api.sendMessage("✅ Anti thêm thành viên: OFF", threadID, messageID);
          } else {
            antijoin[threadID] = true;
            dataAnti.antiJoin[threadID] = true;
            api.sendMessage("✅ Anti thêm thành viên: ON", threadID, messageID);
          }
          dataAnti.antijoin = antijoin;
          writeFileSync(pathData, JSON.stringify(dataAnti, null, 4));
          break;
        }
        case "9": {
          const antiImage = dataAnti.boximage ? dataAnti.boximage.find(item => item.threadID === threadID) : null;
          const antiBoxname = dataAnti.boxname ? dataAnti.boxname.find(item => item.threadID === threadID) : null;
          const antiNickname = dataAnti.antiNickname ? dataAnti.antiNickname.find(item => item.threadID === threadID) : null;
          const antiEmoji = dataAnti.antiEmoji && dataAnti.antiEmoji[threadID] ? dataAnti.antiEmoji[threadID].enabled : false;
          const antiTheme = dataAnti.antiTheme && dataAnti.antiTheme[threadID] ? dataAnti.antiTheme[threadID].enabled : false;
          const antiQtv = dataAnti.antiQtv && dataAnti.antiQtv[threadID] ? dataAnti.antiQtv[threadID] : false;
          const antiJoin = dataAnti.antijoin && dataAnti.antijoin[threadID] ? dataAnti.antijoin[threadID] : false;
          const antiOut = dataAnti.antiout && dataAnti.antiout[threadID] ? dataAnti.antiout[threadID] : false;
          
          let antiTagAll = false;
          if (pathKick && existsSync(pathKick)) {
            try {
              const fileContent = readFileSync(pathKick, 'utf8');
              if (fileContent.trim() !== '' && fileContent.trim() !== '[]') {
                const parsed = JSON.parse(fileContent);
                const tagData = Array.isArray(parsed) ? {} : parsed;
                antiTagAll = tagData[threadID] || false;
              }
            } catch (error) {
              antiTagAll = false;
            }
          }
          
          api.sendMessage(
            `[ TRẠNG THÁI ANTI ]\n\n1. Anti namebox: ${antiBoxname ? "ON" : "OFF"}\n2. Anti imagebox: ${antiImage ? "ON" : "OFF"}\n3. Anti nickname: ${antiNickname ? "ON" : "OFF"}\n4. Anti out: ${antiOut ? "ON" : "OFF"}\n5. Anti emoji: ${antiEmoji ? "ON" : "OFF"}\n6. Anti theme: ${antiTheme ? "ON" : "OFF"}\n7. Anti qtv: ${antiQtv ? "ON" : "OFF"}\n8. Anti join: ${antiJoin ? "ON" : "OFF"}\n9. Anti tagall: ${antiTagAll ? "ON" : "OFF"}`,
            threadID
          );
          break;
        }
        case "10": {
          const adminIDs = dataThread?.adminIDs || [];
          if (!adminIDs.some(item => item.id === api.getCurrentUserID()))
            return api.sendMessage('⚠️ Bot cần quyền quản trị viên để có thể thực thi lệnh', threadID, messageID);
          
          if (!pathKick || !existsSync(pathKick)) {
            return api.sendMessage("❎ Không tìm thấy file cấu hình anti tagall", threadID, messageID);
          }
          
          let tagData = {};
          try {
            const fileContent = readFileSync(pathKick, 'utf8');
            if (fileContent.trim() === '' || fileContent.trim() === '[]') {
              tagData = {};
            } else {
              const parsed = JSON.parse(fileContent);
              tagData = Array.isArray(parsed) ? {} : parsed;
            }
          } catch (parseError) {
            tagData = {};
          }
          
          const currentState = tagData[threadID] || false;
          tagData[threadID] = !currentState;
          
          writeFileSync(pathKick, JSON.stringify(tagData, null, 2), 'utf8');
          
          const message = `✅ Anti tag all: ${tagData[threadID] ? 'ON' : 'OFF'}`;
          api.sendMessage(message, threadID, messageID);
          break;
        }
        default: {
          return api.sendMessage(`❎ Số bạn chọn không có trong lệnh`, threadID);
        }
      }
    }
  } catch (error) {
    console.error('Error in anti onReply:', error);
    return api.sendMessage("❎ Đã xảy ra lỗi khi xử lý lệnh anti", threadID, messageID);
  }
};

this.onCall = async ({ api, event, args, permssion, Threads }) => {
  const { threadID, messageID, senderID } = event;
  const threadSetting = (await Threads.getData(String(threadID))).data || {};
  const prefix = threadSetting.hasOwnProperty("PREFIX") ? threadSetting.PREFIX : global.config.PREFIX;
  
  return api.sendMessage(`[ ANTI CONFIG ]\n\n1. Anti namebox - Cấm đổi tên nhóm\n2. Anti imagebox - Cấm đổi ảnh nhóm\n3. Anti nickname - Cấm đổi biệt danh\n4. Anti out - Cấm thành viên out\n5. Anti emoji - Cấm thay đổi emoji\n6. Anti theme - Cấm thay đổi chủ đề\n7. Anti qtv - Cấm thay quản trị viên\n8. Anti join - Cấm thêm thành viên\n9. Check trạng thái anti\n10. Anti tagall - Cấm tag all nhóm\n\nReply theo số để ON/OFF`, threadID, (error, info) => {
    if (error) {
      console.log(error);
      return api.sendMessage("❎ Đã xảy ra lỗi!", threadID);
    } else {
      global.Seiko.onReply.set(info.messageID, {
        commandName: this.config.name,
        messageID: info.messageID,
        author: senderID,
        permssion
      });
    }
  }, messageID);
};
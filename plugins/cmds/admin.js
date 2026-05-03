this.config = {
  name: "admin",
  alias: ["adm", "ad"],
  version: "1.1.0",
  role: 0,
  author: "Mirai Team & Mod by DongDev",
  info: "Quản lý admin bot",
  category: "Admin",
  guides: "{pn} [list/add/remove/addndh/qtvonly/echo/create/del/rename]",
  cd: 10,
  prefix: true
};

this.onLoad = function () {
  const { writeFileSync, existsSync } = require('fs-extra');
  const { resolve } = require("path");
  const path = resolve(process.cwd(), 'core', 'data', 'dataAdbox.json');
  
  if (!existsSync(path)) {
    const obj = { adminbox: {} };
    writeFileSync(path, JSON.stringify(obj, null, 4));
  } else {
    const data = require(path);
    if (!data.hasOwnProperty('adminbox')) data.adminbox = {};
    writeFileSync(path, JSON.stringify(data, null, 4));
  }
};

this.onReply = async function ({ api, event, args, msg, Reply, Users }) {
  const fs = require('fs');
  
  if (Reply.type === 'adminList') {
    const l = global.config.NDH || [];
    if (!l.includes(event.senderID)) {
      return msg.reply("Bạn không có quyền thực thi lệnh này");
    }
    
    if (!Reply.adm || !Array.isArray(Reply.adm)) {
      return msg.reply("Dữ liệu admin không hợp lệ");
    }
    
    const { configPath } = global.Seiko;
    var c = require(configPath);
    const r = event.body.trim();
    const adminMatch = r.match(/^del\s+([\d\s,]+)$/i);
    const ndhMatch = r.match(/^delndh\s+([\d\s,]+)$/i);
    
    if (adminMatch) {
      const i = adminMatch[1].split(/[\s,]+/).map(n => parseInt(n) - 1).filter(n => !isNaN(n) && n >= 0 && n < Reply.adm.length).sort((a, b) => b - a);
      
      if (i.length > 0) {
        const removedAdmins = [];
        
        // Xóa từ cuối lên để tránh lỗi index
        for (const index of i) {
          if (index >= 0 && index < Reply.adm.length) {
            const removedAdmin = Reply.adm.splice(index, 1)[0];
            if (removedAdmin) {
              removedAdmins.push(removedAdmin);
            }
          }
        }
        
        if (removedAdmins.length > 0) {
          const n = await Promise.all(removedAdmins.map(async (id) => {
            try {
              const u = await Users.getData(id);
              return `${u?.name || 'Unknown'} (ID: ${id})`;
            } catch (error) {
              console.error(`[ADMIN] Lỗi khi lấy thông tin admin ${id}:`, error);
              return `Unknown (ID: ${id})`;
            }
          }));
          
          msg.reply(`Đã xóa các admin:\n\n${n.join('\n')}`);
          
          // Cập nhật cả global và config
          global.config.ADMINBOT = Reply.adm;
          c.ADMINBOT = Reply.adm;
          
          fs.writeFileSync(configPath, JSON.stringify(c, null, 4), 'utf8');
          delete require.cache[require.resolve(configPath)];
        } else {
          msg.reply(`Không thể xóa admin nào`);
        }
      } else {
        msg.reply(`Không tìm thấy admin với số thứ tự: ${r}`);
      }
    } else if (ndhMatch && Reply.ndh) {
      const i = ndhMatch[1].split(/[\s,]+/).map(n => parseInt(n) - 1).filter(n => !isNaN(n) && n >= 0 && n < Reply.ndh.length).sort((a, b) => b - a);
      
      if (i.length > 0) {
        const removedNDHs = [];
        
        // Xóa từ cuối lên để tránh lỗi index
        for (const index of i) {
          if (index >= 0 && index < Reply.ndh.length) {
            const removedNDH = Reply.ndh.splice(index, 1)[0];
            if (removedNDH) {
              removedNDHs.push(removedNDH);
            }
          }
        }
        
        if (removedNDHs.length > 0) {
          const n = await Promise.all(removedNDHs.map(async (id) => {
            try {
              const u = await Users.getData(id);
              return `${u?.name || 'Unknown'} (ID: ${id})`;
            } catch (error) {
              console.error(`[ADMIN] Lỗi khi lấy thông tin NDH ${id}:`, error);
              return `Unknown (ID: ${id})`;
            }
          }));
          
          msg.reply(`Đã xóa các NDH:\n\n${n.join('\n')}`);
          
          // Cập nhật cả global và config
          global.config.NDH = Reply.ndh;
          c.NDH = Reply.ndh;
          
          fs.writeFileSync(configPath, JSON.stringify(c, null, 4), 'utf8');
          delete require.cache[require.resolve(configPath)];
        } else {
          msg.reply(`Không thể xóa NDH nào`);
        }
      } else {
        msg.reply(`Không tìm thấy NDH với số thứ tự: ${r}`);
      }
    }
  }
};

this.onCall = async function ({ api, event, args, Threads, Users, msg, permission }) {
  const content = args.slice(1, args.length);
  const { threadID, messageID, mentions, senderID } = event;
  const fs = require('fs');
  const { configPath } = global.Seiko;
  const { ADMINBOT, NDH } = global.config;
  const { writeFileSync } = require('fs-extra');
  const prefix = (global.data.threadData.get(threadID) || {}).PREFIX || global.config.PREFIX;
  const mention = Object.keys(mentions);
  const allowedUserIDs = global.config.NDH.map(id => id.toString());
  const senderIDStr = senderID.toString();
  
  delete require.cache[require.resolve(configPath)];
  var config = require(configPath);
  
  if (args.length == 0) {
    return msg.reply(`[ ADMIN CONFIG ]\n\n${prefix}admin add - Thêm admin\n${prefix}admin remove - Xóa admin\n${prefix}admin addndh - Thêm NDH\n${prefix}admin list - Xem danh sách\n${prefix}admin qtvonly - Bật/tắt chế độ QTV\n${prefix}admin echo - Bot trả về text\n${prefix}admin create - Tạo file command\n${prefix}admin del - Xóa file command\n${prefix}admin rename - Đổi tên file\n\nHDSD: ${prefix}admin + [lệnh]`);
  }
  
  switch (args[0]) {
    case "list":
    case "l":
    case "-l": {
      const listAdmin = ADMINBOT || config.ADMINBOT || [];
      const listNDH = NDH || config.NDH || [];
      
      if (!Array.isArray(listAdmin)) {
        return msg.reply("Dữ liệu admin không hợp lệ!");
      }
      
      // Lấy thông tin NDH
      const ndhInfo = await Promise.all(listNDH.map(async (id, index) => {
        try {
          const userData = await Users.getData(id);
          const name = userData?.name || 'Unknown';
          return `${index + 1}. ${name}\n🔗 Link: fb.com/${id}`;
        } catch (error) {
          console.error(`[ADMIN] Lỗi khi lấy thông tin NDH ${id}:`, error);
          return `${index + 1}. Unknown (ID: ${id})\n🔗 Link: fb.com/${id}`;
        }
      }));
      
      // Lấy thông tin Admin Bot
      const adminInfo = await Promise.all(listAdmin.map(async (id, index) => {
        try {
          const userData = await Users.getData(id);
          const name = userData?.name || 'Unknown';
          return `${index + 1}. ${name}\n🔗 Link: fb.com/${id}`;
        } catch (error) {
          console.error(`[ADMIN] Lỗi khi lấy thông tin admin ${id}:`, error);
          return `${index + 1}. Unknown (ID: ${id})\n🔗 Link: fb.com/${id}`;
        }
      }));
      
      const ndhText = ndhInfo.filter(Boolean).join('\n') || 'Không có NDH nào';
      const adminText = adminInfo.filter(Boolean).join('\n') || 'Không có admin nào';
      
      msg.reply(`[ NDH ]\n${ndhText}\n\n[ ADMIN BOT ]\n${adminText}\n\nReply del + stt để xóa admin\nReply delndh + stt để xóa NDH`, (err, info) => {
        if (!err && info) {
          global.Seiko.onReply.set(info.messageID, {
            commandName: this.config.name,
            messageID: info.messageID,
            author: event.senderID,
            adm: listAdmin,
            ndh: listNDH,
            type: 'adminList'
          });
        }
      });
      break;
    }
    
    case "add": {
      const input = args.slice(1).join(' ');
      const id = Object.keys(event.mentions).length > 0 ? 
        Object.keys(event.mentions)[0] : 
        (input && !isNaN(input) ? input : 
        (event.type == "message_reply" ? event.messageReply.senderID : null));

      if (!allowedUserIDs.includes(senderIDStr)) {
        return msg.reply(`Cần quyền admin chính để thực hiện lệnh`);
      }
      
      if (!id) {
        return msg.reply("❎ Vui lòng nhập ID, mention hoặc reply tin nhắn");
      }
      
      if (id && !isNaN(id)) {
        const targetID = id;
        
        // Kiểm tra duplicate admin
        if (ADMINBOT.includes(targetID) || config.ADMINBOT.includes(targetID)) {
          return msg.reply(`Người dùng này đã là admin rồi!`);
        }
        
        // Kiểm tra không được thêm chính mình
        if (targetID === senderID) {
          return msg.reply(`Không thể thêm chính mình làm admin!`);
        }
        
        try {
          // Kiểm tra config.ADMINBOT có tồn tại không
          if (!config.ADMINBOT) {
            config.ADMINBOT = [];
          }
          if (!Array.isArray(config.ADMINBOT)) {
            config.ADMINBOT = [];
          }
          
          ADMINBOT.push(targetID);
          config.ADMINBOT.push(targetID);
          
          const userData = await Users.getData(targetID);
          const name = userData?.name || 'Unknown';
          
          writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
          delete require.cache[require.resolve(configPath)];
          
          return msg.reply(`[ ADD ADMIN ]\n\nĐã thêm admin:\nName: ${name}\nLink: fb.com/${targetID}`, threadID, messageID);
        } catch (error) {
          console.error('[ADMIN] Lỗi khi thêm admin:', error);
          return msg.reply(`Lỗi khi thêm admin: ${error.message}`);
        }
      } else {
        return global.utils.throwError(this.config.name, threadID, messageID);
      }
      break;
    }

    case "addndh": {
      const input = args.slice(1).join(' ');
      const id = Object.keys(event.mentions).length > 0 ? 
        Object.keys(event.mentions)[0] : 
        (input && !isNaN(input) ? input : 
        (event.type == "message_reply" ? event.messageReply.senderID : null));

      // Chỉ NDH hiện tại mới có thể thêm NDH mới
      if (!allowedUserIDs.includes(senderIDStr)) {
        return msg.reply(`Cần quyền NDH để thực hiện lệnh`);
      }
      
      if (!id) {
        return msg.reply("❎ Vui lòng nhập ID, mention hoặc reply tin nhắn");
      }
      
      if (id && !isNaN(id)) {
        const targetID = id;
        
        // Kiểm tra duplicate NDH
        if (NDH.includes(targetID) || config.NDH.includes(targetID)) {
          return msg.reply(`Người dùng này đã là NDH rồi!`);
        }
        
        // Kiểm tra không được thêm chính mình
        if (targetID === senderID) {
          return msg.reply(`Không thể thêm chính mình làm NDH!`);
        }
        
        try {
          // Kiểm tra config.NDH có tồn tại không
          if (!config.NDH) {
            config.NDH = [];
          }
          if (!Array.isArray(config.NDH)) {
            config.NDH = [];
          }
          
          // Thêm vào global và config
          global.config.NDH.push(targetID);
          config.NDH.push(targetID);
          
          const userData = await Users.getData(targetID);
          const name = userData?.name || 'Unknown';
          
          writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
          delete require.cache[require.resolve(configPath)];
          
          return msg.reply(`[ ADD NDH ]\n\nĐã thêm NDH:\nName: ${name}\nLink: fb.com/${targetID}`, threadID, messageID);
        } catch (error) {
          console.error('[ADMIN] Lỗi khi thêm NDH:', error);
          return msg.reply(`Lỗi khi thêm NDH: ${error.message}`);
        }
      } else {
        return global.utils.throwError(this.config.name, threadID, messageID);
      }
      break;
    }

    case "remove":
    case "rm":
    case "delete": {
      const input = args.slice(1).join(' ');
      const id = Object.keys(event.mentions).length > 0 ? 
        Object.keys(event.mentions)[0] : 
        (input && !isNaN(input) ? input : 
        (event.type == "message_reply" ? event.messageReply.senderID : null));

      if (!allowedUserIDs.includes(senderIDStr)) {
        return msg.reply(`Cần quyền admin chính để thực hiện lệnh`);
      }
      
      if (!id) {
        return msg.reply("❎ Vui lòng nhập ID, mention hoặc reply tin nhắn");
      }

      if (id && !isNaN(id)) {
        const targetID = id;
        
        // Kiểm tra không được xóa chính mình
        if (targetID === senderID) {
          return msg.reply(`Không thể xóa chính mình khỏi danh sách admin!`);
        }
        
        const index = config.ADMINBOT.findIndex(item => item.toString() === targetID);

        if (index !== -1) {
          try {
            // Tìm index trong ADMINBOT global
            const globalIndex = ADMINBOT.findIndex(item => item.toString() === targetID);
            if (globalIndex !== -1) {
              ADMINBOT.splice(globalIndex, 1);
            }
            
            config.ADMINBOT.splice(index, 1);
            const userData = await Users.getData(targetID);
            const name = userData?.name || 'Unknown';
            
            writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
            delete require.cache[require.resolve(configPath)];
            
            return msg.reply(`[ REMOVE ADMIN ]\n\nĐã gỡ admin:\nName: ${name}\nLink: fb.com/${targetID}`);
          } catch (error) {
            console.error('[ADMIN] Lỗi khi xóa admin:', error);
            return msg.reply(`Lỗi khi xóa admin: ${error.message}`);
          }
        } else {
          return msg.reply(`Người dùng không phải là admin`);
        }
      } else {
        return global.utils.throwError(this.config.name, threadID, messageID);
      }
      break;
    }

    case 'box':
    case 'qtvonly': {
      const { resolve } = require("path");
      const pathData = resolve(process.cwd(), 'core', 'data', 'dataAdbox.json');
      
      let database, adminbox;
      try {
        database = require(pathData);
        adminbox = database.adminbox || {};
      } catch (error) {
        console.error('[ADMIN] Lỗi khi đọc dataAdbox.json:', error);
        return msg.reply('Lỗi khi đọc dữ liệu cấu hình nhóm');
      }
      
      const dataThread = (await Threads.getData(event.threadID)).threadInfo;
      const isAdmin = dataThread.adminIDs.some(item => item.id == senderID);
      const isBotAdmin = global.config.ADMINBOT.includes(senderID);
      const isNDH = global.config.NDH.includes(senderID);
      
      if (!isAdmin && !isBotAdmin && !isNDH) {
         return msg.reply('❎ Bạn không đủ quyền hạn để sử dụng tính năng này!');
      }
      
      if (adminbox[threadID] == true) {
        adminbox[threadID] = false;
        msg.reply("Tắt chế độ quản trị viên, tất cả thành viên có thể sử dụng bot");
      } else {
        adminbox[threadID] = true;
        msg.reply("Kích hoạt chế độ quản trị viên, chỉ quản trị viên mới có thể sử dụng bot");
      }
      writeFileSync(pathData, JSON.stringify(database, null, 4));
      break;
    }
    
    case 'only':
    case '-o': {
      if (permission < 3) return msg.reply("❎ Bạn không có quyền sử dụng lệnh này");
      if (config.adminOnly == false) {
        config.adminOnly = true;
        api.sendMessage("Bật chế độ ADMIN ONLY", threadID, messageID);
      } else {
        config.adminOnly = false;
        api.sendMessage("Tắt chế độ ADMIN ONLY", threadID, messageID);
      }
      writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf8');
      break;
    }
    
    case 'echo': {
      const input = args.join(" ");
      const spaceIndex = input.indexOf(' ');

      if (spaceIndex !== -1) {
        const textAfterFirstWord = input.substring(spaceIndex + 1).trim();
        return api.sendMessage(textAfterFirstWord, event.threadID);
      }
      break;
    }
    
    case 'offbot': {
      if (!allowedUserIDs.includes(senderIDStr)) {
        return msg.reply(`Cần quyền admin chính để thực hiện lệnh`);
      }
      msg.reply("Tắt bot...", () => process.exit(0));
      break;
    }
    
    case 'del': {
      if (!allowedUserIDs.includes(senderIDStr)) {
        return msg.reply(`Cần quyền admin chính để thực hiện lệnh`);
      }
      const cmdname = args.slice(1).join(' ');
      if (!cmdname) return msg.reply(`Vui lòng cung cấp tên lệnh cần xoá`);
      const filePath = `${__dirname}/${cmdname}.js`;
      fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
          return msg.reply(`Lệnh ${cmdname} không tồn tại`);
        }
        fs.unlink(filePath, (err) => {
          if (err) return msg.reply(`Xoá file ${cmdname}.js thất bại: ${err.message}`);
          return msg.reply(`Đã xoá file ${cmdname}.js thành công`);
        });
      });
      break;
    }
    
    case 'create': {
      if (!allowedUserIDs.includes(senderIDStr)) {
        return api.sendMessage(`Cần quyền admin chính để thực hiện lệnh`, event.threadID, event.messageID);
      }
      if (args.slice(1).length === 0) {
        return api.sendMessage("Vui lòng đặt tên cho file của bạn", event.threadID);
      }
      const commandName = args.slice(1).join(' ');
      const filePath = `${__dirname}/${commandName}.js`;

      if (fs.existsSync(filePath)) {
        return api.sendMessage(`File ${commandName}.js đã tồn tại từ trước`, event.threadID, event.messageID);
      }
      try {
        // Kiểm tra file example.js có tồn tại không
        const examplePath = `${__dirname}/example.js`;
        if (!fs.existsSync(examplePath)) {
          return api.sendMessage(`File example.js không tồn tại!`, event.threadID, event.messageID);
        }
        
        fs.copyFileSync(examplePath, filePath);
        api.sendMessage(`Đã tạo thành công file "${commandName}.js"`, event.threadID, event.messageID);
      } catch (error) {
        console.error('[ADMIN] Lỗi khi tạo file:', error);
        api.sendMessage(`Đã xảy ra lỗi khi tạo file: ${error.message}`, event.threadID, event.messageID);
      }
      break;
    }
    
    case 'rename': {
      if (!allowedUserIDs.includes(senderIDStr)) {
         return api.sendMessage(`Cần quyền admin chính để thực hiện lệnh`, event.threadID, event.messageID);
      }
      const renameArgs = args.slice(1).join(' ').split('=>');    
      if (renameArgs.length !== 2) {
         return api.sendMessage(`Vui lòng nhập đúng định dạng [tên mdl] => [tên muốn đổi]`, event.threadID, event.messageID);
      }
      const oldName = renameArgs[0].trim();
      const newName = renameArgs[1].trim();
      
      // Kiểm tra tên file hợp lệ
      if (!oldName || !newName) {
        return api.sendMessage(`Tên file không được để trống!`, event.threadID, event.messageID);
      }
      
      // Kiểm tra ký tự đặc biệt
      const invalidChars = /[<>:"/\\|?*]/;
      if (invalidChars.test(oldName) || invalidChars.test(newName)) {
        return api.sendMessage(`Tên file chứa ký tự không hợp lệ!`, event.threadID, event.messageID);
      }
      
      const oldPath = `${__dirname}/${oldName}.js`;
      const newPath = `${__dirname}/${newName}.js`;
      
      // Kiểm tra file cũ có tồn tại không
      if (!fs.existsSync(oldPath)) {
        return api.sendMessage(`File ${oldName}.js không tồn tại!`, event.threadID, event.messageID);
      }
      
      // Kiểm tra file mới đã tồn tại chưa
      if (fs.existsSync(newPath)) {
        return api.sendMessage(`File ${newName}.js đã tồn tại!`, event.threadID, event.messageID);
      }
      
      fs.rename(oldPath, newPath, function (err) {
          if (err) {
            return api.sendMessage(`Lỗi khi đổi tên file: ${err.message}`, event.threadID, event.messageID);
          }
          return api.sendMessage(`Đã đổi tên file ${oldName}.js thành ${newName}.js`, event.threadID, event.messageID);
        });
     break;
   }

    // Các trường hợp khác
    default: {
      return global.utils.throwError(this.config.name, threadID, messageID);
    }
  };
};
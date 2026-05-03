const axios = require('axios');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

this.config = {
  name: 'note',
  alias: ['ghichu', 'note'],
  version: '0.0.3',
  role: 3, // Admin
  author: 'DC-Nam & Satoru',
  info: 'Quản lý file note online - Upload/Downloadd',
  category: 'Admin',
  guides: '[tên file] [url] hoặc [tên file] để export',
  cd: 3,
  prefix: true
};

this.onCall = async function({ api, event, args }) {
  const name = this.config.name;
  const url = event?.messageReply?.args?.[0] || args[1];
  const filepath = `${__dirname}/${args[0]}`;
  const send = (msg) =>
    new Promise((r) => api.sendMessage(msg, event.threadID, (err, info) => r(info), event.messageID));

  try {
    if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
      const info = await send(`🔗 File đích: ${filepath}\n\n👉 Reaction tin nhắn này để xác nhận **ghi đè** nội dung file từ URL đã cung cấp.`);
      global.Seiko.onReaction.set(info.messageID, {
        commandName: name,
        messageID: info.messageID,
        author: event.senderID,
        action: 'confirm_replace_content',
        path: filepath,
        url
      });
      return;
    }
    if (!fs.existsSync(filepath)) {
      return send(`❎ Đường dẫn file không tồn tại để export: ${filepath}`);
    }

   const id = uuidv4();
   const editUrl = `https://tk-note.up.railway.app/note/${id}`;// nhows ghi dungs cho t dcu m
   const fileContent = fs.readFileSync(filepath, 'utf8');

   await axios.put(editUrl, fileContent, {
     headers: { 'content-type': 'text/plain; charset=utf-8' }
   });

   const info = await send(
     `📤 EXPORT THÀNH CÔNG\n\n📂 File: ${args[0]}\n✏️ Edit: ${editUrl}\n\n🔧 Chỉnh sửa code trên web\n👆 React để import về file`
   );

  global.Seiko.onReaction.set(info.messageID, {
    commandName: name,
    messageID: info.messageID,
    author: event.senderID,
    action: 'confirm_replace_content',
    path: filepath,
    url: editUrl
  });
  } catch (e) {
    console.error(e);
    send(`❎ Lỗi: ${e.toString()}`);
  }
};

this.onReaction = async function({ api, event, Reaction }) {
  try {
    if (!event.userID || !Reaction || event.userID != Reaction.author) return;

    const send = (msg) =>
      new Promise((r) => api.sendMessage(msg, event.threadID, (err, info) => r(info), event.messageID));

     const { action, path, url, messageID } = Reaction;

     if (action === 'confirm_replace_content') {
       try {
         // Dùng edit URL trực tiếp
         const response = await axios.get(url, {
           responseType: 'text',
           headers: { 
             'User-Agent': 'HaruBot-V6-Note-Manager',
             'Accept': 'text/plain,*/*'
           },
           timeout: 15000
         });

         const content = response.data;
         if (!content || content.length === 0) {
           await send(`🚫 URL không có nội dung\n\nVui lòng chỉnh sửa code trên web trước khi import`);
           if (global.Seiko?.onReaction?.delete) global.Seiko.onReaction.delete(messageID);
           return;
         }

         fs.writeFileSync(path, content, 'utf8');
         const fileSize = (content.length / 1024).toFixed(1);
         
         await send(`✅ IMPORT THÀNH CÔNG\n\n📂 File: ${require('path').basename(path)}\n📊 Size: ${fileSize} KB\n✏️ Từ edit URL`);

         if (global.Seiko?.onReaction?.delete) global.Seiko.onReaction.delete(messageID);
         if (typeof api.unsendMessage === 'function' && messageID) {
           setTimeout(() => api.unsendMessage(messageID), 3000);
         }
       } catch (error) {
         console.error('[NOTE] Import Lỗi:', error.message);
         await send(`🚨 Lỗi import: ${error.message}`);
       }
     }
  } catch (e) {
    console.error(e);
    api.sendMessage(`❎ Lỗi: ${e.toString()}`, event.threadID, event.messageID);
  }
};

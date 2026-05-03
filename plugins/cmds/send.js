this.config = {
  name: "send",
  alias: ["sendnoti"],
  version: "1.2.9",
  role: 2,
  author: "TruongMini",
  info: "Gửi tin nhắn đến tất cả nhóm",
  category: "Admin",
  guides: "[]",
  cd: 5,
  prefix: true
};
const fs = require('fs');
const request = require('request');
let atmDir = [];
const getAtm = (atm, body) => new Promise(async (resolve) => {
  let msg = {},
    attachment = [];
  msg.body = body;
  for (let eachAtm of atm) {
    await new Promise(async (resolve) => {
      try {
        let response = await request.get(eachAtm.url),
          pathName = response.uri.pathname,
          ext = pathName.substring(pathName.lastIndexOf(".") + 1),
          path = __dirname + `/cache/${eachAtm.filename}.${ext}`
        response
          .pipe(fs.createWriteStream(path))
          .on("close", () => {
            attachment.push(fs.createReadStream(path));
            atmDir.push(path);
            resolve();
          })
      } catch (e) {
        console.log(e);
      }
    })
  }
  msg.attachment = attachment;
  resolve(msg);
})

this.onReply = async function ({
  api,
  event,
  Reply,
  Users,
  Threads
}) {
  const {
    threadID,
    messageID,
    senderID,
    body
  } = event;
  let name = await Users.getNameUser(senderID);
  switch (Reply.type) {
    case "sendnoti": {
      let text = `⩺ Phản hồi từ người dùng\n\n⩺ Nội dung: ${body}\n\n⩺ Từ: ${name}\n⩺ Nhóm: ${(await Threads.getInfo(threadID)).threadName || "Unknow"}\n⩺ Reply (phản hồi) tin nhắn để trả lời`;
      if (event.attachments.length > 0) text = await getAtm(event.attachments, `⩺ Phản hồi từ người dùng\n\n⩺ Nội dung: ${body}\n\n⩺ Từ: ${name}\n⩺ Nhóm ${(await Threads.getInfo(threadID)).threadName || "Unknow"}\n⩺ Reply (phản hồi) tin nhắn để trả lời`);
      api.sendMessage(text, Reply.threadID, (err, info) => {
        atmDir.forEach(each => fs.unlinkSync(each))
        atmDir = [];

        global.Seiko.onReply.push({
          name: this.config.name,
          type: "reply",
          messageID: info.messageID,
          messID: messageID,
          threadID
        })
      });
      break;
    }
    case "reply": {
      let text = `⩺ Phản hồi từ Admin\n\n⩺ Nội dung: ${body}\n\n⩺ Từ Admin: ${await Users.getNameUser(senderID)}\n⩺ Reply (phản hồi) tin nhắn để trả lời`;
      if (event.attachments.length > 0) text = await getAtm(event.attachments, `⩺ Phản hồi từ Admin\n\n⩺ Nội dung: ${body}\n\n⩺ Từ Admin: ${await Users.getNameUser(senderID)}\n⩺ Reply (phản hồi) tin nhắn để trả lời`);
      api.sendMessage(text, Reply.threadID, (err, info) => {
        atmDir.forEach(each => fs.unlinkSync(each))
        atmDir = [];
        global.Seiko.onReply.push({
          name: this.config.name,
          type: "sendnoti",
          messageID: info.messageID,
          threadID
        })
      }, Reply.messID);
      break;
    }
  }
}
this.onCall = async function ({
  api,
  event,
  args,
  Users,
  permssion
}) {
  if (permssion < 2) return;
  const {
    threadID,
    messageID,
    senderID,
    messageReply
  } = event;
  if (!args[0]) return api.sendMessage("Please input message", threadID);
  let allThread = global.data.allThreadID || [];
  let can = 0,
    canNot = 0;
  let text = `[ Sakura BOT ]\n⩺ Thông báo từ Admin\n\n⩺ Nội dung: ${args.join(" ")}\n\n⩺ Từ Admin: ${await Users.getNameUser(senderID)}\n⩺ Reply (phản hồi) tin nhắn để gửi về admin`;
  if (event.type == "message_reply") text = await getAtm(messageReply.attachments, `[ HARU BOT ]\n⩺ Thông báo từ Admin\n\n⩺ Nội dung: ${args.join(" ")}\n\n⩺ Từ Admin: ${await Users.getNameUser(senderID)}\n⩺ Reply (phản hồi) tin nhắn để gửi về admin`);
  await new Promise(resolve => {
    allThread.forEach((each) => {
      try {
        api.sendMessage(text, each, (err, info) => {
          if (err) {
            canNot++;
          } else {
            can++;
            atmDir.forEach(each => fs.unlinkSync(each))
            atmDir = [];
            global.Seiko.onReply.push({
              name: this.config.name,
              type: "sendnoti",
              messageID: info.messageID,
              messID: messageID,
              threadID
            })
            resolve();
          }
        })
      } catch (e) {
        console.log(e)
      }
    })
  })
  api.sendMessage(`✅ Đã gửi tin nhắn đến tất cả nhóm`, threadID);
}
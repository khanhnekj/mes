this.config = {
  name: "setprefix",
  alias: ["setprefix"],
  version: "2.0.0",
  role: 1,
  author: "DongDev",
  info: "Đặt lại prefix của nhóm",
  category: "Quản trị viên", 
  guides: " {pn} [prefix/reset]",
  cd: 5,
  prefix: true
};

this.onReaction = async function({ api, event, Threads, Reaction }) {
  try {
    if (!event.userID || !Reaction || event.userID != Reaction.author) return;
    const { threadID, messageID } = event;

    const threadData = await Threads.getData(String(threadID));
    const data = threadData.data || {};

    const prefix = Reaction.PREFIX;
    data["PREFIX"] = prefix;
    await Threads.setData(threadID, { data });
    global.data.threadData.set(String(threadID), data);

    api.unsendMessage(Reaction.messageID);

    const uid = api.getCurrentUserID();
    api.changeNickname(`『 ${prefix} 』 ⪼ ${global.config.BOTNAME}`, threadID, uid);

    return api.sendMessage(`☑️ Đã thay đổi prefix của nhóm thành: ${prefix}`, threadID, messageID);
  } catch (e) {
    console.error(e);
    return api.sendMessage("❌ Đã có lỗi xảy ra khi thực hiện thay đổi prefix", event.threadID, event.messageID);
  }
};

this.onCall = async ({ api, event, args, Threads }) => {
  if (typeof args[0] === "undefined")
    return api.sendMessage(`⚠️ Vui lòng nhập prefix mới để thay đổi prefix của nhóm`, event.threadID, event.messageID);

  const prefix = args[0].trim();
  if (!prefix)
    return api.sendMessage(`⚠️ Vui lòng nhập prefix mới để thay đổi prefix của nhóm`, event.threadID, event.messageID);

  if (prefix === "reset") {
    const threadData = await Threads.getData(event.threadID);
    const data = threadData.data || {};

    data["PREFIX"] = global.config.PREFIX;
    await Threads.setData(event.threadID, { data });
    global.data.threadData.set(String(event.threadID), data);

    const uid = api.getCurrentUserID();
    api.changeNickname(`『 ${global.config.PREFIX} 』 ⪼ ${global.config.BOTNAME}`, event.threadID, uid);

    return api.sendMessage(`☑️ Đã reset prefix về mặc định: ${global.config.PREFIX}`, event.threadID, event.messageID);
  } else {
    api.sendMessage(
      `📝 Bạn đang yêu cầu set prefix mới: ${prefix}\n👉 Reaction tin nhắn này để xác nhận`,
      event.threadID,
      (error, info) => {
        if (error) return api.sendMessage("❌ Đã có lỗi xảy ra", event.threadID, event.messageID);
        global.Seiko.onReaction.set(info.messageID, {
          commandName: "setprefix",
          messageID: info.messageID,
          author: event.senderID,
          PREFIX: prefix
        });
      },
      event.messageID
    );
  }
};

this.onEvent = async function ({ api, event, Threads }) {
  const prefix = ((await Threads.getData(event.threadID)).data || {}).PREFIX || global.config.PREFIX;
  if (event.body && event.body.toLowerCase() === "prefix") {
    return api.sendMessage({
      body: `📌 Prefix của nhóm: ${prefix}`,
      attachment: global.Seiko.animeQueues.splice(0, 1)
    }, event.threadID, event.messageID);
  }
};
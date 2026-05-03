this.config = {
  name: "run",
  alias: ['run'],
  version: "1.0.2",
  role: 2,
  author: "Quất",
  info: "running shell",
  category: "Admin",
  guides: "[Script]",
  cd: 5,
  prefix: true
};
this.onCall = async ({ api, apis, tools, client, msg, ThreadBans, UserBans, event, args, Threads, Users, Currencies, models, permssion }) => {
  let r = require, [axios, fs, { log }] = [r('axios'), r('fs'), console],
    tpo = a => typeof a == "object" && Object.keys(a).length != 0 ? JSON.stringify(a, null, 4) : ['number', 'boolean'].includes(typeof a) ? a.toString() : a,
    send = a => api.sendMessage(tpo(a), event.threadID, event.messageID)
    let mocky = async a => send((await axios.post("https://api.mocky.io/api/mock", {
    status: 200,
    content: tpo(a),
    content_type: 'application/json',
    charset: 'UTF-8',
    secret: 'Quất',
    expiration: 'never'
  })).data.link)
  try {
    let { sendMessage, editMessage, getUserInfo: gI, getThreadInfo: gT, shareContact } = api, { threadID, messageID, senderID } = event;
    send(await eval(`(async() => { ${args.join(' ')} })()`, {
      api, event, args, Threads, Users, Currencies, tools, client, msg, apis, ThreadBans, UserBans, models, global, permssion, log, mocky, send, axios, fs, threadID, messageID, senderID, sendMessage }, true))
  } catch (e) {
    send(`⚠️ Lỗi: ${e.message}\n📝 Dịch: ${(await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=${encodeURIComponent(e.message)}`)).data[0][0][0]}`)
  }
}
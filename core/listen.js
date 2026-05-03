const { readdirSync, existsSync, readFileSync } = require('fs');
const { join, extname, basename, resolve } = require('path');
const logger = require('../func/utils/log.js');
const fs = require('fs');
module.exports = function ({ api, models, client, tools, cra, cv, cb, co, apis }) {
  const loadDBFiles = dir => Object.fromEntries(readdirSync(dir).filter(file => extname(file) === '.js').map(file => [basename(file, '.js'), require(join(dir, file))({ models, api, client })]));
  const { Users, Threads, Currencies, NsfwGroups, ThreadBans, UserBans } = loadDBFiles(join(__dirname, '../func/db'));
  const handleMessage = require('./handler/Message.js');
  const handler = require('./handler/handlerEvents.js');
  ['loadData', 'Schedule'].forEach(file => require(`./handler/${file}.js`)({ api, apis, Currencies, Threads, Users, client, cra, cv, cb }));
  require('./handler/upLoad.js')({ api, client });
  logger.log(`${cra(`[ BOTINFO ]`)} success!\n${co(`[ LOADED ] `)}${cra(`[ NAME ]:`)} ${!global.config.BOTNAME ? "Bot Messenger" : global.config.BOTNAME} \n${co(`[ LOADED ] `)}${cra(`[ BotID ]: `)}${api.getCurrentUserID()}\n${co(`[ LOADED ] `)}${cra(`[ PREFIX ]:`)} ${global.config.PREFIX}`, "LOADED");
  const eventHandlers = {
    message: ['onCall', 'onChat', 'onReply', 'onData', 'onDatabase'],
    message_reply: ['onCall', 'onChat', 'onReply', 'onData', 'onDatabase'],
    message_unsend: ['onCall', 'onChat', 'onReply', 'onData', 'onDatabase'],
    message_reaction: ['onReaction'],
  };
  return event => {
    const { logMessageType, type } = event;
    const { threadID, author, image, logMessageBody, logMessageData } = event;
    const data_anti = JSON.parse(fs.readFileSync(global.anti, "utf8"));
    const botID = api.getCurrentUserID();
    let form_mm_dd_yyyy = (input = '', split = input.split('/')) => `${split[1]}/${split[0]}/${split[2]}`;
    let prefix = (global.data.threadData.get(event.threadID) || {}).PREFIX || global.config.PREFIX;
    if ((event.body || '').startsWith(prefix) && event.senderID != api.getCurrentUserID() && !global.config.NDH.includes(event.senderID) && !global.config.ADMINBOT.includes(event.senderID)) {
      let thuebot;
      try {
        thuebot = JSON.parse(require('fs').readFileSync(process.cwd() + '/core/data/rent.json', 'utf-8'));
      } catch {
        thuebot = [];
      };
      let find_thuebot = thuebot.find($ => $.t_id == event.threadID);
      if (((global.data.threadData.get(event.threadID)?.PREFIX || global.config.PREFIX) + 'callad') != event.args[0]) {
        if (!find_thuebot) {
          return api.shareContact(`Nhóm của bạn chưa thuê bot, liên hệ Admin để thuê bot`, global.config.NDH[0], event.threadID);
        }
        if (new Date(form_mm_dd_yyyy(find_thuebot.time_end)).getTime() <= Date.now()) {
          return api.shareContact(`⚠️ Nhóm của bạn đã hết hạn thuê bot, liên hệ Admin để gia hạn`, global.config.NDH[0], event.threadID);
        }
      }
    }
    if (type === "change_thread_image") {
      Threads.getData(threadID).then(data => {
        const dataThread = data.threadInfo;
        const findAd = dataThread.adminIDs.find((el) => el.id === author);
        const findAnti = data_anti.boximage.find((item) => item.threadID === threadID);
        if (findAnti) {
          if (findAd || botID.includes(author)) {
            findAnti.url = dataThread.imageSrc;
            const jsonData = JSON.stringify(data_anti, null, 4);
            fs.writeFileSync(global.anti, jsonData);
          } else {
            tools.streamURL(findAnti.url, 'jpg').then(res => {
              api.sendMessage(`⚠️ Bạn không có quyền đổi ảnh nhóm`, threadID);
              api.changeGroupImage(res, threadID);
            });
          }
        }
      });
    }
    const params = { api, apis, client, models, Users, Threads, Currencies, NsfwGroups, ThreadBans, UserBans, tools };
    handleMessage({ api, event, client }).then(msg => {
      const eventParams = { ...params, msg };
      if (eventHandlers[type]) {
        eventHandlers[type].forEach(fn => {
          handler[fn](eventParams)({ event });
        });
      }
      if (type === 'message_reaction') {
        const iconPath = resolve(__dirname, 'data/iconUnsend.json');
        const iconData = existsSync(iconPath) ? JSON.parse(readFileSync(iconPath, 'utf-8')) : [];
        const group = iconData.find(i => i.groupId === event.threadID);
        if ((group?.iconUnsend === event.reaction || (iconData.status && iconData.icon === event.reaction)) &&
          event.senderID === api.getCurrentUserID() && event.messageID) {
          api.unsendMessage(event.messageID);
        }
      }
      if (logMessageType) {
        handler.handleEvent(eventParams)({ event });
        handler.onRefresh(eventParams)({ event });
      }
      handler.onEvent(eventParams)({ event });
    });
  };
};
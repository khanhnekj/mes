const crypto = require('crypto');
const os = require("os");
const { readdirSync } = require("fs-extra");
const { join } = require("path");
const logger = require("./log");

class Utils {
    static parseCookies(cookies) {
        return (cookies.includes('useragent=') ? cookies.split('useragent=')[0] : cookies)
            .split(';')
            .map(pair => {
                const [key, value] = pair.trim().split('=');
                return value !== undefined ? {
                    key,
                    value,
                    domain: "facebook.com",
                    path: "/",
                    hostOnly: false,
                    creation: new Date().toISOString(),
                    lastAccessed: new Date().toISOString()
                } : undefined;
            })
            .filter(Boolean);
    }

    static async loadPlugins({ api, models, client, tools, cra, cv, cb }) {
        const loadModules = (path, collection, disabledList, type) => {
            const items = readdirSync(path).filter(file => file.endsWith('.js') && !file.includes('example') && !disabledList.includes(file));
            let loadedCount = 0;
            for (const file of items) {
                try {
                    const item = require(join(path, file));
                    const { config, onCall, onLoad, onEvent, onChat } = item;
                    if (!config || !onCall || (type === 'commands' && !config.category)) {
                        throw new Error(`Lỗi định dạng trong ${type === 'commands' ? 'lệnh' : 'sự kiện'}: ${file}`);
                    }
                    if (global.Seiko[collection].has(config.name)) {
                        throw new Error(`Tên ${type === 'commands' ? 'lệnh' : 'sự kiện'} đã tồn tại: ${config.name}`);
                    }
                    if (config.envConfig) {
                        global.configModule[config.name] = global.configModule[config.name] || {};
                        global.config[config.name] = global.config[config.name] || {};
                        for (const key in config.envConfig) {
                            global.configModule[config.name][key] = global.config[config.name][key] || config.envConfig[key] || '';
                            global.config[config.name][key] = global.configModule[config.name][key];
                        }
                    }
                    if (onLoad) onLoad({ api, tools, models, client });
                    if (onEvent) client.onEvent.push(config.name);
                    if (onChat) client.onChat.push(config.name);
                    global.Seiko[collection].set(config.name, item);
                    loadedCount++;
                } catch (error) {
                    console.error(`Lỗi khi tải ${type === 'commands' ? 'lệnh' : 'sự kiện'} ${file}:`, error);
                }
            }
            return loadedCount;
        };
        
        const commandPath = join(process.cwd(), 'plugins', 'cmds');
        const eventPath = join(process.cwd(), 'plugins', 'events');
        const loadedCommandsCount = loadModules(commandPath, 'commands', global.config.commandDisabled, 'commands');
        const loadedEventsCount = loadModules(eventPath, 'events', global.config.eventDisabled, 'events');
        
        console.log(cv(`\n` + `●─BOTSTART─● `));
        logger.log(`${cra(`[ SUCCESS ]`)} Loaded ${cb(loadedCommandsCount)} commands and ${cb(loadedEventsCount)} events successfully`, "LOADED");
        logger.log(`${cra(`[ TIMESTART ]`)} Launch time: ${((Date.now() - global.Seiko.timeStart) / 1000).toFixed()}s`, "LOADED");
    }

    static throwError(command, threadID, messageID) {
        const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
        return global.Seiko.api.sendMessage(
            global.getText("utils", "throwError", 
            ((threadSetting.hasOwnProperty("PREFIX")) ? threadSetting.PREFIX : global.config.PREFIX), 
            command), 
            threadID, 
            messageID
        );
    }
}

module.exports = Utils;
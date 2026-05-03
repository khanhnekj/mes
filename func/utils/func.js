const crypto = require('crypto');
const os = require("os");
const { readdirSync, lstatSync } = require("fs-extra");
const { join } = require("path");
const logger = require("./log");
const fs = require('fs');

// Utility function để đảm bảo thư mục temp tồn tại
const ensureTempDir = () => {
    const tempDir = join(process.cwd(), 'func', 'temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
        logger.log('Đã tạo thư mục temp', 'SYSTEM');
    }
    return tempDir;
};

const utils = {
    parseCookies(cookies) {
        return (cookies.includes('useragent=') ? cookies.split('useragent=')[0] : cookies).split(';').map(pair => {
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
        }).filter(Boolean);
    },

    async loadPlugins({ api, models, client, tools, cra, cv, cb }) {
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
    },

    throwError(command, threadID, messageID) {
        const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
        return global.Seiko.api.sendMessage(global.getText("utils", "throwError", ((threadSetting.hasOwnProperty("PREFIX")) ? threadSetting.PREFIX : global.config.PREFIX), command), threadID, messageID);
    },

    cleanAnilistHTML(text) {
        return text
            .replace('<br>', '\n')
            .replace(/<\/?(i|em)>/g, '*')
            .replace(/<\/?b>/g, '**')
            .replace(/~!|!~/g, '||')
            .replace("&amp;", "&")
            .replace("&lt;", "<")
            .replace("&gt;", ">")
            .replace("&quot;", '"')
            .replace("&#039;", "'");
    },

    async downloadFile(url, path) {
        const { createWriteStream } = require('fs');
        const axios = require('axios');
        const response = await axios({
            method: 'GET',
            responseType: 'stream',
            url
        });
        const writer = createWriteStream(path);
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    },

    async getContent(url) {
        try {
            const axios = require("axios");
            const response = await axios({
                method: 'GET',
                url
            });
            return response;
        } catch (e) {
            return console.log(e);
        }
    },

    randomString(length) {
        var result = '';
        var characters = 'ABCDKCCzwKyY9rmBJGu48FrkNMro4AWtCkc1flmnopqrstuvwxyz';
        var charactersLength = characters.length || 5;
        for (var i = 0; i < length; i++) result += characters.charAt(Math.floor(Math.random() * charactersLength));
        return result;
    },

    AES: {
        encrypt(cryptKey, crpytIv, plainData) {
            var encipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(cryptKey), Buffer.from(crpytIv));
            var encrypted = encipher.update(plainData);
            encrypted = Buffer.concat([encrypted, encipher.final()]);
            return encrypted.toString('hex');
        },
        decrypt(cryptKey, cryptIv, encrypted) {
            encrypted = Buffer.from(encrypted, "hex");
            var decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(cryptKey), Buffer.from(cryptIv, 'binary'));
            var decrypted = decipher.update(encrypted);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            return String(decrypted);
        },
        makeIv() {
            return Buffer.from(crypto.randomBytes(16)).toString('hex').slice(0, 16);
        }
    },

    homeDir() {
        var returnHome, typeSystem;
        const home = process.env["HOME"];
        const user = process.env["LOGNAME"] || process.env["USER"] || process.env["LNAME"] || process.env["USERNAME"];

        switch (process.platform) {
            case "win32": {
                returnHome = process.env.USERPROFILE || process.env.HOMEDRIVE + process.env.HOMEPATH || home || null;
                typeSystem = "win32"
                break;
            }
            case "darwin": {
                returnHome = home || (user ? '/Users/' + user : null);
                typeSystem = "darwin";
                break;
            }
            case "linux": {
                returnHome = home || (process.getuid() === 0 ? '/root' : (user ? '/home/' + user : null));
                typeSystem = "linux"
                break;
            }
            default: {
                returnHome = home || null;
                typeSystem = "unknow"
                break;
            }
        }

        return [typeof os.homedir === 'function' ? os.homedir() : returnHome, typeSystem];
    },

    ensureTempDir
};

module.exports = utils;
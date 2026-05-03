this.config = {
    name: "cmd",
    alias: ["cmd"],
    version: "1.0.0",
    role: 3,
    author: "DongDev",
    info: "Quản lý/Kiểm soát toàn bộ module của bot",
    category: "Admin",
    guides: " {pn} [load/unload/loadAll/unloadAll/info] [tên module]",
    cd: 2,
    prefix: true
};
const loadCommand = ({ moduleList, threadID, messageID, client }) => {
    const { writeFileSync } = require('fs-extra');
    const { join } = require('path');
    const { api } = global.Seiko;
    const configPath = join(process.cwd(), 'func/config/config.main.json');
    const logger = require(join(process.cwd(), 'func/utils/log.js'));
    let errorList = [];
    delete require.cache[require.resolve(configPath)];
    let configValue = require(configPath);
    moduleList.forEach(nameModule => {
        try {
            const dirModule = join(__dirname, `${nameModule}.js`);
            delete require.cache[require.resolve(dirModule)];
            const command = require(dirModule);
            const { name, envConfig, category } = command.config || {};
            if (!category || !command.onCall) throw new Error('Module không đúng định dạng!');
            global.Seiko.commands.delete(nameModule);
            client.onEvent = client.onEvent.filter(info => info !== name);
            client.onChat = client.onChat.filter(info => info !== name);
            if (envConfig && typeof envConfig === 'object') {
                global.configModule[name] = global.configModule[name] || {};
                configValue[name] = configValue[name] || {};
                Object.entries(envConfig).forEach(([key, value]) => {
                    global.configModule[name][key] = configValue[name][key] ?? value ?? '';
                    configValue[name][key] = configValue[name][key] ?? value ?? '';
                });
                logger.log(`Loaded config ${name}`, 'LOADED');
            }
            command.onLoad?.({ api, configValue });
            if (command.onEvent) client.onEvent.push(name);
            if (command.onChat) client.onChat.push(name);
            const commandDisabled = [...global.config.commandDisabled, ...configValue.commandDisabled];
            if (commandDisabled.includes(`${nameModule}.js`)) {
                global.config.commandDisabled = global.config.commandDisabled.filter(cmd => cmd !== `${nameModule}.js`);
                configValue.commandDisabled = configValue.commandDisabled.filter(cmd => cmd !== `${nameModule}.js`);
            }
            global.Seiko.commands.set(name, command);
            logger.log(`Loaded command ${name}!`, 'LOADED');
        } catch (error) {
            console.log(error);
            errorList.push(`- ${nameModule} reason: ${error.message}`);
        }
    });
    const msg = errorList.length ? `❎ Những lệnh xảy ra sự cố khi load: ${errorList.join(' ')}` : `☑️ Đã tải thành công ${moduleList.length - errorList.length} lệnh`;
    api.sendMessage(msg, threadID, messageID);
    writeFileSync(configPath, JSON.stringify(configValue, null, 4), 'utf8');
};
const unloadModule = ({ moduleList, threadID, messageID, client }) => {
    const { writeFileSync } = require("fs-extra");
    const configPath = require.resolve(process.cwd() + '/func/config/config.main.json');
    const configValue = require(configPath);
    const { mainPath, api, commands } = global.Seiko;
    const logger = require(`${process.cwd()}/func/utils/log.js`);
    moduleList.forEach(nameModule => {
        commands.delete(nameModule);
        client.onEvent = client.onEvent.filter(item => item !== nameModule);
        client.onChat = client.onChat.filter(item => item !== nameModule);
        const moduleFile = `${nameModule}.js`;
        configValue.commandDisabled.push(moduleFile);
        global.config.commandDisabled.push(moduleFile);
        logger.log(`Unloaded command ${nameModule}!`, 'LOADED');
    });
    writeFileSync(configPath, JSON.stringify(configValue, null, 4), 'utf8');
    return api.sendMessage(`☑️ Đã hủy tải thành công ${moduleList.length} lệnh`, threadID, messageID);
};
this.onChat = async function({ api, event, Currencies, Users }) {
	var { threadID, senderID } = event;
	let exp = (await Currencies.getData(senderID)).exp;
	exp = exp += 1;
	if (isNaN(exp)) return;
	const lv1 = Math.floor((Math.sqrt(1 + (4 * exp / 3) + 1) / 2));
	const lv2 = Math.floor((Math.sqrt(1 + (4 * (exp + 1) / 3) + 1) / 2));
	if (lv2 > lv1 && lv2 != 1) {
	     const name = await Users.getData(senderID).name;
	     const namett = this.config.name;
	}
      await Currencies.setData(senderID, { exp });
      return;
}
this.onCall = function ({ event, args, api, client }) {
    const fs = require('fs');
    const path = require('path');
    const { readdirSync } = require("fs-extra");
    const { threadID, messageID } = event;
    const moduleList = args.slice(1);
    const sendMsg = (msg) => api.sendMessage(msg, threadID, messageID);
    switch (args[0]) {
        case "c":
        case "count":
            sendMsg(`📝 Hiện tại có ${global.Seiko.commands.size} lệnh có thể sử dụng`);
            break;
        case "l":
        case "load":
            if (!moduleList.length) return sendMsg("❎ Tên module không được phép bỏ trống");
            return loadCommand({ moduleList, threadID, messageID, client });
        case "lA":
        case "loadAll": {
            const files = readdirSync(__dirname).filter(file => file.endsWith(".js") && !file.includes('example')).map(item => item.replace(/\.js/g, ""));
            return loadCommand({ moduleList: files, threadID, messageID, client });
        }
        case "un":
        case "ul":
        case "unload":
            if (!moduleList.length) return sendMsg("❎ Tên module không được phép bỏ trống");
            return unloadModule({ moduleList, threadID, messageID, client });
        case "unAll":
        case "unloadAll": {
            const files = readdirSync(__dirname).filter(file => file.endsWith(".js") && !file.includes('example') && !file.includes("command")).map(item => item.replace(/\.js/g, ""));
            return unloadModule({ moduleList: files, threadID, messageID, client });
        }
        case "info": {
            const command = global.Seiko.commands.get(moduleList.join("") || "");
            if (!command) return sendMsg("❎ Module bạn nhập không tồn tại");
            const { name, version, role, author, cd } = command.config;
            sendMsg(`|› Tên lệnh: ${name.toUpperCase()}\n|› Tác giả: ${author}\n|› Phiên bản: ${version}\n|› Quyền hạn: ${role === 0 ? "Người dùng" : role === 1 ? "Quản trị viên" : "Admin Bot"}\n|› Thời gian chờ: ${cd} giây(s)\n──────────────────`);
            break;
        }
        default:
            return global.utils.throwError(this.config.name, threadID, messageID);
    }
};
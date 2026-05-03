this.config = {
    name: 'menu',
    alias: ["menu"],
    version: '1.1.1',
    role: 0,
    author: 'DC-Nam mod by DongDev',
    info: 'Xem danh sách nhóm lệnh, thông tin lệnh',
    category: 'Box chat',
    guides: '[...name commands|all]',
    cd: 5,
    prefix: true,
    envConfig: {
        autoUnsend: {
            status: true,
            timeOut: 60
        }
    }
};

const { autoUnsend = this.config.envConfig.autoUnsend } =
    global.config == undefined ? {} :
    global.config.menu == undefined ? {} :
    global.config.menu;

const { compareTwoStrings, findBestMatch } = require('string-similarity');
const { readFileSync, writeFileSync, existsSync } = require('fs-extra');

this.onCall = async function ({ api, event, args }) {
    const axios = require("axios");
    const moment = require("moment-timezone");
    const { sendMessage: send, unsendMessage: un } = api;
    const { threadID: tid, messageID: mid, senderID: sid } = event;
    const cmds = global.Seiko.commands;
    const isAdminOrNDH = global.config.ADMINBOT.includes(sid) || global.config.NDH.includes(sid);
    const time = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss || DD/MM/YYYY");

    if (args.length >= 1) {
        if (typeof cmds.get(args.join(' ')) == 'object') {
            const body = infoCmds(cmds.get(args.join(' ')).config);
            return send(body, tid, mid);
        } else {
            if (args[0] == 'all') {
                const data = Array.from(cmds.values()).filter(cmd => isAdminOrNDH || cmd.config.category.toLowerCase() !== 'admin');
                var txt = '', count = 0;
                for (const cmd of data) {
                    txt += `${++count}. ${cmd.config.name} | ${cmd.config.info}\n`;
                }
                txt += `\n⩺ Tự động gỡ tin nhắn sau: ${autoUnsend.timeOut}s`;
                return send(txt, tid, (a, b) => autoUnsend.status ? setTimeout(v1 => un(v1), 1000 * autoUnsend.timeOut, b.messageID) : '');
            } else {
                const cmdsValue = Array.from(cmds.values()).filter(cmd => isAdminOrNDH || cmd.config.category.toLowerCase() !== 'admin');
                const arrayCmds = cmdsValue.map(cmd => cmd.config.name);
                const similarly = findBestMatch(args.join(' '), arrayCmds);
                if (similarly.bestMatch.rating >= 0.3)
                    return send(`"${args.join(' ')}" là lệnh gần giống là "${similarly.bestMatch.target}" ?`, tid, mid);
            }
        }
    } else {
        // === MENU CHÍNH ===
        const data = commandsGroup(isAdminOrNDH);
        var txt = `[ MENU LỆNH ]\n\n`;
        let total = 0;
        for (let i = 0; i < data.length; i++) {
            const { category, commandsName } = data[i];
            total += commandsName.length;
            txt += `${i + 1}. ${category} (${commandsName.length} lệnh)\n`;
        }
        txt += `\n📊 Tổng số lệnh: ${total}`;
        txt += `\n💭 Reply (1-${data.length}) để xem chi tiết`;
        txt += `\n⏱️ Tự động gỡ sau: ${autoUnsend.timeOut}s`;

        return send(txt, tid, (a, b) => {
            global.Seiko.onReply.set(b.messageID, {
                commandName: 'menu',
                messageID: b.messageID,
                author: sid,
                'case': 'infoGr',
                data
            });
            if (autoUnsend.status)
                setTimeout(v1 => un(v1), 1000 * autoUnsend.timeOut, b.messageID);
        }, mid);
    }
};

this.onReply = async function ({ Reply: $, api, event }) {
    const { sendMessage: send, unsendMessage: un } = api;
    const { threadID: tid, messageID: mid, senderID: sid, args } = event;
    const axios = require("axios");
    const isAdminOrNDH = global.config.ADMINBOT.includes(sid) || global.config.NDH.includes(sid);
    if (sid != $.author) {
        return send(`Bạn không phải người dùng lệnh thì reply cái gì`, tid, mid);
    }
    switch ($.case) {
        case 'infoGr': {
            var data = $.data[(+args[0]) - 1];
            if (data == undefined) {
                const txt = `"${args[0]}" không nằm trong số thứ tự menu`;
                const msg = txt;
                return send(msg, tid, mid);
            }
            un($.messageID);
            var txt = `[ ${data.category.toUpperCase()} ]\n\n`,
                count = 0;
            for (const name of data.commandsName) {
                const cmdInfo = global.Seiko.commands.get(name).config;
                if (isAdminOrNDH || cmdInfo.category.toLowerCase() !== 'admin') {
                    txt += `${++count}. ${name}: ${cmdInfo.info}\n`;
                }
            }
            txt += `\n💭 Reply (1-${count}) để xem chi tiết`;
            txt += `\n⏱️ Tự động gỡ sau: ${autoUnsend.timeOut}s`;
            txt += `\n📘 Dùng ${prefix(tid)}help + tên lệnh để xem chi tiết cách sử dụng`;
            return send(txt, tid, (a, b) => {
                global.Seiko.onReply.set(b.messageID, {
                    commandName: 'menu',
                    messageID: b.messageID,
                    author: sid,
                    'case': 'infoCmds',
                    data: data.commandsName.filter(name => isAdminOrNDH || global.Seiko.commands.get(name).config.category.toLowerCase() !== 'admin')
                });
                if (autoUnsend.status)
                    setTimeout(v1 => un(v1), 1000 * autoUnsend.timeOut, b.messageID);
            }, mid);
        }
        case 'infoCmds': {
            var data = global.Seiko.commands.get($.data[(+args[0]) - 1]);
            if (typeof data != 'object') {
                const txt = `"${args[0]}" không nằm trong số thứ tự menu`;
                const msg = txt;
                return send(msg, tid, mid);
            }
            const { config = {} } = data || {};
            un($.messageID);
            const msg = infoCmds(config);
            return send(msg, tid, mid);
        }
        default:
    }
};

function commandsGroup(isAdminOrNDH) {
    const array = [],
        cmds = global.Seiko.commands.values();
    for (const cmd of cmds) {
        const { name, category } = cmd.config;
        if (isAdminOrNDH || category.toLowerCase() !== 'admin') {
            const find = array.find(i => i.category == category);
            !find ? array.push({ category, commandsName: [name] }) : find.commandsName.push(name);
        }
    }
    array.sort(sortCompare('commandsName'));
    return array;
}

function infoCmds(a) {
    return `[ INFO COMMAND ]\n\n⩺ Tên lệnh: ${a.name}\n⩺ Phiên bản: ${a.version}\n⩺ Quyền hạn: ${premssionTxt(a.role)}\n⩺ Tác giả: ${a.author}\n⩺ Mô tả: ${a.info}\n⩺ Thuộc nhóm: ${a.category}\n⩺ Cách dùng: ${a.guides}\n⩺ Thời gian chờ: ${a.cd} giây`;
}

function premssionTxt(a) {
    return a == 0 ? 'Thành Viên' : a == 1 ? 'Quản Trị Viên Nhóm' : a == 2 ? 'ADMINBOT' : 'Người Điều Hành';
}

function prefix(a) {
    const tidData = global.data.threadData.get(a) || {};
    return tidData.PREFIX || global.config.PREFIX;
}

function sortCompare(k) {
    return function (a, b) {
        return (a[k].length > b[k].length ? 1 : a[k].length < b[k].length ? -1 : 0) * -1;
    };
}
this.config = {
    name: "help",
    alias: ["help"],
    version: "1.1.1",
    role: 0,
    author: "DC-Nam mod by Niio-team",
    info: "Xem danh sách lệnh và info",
    category: "Box chat",
    guides: "[tên lệnh/all]",
    cd: 5,
    prefix: true
};

this.onCall = async function({ api, event, args, Threads, client }) {
    const { threadID: tid, messageID: mid, senderID: sid } = event;
    const cmds = global.Seiko.commands;
    const TIDdata = await Threads.getData(tid) || {};
    const prefix = TIDdata.PREFIX || global.config.PREFIX;
    const type = args[0] ? args[0].toLowerCase() : "";
    let msg = "";
    if (type === "all") {
        const commandsList = Array.from(cmds.values()).map((cmd, index) => {
            return `${index + 1}. ${cmd.config.name}\n📝 Mô tả: ${cmd.config.info}\n\n`;
        }).join('');
        return api.sendMessage(commandsList, tid, mid);
    }
    if (type) {
        let command = cmds.get(type) || Array.from(cmds.values()).find(cmd => cmd.config.name.toLowerCase() === type);
        if (!command) {
            const stringSimilarity = require('string-similarity');
            const commandName = type;
            const commandValues = [...cmds.keys()];
            const checker = stringSimilarity.findBestMatch(commandName, commandValues);
            command = cmds.get(checker.bestMatch.target);
            msg = `❎ Không tìm thấy lệnh '${commandName}' trong hệ thống, lệnh gần giống được tìm thấy: '${checker.bestMatch.target}'`;
            return api.sendMessage(msg, tid, mid);
        }
        const cmd = command.config;
        msg = `[ HƯỚNG DẪN SỬ DỤNG ]\n\n📜 Tên lệnh: ${cmd.name}\n🖋️ Tên khác: ${cmd.alias.join(", ")}\n🕹️ Phiên bản: ${cmd.version}\n🔑 Quyền Hạn: ${TextPr(cmd.role)}\n📝 Mô Tả: ${cmd.info}\n🏘️ Nhóm: ${cmd.category}\n📌 Cách Dùng: ${cmd.guides}\n⏳ Cooldowns: ${cmd.cd}s`;
        return api.sendMessage(msg, tid, mid);
    } else {
        const commandsArray = Array.from(cmds.values()).map(cmd => cmd.config);
        const array = [];
        commandsArray.forEach(cmd => {
            const { category, name: nameModule } = cmd;
            const find = array.find(i => i.cmdCategory == category);
            if (!find) {
                array.push({
                    cmdCategory: category,
                    nameModule: [nameModule]
                });
            } else {
                find.nameModule.push(nameModule);
            }
        });
        array.sort(S("nameModule"));
        array.forEach(cmd => {
            if (cmd.cmdCategory.toUpperCase() === 'ADMIN' && !client.config.ADMINBOT.includes(sid) && !client.config.NDH.includes(sid)) return;
            msg += `[ ${cmd.cmdCategory.toUpperCase()} ]\n📝 Tổng lệnh: ${cmd.nameModule.length} lệnh\n${cmd.nameModule.join(", ")}\n\n`;
        });
        msg += `🚀 Tổng lệnh: ${cmds.size} lệnh\n🔥 Tổng sự kiện: ${global.Seiko.events.size}\n${prefix}help + tên lệnh để xem chi tiết\n${prefix}help + all để xem tất cả lệnh`;
        return api.sendMessage(msg, tid, mid);
    }
}
function S(k) {
    return function(a, b) {
        return a[k].length < b[k].length ? 1 : -1;
    };
}
function TextPr(permission) {
    return permission == 0 ? "Thành Viên" : permission == 1 ? "Quản Trị Viên" : permission == 2 ? "Admin Bot" : "Toàn Quyền";
}
const logger = require(process.cwd() + "/func/utils/log.js");
const fs = require('fs-extra');

function getType(obj) {
    return Object.prototype.toString.call(obj).slice(8, -1);
}

const handler = {
    onCall({ apis, api, msg, models, Users, Threads, Currencies, client, NsfwGroups, ThreadBans, UserBans, tools }) {
        const fs = require("fs");
        const stringSimilarity = require('string-similarity');
        const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const logger = require(process.cwd() + "/func/utils/log.js");
        const moment = require("moment-timezone");
        return async function ({ event }) {
            const dateNow = Date.now();
            const time = moment.tz("Asia/Ho_Chi_minh").format("HH:MM:ss DD/MM/YYYY");
            const { allowInbox, PREFIX, ADMINBOT, NDH, DeveloperMode, adminOnly } = global.config;
            const { userBanned, threadBanned, threadInfo, threadData, commandBanned } = global.data;
            const { commands, cd } = global.Seiko;
            var { body, senderID, threadID, messageID } = event;
            senderID = String(senderID);
            threadID = String(threadID);
            const ten = await Users.getNameUser(event.senderID);
            const threadSetting = (await Threads.getData(threadID)).data || {};
            const prefixRegex = new RegExp(`^(<@!?${senderID}>|${escapeRegex((threadSetting.PREFIX || PREFIX))})\\s*`);
            const prefixbox = threadSetting.PREFIX || PREFIX;
            const adminbot = require(process.cwd() + '/func/config/config.main.json');
            const threadInf = threadInfo.get(threadID) || await Threads.getInfo(threadID);
            const findd = threadInf.adminIDs.find(el => el.id == senderID);
            const dataAdbox = require(process.cwd() + '/core/data/dataAdbox.json');
            if (typeof body === 'string' && body.startsWith(prefixbox) && !NDH.includes(senderID) && !ADMINBOT.includes(senderID) && adminbot.adminOnly == true) {
                // Kiểm tra xem đã thông báo adminOnly hôm nay chưa
                const today = moment().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD");
                const adminOnlyNotificationKey = `adminonly_notification_${senderID}_${today}`;
                
                // Dọn dẹp thông báo cũ (không phải hôm nay) - chỉ chạy 1 lần mỗi ngày
                if (!global.data.lastAdminOnlyCleanupDate || global.data.lastAdminOnlyCleanupDate !== today) {
                    global.data.lastAdminOnlyCleanupDate = today;
                    const keysToDelete = [];
                    for (const key of global.data.adminOnlyNotifications) {
                        if (!key.includes(today)) {
                            keysToDelete.push(key);
                        }
                    }
                    keysToDelete.forEach(key => global.data.adminOnlyNotifications.delete(key));
                }
                
                // Nếu chưa thông báo hôm nay thì mới gửi thông báo
                if (!global.data.adminOnlyNotifications.has(adminOnlyNotificationKey)) {
                    global.data.adminOnlyNotifications.add(adminOnlyNotificationKey);
                    return api.sendMessage('CHẾ ĐỘ ADMIN ONLY\n\nHiện tại bot đang ở chế độ chỉ Admin mới được sử dụng\n\nVui lòng liên hệ Admin để được hỗ trợ', threadID, messageID);
                } else {
                    // Đã thông báo hôm nay rồi, chỉ return mà không gửi thông báo
                    return;
                }
            }
            if (typeof body === 'string' && body.startsWith(prefixbox) && dataAdbox.adminbox.hasOwnProperty(threadID) && dataAdbox.adminbox[threadID] == true && !NDH.includes(senderID) && !ADMINBOT.includes(senderID) && !findd && event.isGroup == true) {
                // Kiểm tra xem đã thông báo qtvonly hôm nay chưa
                const today = moment().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD");
                const qtvNotificationKey = `qtv_notification_${senderID}_${threadID}_${today}`;
                
                // Dọn dẹp thông báo cũ (không phải hôm nay) - chỉ chạy 1 lần mỗi ngày
                if (!global.data.lastQtvCleanupDate || global.data.lastQtvCleanupDate !== today) {
                    global.data.lastQtvCleanupDate = today;
                    const keysToDelete = [];
                    for (const key of global.data.qtvNotifications) {
                        if (!key.includes(today)) {
                            keysToDelete.push(key);
                        }
                    }
                    keysToDelete.forEach(key => global.data.qtvNotifications.delete(key));
                }
                
                // Nếu chưa thông báo hôm nay thì mới gửi thông báo
                if (!global.data.qtvNotifications.has(qtvNotificationKey)) {
                    global.data.qtvNotifications.add(qtvNotificationKey);
                    return api.sendMessage('CHẾ ĐỘ QUẢN TRỊ VIÊN\n\nNhóm này đang ở chế độ chỉ Quản trị viên mới được sử dụng bot\n\nVui lòng liên hệ Quản trị viên để được hỗ trợ', event.threadID, event.messageID);
                } else {
                    // Đã thông báo hôm nay rồi, chỉ return mà không gửi thông báo
                    return;
                }
            }
            const a = await UserBans.getAll();
            const b = await ThreadBans.getAll();
            const c = a.length > 0 ? a.find(u => u.userID.toString() === senderID.toString()) : null;
            const d = b.length > 0 ? b.find(t => t.threadID.toString() === threadID.toString()) : null;
            if (c || d || (allowInbox == false && senderID === threadID)) {
                if (!ADMINBOT.includes(senderID) && !NDH.includes(senderID)) {
                    // Kiểm tra xem đã thông báo ban hôm nay chưa
                    const today = moment().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD");
                    const banNotificationKey = `ban_notification_${senderID}_${today}`;
                    
                    // Đảm bảo banNotifications tồn tại
                    if (!global.data.banNotifications) {
                        global.data.banNotifications = new Set();
                        console.log(`[BAN NOTIFICATION] Khởi tạo banNotifications Set`);
                    }
                    
                    // Dọn dẹp thông báo cũ (không phải hôm nay) - chỉ chạy 1 lần mỗi ngày
                    if (!global.data.lastCleanupDate || global.data.lastCleanupDate !== today) {
                        global.data.lastCleanupDate = today;
                        const keysToDelete = [];
                        for (const key of global.data.banNotifications) {
                            if (!key.includes(today)) {
                                keysToDelete.push(key);
                            }
                        }
                        keysToDelete.forEach(key => global.data.banNotifications.delete(key));
                    }
                    
                    // Nếu chưa thông báo hôm nay thì mới gửi thông báo
                    if (!global.data.banNotifications.has(banNotificationKey)) {
                        global.data.banNotifications.add(banNotificationKey);
                        console.log(`[BAN NOTIFICATION] Gửi thông báo ban cho user ${senderID} lần đầu trong ngày ${today}`);
                        
                        const formatDateTime = (date) => {
                            return moment(date).tz("Asia/Ho_Chi_Minh").format("HH:mm:ss | DD/MM/YYYY");
                        };
                        
                        if (c) {
                            const { reason, banTime } = c;
                            const formattedBanTime = formatDateTime(banTime);
                            return api.sendMessage(
                                `THÔNG BÁO BAN NGƯỜI DÙNG\n\nLý do: ${reason}\nThời gian: ${formattedBanTime}\n\nLiên hệ Admin để được hỗ trợ`,
                                threadID,
                                async (err, info) => {
                                    if (err) return console.error(err);
                                    await new Promise(resolve => setTimeout(resolve, 15 * 1000));
                                    return api.unsendMessage(info.messageID);
                                },
                                messageID
                            );
                        } else if (d) {
                            const { reason, banTime } = d;
                            const formattedBanTime = formatDateTime(banTime);
                            return api.sendMessage(
                                `THÔNG BÁO BAN NHÓM\n\nLý do: ${reason}\nThời gian: ${formattedBanTime}\n\nLiên hệ Admin để được hỗ trợ`,
                                threadID,
                                async (err, info) => {
                                    if (err) return console.error(err);
                                    await new Promise(resolve => setTimeout(resolve, 15 * 1000));
                                    return api.unsendMessage(info.messageID);
                                },
                                messageID
                            );
                        } else if (allowInbox == false && senderID === threadID) {
                            return api.sendMessage(
                                `THÔNG BÁO BAN INBOX\n\nBot hiện tại không cho phép sử dụng trong tin nhắn riêng\n\nVui lòng sử dụng trong nhóm chat`,
                                threadID,
                                async (err, info) => {
                                    if (err) return console.error(err);
                                    await new Promise(resolve => setTimeout(resolve, 15 * 1000));
                                    return api.unsendMessage(info.messageID);
                                },
                                messageID
                            );
                        }
                    } else {
                        // Đã thông báo hôm nay rồi, chỉ return mà không gửi thông báo
                        console.log(`[BAN NOTIFICATION] User ${senderID} đã được thông báo ban hôm nay, bỏ qua thông báo`);
                        return;
                    }
                }
            }
            body = body !== undefined ? body : 'x';
            const [matchedPrefix] = body.match(prefixRegex) || [''];
            var args = body.slice(matchedPrefix.length).trim().split(/ +/);
            var commandName = args.shift().toLowerCase();
            var command = commands.get(commandName);
            if (!prefixRegex.test(body)) {
                args = (body || '').trim().split(/ +/);
                commandName = args.shift()?.toLowerCase();
                command = commands.get(commandName);
                if (command && command.config) {
                    if (typeof body === 'string' && !body.startsWith(prefixbox) && command.config.prefix === false && !NDH.includes(senderID) && !ADMINBOT.includes(senderID) && adminOnly == true) {
                        // Kiểm tra xem đã thông báo adminOnly hôm nay chưa
                        const today = moment().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD");
                        const adminOnlyNotificationKey = `adminonly_notification_${senderID}_${today}`;
                        
                        // Nếu chưa thông báo hôm nay thì mới gửi thông báo
                        if (!global.data.adminOnlyNotifications.has(adminOnlyNotificationKey)) {
                            global.data.adminOnlyNotifications.add(adminOnlyNotificationKey);
                            return api.sendMessage('CHẾ ĐỘ ADMIN ONLY\n\nHiện tại bot đang ở chế độ chỉ Admin mới được sử dụng\n\nVui lòng liên hệ Admin để được hỗ trợ', threadID, messageID);
                        } else {
                            // Đã thông báo hôm nay rồi, chỉ return mà không gửi thông báo
                            return;
                        }
                    }
                    if (typeof body === 'string' && !body.startsWith(prefixbox) && command.config.prefix === false && dataAdbox.adminbox[threadID] && dataAdbox.adminbox.hasOwnProperty(threadID) && dataAdbox.adminbox[threadID] == true && !NDH.includes(senderID) && !ADMINBOT.includes(senderID) && !findd && event.isGroup == true) {
                        // Kiểm tra xem đã thông báo qtvonly hôm nay chưa
                        const today = moment().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD");
                        const qtvNotificationKey = `qtv_notification_${senderID}_${threadID}_${today}`;
                        
                        // Nếu chưa thông báo hôm nay thì mới gửi thông báo
                        if (!global.data.qtvNotifications.has(qtvNotificationKey)) {
                            global.data.qtvNotifications.add(qtvNotificationKey);
                            return api.sendMessage('CHẾ ĐỘ QUẢN TRỊ VIÊN\n\nNhóm này đang ở chế độ chỉ Quản trị viên mới được sử dụng bot\n\nVui lòng liên hệ Quản trị viên để được hỗ trợ', threadID, messageID);
                        } else {
                            // Đã thông báo hôm nay rồi, chỉ return mà không gửi thông báo
                            return;
                        }
                    }
                    if (command.config.prefix === false && commandName.toLowerCase() !== command.config.name.toLowerCase()) {
                        return;
                    }
                    if (command.config.prefix === true && !body.startsWith(prefixbox)) {
                        return;
                    }
                }
                if (command && command.config) {
                    if (typeof command.config.prefix === 'undefined') {
                        return;
                    }
                }
            }
            if (!command) {
                if (!body.startsWith((threadSetting.hasOwnProperty("PREFIX")) ? threadSetting.PREFIX : PREFIX)) return;
                for (const [name, cmd] of commands.entries()) {
                    if (cmd.config.alias && cmd.config.alias.includes(commandName)) {
                        command = cmd;
                        break;
                    }
                }
            }
            if (!command) {
                const getUptime = () => {
                     const secs = process.uptime();
                     const days = Math.floor(secs / 86400);
                     const hours = String(Math.floor((secs % 86400) / 3600)).padStart(2, '0');
                     const minutes = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
                     const seconds = String(Math.floor(secs % 60)).padStart(2, '0');
                     return days ? `${days} ngày ${hours} giờ ${minutes} phút ${seconds} giây` : `${hours}:${minutes}:${seconds}`};
                if (!body.startsWith((threadSetting.hasOwnProperty("PREFIX")) ? threadSetting.PREFIX : PREFIX)) return;
                var allCommandName = [];
                const commandValues = commands.keys();
                for (const cmd of commandValues) allCommandName.push(cmd);
                const checker = stringSimilarity.findBestMatch(commandName, allCommandName);
                if (checker.bestMatch.rating >= 0.5) {
                    command = commands.get(checker.bestMatch.target);
                } else {
                    return api.sendMessage({body: `🌸 Lệnh bạn yêu cầu không tồn tại\n❄️ Lệnh gần giống là "${checker.bestMatch.target}"\n☃️ Bot hoạt động: ${getUptime()}\n👾 Sử dụng ${prefixbox}help để xem danh sách lệnh!`, attachment: global.Seiko.animeQueues.splice(0,1)}, event.threadID, async (err, info) => {
                        if (!err) {
                            await new Promise(resolve => setTimeout(resolve, 60 * 1000));
                            api.unsendMessage(info.messageID);
                        }
                    }, event.messageID);
                }
            }
            let path = __dirname + '/../../core/data/commands-banned.json';
            let data = {};
            if (fs.existsSync(path)) data = JSON.parse(fs.readFileSync(path));

            // Đồng bộ với ban/unban system
            const checkPermission = (userID, threadID) => {
                const isAdmin = global.config.ADMINBOT.includes(userID);
                const isNDH = global.config.NDH.includes(userID);
                const threadInfo = global.data.threadInfo.get(threadID);
                const isGroupAdmin = threadInfo?.adminIDs?.some(admin => admin.id === userID);
                
                return { isAdmin, isNDH, isGroupAdmin, canBan: isAdmin || isNDH || isGroupAdmin };
            };

            let is_qtv_box = async (id) => {
                let threadData = await Threads.getData(event.threadID);
                return threadData?.threadInfo?.adminIDs?.some($ => $.id == id);
            };

            let name = id => global.data.userName.get(id);
            let cmd = command.config.name;

            if (data[threadID]) {
                if (ban = data[threadID].cmds.find($ => $.cmd == cmd)) {
                    if (ADMINBOT.includes(ban.author) && ban.author != senderID) {
                        return api.sendMessage(`🚫 LỆNH BỊ CẤM\n\n⚡ Lệnh: ${cmd}\n👤 Người cấm: Admin Bot (${name(ban.author)})\n⏰ Thời gian: ${ban.time}`, threadID, messageID);
                    }
                    if (await is_qtv_box(ban.author) && ban.author != senderID) {
                        return api.sendMessage(`🚫 LỆNH BỊ CẤM\n\n⚡ Lệnh: ${cmd}\n👤 Người cấm: Quản trị viên nhóm (${name(ban.author)})\n⏰ Thời gian: ${ban.time}`, threadID, messageID);
                    }
                }
                if (all = (data[threadID].users[senderID] || {}).all) {
                    if (all.status == true && ADMINBOT.includes(all.author) && !ADMINBOT.includes(senderID)) {
                        // Kiểm tra xem đã thông báo ban nhóm hôm nay chưa
                        const today = moment().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD");
                        const groupBanNotificationKey = `groupban_notification_${senderID}_${threadID}_${today}`;
                        
                        // Đảm bảo groupBanNotifications tồn tại
                        if (!global.data.groupBanNotifications) {
                            global.data.groupBanNotifications = new Set();
                        }
                        
                        // Dọn dẹp thông báo cũ (không phải hôm nay) - chỉ chạy 1 lần mỗi ngày
                        if (!global.data.lastGroupBanCleanupDate || global.data.lastGroupBanCleanupDate !== today) {
                            global.data.lastGroupBanCleanupDate = today;
                            const keysToDelete = [];
                            for (const key of global.data.groupBanNotifications) {
                                if (!key.includes(today)) {
                                    keysToDelete.push(key);
                                }
                            }
                            keysToDelete.forEach(key => global.data.groupBanNotifications.delete(key));
                        }
                        
                        // Nếu chưa thông báo hôm nay thì mới gửi thông báo
                        if (!global.data.groupBanNotifications.has(groupBanNotificationKey)) {
                            global.data.groupBanNotifications.add(groupBanNotificationKey);
                            console.log(`[GROUP BAN NOTIFICATION] Gửi thông báo ban nhóm cho user ${senderID} lần đầu trong ngày ${today}`);
                            return api.sendMessage(`🚫 BẠN ĐÃ BỊ BAN\n\n👤 Người ban: Admin Bot (${name(all.author)})\n⏰ Thời gian: ${all.time}\n\n📞 Liên hệ Admin để được hỗ trợ`, threadID, messageID);
                        } else {
                            console.log(`[GROUP BAN NOTIFICATION] User ${senderID} đã được thông báo ban nhóm hôm nay, bỏ qua thông báo`);
                            return;
                        }
                    }
                    if (all.status == true && await is_qtv_box(all.author) && !await is_qtv_box(senderID) && !ADMINBOT.includes(senderID)) {
                        // Kiểm tra xem đã thông báo ban nhóm hôm nay chưa
                        const today = moment().tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD");
                        const groupBanNotificationKey = `groupban_notification_${senderID}_${threadID}_${today}`;
                        
                        // Đảm bảo groupBanNotifications tồn tại
                        if (!global.data.groupBanNotifications) {
                            global.data.groupBanNotifications = new Set();
                        }
                        
                        // Dọn dẹp thông báo cũ (không phải hôm nay) - chỉ chạy 1 lần mỗi ngày
                        if (!global.data.lastGroupBanCleanupDate || global.data.lastGroupBanCleanupDate !== today) {
                            global.data.lastGroupBanCleanupDate = today;
                            const keysToDelete = [];
                            for (const key of global.data.groupBanNotifications) {
                                if (!key.includes(today)) {
                                    keysToDelete.push(key);
                                }
                            }
                            keysToDelete.forEach(key => global.data.groupBanNotifications.delete(key));
                        }
                        
                        // Nếu chưa thông báo hôm nay thì mới gửi thông báo
                        if (!global.data.groupBanNotifications.has(groupBanNotificationKey)) {
                            global.data.groupBanNotifications.add(groupBanNotificationKey);
                            console.log(`[GROUP BAN NOTIFICATION] Gửi thông báo ban nhóm cho user ${senderID} lần đầu trong ngày ${today}`);
                            return api.sendMessage(`🚫 BẠN ĐÃ BỊ BAN\n\n👤 Người ban: Quản trị viên nhóm (${name(all.author)})\n⏰ Thời gian: ${all.time}\n\n📞 Liên hệ Admin để được hỗ trợ`, threadID, messageID);
                        } else {
                            console.log(`[GROUP BAN NOTIFICATION] User ${senderID} đã được thông báo ban nhóm hôm nay, bỏ qua thông báo`);
                            return;
                        }
                    }
                }
                if (user_ban = (data[threadID].users[senderID] || {
                    cmds: []
                }).cmds.find($ => $.cmd == cmd)) {
                    if (ADMINBOT.includes(user_ban.author) && !ADMINBOT.includes(senderID)) {
                        return api.sendMessage(`🚫 LỆNH BỊ CẤM\n\n⚡ Lệnh: ${cmd}\n👤 Người cấm: Admin Bot (${name(user_ban.author)})\n⏰ Thời gian: ${user_ban.time}`, threadID, messageID);
                    }
                    if (await is_qtv_box(user_ban.author) && !await is_qtv_box(senderID) && !ADMINBOT.includes(senderID)) {
                        return api.sendMessage(`🚫 LỆNH BỊ CẤM\n\n⚡ Lệnh: ${cmd}\n👤 Người cấm: Quản trị viên nhóm (${name(user_ban.author)})\n⏰ Thời gian: ${user_ban.time}`, threadID, messageID);
                    }
                }
            }
            const disableCommandPath = process.cwd() + '/core/data/disable-command.json';
            let disableData = fs.existsSync(disableCommandPath) ? JSON.parse(fs.readFileSync(disableCommandPath)) : {};
            if ((disableData[threadID]?.commands?.[command.config.name] || disableData[threadID]?.categories?.[command.config.category]) && !NDH.includes(senderID) && !ADMINBOT.includes(senderID)) {
                if (disableData[threadID]?.categories?.[command.config.category]) {
                    return api.sendMessage(`🚫 LỆNH BỊ CẤM\n\n📂 Nhóm lệnh: ${command.config.category}\n🔒 Trạng thái: Đã bị cấm trong nhóm này`, threadID);
                }
                if (disableData[threadID]?.commands?.[command.config.name]) {
                    return api.sendMessage(`🚫 LỆNH BỊ CẤM\n\n⚡ Lệnh: ${command.config.name}\n🔒 Trạng thái: Đã bị cấm trong nhóm này`, threadID);
                }
            }
            var permssion = 0;
            const threadInfoo = (await Threads.getData(threadID)).threadInfo;
            const find = threadInfoo.adminIDs.find(el => el.id == senderID);
            if (NDH.includes(senderID.toString())) permssion = 3;
            else if (ADMINBOT.includes(senderID.toString())) permssion = 2;
            else if (find) permssion = 1;
            const rolePermissions = {
                1: "Quản Trị Viên",
                2: "ADMIN BOT",
                3: "Người Hỗ Trợ"
            };
            const requiredPermission = rolePermissions[command.config.role] || "";
            if (command.config.role > permssion) {
                msg.react('⛔', messageID, () => { });
                return api.sendMessage(`KHÔNG ĐỦ QUYỀN HẠN\n\nLệnh: ${command.config.name}\nYêu cầu: ${requiredPermission}\n\nVui lòng liên hệ Admin để được hỗ trợ`, threadID, async (err, info) => {
                    await new Promise(resolve => setTimeout(resolve, 15 * 1000));
                    return api.unsendMessage(info.messageID);
                }, messageID);
            }
            if (!cd.has(command.config.name)) cd.set(command.config.name, new Map());
            const timestamps = cd.get(command.config.name);
            const expirationTime = (command.config.cd || 1) * 1000;
            if (timestamps.has(senderID) && dateNow < timestamps.get(senderID) + expirationTime) {
                msg.react('⏱️', messageID, () => { });
                return api.sendMessage(`THAO TÁC QUÁ NHANH\n\nLệnh: ${command.config.name}\nCooldown: ${command.config.cd || 1} giây\n\nVui lòng chờ và thử lại sau`, threadID, async (err, info) => {
                    await new Promise(resolve => setTimeout(resolve, 15 * 1000));
                    return api.unsendMessage(info.messageID);
                }, messageID);
            }
            try {
                command.onCall({ apis, api, tools, event, args, models, msg, Users, Threads, Currencies, permssion, client, NsfwGroups, ThreadBans, UserBans, commandName });
                timestamps.set(senderID, dateNow);
                if (DeveloperMode) logger(`Lệnh ${commandName} được thực thi lúc ${time} bởi ${senderID} trong nhóm ${threadID}, thời gian thực thi: ${(Date.now()) - dateNow}ms`, 'info');
            } catch (e) {
                return api.sendMessage(`LỖI THỰC THI LỆNH\n\nLệnh: ${commandName}\nLỗi: ${e}\n\nVui lòng thử lại sau`, threadID);
            }
        };
    },
    onChat({ apis, api, tools, msg, models, Users, Threads, Currencies, client, UserBans, ThreadBans }) {
        return async function ({ event }) {
            const { commands } = global.Seiko;
            const allOnChat = client.onChat || [];
            const { body, senderID, threadID } = event;
            const args = body ? body.split(/ +/) : [];

            for (const key of allOnChat) {
                const command = commands.get(key);
                if (!command) continue;

                const commandName = command.config.name;

                if (getType(command.onChat) === "Function") {
                    const originalOnChat = command.onChat;
                    command.onChat = async function (...args) {
                        return originalOnChat(...args);
                    };
                }

                command.onChat({
                    apis,
                    event,
                    args,
                    api,
                    models,
                    Users,
                    Threads,
                    Currencies,
                    msg,
                    body,
                    UserBans,
                    ThreadBans,
                    client,
                    commandName,
                    tools
                })
                    .then(async (handler) => {
                        if (typeof handler === "function") {
                            try {
                                await handler();
                                console.log("onChat", `${commandName} | ${senderID} | ${threadID} | ${args.join(" ")}`);
                            } catch (err) {
                                const errorMsg = err.stack ? err.stack.split("\n").slice(0, 5).join("\n") : JSON.stringify(err, null, 2);
                                await msg.reply(`Error occurred in command ${commandName}: ${errorMsg}`);
                            }
                        }
                    })
                    .catch(err => {
                        console.error("onChat", `An error occurred when calling the command onChat ${commandName}`, err);
                    });
            }
        };
    },
    onEvent({ apis, api, tools, msg, models, Users, Threads, Currencies, client }) {
        return async function ({ event }) {
            const { allowInbox, NDH } = global.config;
            const { userBanned, threadBanned } = global.data;
            const { commands } = global.Seiko;
            const { onEvent } = client;
            const { senderID, threadID, body, type } = event;

            for (const eventReg of onEvent) {
                const cmd = commands.get(eventReg);
                if (!cmd) continue;

                try {
                    const Obj = {
                        apis,
                        event,
                        api,
                        models,
                        Users,
                        Threads,
                        Currencies,
                        msg,
                        client,
                        body,
                        type,
                        commandName: cmd.config.name,
                        tools
                    };
                    if (cmd) {
                        cmd.onEvent(Obj);
                    }
                } catch (error) {
                    console.log(error);
                    logger.error(`Lỗi khi xử lý sự kiện của lệnh ${cmd.config.name} trong thread ${threadID}, sender ${senderID}`, 'ONEVENT');
                }
            }
        };
    },
    onReply({ apis, api, tools, msg, models, Users, Threads, Currencies, UserBans, ThreadBans, client }) {
        return async function ({ event }) {
            if (!event.messageReply) return;

            const { onReply, commands } = global.Seiko;
            const { messageID, threadID, messageReply } = event;

            const Reply = onReply.get(messageReply.messageID);
            if (!Reply) return;

            Reply.delete = () => onReply.delete(messageReply.messageID);

            const commandName = Reply.commandName;
            if (!commandName) {
                api.sendMessage("Không tìm thấy tên lệnh để thực thi!", threadID, messageID);
                console.error("onReply", "Không tìm thấy tên lệnh cho reply này!", Reply);
                return;
            }

            const command = commands.get(commandName);
            if (!command) {
                api.sendMessage(`Lệnh "${commandName}" không tồn tại!`, threadID, messageID);
                console.error("onReply", `Lệnh "${commandName}" không tồn tại!`, Reply);
                return;
            }

            try {
                const args = event.body ? event.body.trim().split(/\s+/) : [];
                await command.onReply({
                    apis,
                    api,
                    event,
                    models,
                    Users,
                    Threads,
                    Currencies,
                    Reply,
                    args,
                    msg,
                    client,
                    commandName,
                    tools,
                    UserBans,
                    ThreadBans
                });
                console.log("onReply", `${commandName} | ${event.senderID} | ${threadID} | ${args.join(" ")}`);
            } catch (err) {
                console.error("onReply", `Đã xảy ra lỗi khi thực thi lệnh ${commandName}`, err);
                api.sendMessage(`Đã xảy ra lỗi: ${err.message}`, threadID, messageID);
            }
        };
    },
    onData({ api, msg, models, Users, Threads, Currencies }) {
        const path = require('path');
        const moment = require('moment-timezone');
        return async function ({ event }) {
            (async () => {
                const dataPath = path.join(__dirname, '..', 'data', 'messageCounts');
                if (!event.isGroup) return;
                const { threadID, senderID, participantIDs } = event;
                const botID = api.getCurrentUserID();
                if (senderID === botID) return;
                const today = moment.tz("Asia/Ho_Chi_Minh").day();
                const now = Date.now();
                const filePath = path.join(dataPath, `${threadID}.json`);
                if (!fs.existsSync(dataPath)) {
                    fs.mkdirSync(dataPath, { recursive: true });
                }
                if (!fs.existsSync(filePath)) {
                    const newObj = {
                        total: [],
                        week: [],
                        day: [],
                        month: [],
                        time: today
                    };
                    for (const user of participantIDs) {
                        const userObj = { id: user, count: 0, lastInteraction: null };
                        newObj.total.push(userObj);
                        newObj.week.push(userObj);
                        newObj.day.push(userObj);
                        newObj.month.push(userObj);
                    }
                    fs.writeFileSync(filePath, JSON.stringify(newObj, null, 4));
                    logger.log(`Đã tạo file dữ liệu tương tác mới cho nhóm: ${threadID}`, 'CHECKTT');
                }
                const data = fs.readFileSync(filePath);
                let threadData = JSON.parse(data);
                const ensureUserData = (dataArray) => {
                    for (const user of participantIDs) {
                        if (!dataArray.some(e => e.id === user)) {
                            dataArray.push({ id: user, count: 0, lastInteraction: null });
                        }
                    }
                };
                ensureUserData(threadData.total);
                ensureUserData(threadData.week);
                ensureUserData(threadData.day);
                ensureUserData(threadData.month);
                const updateData = (dataArray) => {
                    const userIndex = dataArray.findIndex(e => e.id === senderID);
                    if (userIndex === -1) {
                        dataArray.push({ id: senderID, count: 1, lastInteraction: now });
                    } else {
                        dataArray[userIndex].count++;
                        dataArray[userIndex].lastInteraction = now;
                    }
                };
                updateData(threadData.total);
                updateData(threadData.week);
                updateData(threadData.day);
                updateData(threadData.month);
                const buffer = Buffer.from(JSON.stringify(threadData, 0, 4));
                fs.writeFileSync(filePath, buffer);
            })();
            (async () => {
                const dataPath = path.join(__dirname, '..', 'data', 'timeJoin');
                if (!event.isGroup) return;
                const { threadID, participantIDs } = event;
                const now = moment.tz("Asia/Ho_Chi_Minh").format();
                const filePath = path.join(dataPath, `${threadID}.json`);
                if (!fs.existsSync(dataPath)) {
                    fs.mkdirSync(dataPath, { recursive: true });
                }
                let timeJoinData = {};
                if (fs.existsSync(filePath)) {
                    const data = fs.readFileSync(filePath);
                    timeJoinData = JSON.parse(data);
                }
                let newUserJoined = false;
                for (const user of participantIDs) {
                    if (!timeJoinData[user]) {
                        timeJoinData[user] = {
                            timeJoin: now
                        };
                        newUserJoined = true;
                        logger.log(`Đã ghi lại thời gian tham gia cho người dùng ${user} vào nhóm: ${threadID}`, 'CHECKTT');
                    }
                }
                if (newUserJoined) {
                    fs.writeFileSync(filePath, JSON.stringify(timeJoinData, 0, 4));
                }
            })();
        }
    },
    /*
    onDatabase({ Users, Threads, Currencies }) {
      return async function ({ event }) {
        const { autoCreateDB } = global.config;
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
        if (!autoCreateDB) return;
        let { senderID, threadID } = event;
        senderID = String(senderID);
        threadID = String(threadID);
    
        try {
          const threadData = await Threads.getData(threadID);
          if (event.isGroup && (!threadData || !threadData.name || !threadData.threadInfo)) {
            const threadInf = await Threads.getInfo(threadID);
            const dataThread = {
              threadID: threadInf.threadID || threadID,
              threadName: threadInf.threadName || "Tên nhóm chưa xác định",
              participantIDs: threadInf.participantIDs || [],
              userInfo: threadInf.userInfo || [],
              unreadCount: 0,
              messageCount: 0,
              timestamp: Date.now().toString(),
              muteUntil: null,
              isGroup: threadInf.isGroup || true,
              isSubscribed: true,
              isArchived: false,
              folder: "INBOX",
              cannotReplyReason: null,
              eventReminders: [],
              emoji: threadInf.emoji || "👍",
              color: threadInf.color || "#0084FF",
              threadTheme: {
                id: threadInf?.threadTheme?.id || "",
                accessibility_label: threadInf?.threadTheme?.accessibility_label || ""
              },
              nicknames: threadInf.nicknames || {},
              adminIDs: threadInf.adminIDs || [],
              approvalMode: threadInf.approvalMode || false,
              approvalQueue: [],
              reactionsMuteMode: "reactions_not_muted",
              mentionsMuteMode: "mentions_not_muted",
              isPinProtected: false,
              relatedPageThread: null,
              snippet: "",
              snippetSender: "",
              snippetAttachments: [],
              serverTimestamp: Date.now().toString(),
              imageSrc: threadInf.imageSrc || "",
              isCanonicalUser: false,
              isCanonical: false,
              recipientsLoadable: true,
              hasEmailParticipant: false,
              readOnly: false,
              canReply: true,
              lastMessageType: "message",
              lastReadTimestamp: Date.now().toString(),
              threadType: 2,
              inviteLink: threadInf.inviteLink || ""
            };
    
            await Threads.setData(threadID, {
              name: dataThread.threadName,
              threadInfo: dataThread,
              data: {}
            });
            
            logger.log(`Create data thread: ${threadInf.threadName || "Tên nhóm chưa xác định"} (${threadID})`, 'DATABASE');
    
            const userUpdatePromises = threadInf.userInfo.map(async (singleData) => {
              await delay(500);
              const userData = await Users.getData(singleData.id);
              if (!userData || !userData.name || !userData.gender) {
                const userInfo = await Users.getInfo(singleData.id);
                if (userInfo.name === "Người dùng Facebook") return;
                await Users.createData(singleData.id, {
                  name: userInfo.name || "Người dùng chưa xác định",
                  gender: userInfo.gender || null,
                  data: {}
                });
                logger.log(`Create data user: ${userInfo.name || "Người dùng chưa xác định"} (${singleData.id})`, 'DATABASE');
              } else if (userData.name !== singleData.name || userData.gender !== singleData.gender) {
                await Users.setData(singleData.id, {
                  name: userData.name,
                  gender: userData.gender,
                  settings: {},
                  data: {}
                });
                logger.log(`Update data user: ${userData.name} (${singleData.id})`, 'DATABASE');
              }
            });
            await Promise.all(userUpdatePromises);
          } else {
            const senderData = await Users.getData(senderID);
            const infoUsers = (!senderData || !senderData.name || !senderData.gender) ? await Users.getInfo(senderID) : null;
    
            if (infoUsers && infoUsers.name === "Người dùng Facebook") return;
    
            if (!senderData) {
              await Users.createData(senderID, {
                name: infoUsers.name || "Người dùng chưa xác định",
                gender: infoUsers.gender || null,
                settings: {},
                data: {}
              });
              logger.log(`Create data user: ${infoUsers.name || "Người dùng chưa xác định"} (${senderID})`, 'DATABASE');
            } else if (!senderData.name || !senderData.gender) {
              await Users.setData(senderID, {
                name: senderData.name || infoUsers.name,
                gender: senderData.gender || infoUsers.gender,
                settings: {},
                data: {}
              });
              logger.log(`Update data user: ${senderData.name} (${senderID})`, 'DATABASE');
            }
    
            await delay(500);
            const currenciesData = await Currencies.getData(senderID);
            if (!currenciesData) {
              await Currencies.createData(senderID, { data: {} });
            }
          }
          return;
        } catch (err) {
          console.log(err);
        }
      };
    },*/
    onDatabase({ Users, Threads, Currencies }) {
        return async function ({ event }) {
            const chalk = require('chalk');
            const brightGreen = chalk.bold.hex('#00ff7f');

            const logger = (prefix, message) => {
                const msg = `${prefix}: ${message}`;
                console.log(brightGreen(msg));
            };

            const { allUserID, allCurrenciesID, allThreadID, userName, threadInfo } = global.data;
            const { autoCreateDB } = global.config;
            if (autoCreateDB == ![]) return;
            let { senderID, threadID } = event;
            senderID = String(senderID);
            threadID = String(threadID);

            try {
                if (!allThreadID.includes(threadID) && event.isGroup == !![]) {
                    const threadIn4 = await Threads.getInfo(threadID);
                    const dataThread = {
                        threadID: threadIn4.threadID,
                        threadName: threadIn4.threadName,
                        participantIDs: threadIn4.participantIDs,
                        userInfo: threadIn4.userInfo,
                        timestamp: Date.now().toString(),
                        isGroup: threadIn4.isGroup,
                        isSubscribed: true,
                        isArchived: false,
                        emoji: threadIn4.emoji,
                        color: threadIn4.color,
                        threadTheme: threadIn4.threadTheme,
                        nicknames: threadIn4.nicknames,
                        adminIDs: threadIn4.adminIDs,
                        approvalMode: threadIn4.approvalMode,
                        approvalQueue: [],
                        imageSrc: threadIn4.imageSrc || "",
                        inviteLink: threadIn4.inviteLink
                    };

                    allThreadID.push(threadID);
                    threadInfo.set(threadID, dataThread);
                    await Threads.setData(threadID, { threadInfo: dataThread, data: {} });

                    for (const singleData of threadIn4.userInfo) {
                        if (singleData.gender !== undefined) {
                            userName.set(String(singleData.id), singleData.name);
                            try {
                                if (!global.data.allUserID.includes(String(singleData.id))) {
                                    await Users.createData(singleData.id, {
                                        'name': singleData.name,
                                        'gender': singleData.gender,
                                        'data': {}
                                    });
                                    global.data.allUserID.push(String(singleData.id));
                                    // logger('USER', `New user added: ${singleData.name} (ID: ${singleData.id})`);
                                } else {
                                    await Users.setData(String(singleData.id), {
                                        'name': singleData.name
                                    });
                                }
                            } catch (e) {
                                console.log(e);
                            }
                        }
                    }
                    // logger('THREAD', `New thread added: ${threadIn4.threadName} (ID: ${threadID})`);
                }

                if (!allUserID.includes(senderID) || !userName.has(senderID)) {
                    const infoUsers = await Users.getInfo(senderID);
                    const setting3 = {
                        name: infoUsers?.name,
                        gender: infoUsers?.gender
                    };
                    await Users.createData(senderID, setting3);
                    allUserID.push(senderID);
                    userName.set(senderID, infoUsers?.name);
                    // logger('USER', `New user added: ${infoUsers?.name} (ID: ${senderID})`);
                }
                if (!allCurrenciesID.includes(senderID)) {
                    const setting4 = {
                        data: {}
                    };
                    await Currencies.createData(senderID, setting4);
                    allCurrenciesID.push(senderID);
                }

                return;
            } catch (err) {
                return console.log(err);
            }
        };
    },
    handleEvent({ apis, api, tools, msg, models, Users, Threads, Currencies, client }) {
        const moment = require("moment");
        return async function ({ event }) {
            const timeStart = Date.now();
            const time = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss L");
            const { userBanned, threadBanned } = global.data;
            const { events } = global.Seiko;
            const { allowInbox, DeveloperMode, NDH } = global.config;
            let { senderID, threadID } = event;
            senderID = String(senderID);
            threadID = String(threadID);
            const isSenderInNDH = NDH.includes(senderID);
            if (!isSenderInNDH && (userBanned.has(senderID) || threadBanned.has(threadID) || (!allowInbox && senderID === threadID))) {
                return;
            }
            for (const [key, value] of events.entries()) {
                if (value.config.eventType.includes(event.logMessageType)) {
                    const eventRun = events.get(key);
                    try {
                        const Obj = {
                            apis,
                            api,
                            event,
                            models,
                            Users,
                            Threads,
                            Currencies,
                            msg,
                            client,
                            tools
                        };
                        eventRun.onCall(Obj);
                        if (DeveloperMode) {
                            logger.log(`Đang thực thi sự kiện ${eventRun.config.name} vào lúc ${time} trong nhóm ${threadID}. Thời gian thực hiện: ${Date.now() - timeStart}ms`, 'EVENT');
                        }
                    } catch (error) {
                        logger.error(`Đã xảy ra lỗi trong quá trình thực thi sự kiện ${eventRun.config.name}: ${JSON.stringify(error)}`, "EVENT");
                    }
                }
            }
        };
    },
    onReaction({ apis, api, tools, msg, models, Users, Threads, Currencies, client }) {

        return async function ({ event }) {
            const { onReaction } = global.Seiko;
            const { messageID, threadID } = event;

            const Reaction = onReaction.get(messageID);
            if (!Reaction) return;

            Reaction.delete = () => onReaction.delete(messageID);
            const commandName = Reaction.commandName;

            if (!commandName) {
                api.sendMessage("Không tìm thấy tên lệnh để thực hiện phản ứng!", threadID, messageID);
                logger.error("onReaction", `Không thể tìm thấy tên lệnh để thực hiện phản ứng!`, 'REACTION');
                return;
            }

            const command = global.Seiko.commands.get(commandName);
            if (!command) {
                api.sendMessage(`Không tìm thấy lệnh "${commandName}"`, threadID, messageID);
                logger.error("onReaction", `Lệnh "${commandName}" không tồn tại`, 'REACTION');
                return;
            }
            
            const time = new Date().toLocaleString();
            try {
                if (!command) throw new Error(`Không tìm thấy lệnh với commandName: ${commandName}`);

                const args = [];

                await command.onReaction({
                    apis,
                    api,
                    event,
                    models,
                    Users,
                    Threads,
                    Currencies,
                    Reaction,
                    msg,
                    client,
                    args,
                    commandName,
                    tools
                });
                console.log("onReaction", `${commandName} | ${event.senderID} | ${threadID} | ${event.reaction}`);
            } catch (err) {
                console.log(err);
                api.sendMessage(`Lỗi xảy ra khi thực hiện: ${commandName} - ${time}`, threadID, messageID);
            }
        };
    },
    onRefresh({ api, msg, client, models, Users, Threads, Currencies, NsfwGroups, ThreadBans, UserBans, tools }) {
        return async function ({ event }) {
            const { allUserID, allCurrenciesID, allThreadID, userName, threadInfo } = global.data;
            const { threadID, logMessageType, logMessageData } = event;
            const { setData, getData, delData } = Threads;
            try {
                let threadData = await getData(threadID);
                let dataThread = threadData.threadInfo;
                switch (logMessageType) {
                    case "log:subscribe": {
                        if (logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            try {
                                const handler = require('./handlerEvents');
                                await handler.onDatabase({ api, msg, client, models, Users, Threads, Currencies, NsfwGroups, ThreadBans, UserBans, tools })({ event });
                            } catch (e) {
                                logger.error(`Lỗi khi xử lý handleCreateDatabase: ${e}`, 'REFRESH');
                            }
                            return;
                        } else {
                            for (const participant of logMessageData.addedParticipants) {
                                const userFbId = participant.userFbId;
                                const userData = await Users.getData(userFbId);
                                const userfb = await api.getUserInfo(userFbId);
                                const userInfo = {
                                    id: userFbId,
                                    name: userfb[userFbId]?.name || "Unknown",
                                    firstName: userfb[userFbId]?.firstName || "Unknown",
                                    vanity: userfb[userFbId]?.vanity,
                                    thumbSrc: userfb[userFbId]?.thumbSrc,
                                    profileUrl: userfb[userFbId]?.profileUrl,
                                    gender: userfb[userFbId]?.gender,
                                    type: "User",
                                    isFriend: userfb[userFbId]?.isFriend,
                                    isBirthday: userfb[userFbId]?.isBirthday
                                };
                                if (!userData) {
                                    await Users.createData(userFbId, {
                                        name: userInfo.name,
                                        gender: userInfo.gender,
                                        settings: {},
                                        data: {},
                                    });
                                } else {
                                    await Users.setData(userFbId, {
                                        name: userInfo.name,
                                        gender: userInfo.gender,
                                        settings: {},
                                        data: {}
                                    });
                                }
                                logger.log(`Người dùng ${userInfo.name} đã tham gia nhóm [ ${dataThread?.threadName || "Unknown"} ]`, 'Update');
                            }
                            await setData(threadID, { threadInfo: dataThread });
                        }
                        break;
                    }
                    case "log:thread-name": {
                        const newThreadName = logMessageData.name;
                        logger.log(`Cập Nhật Tên Nhóm Cho Nhóm ${threadID} thành ${logMessageData.name}`, 'Update');
                        dataThread.threadName = newThreadName;
                        await setData(threadID, { threadInfo: dataThread });
                        break;
                    }
                    case "log:thread-admins": {
                        const targetID = logMessageData.TARGET_ID;
                        if (logMessageData.ADMIN_EVENT === "add_admin") {
                            dataThread.adminIDs = dataThread.adminIDs || [];
                            dataThread.adminIDs.push({ id: targetID });
                        } else if (logMessageData.ADMIN_EVENT === "remove_admin") {
                            dataThread.adminIDs = dataThread.adminIDs?.filter(item => item.id !== targetID) || [];
                        }
                        logger.log(`Update quản trị viên cho nhóm: ${threadID}`, 'Update');
                        await setData(threadID, { threadInfo: dataThread });
                        break;
                    }
                    case 'log:unsubscribe': {
                        if (logMessageData.leftParticipantFbId == api.getCurrentUserID()) {
                            const threadData = await getData(threadID);
                            const threadName = threadData?.threadInfo?.threadName || "Unknown";
                            logger.log(`Đã xóa dữ liệu của nhóm [ ${threadName} - ${threadID} ]`, 'Update');
                            await delData(threadID);
                            return;
                        } else {
                            const idIndex = dataThread.participantIDs?.findIndex(item => item == logMessageData.leftParticipantFbId);
                            if (idIndex !== -1) {
                                dataThread.participantIDs.splice(idIndex, 1);
                            }
                            const userInfoIndex = dataThread.userInfo?.findIndex(user => user.id == logMessageData.leftParticipantFbId);
                            if (userInfoIndex !== -1) {
                                dataThread.userInfo.splice(userInfoIndex, 1);
                            }
                            logger.log(`Đã xóa dữ liệu người dùng ${await Users.getNameUser(logMessageData.leftParticipantFbId)} khỏi nhóm [ ${dataThread?.threadName || "Unknown"} ]`, 'Update');
                            await Users.delData(logMessageData.leftParticipantFbId);
                            await setData(threadID, { threadInfo: dataThread });
                        }
                        break;
                    }
                    case "log:thread-approval-mode": {
                        const { APPROVAL_MODE } = logMessageData;
                        dataThread.approvalMode = APPROVAL_MODE === '1';
                        logger.log(`Chế độ phê duyệt của nhóm [ ${dataThread?.threadName || "Unknown"} ] đã được cập nhật thành ${dataThread.approvalMode ? "bật" : "tắt"}`, 'Update');
                        await setData(threadID, { threadInfo: dataThread });
                        break;
                    }
                    case "log:thread-color": {
                        logger.log(`Chủ đề nhóm [ ${dataThread?.threadName || "Unknown"} ] đã được cập nhật thành ${event.logMessageData.accessibility_label}`, 'Update');
                        dataThread.emoji = event.logMessageData.theme_emoji;
                        dataThread.threadTheme = {
                            id: logMessageData.theme_id,
                            accessibility_label: event.logMessageData.accessibility_label
                        };
                        dataThread.color = event.logMessageData.theme_color;
                        await setData(threadID, { threadInfo: dataThread });
                        break;
                    }
                    case "log:user-nickname": {
                        const { participant_id, nickname } = logMessageData;
                        
                        // Kiểm tra dataThread có tồn tại không
                        if (!dataThread) {
                            logger.log(`[ERROR] dataThread undefined cho nhóm ${threadID}`, 'Error');
                            break;
                        }
                        
                        dataThread.nicknames = dataThread.nicknames || {};
                        if (nickname === '') {
                            delete dataThread.nicknames[participant_id];
                            logger.log(`Biệt danh của ${participant_id} trong nhóm [ ${dataThread?.threadName || "Unknown"} ] đã bị xóa`, 'Update');
                        } else {
                            dataThread.nicknames[participant_id] = nickname;
                            logger.log(`Biệt danh của ${participant_id} trong nhóm [ ${dataThread?.threadName || "Unknown"} ] đã được cập nhật thành ${nickname}`, 'Update');
                        }
                        await setData(threadID, { threadInfo: dataThread });
                        break;
                    }
                    case "log:thread-icon": {
                        logger.log(`Biểu tượng nhóm [ ${dataThread?.threadName || "Unknown"} ] đã được cập nhật thành ${event.logMessageData.thread_quick_reaction_emoji}`, 'Update');
                        dataThread.emoji = event.logMessageData.thread_quick_reaction_emoji;
                        await setData(threadID, { threadInfo: dataThread });
                        break;
                    }
                }
            } catch (error) {
                console.log(error);
                logger.error(`Đã xảy ra lỗi khi cập nhật dữ liệu: ${JSON.stringify(error, null, 2)}`, 'REFRESH');
            }
            return;
        };
    }
};

module.exports = handler;
module.exports = async function ({ api, Currencies, Threads, Users, cra, cv, cb }) {
    const logger = require("../../func/utils/log");
    try {
        const [threads, users, currencies] = await Promise.all([
            Threads.getAll(),
            Users.getAll(['userID', 'name', 'data']),
            Currencies.getAll(['userID'])
        ]);
        for (let i = 0; i < threads.length; i++) {
            const data = threads[i];
            const idThread = String(data.threadID);
            global.data.allThreadID.push(idThread);
            global.data.threadData.set(idThread, data.data || {});
            global.data.threadInfo.set(idThread, data.threadInfo || {});
            if (data.data?.banned) {
                global.data.threadBanned.set(idThread, {
                    reason: data.data.reason || '',
                    dateAdded: data.data.dateAdded || ''
                });
            }
            if (data.data?.commandBanned?.length) {
                global.data.commandBanned.set(idThread, data.data.commandBanned);
            }
            if (data.data?.NSFW) {
                global.data.threadAllowNSFW.push(idThread);
            }
        }
        for (let i = 0; i < users.length; i++) {
            const dataU = users[i];
            const idUsers = String(dataU.userID);
            global.data.allUserID.push(idUsers);
            if (dataU.name?.length) {
                global.data.userName.set(idUsers, dataU.name);
            }
            if (dataU.data?.banned) {
                global.data.userBanned.set(idUsers, {
                    reason: dataU.data.reason || '',
                    dateAdded: dataU.data.dateAdded || ''
                });
            }
            if (dataU.data?.commandBanned?.length) {
                global.data.commandBanned.set(idUsers, dataU.data.commandBanned);
            }
        }
        for (let i = 0; i < currencies.length; i++) {
            const dataC = currencies[i];
            global.data.allCurrenciesID.push(String(dataC.userID));
        }
        logger.log(`Successfully loaded ${cb(global.data.allThreadID.length)} threads and ${cb(global.data.allUserID.length)} users`, "LOADED");
    } catch (error) {
        logger.err(`${cra(`[ DATBASE ]`)} Tải môi trường thất bại: ${error}`, 'LOADED');
    }
};
const fs = require('fs');
const config = require('../func/config/config.main.json');
const moment = require('moment-timezone');

const ensureFileAndRead = (path, defaultContent = '[]') => {
    if (!fs.existsSync(path)) {
        fs.writeFileSync(path, defaultContent);
    }
    return fs.readFileSync(path, 'utf8');
};

const client = {
    api: require('../core/api/index.js'),
    config,
    mainPath: process.cwd(),
    account: {
        email: config.EMAIL,
        pass: config.PASSWORD,
        otpkey: config.OTPKEY,
        fbstate: JSON.parse(ensureFileAndRead(process.cwd() + '/core/data/fbstate.json')),
        cookie: ensureFileAndRead(process.cwd() + '/cookie.txt', ''),
        token: (() => {
            const tokensPath = process.cwd() + '/core/data/tokens.json';
            const defaultTokens = JSON.stringify({ EAAAAU: ''});
            const tokens = JSON.parse(ensureFileAndRead(tokensPath, defaultTokens));
            return {
                EAAAU: tokens.EAAAU
            };
        })()
    },
    onChat: [],
    onEvent: [],
    getTime: {
        seconds: moment.tz("Asia/Ho_Chi_Minh").format("ss"),
        minutes: moment.tz("Asia/Ho_Chi_Minh").format("mm"),
        hours: moment.tz("Asia/Ho_Chi_Minh").format("HH"),
        date: moment.tz("Asia/Ho_Chi_Minh").format("DD"),
        month: moment.tz("Asia/Ho_Chi_Minh").format("MM"),
        year: moment.tz("Asia/Ho_Chi_Minh").format("YYYY"),
        fullHour: moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss"),
        fullYear: moment.tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY"),
        fullTime: moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss DD/MM/YYYY")
    }
};

const data = {
    threadInfo: new Map(),
    threadData: new Map(),
    userName: new Map(),
    userBanned: new Map(),
    threadBanned: new Map(),
    commandBanned: new Map(),
    threadAllowNSFW: [],
    allUserID: [],
    allCurrenciesID: [],
    allThreadID: [],
    banNotifications: new Set(),
    lastCleanupDate: null,
    qtvNotifications: new Set(),
    lastQtvCleanupDate: null,
    adminOnlyNotifications: new Set(),
    lastAdminOnlyCleanupDate: null,
    groupBanNotifications: new Set(),
    lastGroupBanCleanupDate: null
};

module.exports = {
    client,
    data
};
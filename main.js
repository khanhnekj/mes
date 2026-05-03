const moment = require("moment-timezone");
const { readFileSync, writeFileSync, readdir, unlink } = require("fs-extra");
const { join, resolve, extname } = require("path");
const logger = require("./func/utils/log.js");
const { client, data } = require('./source/botClient.js');
const tools = require('./source/tools.js');
const { getThemeColors } = require("./func/utils/log.js");
const { cra, cv, cb } = getThemeColors();
const fs = require('fs');
const apis = require('./core/api/index.js');
class Main {
  constructor() {
    this.initializeGlobals();
    this.createRequiredDirectories();
    this.cleanCache();
    this.connectDatabase();
    this.handleErrorEvents();
  }

  initializeGlobals() {
    global.Seiko = {
	queues: [],
	animeQueues: [],
    cosQueues: [],
    chillQueues: [],
    traiQueues: [],     
      timeStart: Date.now() - process.uptime() * 1000,
      commands: new Map(),
      events: new Map(),
      cd: new Map(),
      onReaction: new Map(),
      onReply: new Map(),
      mainPath: process.cwd(),
      configPath: join(process.cwd(), '/func/config/config.main.json')
    };
    global.data = data;
    global.config = JSON.parse(readFileSync(global.Seiko.configPath, 'utf8'));
    global.configModule = {};
    global.moduleData = [];
    global.account = {
      email: global.config.EMAIL,
      pass: global.config.PASSWORD,
      otpkey: global.config.OTPKEY,
      fbsate: this.getFbstate(),
      cookie: this.getCookies(),
      token: this.getTokens()
    };
    global.utils = require("./func/utils/func.js");
    global.cookie = require("./source/cookieMain.js");
    global.anti = resolve(process.cwd(), 'core', 'data', 'antisetting.json');
  }

  getFbstate() {
    const fbstatePath = './core/data/fbstate.json';
    return fs.existsSync(fbstatePath)
      ? JSON.parse(readFileSync(fbstatePath, 'utf8') || '[]')
      : (writeFileSync(fbstatePath, '[]'), []);
  }

  getCookies() {
    return this.getFbstate().map(i => `${i.key}=${i.value}`).join(";");
  }

  getTokens() {
    const tokensPath = './core/data/tokens.json';
    const tokens = fs.existsSync(tokensPath)
      ? JSON.parse(readFileSync(tokensPath, 'utf8'))
      : (writeFileSync(tokensPath, '{}'), {});
    return {
      EAAAU: tokens.EAAAU,
      EAAD6V7: tokens.EAAD6V7
    };
  }

  createRequiredDirectories() {
    const requiredDirs = [
      './func/temp',
      './core/data/messageCounts', 
      './core/data/timeJoin',
      './core/data/backup/messageCounts'
    ];
    
    requiredDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.log(`Đã tạo thư mục: ${dir}`, 'SYSTEM');
      }
    });
  }

  cleanCache() {
    const dirs = ["./func/temp", "./plugins/cmds/cache"];
    const extensions = [".png", ".jpg", ".jpeg", ".mp4", ".mp3", ".m4a", ".ttf", ".gif", ".mov"];
    let totalCleaned = 0;
    
    dirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        readdir(dir, (err, files) => {
          if (err) return;
          const validFiles = files.filter(file => extensions.includes(extname(file).toLowerCase()));
          validFiles.forEach(file => {
            unlink(join(dir, file), err => {
              if (!err) totalCleaned++;
            });
          });
        });
      }
    });
    
    setTimeout(() => {
      if (totalCleaned > 0) logger.log(`Đã Dọn Dẹp ${totalCleaned} file cache`, 'SYSTEM');
    }, 100);
  }

  async connectDatabase() {
    const { sequelize, Sequelize } = require("./func/db/data/index.js");
    try {
      await sequelize.authenticate();
      const models = require('./func/db/data/model.js')({ Sequelize, sequelize });
      console.log(cv(`\n●─DATABASE─●`));
      require('./func/login/index.js')({ models, client, tools, apis });
      logger.log(`${cra(`[ CONNECT ]`)} Connected to SQLite database successfully!`, "DATABASE");
    } catch (error) {
      console.error(error);
      logger.err(`${cra(`[ CONNECT ]`)} Failed to connect to the SQLite database: ` + error, "DATABASE");
    }
  }

  handleErrorEvents() {
    process.on('unhandledRejection', (err, p) => { })
      .on('uncaughtException', err => { console.error(err); });
  }
}

new Main();
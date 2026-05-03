const cron = require('node-cron');
const fs = require('fs-extra');
const moment = require('moment-timezone');
const path = require('path');
const axios = require('axios');
const logger = require('../../func/utils/log');
const { getThemeColors } = require("../../func/utils/log");
const { cra: craColor, cv: cvColor, cb: cbColor } = getThemeColors();

module.exports = function ({ api, client, Threads, Users, cra, cv, cb }) {
  
  // ===== AUTO UPDATE THREAD DATA =====
  cron.schedule('*/10 * * * *', async () => {
    try {
      const dataFile = path.join(__dirname, '..', 'data', 'check_data.json');
    const currentTime = moment().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');
      
    let lastRunTime = null;
      if (fs.existsSync(dataFile)) {
        try {
          const { datetime } = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
      lastRunTime = datetime;
        } catch (error) {
          logger.err(`Lỗi đọc check_data.json: ${error.message}`, 'SCHEDULE');
        }
    }
      
    if (!lastRunTime || moment(currentTime).diff(moment(lastRunTime), 'minutes') >= 10) {
        const groupList = (await api.getThreadList(100, null, ['INBOX']))
          .filter(group => group.isSubscribed && group.isGroup);
        
        let updatedCount = 0;
      for (const { threadID } of groupList) {
          try {
        await Threads.setData(threadID, { threadInfo: await api.getThreadInfo(threadID) });
            updatedCount++;
          } catch (error) {
            logger.err(`Lỗi cập nhật nhóm ${threadID}: ${error.message}`, 'SCHEDULE');
          }
        }
        
        fs.writeFileSync(dataFile, JSON.stringify({ datetime: currentTime }));
        logger.log(`${craColor(`[ AUTO-UPDATE ]`)} Đã cập nhật ${updatedCount}/${groupList.length} nhóm`, 'SCHEDULE');
      }
    } catch (error) {
      logger.err(`Lỗi auto-update threads: ${error.message}`, 'SCHEDULE');
    }
  });
  
  // ===== TOKEN MANAGEMENT SYSTEM =====
  const manageTokens = async () => {
    try {
      const tokenFile = path.join(__dirname, '..', 'data', 'tokens.json');
      const tokenDir = path.dirname(tokenFile);
      
      // Đảm bảo thư mục tồn tại
      if (!fs.existsSync(tokenDir)) {
        fs.mkdirSync(tokenDir, { recursive: true });
        logger.log(`${craColor(`[ TOKEN ]`)} Đã tạo thư mục tokens`, 'SCHEDULE');
      }
      
      // Load tokens từ file
      const loadTokens = () => {
        try {
          if (fs.existsSync(tokenFile)) {
            const data = fs.readFileSync(tokenFile, 'utf8');
            return JSON.parse(data);
          }
        } catch (error) {
          logger.err(`Lỗi đọc tokens: ${error.message}`, 'SCHEDULE');
        }
        return {};
      };
      
      // Lưu tokens vào file
      const saveTokens = (tokens) => {
        try {
          fs.writeFileSync(tokenFile, JSON.stringify(tokens, null, 2), 'utf8');
          logger.log(`${craColor(`[ TOKEN ]`)} Đã lưu tokens thành công`, 'SCHEDULE');
        } catch (error) {
          logger.err(`Lỗi lưu tokens: ${error.message}`, 'SCHEDULE');
        }
      };
      
      // Validate token qua Facebook API
      const validateToken = async (token) => {
        try {
          const response = await axios.get(`https://graph.facebook.com/me?access_token=${token}`, {
            timeout: 10000
          });
          return response.data && response.data.id;
        } catch (error) {
          return false;
        }
      };
      
      const tokenTypesToMonitor = [
        { type: 'EAAAU', id: '350685531728' }
      ];
      
      let tokens = loadTokens();
      let refreshedCount = 0;
      
      for (const { type } of tokenTypesToMonitor) {
        try {
          let token = tokens[type];
          let needRefresh = false;
          
          if (token) {
            const isValid = await validateToken(token);
            if (isValid) {
              logger.log(`${cvColor(`[ TOKEN ]`)} ${type} hợp lệ`, 'SCHEDULE');
                continue;
            } else {
              needRefresh = true;
              logger.log(`${cbColor(`[ TOKEN ]`)} ${type} hết hạn, đang làm mới...`, 'SCHEDULE');
            }
          } else {
            needRefresh = true;
            logger.log(`${cbColor(`[ TOKEN ]`)} Chưa có ${type}, đang tạo mới...`, 'SCHEDULE');
          }
          
          if (needRefresh) {
            const newToken = await api.getEAAU();
            if (!newToken) {
              throw new Error('Không thể lấy token mới');
            }
            
            tokens[type] = newToken;
            saveTokens(tokens);
            refreshedCount++;
            logger.log(`${craColor(`[ TOKEN ]`)} Đã làm mới ${type}`, 'SCHEDULE');
          }
        } catch (error) {
          logger.err(`Lỗi quản lý token ${type}: ${error.message}`, 'SCHEDULE');
        }
      }
      
      if (refreshedCount > 0) {
        logger.log(`${craColor(`[ TOKEN ]`)} Đã làm mới ${refreshedCount} token(s)`, 'SCHEDULE');
      }
      
    } catch (error) {
      logger.err(`Lỗi nghiêm trọng token management: ${error.message}`, 'SCHEDULE');
    }
  };
  
  // Chạy ngay khi khởi động
  manageTokens().catch(error => 
    logger.err(`Lỗi token management khởi động: ${error.message}`, 'SCHEDULE')
  );
  
  // Chạy mỗi 2 giờ (7200000ms)
  setInterval(() => {
    manageTokens().catch(error => 
      logger.err(`Lỗi token management định kỳ: ${error.message}`, 'SCHEDULE')
    );
  }, 7200000);  

  logger.log(`${craColor(`[ SCHEDULE ]`)} Đã khởi tạo Auto-Update & Token Management`, 'SYSTEM');
};
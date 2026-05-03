const logger = require("./log.js");

/**
 * Hàm kick người dùng an toàn với error handling
 * @param {Object} api - Facebook API object
 * @param {string} userID - ID người dùng cần kick
 * @param {string} threadID - ID nhóm
 * @param {Object} options - Tùy chọn bổ sung
 * @returns {Promise<Object>} Kết quả kick
 */
async function kickUser(api, userID, threadID, options = {}) {
    try {
        // Kiểm tra tham số đầu vào
        if (!api || !userID || !threadID) {
            throw new Error("Thiếu tham số bắt buộc: api, userID, threadID");
        }

        // Kiểm tra quyền kick
        if (options.checkPermission !== false) {
            const threadInfo = await api.getThreadInfo(threadID);
            const botID = api.getCurrentUserID();
            
            // Kiểm tra bot có phải admin không
            const isBotAdmin = threadInfo.adminIDs?.some(admin => admin.id === botID);
            if (!isBotAdmin) {
                throw new Error("Bot không có quyền kick người dùng trong nhóm này");
            }

            // Kiểm tra người dùng có trong nhóm không
            const userInGroup = threadInfo.participantIDs?.includes(userID);
            if (!userInGroup) {
                throw new Error("Người dùng không có trong nhóm");
            }

            // Kiểm tra người dùng có phải admin không
            const isUserAdmin = threadInfo.adminIDs?.some(admin => admin.id === userID);
            if (isUserAdmin) {
                throw new Error("Không thể kick admin nhóm");
            }
        }

        // Thực hiện kick với retry mechanism
        let retryCount = 0;
        const maxRetries = options.maxRetries || 3;
        const retryDelay = options.retryDelay || 2000;

        while (retryCount < maxRetries) {
            try {
                logger.log(`Đang kick người dùng ${userID} khỏi nhóm ${threadID} (lần thử ${retryCount + 1})`, "Kick");
                
                await api.removeUserFromGroup(userID, threadID);
                
                logger.log(`Kick thành công người dùng ${userID} khỏi nhóm ${threadID}`, "Kick");
                
                return {
                    success: true,
                    message: "Kick thành công",
                    userID: userID,
                    threadID: threadID,
                    retryCount: retryCount
                };

            } catch (error) {
                retryCount++;
                
                // Phân tích lỗi
                const errorMessage = error.message || error.toString();
                
                // Các lỗi không nên retry
                const nonRetryableErrors = [
                    "Bot không có quyền",
                    "Người dùng không có trong nhóm",
                    "Không thể kick admin",
                    "Thiếu tham số bắt buộc"
                ];
                
                const shouldNotRetry = nonRetryableErrors.some(err => errorMessage.includes(err));
                
                if (shouldNotRetry || retryCount >= maxRetries) {
                    throw error;
                }
                
                // Lỗi có thể retry
                logger.log(`Lỗi kick lần ${retryCount}: ${errorMessage}. Thử lại sau ${retryDelay}ms...`, "Kick");
                
                if (retryCount < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            }
        }

    } catch (error) {
        const errorMessage = error.message || error.toString();
        logger.log(`Lỗi kick người dùng ${userID}: ${errorMessage}`, "Error");
        
        // Phân loại lỗi
        let errorType = "UNKNOWN";
        if (errorMessage.includes("404")) {
            errorType = "NOT_FOUND";
        } else if (errorMessage.includes("quyền")) {
            errorType = "PERMISSION_DENIED";
        } else if (errorMessage.includes("admin")) {
            errorType = "ADMIN_PROTECTED";
        } else if (errorMessage.includes("không có trong nhóm")) {
            errorType = "USER_NOT_IN_GROUP";
        }

        return {
            success: false,
            error: errorMessage,
            errorType: errorType,
            userID: userID,
            threadID: threadID
        };
    }
}

/**
 * Hàm kick nhiều người dùng cùng lúc
 * @param {Object} api - Facebook API object
 * @param {Array} userIDs - Mảng ID người dùng
 * @param {string} threadID - ID nhóm
 * @param {Object} options - Tùy chọn bổ sung
 * @returns {Promise<Object>} Kết quả kick
 */
async function kickMultipleUsers(api, userIDs, threadID, options = {}) {
    try {
        if (!Array.isArray(userIDs) || userIDs.length === 0) {
            throw new Error("userIDs phải là mảng không rỗng");
        }

        const results = [];
        const delay = options.delay || 1000; // Delay giữa các lần kick

        for (let i = 0; i < userIDs.length; i++) {
            const userID = userIDs[i];
            
            try {
                const result = await kickUser(api, userID, threadID, options);
                results.push(result);
                
                // Delay giữa các lần kick để tránh spam
                if (i < userIDs.length - 1 && delay > 0) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
                
            } catch (error) {
                results.push({
                    success: false,
                    error: error.message,
                    userID: userID,
                    threadID: threadID
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const failCount = results.length - successCount;

        logger.log(`Kick hoàn thành: ${successCount} thành công, ${failCount} thất bại`, "Kick");

        return {
            success: successCount > 0,
            total: results.length,
            successCount: successCount,
            failCount: failCount,
            results: results
        };

    } catch (error) {
        logger.log(`Lỗi kick nhiều người dùng: ${error.message}`, "Error");
        return {
            success: false,
            error: error.message,
            total: userIDs.length,
            successCount: 0,
            failCount: userIDs.length,
            results: []
        };
    }
}

/**
 * Hàm kiểm tra quyền kick
 * @param {Object} api - Facebook API object
 * @param {string} threadID - ID nhóm
 * @param {string} userID - ID người dùng cần kick
 * @returns {Promise<Object>} Thông tin quyền
 */
async function checkKickPermission(api, threadID, userID) {
    try {
        const threadInfo = await api.getThreadInfo(threadID);
        const botID = api.getCurrentUserID();
        
        const isBotAdmin = threadInfo.adminIDs?.some(admin => admin.id === botID);
        const isUserAdmin = threadInfo.adminIDs?.some(admin => admin.id === userID);
        const userInGroup = threadInfo.participantIDs?.includes(userID);
        
        return {
            canKick: isBotAdmin && !isUserAdmin && userInGroup,
            isBotAdmin: isBotAdmin,
            isUserAdmin: isUserAdmin,
            userInGroup: userInGroup,
            threadInfo: threadInfo
        };
        
    } catch (error) {
        logger.log(`Lỗi kiểm tra quyền kick: ${error.message}`, "Error");
        return {
            canKick: false,
            error: error.message
        };
    }
}

module.exports = {
    kickUser,
    kickMultipleUsers,
    checkKickPermission
};

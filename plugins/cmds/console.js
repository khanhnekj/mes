this.config = {
    name: "console",
    alias: ["console"],
    version: "1.0.0",
    role: 2,
    author: "DuyDev",
    info: "Làm đẹp console và ẩn thông tin JSON không cần thiết",
    category: "Admin",
    guides: "[on/off]",
    cd: 5,
    prefix: true
};

// Load cấu hình từ file
const fs = require('fs');
const path = require('path');
const settingsPath = path.join(process.cwd(), 'core', 'data', 'consoleSettings.json');

// Biến toàn cục để kiểm soát console
global.consoleSettings = global.consoleSettings || loadConsoleSettings();

function loadConsoleSettings() {
    try {
        if (fs.existsSync(settingsPath)) {
            return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        }
    } catch (error) {
        console.error('Lỗi load console settings:', error);
    }
    return {
        enabled: false,
        hideJson: true,
        hideMemory: false,
        hideVideoId: true,
        antiSpam: true,
        customFilters: ["video_id", "RSS:", "MB", "Giám sát"],
        whitelist: ["ERROR", "WARN", "INFO", "SUCCESS"]
    };
}

function saveConsoleSettings() {
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(global.consoleSettings, null, 2));
    } catch (error) {
        console.error('Lỗi save console settings:', error);
    }
}

// Override console.log để lọc thông tin
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Hàm kiểm tra xem có phải JSON array không
function isJsonArray(str) {
    if (!global.consoleSettings.hideJson) return false;
    try {
        const parsed = JSON.parse(str);
        return Array.isArray(parsed);
    } catch {
        return false;
    }
}

// Hàm kiểm tra xem có phải thông tin memory không
function isMemoryInfo(str) {
    if (!global.consoleSettings.hideMemory) return false;
    return str.includes('RAM đang sử dụng') || 
           str.includes('RSS:') || 
           (str.includes('MB') && str.includes('Giám sát'));
}

// Hàm kiểm tra xem có phải video_id array không
function isVideoIdArray(str) {
    if (!global.consoleSettings.hideVideoId) return false;
    return str.includes("'video_id'") || 
           (str.includes('[') && str.includes('video_id') && str.includes(']'));
}

// Hàm kiểm tra custom filters
function matchesCustomFilters(str) {
    if (!global.consoleSettings.customFilters) return false;
    return global.consoleSettings.customFilters.some(filter => str.includes(filter));
}

// Hàm kiểm tra whitelist
function isWhitelisted(str) {
    if (!global.consoleSettings.whitelist) return false;
    return global.consoleSettings.whitelist.some(item => str.includes(item));
}

// Override console.log
console.log = function(...args) {
    if (!global.consoleSettings.enabled) {
        return originalConsoleLog.apply(console, args);
    }

    const message = args.join(' ');
    
    // Kiểm tra whitelist trước (ưu tiên hiển thị)
    if (isWhitelisted(message)) {
        return originalConsoleLog.apply(console, args);
    }
    
    // Ẩn JSON arrays
    if (isJsonArray(message)) {
        return;
    }
    
    // Ẩn video_id arrays
    if (isVideoIdArray(message)) {
        return;
    }
    
    // Ẩn thông tin memory nếu được bật
    if (isMemoryInfo(message)) {
        return;
    }
    
    // Ẩn custom filters
    if (matchesCustomFilters(message)) {
        return;
    }
    
    // Hiển thị thông tin đã được lọc
    originalConsoleLog.apply(console, args);
};

// Override console.error
console.error = function(...args) {
    if (!global.consoleSettings.enabled) {
        return originalConsoleError.apply(console, args);
    }
    
    const message = args.join(' ');
    
    // Vẫn hiển thị lỗi nhưng có thể lọc một số thông tin không cần thiết
    if (global.consoleSettings.hideJson && isJsonArray(message)) {
        return;
    }
    
    originalConsoleError.apply(console, args);
};

// Override console.warn
console.warn = function(...args) {
    if (!global.consoleSettings.enabled) {
        return originalConsoleWarn.apply(console, args);
    }
    
    const message = args.join(' ');
    
    if (global.consoleSettings.hideJson && isJsonArray(message)) {
        return;
    }
    
    originalConsoleWarn.apply(console, args);
};

this.onCall = async function({ api, event, args, Threads, client }) {
    const { threadID: tid, messageID: mid, senderID: sid } = event;
    const action = args[0] ? args[0].toLowerCase() : "status";
    
    try {
        switch (action) {
            case "on":
            case "enable":
                global.consoleSettings.enabled = true;
                saveConsoleSettings();
                return api.sendMessage(
                    "✅ **Console Filter đã được BẬT**\n\n" +
                    "🔹 Ẩn JSON arrays: " + (global.consoleSettings.hideJson ? "✅" : "❌") + "\n" +
                    "🔹 Ẩn thông tin Memory: " + (global.consoleSettings.hideMemory ? "✅" : "❌") + "\n" +
                    "🔹 Ẩn Video ID: " + (global.consoleSettings.hideVideoId ? "✅" : "❌") + "\n" +
                    "🔹 Chống spam: " + (global.consoleSettings.antiSpam ? "✅" : "❌") + "\n\n" +
                    "💡 Sử dụng `.console config` để tùy chỉnh",
                    tid, mid
                );
                
            case "off":
            case "disable":
                global.consoleSettings.enabled = false;
                saveConsoleSettings();
                return api.sendMessage(
                    "❌ **Console Filter đã được TẮT**\n\n" +
                    "Tất cả thông tin console sẽ hiển thị bình thường",
                    tid, mid
                );
                
            case "config":
            case "setting":
                const configMsg = "⚙️ **Cấu hình Console Filter**\n\n" +
                    "🔹 Trạng thái: " + (global.consoleSettings.enabled ? "✅ BẬT" : "❌ TẮT") + "\n" +
                    "🔹 Ẩn JSON: " + (global.consoleSettings.hideJson ? "✅" : "❌") + "\n" +
                    "🔹 Ẩn Memory: " + (global.consoleSettings.hideMemory ? "✅" : "❌") + "\n" +
                    "🔹 Ẩn Video ID: " + (global.consoleSettings.hideVideoId ? "✅" : "❌") + "\n" +
                    "🔹 Anti-spam: " + (global.consoleSettings.antiSpam ? "✅" : "❌") + "\n\n" +
                    "**Lệnh tùy chỉnh:**\n" +
                    "• `.console json on/off` - Bật/tắt ẩn JSON\n" +
                    "• `.console memory on/off` - Bật/tắt ẩn Memory\n" +
                    "• `.console video on/off` - Bật/tắt ẩn Video ID\n" +
                    "• `.console spam on/off` - Bật/tắt chống spam";
                return api.sendMessage(configMsg, tid, mid);
                
            case "json":
                const jsonAction = args[1] ? args[1].toLowerCase() : "status";
                if (jsonAction === "on" || jsonAction === "enable") {
                    global.consoleSettings.hideJson = true;
                    saveConsoleSettings();
                    return api.sendMessage("✅ Đã bật ẩn JSON arrays trong console", tid, mid);
                } else if (jsonAction === "off" || jsonAction === "disable") {
                    global.consoleSettings.hideJson = false;
                    saveConsoleSettings();
                    return api.sendMessage("❌ Đã tắt ẩn JSON arrays trong console", tid, mid);
                } else {
                    return api.sendMessage(
                        "🔹 Ẩn JSON arrays: " + (global.consoleSettings.hideJson ? "✅ BẬT" : "❌ TẮT") + "\n" +
                        "Sử dụng: `.console json on/off`",
                        tid, mid
                    );
                }
                
            case "video":
                const videoAction = args[1] ? args[1].toLowerCase() : "status";
                if (videoAction === "on" || videoAction === "enable") {
                    global.consoleSettings.hideVideoId = true;
                    saveConsoleSettings();
                    return api.sendMessage("✅ Đã bật ẩn Video ID arrays trong console", tid, mid);
                } else if (videoAction === "off" || videoAction === "disable") {
                    global.consoleSettings.hideVideoId = false;
                    saveConsoleSettings();
                    return api.sendMessage("❌ Đã tắt ẩn Video ID arrays trong console", tid, mid);
                } else {
                    return api.sendMessage(
                        "🔹 Ẩn Video ID arrays: " + (global.consoleSettings.hideVideoId ? "✅ BẬT" : "❌ TẮT") + "\n" +
                        "Sử dụng: `.console video on/off`",
                        tid, mid
                    );
                }
                
            case "memory":
                const memoryAction = args[1] ? args[1].toLowerCase() : "status";
                if (memoryAction === "on" || memoryAction === "enable") {
                    global.consoleSettings.hideMemory = true;
                    saveConsoleSettings();
                    return api.sendMessage("✅ Đã bật ẩn thông tin Memory trong console", tid, mid);
                } else if (memoryAction === "off" || memoryAction === "disable") {
                    global.consoleSettings.hideMemory = false;
                    saveConsoleSettings();
                    return api.sendMessage("❌ Đã tắt ẩn thông tin Memory trong console", tid, mid);
                } else {
                    return api.sendMessage(
                        "🔹 Ẩn Memory info: " + (global.consoleSettings.hideMemory ? "✅ BẬT" : "❌ TẮT") + "\n" +
                        "Sử dụng: `.console memory on/off`",
                        tid, mid
                    );
                }
                
            case "spam":
                const spamAction = args[1] ? args[1].toLowerCase() : "status";
                if (spamAction === "on" || spamAction === "enable") {
                    global.consoleSettings.antiSpam = true;
                    saveConsoleSettings();
                    return api.sendMessage("✅ Đã bật chống spam console", tid, mid);
                } else if (spamAction === "off" || spamAction === "disable") {
                    global.consoleSettings.antiSpam = false;
                    saveConsoleSettings();
                    return api.sendMessage("❌ Đã tắt chống spam console", tid, mid);
                } else {
                    return api.sendMessage(
                        "🔹 Anti-spam: " + (global.consoleSettings.antiSpam ? "✅ BẬT" : "❌ TẮT") + "\n" +
                        "Sử dụng: `.console spam on/off`",
                        tid, mid
                    );
                }
                
            case "status":
            default:
                const statusMsg = "📊 **Trạng thái Console Filter**\n\n" +
                    "🔹 **Tổng quan:** " + (global.consoleSettings.enabled ? "✅ ĐANG HOẠT ĐỘNG" : "❌ ĐÃ TẮT") + "\n\n" +
                    "**Các tính năng:**\n" +
                    "• Ẩn JSON arrays: " + (global.consoleSettings.hideJson ? "✅" : "❌") + "\n" +
                    "• Ẩn Memory info: " + (global.consoleSettings.hideMemory ? "✅" : "❌") + "\n" +
                    "• Ẩn Video ID: " + (global.consoleSettings.hideVideoId ? "✅" : "❌") + "\n" +
                    "• Chống spam: " + (global.consoleSettings.antiSpam ? "✅" : "❌") + "\n\n" +
                    "**Lệnh sử dụng:**\n" +
                    "• `.console on/off` - Bật/tắt filter\n" +
                    "• `.console config` - Xem cấu hình\n" +
                    "• `.console json on/off` - Tùy chỉnh JSON\n" +
                    "• `.console memory on/off` - Tùy chỉnh Memory\n" +
                    "• `.console video on/off` - Tùy chỉnh Video ID\n" +
                    "• `.console spam on/off` - Tùy chỉnh Anti-spam";
                return api.sendMessage(statusMsg, tid, mid);
        }
    } catch (error) {
        return api.sendMessage("❌ Có lỗi xảy ra: " + error.message, tid, mid);
    }
};

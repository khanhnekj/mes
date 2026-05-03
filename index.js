const { spawn } = require("child_process");
const logger = require("./func/logger.js");
const chalk = require("chalk");
const moment = require("moment-timezone");

// Hiển thị thông tin hệ thống nâng cao
const showSystemInfo = () => {
    const now = moment.tz("Asia/Ho_Chi_Minh");
    const nodeVersion = process.version;
    const platform = process.platform;
    const arch = process.arch;
    
    console.log(chalk.cyan("") + chalk.gray("OS: ") + chalk.yellow(platform + " " + arch) + chalk.cyan(""));
    console.log(chalk.cyan("") + chalk.gray("Node.js: ") + chalk.green(nodeVersion) + chalk.cyan(""));
    console.log(chalk.cyan("") + chalk.gray("Folder: ") + chalk.blue(__dirname) + chalk.cyan(""));
    console.log(chalk.cyan("") + chalk.gray("Time: ") + chalk.white(now.format("HH:mm:ss - DD/MM/YYYY")) + chalk.cyan(""));
};

// Hiển thị trạng thái khởi động
const showStartupStatus = (status, message) => {
    const timestamp = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss");
    const statusIcon = {
        "info": "[INFO]",
        "success": "[OK]", 
        "warning": "[WARN]",
        "error": "[ERROR]",
        "loading": "[LOAD]"
    };
    
    const statusColor = {
        "info": chalk.blue,
        "success": chalk.green,
        "warning": chalk.yellow, 
        "error": chalk.red,
        "loading": chalk.cyan
    };
    
    console.log(chalk.gray(`[${timestamp}] `) + statusColor[status](`${statusIcon[status]} ${message}`));
};

// Hàm khởi động bot
const startBot = () => {
    // Hiển thị thông tin hệ thống
    console.clear();
    showSystemInfo();
    
    // Thông báo khởi động
    //showStartupStatus("loading", "Đang khởi động HaruBot V6...");
    
    const child = spawn("node", ["--trace-warnings", "--async-stack-traces", "main.js"], {
        cwd: __dirname,
        stdio: "inherit",
        shell: true
    });

    child.on("close", async (exitCode) => {
        if (exitCode === 1) {
            showStartupStatus("warning", "Bot gặp lỗi, đang khởi động lại...");
            setTimeout(() => startBot(), 2000);
        } else if (exitCode >= 200 && exitCode < 300) {
            const delay = (exitCode - 200) * 1000;
            showStartupStatus("info", `Bot đã được kích hoạt, chờ ${delay / 1000} giây...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            startBot();
        } else if (exitCode === 134) {
            showStartupStatus("error", "Bot gặp lỗi nghiêm trọng, đang khởi động lại...");
            setTimeout(() => startBot(), 5000);
        } else {
            showStartupStatus("info", `Bot đã dừng với mã thoát: ${exitCode}`);
            process.exit(0);
        }
    });

    child.on("error", (error) => {
        showStartupStatus("error", `Lỗi khởi động: ${error.message}`);
    });
    
    // Xử lý tín hiệu dừng
    process.on('SIGINT', () => {
        showStartupStatus("warning", "Nhận tín hiệu dừng, đang thoát...");
        child.kill('SIGINT');
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        showStartupStatus("warning", "Nhận tín hiệu kết thúc, đang thoát...");
        child.kill('SIGTERM');
        process.exit(0);
    });
};

// Bắt đầu chương trình
startBot();
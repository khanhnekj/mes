const fs = require('fs');
const path = require('path');
const axios = require('axios');

this.config = {
  name: "api",
  alias: ["apis", "apilink"],
  version: "4.0.0",
  role: 2,
  author: "Vtuan (Converted by AI)",
  info: "Quản lý file API links",
  category: "Admin",
  guides: "[add/check/cr/rm/gf]",
  cd: 3,
  prefix: true
};

this.onCall = async ({ api, event, args }) => {
  try {
    const pathApi = path.join(__dirname, '../../core/data/media');

    // Đảm bảo thư mục tồn tại
    if (!fs.existsSync(pathApi)) {
      fs.mkdirSync(pathApi, { recursive: true });
    }

    if (!args[0]) {
      const files = fs.readdirSync(pathApi).filter(file => file.endsWith('.json'));
      const totalFiles = files.length;
      let totalLines = 0;

      for (const file of files) {
        const filePath = path.join(pathApi, file);
        const lines = fs.readFileSync(filePath, 'utf8').split(/\r\n|\r|\n/).length;
        totalLines += lines;
      }

      const helpMsg = `[ API MANAGER ]\n\n` +
                     `Commands:\n` +
                     `• ${global.config.PREFIX}api add - Upload media\n` +
                     `• ${global.config.PREFIX}api check - List files\n` +
                     `• ${global.config.PREFIX}api cr <name> - Create file\n` +
                     `• ${global.config.PREFIX}api rm <name> - Delete file\n` +
                     `• ${global.config.PREFIX}api gf <name> - Share file\n\n` +
                     `Stats: ${totalFiles} files, ${totalLines} lines\n\n` +
                     `Reply [rm/cr/gf/check] + number`;

      return api.sendMessage(helpMsg, event.threadID, (err, info) => {
        if (!err) {
          global.Seiko.onReply.set(info.messageID, {
            commandName: this.config.name,
            type: 'api',
            author: event.senderID
          });
        }
      });
    }

    const subCommand = args[0].toLowerCase();

    if (subCommand === "add") {
      if (!event.messageReply) {
        return api.sendMessage(`❎ Reply media + tên file`, event.threadID);
      }

      let fileName = "api.json";
      if (args.length > 1) {
        fileName = args.slice(1).join("_") + ".json";
      }

      const filePath = path.join(pathApi, fileName);

      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, "[]", "utf-8");
      }

      let existingData = [];
      try {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        if (fileContent.trim()) {
          existingData = JSON.parse(fileContent);
        }
      } catch (error) {
        console.log("Warning: File corrupted, using empty array");
        existingData = [];
      }

      let uploadedLinks = "";
      for (let attachment of event.messageReply.attachments) {
        try {
          const response = await axios.get(
            `https://tk-catbox.up.railway.app/upload?url=${encodeURIComponent(attachment.url)}`
          );
          uploadedLinks += `${response.data.url}\n`;
        } catch (error) {
          console.log(`Error uploading ${attachment.url}:`, error.message);
        }
      }

      if (uploadedLinks.trim()) {
        const newLinks = uploadedLinks.split("\n").filter(Boolean);
        existingData = existingData.concat(newLinks);
        fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), "utf-8");
        api.sendMessage(`✅ Đã thêm ${newLinks.length} links vào ${fileName}`, event.threadID);
      } else {
        api.sendMessage("❎ Upload thất bại", event.threadID);
      }
      return;

    } else if (subCommand === "cr") {
      if (args.length === 1) {
        return api.sendMessage(`❎ Nhập tên file cần tạo`, event.threadID);
      }

      let fileName = args.slice(1).join("_") + ".json";
      const filePath = path.join(pathApi, fileName);

      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, "[]", "utf-8");
        api.sendMessage(`✅ Đã tạo file ${fileName}`, event.threadID);
      } else {
        api.sendMessage(`❎ File ${fileName} đã tồn tại`, event.threadID);
      }
      return;

    } else if (subCommand === "rm") {
      if (args.length === 1) {
        return api.sendMessage(`❎ Nhập tên file cần xóa`, event.threadID);
      }

      let fileName = args.slice(1).join("_") + ".json";
      const filePath = path.join(pathApi, fileName);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        api.sendMessage(`✅ Đã xóa file ${fileName}`, event.threadID);
      } else {
        api.sendMessage(`❎ Không tìm thấy file ${fileName}`, event.threadID);
      }
      return;

    } else if (subCommand === "gf") {
      if (args.length === 1) {
        return api.sendMessage(`❎ Nhập tên file cần chia sẻ`, event.threadID);
      }

      const fileName = args[1].toLowerCase() + ".json";
      const filePath = path.join(pathApi, fileName);

      if (fs.existsSync(filePath)) {
        try {
          const fileContent = fs.readFileSync(filePath, "utf-8");
          const response = await axios.post(
            "https://api.mocky.io/api/mock",
            {
              status: 200,
              content: fileContent,
              content_type: "application/json",
              charset: "UTF-8",
              secret: "NguyenMinhHuy",
              expiration: "never",
            }
          );
          api.sendMessage(`✅ ${fileName}: ${response.data.link}`, event.threadID);
        } catch (error) {
          api.sendMessage(`❎ Lỗi chia sẻ file ${fileName}`, event.threadID);
        }
      } else {
        api.sendMessage(`❎ Không tìm thấy file ${fileName}`, event.threadID);
      }
      return;

    } else if (subCommand === "check") {
      if (args.length < 2) {
        const files = fs.readdirSync(pathApi).filter(file => file.endsWith('.json'));

        if (files.length > 0) {
          const fileList = files.map((file, index) => {
            const filePath = path.join(pathApi, file);
            const lineCount = fs.readFileSync(filePath, "utf-8").split(/\r\n|\r|\n/).length;
            return `${index + 1}. ${file.replace('.json', '')} (${lineCount} links)`;
          }).join("\n");

          const message = await api.sendMessage(
            `📂 DANH SÁCH FILE API\n\n${fileList}\n\nReply [rm/cr/gf/check] + số`,
            event.threadID
          );

          global.Seiko.onReply.set(message.messageID, {
            commandName: this.config.name,
            type: 'list',
            author: event.senderID,
            files: files
          });
        } else {
          api.sendMessage(`❎ Không tìm thấy file API nào`, event.threadID);
        }
        return;
      } else {
        // Check specific file
        const fileName = args[1].toLowerCase() + ".json";
        const filePath = path.join(pathApi, fileName);

        if (!fs.existsSync(filePath)) {
          return api.sendMessage(`❎ Không tìm thấy file ${fileName}`, event.threadID);
        }

        try {
          const fileContent = fs.readFileSync(filePath, "utf-8");
          const jsonData = JSON.parse(fileContent);

          const brokenLinks = await Promise.all(
            jsonData.map(async (link) => {
              try {
                const response = await axios.head(link);
                if (response.status === 404) return link;
              } catch (error) {
                return link;
              }
            })
          );

          const deadLinks = brokenLinks.filter(Boolean);
          const liveLinks = jsonData.length - deadLinks.length;

          const message = `🔍 KIỂM TRA ${fileName}\n\n` +
                         `✅ Live: ${liveLinks}\n` +
                         `❎ Dead: ${deadLinks.length}\n\n` +
                         `React 👍 để xóa link chết`;

          api.sendMessage(message, event.threadID, (err, info) => {
            if (!err) {
              global.Seiko.onReaction.set(info.messageID, {
                commandName: this.config.name,
                type: 'check',
                filePath: filePath,
                deadLinks: deadLinks,
                author: event.senderID
              });
            }
          });
        } catch (error) {
          api.sendMessage(`❎ Lỗi kiểm tra file ${fileName}`, event.threadID);
        }
        return;
      }

    } else {
      api.sendMessage(`❎ Lệnh không hợp lệ`, event.threadID);
    }

  } catch (error) {
    console.error("[API] Lỗi:", error.message);
    api.sendMessage("❎ Đã xảy ra lỗi", event.threadID);
  }
};

this.onReply = async function ({ event, api, Reply }) {
  try {
    const { threadID, body } = event;
    const args = body.split(" ");
    const pathApi = path.join(__dirname, '../../core/data/media');

    if (Reply.type === "list") {
      const index = parseInt(args[1]) - 1;

      if (index >= 0 && index < Reply.files.length) {
        const selectedFile = Reply.files[index];
        const filePath = path.join(pathApi, selectedFile);

        if (args[0].toLowerCase() === "rm") {
          fs.unlinkSync(filePath);
          api.sendMessage(`✅ Đã xóa file ${selectedFile}`, threadID);
        } else if (args[0].toLowerCase() === "cr") {
          if (args.length === 1) {
            return api.sendMessage(`❎ Nhập tên file cần tạo`, threadID);
          }
          let fileName = args.slice(1).join("_") + ".json";
          const newFilePath = path.join(pathApi, fileName);
          if (!fs.existsSync(newFilePath)) {
            fs.writeFileSync(newFilePath, "[]", "utf-8");
            api.sendMessage(`✅ Đã tạo file ${fileName}`, threadID);
          } else {
            api.sendMessage(`❎ File ${fileName} đã tồn tại`, threadID);
          }
        } else if (args[0].toLowerCase() === "gf") {
          try {
            const fileContent = fs.readFileSync(filePath, "utf-8");
            const response = await axios.post(
              "https://api.mocky.io/api/mock",
              {
                status: 200,
                content: fileContent,
                content_type: "application/json",
                charset: "UTF-8",
                secret: "NguyenMinhHuy",
                expiration: "never",
              }
            );
            api.sendMessage(`✅ ${selectedFile}: ${response.data.link}`, threadID);
          } catch (error) {
            api.sendMessage(`❎ Lỗi chia sẻ file ${selectedFile}`, threadID);
          }
        } else if (args[0].toLowerCase() === "check") {
          try {
            const fileContent = fs.readFileSync(filePath, "utf-8");
            const jsonData = JSON.parse(fileContent);

            const brokenLinks = await Promise.all(
              jsonData.map(async (link) => {
                try {
                  const response = await axios.head(link);
                  if (response.status === 404) return link;
                } catch (error) {
                  return link;
                }
              })
            );

            const deadLinks = brokenLinks.filter(Boolean);
            const liveLinks = jsonData.length - deadLinks.length;

            const message = `🔍 KIỂM TRA ${selectedFile}\n\n` +
                           `✅ Live: ${liveLinks}\n` +
                           `❎ Dead: ${deadLinks.length}\n\n` +
                           `React 👍 để xóa link chết`;

            api.sendMessage(message, threadID, (err, info) => {
              if (!err) {
                global.Seiko.onReaction.set(info.messageID, {
                  commandName: this.config.name,
                  type: 'check',
                  filePath: filePath,
                  deadLinks: deadLinks,
                  author: event.senderID
                });
              }
            });
          } catch (error) {
            api.sendMessage(`❎ Lỗi kiểm tra file ${selectedFile}`, threadID);
          }
        } else {
          api.sendMessage("❎ Lệnh không hợp lệ", threadID);
        }
      } else {
        api.sendMessage("❎ Số không hợp lệ", threadID);
      }

    } else if (Reply.type === "api") {
      if (args[0].toLowerCase() === "cr") {
        if (args.length === 1) {
          return api.sendMessage(`❎ Nhập tên file cần tạo`, threadID);
        }

        let fileName = args.slice(1).join("_") + ".json";
        const filePath = path.join(pathApi, fileName);

        if (!fs.existsSync(filePath)) {
          fs.writeFileSync(filePath, "[]", "utf-8");
          api.sendMessage(`✅ Đã tạo file ${fileName}`, threadID);
        } else {
          api.sendMessage(`❎ File ${fileName} đã tồn tại`, threadID);
        }
      }
    }

  } catch (error) {
    console.error("[API] Reply Lỗi:", error.message);
    api.sendMessage("❎ Đã xảy ra lỗi", event.threadID);
  }
};

this.onReaction = async function ({ event, api, Reaction }) {
  if (event.userID != Reaction.author) return;

  try {
    if (Reaction.type === 'check') {
      const { filePath, deadLinks } = Reaction;

      if (filePath && Array.isArray(deadLinks) && deadLinks.length > 0) {
        let fileContent = fs.readFileSync(filePath, "utf-8");
        let jsonData = JSON.parse(fileContent);
        const initialCount = jsonData.length;
        jsonData = jsonData.filter((link) => !deadLinks.includes(link));
        const removedCount = initialCount - jsonData.length;

        fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), "utf-8");
        api.sendMessage(`✅ Đã xóa ${removedCount} link chết`, event.threadID);
      }
    }
  } catch (error) {
    console.error("[API] Reaction Lỗi:", error.message);
    api.sendMessage("❎ Lỗi xóa link chết", event.threadID);
  }
};
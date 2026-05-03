module.exports = function({ api }) {
  async function sendBangGia(threadID, message) {
    try {
     const banggiaPath = process.cwd() + '/modules/commands/banggia.js';
      delete require.cache[require.resolve(banggiaPath)];
      const banggiaModule = require(banggiaPath);
      const imagePath = await banggiaModule.createBangGiaImage();
      const fullMessage = `${message}━━━━━━━━━━━━━━━━━━━\n💡 Reply ảnh bảng giá với số tiền gói muốn thuê\n⚠️ Hệ thống sẽ tự động tạo QR thanh toán`;
      await api.sendMessage(
        { body: fullMessage, attachment: fs.createReadStream(imagePath) },
        threadID,
        () => {
          try { fs.unlinkSync(imagePath); } catch {}
        }
      );
    } catch (error) {
      console.error('Lỗi khi gửi bảng giá:', error);
      api.sendMessage(message + "\n\n⚠️ Không thể tải bảng giá. Vui lòng liên hệ Admin!", threadID);
    }
  }
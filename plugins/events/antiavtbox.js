const fs = require("fs");

module.exports = {
    config: {
        name: "antiBox",
        eventType: ["log:thread-change"], // Event thay đổi thông tin nhóm
        version: "1.0.0",
        author: "DongDev",
        info: "Chống đổi ảnh nhóm"
    },

    onCall: async function({ event, api }) {
        try {
            const { logMessageData, author, threadID } = event;
            if (!logMessageData) return;

            const botID = await api.getCurrentUserID();
            if (author === botID) return;

            if (!global.anti) return;
            let dataAnti = {};
            try {
                dataAnti = JSON.parse(fs.readFileSync(global.anti, "utf8"));
            } catch (e) {
                console.error('[ANTIBOX] Không đọc được file anti:', e.message);
                return;
            }

            // Kiểm tra thread có bật antiBox không
            if (!dataAnti.antiBox?.[threadID]) return;

            const { CHANGE_TYPE, NEW_IMAGE } = logMessageData;
            if (!CHANGE_TYPE) return;

            // Chỉ quan tâm tới thay đổi ảnh nhóm
            if (CHANGE_TYPE === "thread_image") {
                // Lấy ảnh cũ từ dataAnti (cần lưu trước ảnh gốc)
                const oldImage = dataAnti.antiBox[threadID].image;
                if (!oldImage) return;

                // Khôi phục ảnh cũ
                await api.changeThreadImage(threadID, oldImage);

                // Gỡ quyền admin người thực hiện nếu muốn (tùy ý)
                // await api.changeAdminStatus(threadID, author, false);

                console.log(`[ANTIBOX] ${author} đã đổi ảnh nhóm. Khôi phục ảnh cũ.`);
            }

        } catch (error) {
            console.error('[ANTIBOX] Lỗi:', error);
        }
    }
};

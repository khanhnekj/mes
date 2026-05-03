module.exports = {
    config: {
        name: "ping",
        alias: ['all'],
        version: "1.0.5",
        role: 1,
        desc: "Tag toàn bộ thành viên",
        category: "Quản trị viên",
        guide: "{pn} [Nội dung]\n\n" +
            "- [Nội dung]: Nội dung tin nhắn muốn gửi kèm tag (không bắt buộc)\n\n" +
            "Ví dụ:\n" +
            "- {pn} Họp nhóm lúc 8h tối nay\n" +
            "- {pn}",
        cd: 0,
    },
    onCall: async function ({ api, msg, event, args }) {
        const { participantIDs } = event;
        const lengthAllUser = participantIDs.length;
        const mentions = [];
        let body = args.join(" ") || "@all";
        let bodyLength = body.length;
        let i = 0;
        for (const uid of participantIDs) {
            let fromIndex = 0;
            if (bodyLength < lengthAllUser) {
                body += body[bodyLength - 1];
                bodyLength++;
            }
            if (body.slice(0, i).lastIndexOf(body[i]) != -1) fromIndex = i;
            mentions.push({
                tag: body[i],
                id: uid, fromIndex
            });
            i++;
        }
        msg.reply({ body, mentions });
    }
};
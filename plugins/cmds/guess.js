this.config = {
    name: "guess",
    alias: ['guess'],
    version: "1.0.0",
    role: 0,
    author: "Niio-team (Vtuan)",
    info: "Trò chơi đoán số",
    category: "Game",
    guides: "No",
    cd: 5,
    prefix: true
};

function rd() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

function Number($) {
    let $_ = $.toString();
    let _ = $_.split('.');
    let i = _[0];
    let $0 = _.length > 1 ? '.' + _[1] : '';
    let $$ = /(-?\d+)(\d{3})/;
    while ($$.test(i)) {
        i = i.replace($$, '$1,$2');
    }
    return i + $0;
}

this.onCall = async ({ api, event, args }) => {
    const num = rd();
    //console.log(num);
    api.sendMessage(`Hãy đoán một số có 4 chữ số\nReply vào tin nhắn này "gợi ý" hoặc đáp án của bạn để xem gợi ý hoặc trả lời!`, event.threadID, (err, info) => {
        if (err) return console.error(err);
        global.Seiko.onReply.set(info.messageID, {
            commandName: module.exports.config.name,
            author: event.senderID,
            messageID: info.messageID,
            threadID: event.threadID,
            num,
            at: 0
        });
    });
}

this.onReply = async function ({ api, event, Reply, Currencies }) {
    if (event.senderID !== Reply.author) return;

    const guess = event.body;
    const num = Reply.num;

    if (event.body.toLowerCase() === "gợi ý") {
        const coinsdown = 20000;
        let balance = (await Currencies.getData(event.senderID)).money;
        if (coinsdown > balance) {
            return api.sendMessage(`Số dư không đủ ${coinsdown.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")} VND để xem gợi ý`, event.threadID, event.messageID);
        }
        await Currencies.decreaseMoney(event.senderID, coinsdown);

        const cặc = Math.floor((num - 900) / 100) * 100;
        const lồn = Math.ceil((parseInt(num, 10) + 1000) / 100) * 100;

        let hint = num.split('').map((digit, index) => index === 1 ? digit : '_').join(' ');
        if (Reply.messageID) api.unsendMessage(Reply.messageID)
        return api.sendMessage(`Gợi ý: số nằm trong khoảng từ ${cặc} - ${lồn}\nsố ${hint}`, event.threadID, (err, info) => {
            if (err) return console.error(err);
            global.Seiko.onReply.set(info.messageID, {
            commandName: module.exports.config.name,
                author: event.senderID,
                messageID: info.messageID,
                threadID: event.threadID,
                num,
                at: Reply.at
            });
        });
    }

    if (guess.length !== 4 || isNaN(guess)) {
        if (Reply.messageID) api.unsendMessage(Reply.messageID)
        return api.sendMessage(`Vui lòng đoán một số có 4 chữ số\nReply vào tin nhắn này để trả lời!`, event.threadID, (err, info) => {
            if (err) return console.error(err);
            global.Seiko.onReply.set(info.messageID, {
            commandName: module.exports.config.name,
                author: event.senderID,
                messageID: info.messageID,
                threadID: event.threadID,
                num,
                at: Reply.at
            });
        });
    }

    const money = 1000000; // 1 triệu
    let $ = 0;

    for (let i = 0; i < guess.length; i++) {
        if (guess[i] === num[i]) {
            $++;
        }
    }

    if (guess === num) {
        api.unsendMessage(Reply.messageID);
        await Currencies.increaseMoney(event.senderID, money - Reply.at * 50000);
        return api.sendMessage(`Bạn đã đoán đúng số: ${num}\nBạn nhận được ${Number(money - Reply.at * 50000)} VND`, event.threadID, event.messageID);
    } else {
        if (money - Reply.at * 50000 <= 0) {
            api.unsendMessage(Reply.messageID);
            return api.sendMessage(`Bạn thua!`, event.threadID);
        }
        Reply.at += 1;
        api.unsendMessage(Reply.messageID);
        return api.sendMessage(`Có ${$} chữ số đúng ở vị trí chính xác\nSố lần đoán: ${Reply.at}\nReply vào tin nhắn này để trả lời!`, event.threadID, (err, info) => {
            if (err) return console.error(err);
            global.Seiko.onReply.set(info.messageID, {
            commandName: module.exports.config.name,
                author: event.senderID,
                messageID: info.messageID,
                threadID: event.threadID,
                num,
                at: Reply.at
            });
        });
    }
}
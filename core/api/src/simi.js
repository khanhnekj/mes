const fs = require('fs');
const path = require('path');
const stringSimilarity = require('string-similarity');

const dataSimPath = path.join(__dirname, 'data', 'data_simi.json');

if (!fs.existsSync(dataSimPath)) fs.writeFileSync(dataSimPath, '[]', 'utf-8');

let dataSim = require(dataSimPath);

const saveDataSim = () => {
  fs.writeFileSync(dataSimPath, JSON.stringify(dataSim, null, 2), 'utf-8');
};

const clearRequireCache = (modulePath) => {
  delete require.cache[require.resolve(modulePath)];
};

const loadDataSim = () => {
  clearRequireCache(dataSimPath);
  dataSim = require(dataSimPath);
};

const normalizeString = (str) => {
  return str.toLowerCase().trim();
};

const simi = {
 ask: (data) => {
    if (typeof data !== 'string' || !data.trim()) {
        return { answer: "Vui lòng cung cấp một câu hỏi hợp lệ." };
    }

    const ask = normalizeString(data);
    loadDataSim();

    const messages = dataSim.map(entry => normalizeString(entry.ask));
    const checker = stringSimilarity.findBestMatch(ask, messages);
    const threshold = 0.5;

    if (checker.bestMatch.rating < threshold) {
        return;
    }

    const bestMatch = checker.bestMatch.target;
    const matches = dataSim.filter(i => normalizeString(i.ask) === normalizeString(bestMatch));

    if (!matches.length) {
        return { answer: "Xin lỗi, mình không tìm thấy câu trả lời phù hợp." };
    }

    const randomMatch = matches[Math.floor(Math.random() * matches.length)];
    const answer = randomMatch.ans[Math.floor(Math.random() * randomMatch.ans.length)];

    return { answer };
},

  teach: (data) => {
    const { ask, ans } = data;

    if (!ask || !ans) {
      return { error: 'Thiếu dữ liệu để thực thi lệnh' };
    }

    const cleanedAsk = normalizeString(ask);
    loadDataSim();

    const existingQuestion = dataSim.find(entry => normalizeString(entry.ask) === cleanedAsk);

    if (existingQuestion) {
      if (existingQuestion.ans.includes(ans)) {
        return { error: 'Câu trả lời này đã tồn tại cho câu hỏi này.' };
      }
      existingQuestion.ans.push(ans);
    } else {
      dataSim.push({ id: dataSim.length, ask: cleanedAsk, ans: [ans] });
    }

    saveDataSim();
    return { msg: 'Dạy thành công!', data: { ask: cleanedAsk, ans } };
  },

  delete: (data) => {
    const { ask, ans } = data;

    if (!ask || !ans) {
      return { error: 'Thiếu dữ liệu để thực thi lệnh' };
    }

    const cleanedAsk = normalizeString(ask);
    loadDataSim();

    const existingQuestion = dataSim.find(entry => normalizeString(entry.ask) === cleanedAsk);

    if (!existingQuestion || !existingQuestion.ans.includes(ans)) {
      return { error: "Không tìm thấy câu trả lời để xóa." };
    }

    existingQuestion.ans = existingQuestion.ans.filter(answer => answer !== ans);

    if (existingQuestion.ans.length === 0) {
      dataSim = dataSim.filter(entry => entry.ask !== cleanedAsk);
    }

    saveDataSim();
    return { msg: 'Xóa câu trả lời thành công.' };
  }
};

module.exports = simi;
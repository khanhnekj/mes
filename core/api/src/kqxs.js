const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment-timezone');

async function mb() {
  const fmtDate = (offset = 0) => {
    const date = moment().tz('Asia/Ho_Chi_Minh').subtract(offset, 'days');
    const dayOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'][date.day()];
    return `${date.format('DD-MM-YYYY')} (${dayOfWeek})`;
  };
  const getDateUrl = () => {
    const now = moment().tz('Asia/Ho_Chi_Minh');
    return now.isAfter(now.set({ hour: 18, minute: 30 })) ? fmtDate() : fmtDate(1);
  };
  try {
    const datePart = getDateUrl();
    const { data } = await axios.get(`https://az24.vn/xsmb-${datePart.split(' ')[0]}.html`);
    const $ = cheerio.load(data);
    const res = {
      date: datePart,
      title: $('h2.title-bor strong a').last().text().trim(),
      time: moment().tz('Asia/Ho_Chi_Minh').format('HH:mm:ss - DD/MM/YYYY'),
      db: '',
      code: '',
      g1: '',
      g2: [],
      g3: [],
      g4: [],
      g5: [],
      g6: [],
      g7: []
    };
    res.code = $('tr').filter((i, el) => $(el).find('td.txt-giai').text().trim() === 'Mã ĐB').find('td.v-giai span').text().trim();
    res.db = $('tr.db .v-gdb').text().trim();
    res.g1 = $('tr').filter((i, el) => $(el).find('td.txt-giai').text().trim() === 'Giải 1').find('td.v-giai.number span').text().trim();
    res.g2 = $('tr.bg_ef').filter((i, el) => $(el).find('td.txt-giai').text().trim() === 'Giải 2').find('td.v-giai.number span').map((i, el) => $(el).text().trim()).get();
    res.g3 = $('tr').filter((i, el) => $(el).find('td.txt-giai').text().trim() === 'Giải 3').find('td.v-giai.number span').map((i, el) => $(el).text().trim()).get();
    res.g4 = $('tr.bg_ef').filter((i, el) => $(el).find('td.txt-giai').text().trim() === 'Giải 4').find('td.v-giai.number span').map((i, el) => $(el).text().trim()).get();
    res.g5 = $('tr').filter((i, el) => $(el).find('td.txt-giai').text().trim() === 'Giải 5').find('td.v-giai.number span').map((i, el) => $(el).text().trim()).get();
    res.g6 = $('tr').filter((i, el) => $(el).find('td.txt-giai').text().trim() === 'Giải 6').find('td.v-giai.number span').map((i, el) => $(el).text().trim()).get();
    res.g7 = $('tr.g7').find('td.v-giai.number span').map((i, el) => $(el).text().trim()).get();
    return res;
  } catch (error) {
    return { error: "Không tìm thấy kết quả"}
  }
}

module.exports = {
    mb
};
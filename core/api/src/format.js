const axios = require('axios');
const FormData = require('form-data');
const cheerio = require('cheerio');
const fs = require('fs-extra');

async function js(file) {
  try {
    const filePath = process.cwd()+`/srcipts/cmds/${file}.js`;
    const code = await fs.readFile(filePath, 'utf8');
    const form = new FormData();
    form.append('forceInNewWindow', 'false');
    form.append('jsString', code);
    form.append('encoding', 'UTF-8');
    form.append('indentation', 'TWO_SPACES');
    form.append('braceStyle', 'COLLAPSE');
    const headers = {
      ...form.getHeaders(),
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-encoding': 'gzip, deflate, br, zstd',
      'accept-language': 'vi,vi-VN;q=0.9',
      'cache-control': 'no-cache',
      'cookie': 'JSESSIONID=14FCA65BFD45B9E2F9E2D91A91AB84D1; AWSELB=AF1961331E850F0E76644F5A99C0DC4A317F182299796EF3BB0F81C202145A4452F95272D4540B6FA6EB324970E3D9236B8AC1D0827DE8BC0F46C9160007D5B764A2AFC97C; AWSELBCORS=AF1961331E850F0E76644F5A99C0DC4A317F182299796EF3BB0F81C202145A4452F95272D4540B6FA6EB324970E3D9236B8AC1D0827DE8BC0F46C9160007D5B764A2AFC97C; _ga=GA1.1.1188903622.1723977849; __gads=ID=87fd14ae8cfac34a:T=1723977851:RT=1723977851:S=ALNI_MZY_DqTlzzaiMpUqxspohaTlApOUQ; __gpi=UID=00000ec3d8b27abf:T=1723977851:RT=1723977851:S=ALNI_Ma5qpLn5XILA08AB7Z42aTAAJxiGA; __eoi=ID=329419efaa98158d:T=1723977851:RT=1723977851:S=AA-Afja_SflPtGCOC9EwbO4XGz_t; _ga_0BGQDKW33P=GS1.1.1723977849.1.1.1723977877.0.0.0',
      'origin': 'https://www.freeformatter.com',
      'referer': 'https://www.freeformatter.com/javascript-beautifier.html',
      'sec-ch-ua': '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'same-origin',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
    };
    const { data } = await axios.post('https://www.freeformatter.com/javascript-beautifier.html', form, { headers });
    const $ = cheerio.load(data);
    const jsString = $('#output code.language-javascript').text();
    return jsString;
  } catch (error) {
    console.error(error);
  }
}

module.exports = {
    js
};
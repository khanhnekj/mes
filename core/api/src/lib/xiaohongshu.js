const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async function(url) {
    try {
        function getId(url) {
          const parts = url.split('/');
          return parts[parts.length - 1].split('?')[0];
        }
        const headers = {
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br, zstd',
  'Accept-Language': 'vi',
  'Cache-Control': 'max-age=0',
  'Cookie': 'abRequestId=1c0366c5-be0c-5a75-9981-39cc56730867; xsecappid=xhs-pc-web; a1=191def157edk6m96ngyq6u1o48miuf9gzz4dpzazp50000738998; webId=efa5de195892fe3a3620b1c188bef0d0; web_session=030037a1d256120939542a4499214a0df20c5d; gid=yjyfdiyKYfuyyjyfdiy2Wuu0dfTK6jKIkvAK4uU7yl4Y6f2837ijkU888WqYjjY8qdf8JWJK; websectiga=f47eda31ec99545da40c2f731f0630efd2b0959e1dd10d5fedac3dce0bd1e04d; acw_tc=184d1ada40dd0b464aded3542e9320a220382b967b9b58f036283674628859c1; sec_poison_id=231d051a-10fc-448e-a273-c76c84a73b6b; webBuild=4.33.2',
  'Priority': 'u=0, i',
  'Sec-CH-UA': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
  'Sec-CH-UA-Mobile': '?0',
  'Sec-CH-UA-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'same-origin',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
};
  
        const { data } = await axios.get(url, { headers });
        const $ = cheerio.load(data);
        let jsonString = $('script').filter((i, el) => $(el).html().includes('window.__INITIAL_STATE__')).html().split('window.__INITIAL_STATE__=')[1].split(';')[0].replace(/undefined/g, 'null');
        const jsonData = JSON.parse(jsonString);
      //  const js = jsonData?.note?.noteDetailMap[getId(url)];
return jsonData;
       /* const attachments = [];
        const video = js?.note?.video?.media?.stream?.h264?.[0]?.masterUrl;
        attachments.push({
          type: "Video",
          url: video
        });
        return {
          id: js.note.noteId,
          message: js.note.title,
          static: js.note.interactInfo,
          create_at: js.note.time,
          author: js.note.user.nickname,
          attachments
        };*/
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}
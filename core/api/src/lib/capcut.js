const axios = require('axios');

module.exports = async function(url) {
  try {
    const randomUserAgent = () => {
        const versions = ["4.0.3", "4.1.1", "4.2.2", "4.3", "4.4", "5.0.2", "5.1", "6.0", "7.0", "8.0", "9.0", "10.0", "11.0"];
        const devices = ["M2004J19C", "S2020X3", "Xiaomi4S", "RedmiNote9", "SamsungS21", "GooglePixel5"];
        const builds = ["RP1A.200720.011", "RP1A.210505.003", "RP1A.210812.016", "QKQ1.200114.002", "RQ2A.210505.003"];
        const chromeVersion = `Chrome/${Math.floor(Math.random() * 80) + 1}.${Math.floor(Math.random() * 999) + 1}.${Math.floor(Math.random() * 9999) + 1}`;
        return `Mozilla/5.0 (Linux; Android ${versions[Math.floor(Math.random() * versions.length)]}; ${devices[Math.floor(Math.random() * devices.length)]} Build/${builds[Math.floor(Math.random() * builds.length)]}) AppleWebKit/537.36 (KHTML, like Gecko) ${chromeVersion} Mobile Safari/537.36 WhatsApp/1.${Math.floor(Math.random() * 9) + 1}.${Math.floor(Math.random() * 9) + 1}`;
    };
    const randomIP = () => `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
    const headersss = () => ({
        "User-Agent": randomUserAgent(),
        "X-Forwarded-For": randomIP(),
    });
    let results = {
        id: '',
        message: '',
        usage: '',
        attachments: []
      };
      const getUrlResponse = await axios.get(`https://ssscap.net/api/download/get-url?url=${url}`);
      const videoId = getUrlResponse.data.url.split("/")[4].split("?")[0];
      const options = {
        method: 'GET',
        url: `https://ssscap.net/api/download/${videoId}`,
        headers: {
    'accept': 'application/json, text/plain, */*',
    'accept-encoding': 'gzip, deflate, br, zstd',
    'accept-language': 'vi',
    'cookie': 'sign=4bcf7c26812fa0550e148dcd20a79ff6; device-time=1726066249013; __gads=ID=d75198b262e14472:T=1726066251:RT=1726066251:S=ALNI_Mbfm3GpcgH_CgG-6Ebiwtleu12xRw; __gpi=UID=00000efa72ea9d4d:T=1726066251:RT=1726066251:S=ALNI_MbaAXbocghaYUsGGt4Qge4s8CqJoQ; __eoi=ID=09b043033657ed3a:T=1726066251:RT=1726066251:S=AA-Afjb4-dc6HoVVtLfIfX7-BtXd; FCNEC=%5B%5B%22AKsRol9FdiNmD8owGNb-EF89g2HlCc2_vubZp90k9M1fY0XjSs8boS_M2ZvoHBdXHFameMOKdA-En8tmmli9o0_OArIUwGzFFTMZsg9-327o95axBAVwzTm2PSq3yhfFRINbyd64zFjQJYCttpSVtNDJQ2By_xsipw%3D%3D%22%5D%2Cnull%2C%5B%5B2%2C%22%5Bnull%2C%5Bnull%2C1%2C%5B1726066256%2C779079000%5D%5D%5D%22%5D%5D%5D',
    'referer': 'https://ssscap.net/vi',
    'sec-ch-ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  }
      };
      const response = await axios.request(options);
      const { title, description, usage, originalVideoUrl } = response.data;
      const base64String = originalVideoUrl.replace("/api/cdn/", "");
      const buffer = Buffer.from(base64String, 'base64');
      const decodedString = buffer.toString('utf-8');
      results.id = videoId;
      results.message = `${title} - ${description}`;
      results.usage = usage;
      results.attachments.push({
        type: "Video",
        url: decodedString,
      });
    return results;
  } catch (error) {
    console.error('Error occurred:', error);
  }
}
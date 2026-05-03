const axios = require('axios');
const tunnel = require('tunnel');

module.exports = async function(url) {

const proxyHost = '27.73.88.140';
const proxyPort = '21433';
const proxyUsername = '1mdtGrXNJ';
const proxyPassword = 'WTmsph';
const proxy = tunnel.httpsOverHttp({
  proxy: {
    host: '27.73.88.140',
    port: 21433,
    proxyAuth: '1mdtGrXNJ:WTmsph',
  },
});
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
       // "X-Forwarded-For": randomIP(),
    });

    const getID = async (url) => {
        const regex = /template-detail\/(\d+)/;
        if (regex.test(url)) {
            const match = url.match(regex);
            return match ? match[1] : null;
        } else {
            try {
                const response = await axios.get(url, {
                    maxRedirects: 0,
                    validateStatus: (status) => status >= 300 && status < 400,
                });
                const originalUrl = response.headers.location;
                const match = originalUrl.match(regex);
                return match ? match[1] : null;
            } catch (error) {
                console.error('Error:', error.message);
                return null;
            }
        }
    };

    const videoId = await getID(url);
    const headers = {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'vi,en;q=0.9',
        'App-Sdk-Version': '48.0.0',
        'Appvr': '5.8.0',
        'Content-Type': 'application/json',
        'Cookie': 'passport_csrf_token=fea6749fed6008d79372ea4131efb483; passport_csrf_token_default=fea6749fed6008d79372ea4131efb483; passport_auth_status=6f01e86273e10de44e9a2ea3891f1a25%2C; passport_auth_status_ss=6f01e86273e10de44e9a2ea3891f1a25%2C; sid_guard=8437e2a5e8f43d0bcc46bf26aa479ae5%7C1717844956%7C34560000%7CSun%2C+13-Jul-2025+11%3A09%3A16+GMT; uid_tt=e34ead5d420362c0e3d71761308ff9c74276f6e50a2a774c217bcf2320b46658; uid_tt_ss=e34ead5d420362c0e3d71761308ff9c74276f6e50a2a774c217bcf2320b46658; sid_tt=8437e2a5e8f43d0bcc46bf26aa479ae5; sessionid=8437e2a5e8f43d0bcc46bf26aa479ae5; sessionid_ss=8437e2a5e8f43d0bcc46bf26aa479ae5; sid_ucp_v1=1.0.0-KGI2YTQ3YzBhMjZlNWQ1NGYwZjhmZThlNTdlNzQ3NzgxOGFlMGE0MzEKIAiCiIqEifaqymUQ3PeQswYYnKAVIAww29fSrAY4CEASEAMaA3NnMSIgODQzN2UyYTVlOGY0M2QwYmNjNDZiZjI2YWE0NzlhZTU; ssid_ucp_v1=1.0.0-KGI2YTQ3YzBhMjZlNWQ1NGYwZjhmZThlNTdlNzQ3NzgxOGFlMGE0MzEKIAiCiIqEifaqymUQ3PeQswYYnKAVIAww29fSrAY4CEASEAMaA3NnMSIgODQzN2UyYTVlOGY0M2QwYmNjNDZiZjI2YWE0NzlhZTU; store-idc=alisg; store-country-code=vn; store-country-code-src=uid; _clck=gewwr2%7C2%7Cfmg%7C0%7C1620; _clsk=1auat5k%7C1717845282705%7C5%7C0%7Ct.clarity.ms%2Fcollect; ttwid=1|lzYqbBKYnM2qubxO7orNtAxCXMz3BbnaAMgB-zy4ICY|1717845379|b03fb4bf974d1ec2f5f2cee73c42e6c4d800e57e63795cf2db298385b1742fc5; _uetsid=8d048170258711efb10015e2f330cee7; _uetvid=8d04cee0258711ef8d278993f44c7fbe; odin_tt=f9c81c0021bbd9d87817b4d8a50057bedd96b05b1f1d892df0ac5f9cf669290204dc406ea997bb85e51d6160f3b1ad589361574345e9833327b0ad4f15d5d18f; msToken=yLylj1zd1B0_KRakyX66qTDGIyY6skmEN5KS3Imyn4J8gyKnfOMf7QBg1qaJKOkPzq0xl_OYAU2PvcikPI0-6KOCLxLX_jmrzJOZQ2sUdwCmtaFNk172h79rmfnlqIK0jwe4EA==',
        'Device-Time': '1717845388',
        'Lan': 'vi-VN',
        'Loc': 'va',
        'Origin': 'https://www.capcut.com',
        'Pf': '7',
        'Priority': 'u=1, i',
        'Referer': 'https://www.capcut.com/',
        'Sec-Ch-Ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        'Sign': '2cd3272c536081caeafe7c07949d023d',
        'Sign-Ver': '1',
        'Tdid': '',
        ...headersss(),
    };

    const data = {
        sdk_version: "86.0.0",
        biz_id: null,
        id: [videoId],
        enter_from: "",
        cc_web_version: 0,
    };

    try {
        const response = await axios.post(`https://edit-api-sg.capcut.com/lv/v1/cc_web/replicate/multi_get_templates`, data, {
            headers,
  httpsAgent: proxy,
 /* proxy: {
    host: proxyHost,
    port: proxyPort,
    auth: {
      username: proxyUsername,
      password: proxyPassword
    }
  }*/
});
        const results = {
            id: response.data.data.templates[0].web_id,
            message: response.data.data.templates[0].title,
            short_title: response.data.data.templates[0].short_title,
            duration: response.data.data.templates[0].duration,
            fragment_count: response.data.data.templates[0].fragment_count,
            usage_amount: response.data.data.templates[0].usage_amount,
            play_amount: response.data.data.templates[0].play_amount,
            favorite_count: response.data.data.templates[0].favorite_count,
            like_count: response.data.data.templates[0].like_count,
            comment_count: response.data.data.templates[0].interaction.comment_count,
            create_time: response.data.data.templates[0].create_time,
            author: {
                unique_id: response.data.data.templates[0].author.unique_id,
                name: response.data.data.templates[0].author.name,
            },
            attachments: [
                 {
                    type: 'Video',
                    url: response.data.data.templates[0].video_url,
                }
             ]
        };
        return results;
    } catch (error) {
        console.error('Error making POST request:', error);
    }
}
const axios = require('axios');

module.exports = async function(link) {
    try {
        function formatNumber(number) {
            if (isNaN(number)) {
                return null;
             }
              return number.toLocaleString('de-DE');
        }
        async function getClientID() {
            const { data } = await axios.get('https://soundcloud.com/', { headers: {} }).catch((err) => err);
            const splitted = data.split('<script crossorigin src="');
            const urls = [];
            splitted.forEach((r) => {
                if (r.startsWith('https')) {
                    urls.push(r.split('"')[0]);
                }
            });
            const data2 = await axios.get(urls[urls.length - 1]);
            return data2.data.split(',client_id:"')[1].split('"')[0];
        }
        const clientId = await getClientID();
        const res = await axios.get(link, { 
            headers: {
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
                'referer': 'https://soundcloud.com/',
                'sec-ch-ua': '"Chromium";v="115", "Not;A=Brand";v="24", "Google Chrome";v="115"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-site': 'same-origin',
                'sec-fetch-mode': 'navigate',
                'sec-fetch-dest': 'document',
                'accept-language': 'en-US,en;q=0.9',
                'upgrade-insecure-requests': '1',
            }
        });
        const responseData = decodeURIComponent(res.request.res.responseUrl);
        const urlParts = responseData.replace("m.soundcloud.com", "soundcloud.com");
        const { data } = await axios.get(`https://api-v2.soundcloud.com/resolve?url=${urlParts}&client_id=${clientId}`);
        const progressiveUrl = data?.media?.transcodings?.find(t => t.format.protocol === 'progressive')?.url;
        if (!progressiveUrl) throw new Error('Không tìm thấy data phù hợp');
        const { url } = (await axios.get(`${progressiveUrl}?client_id=${clientId}&track_authorization=${data.track_authorization}`)).data;
        return {
            id: data.id,
            message: data.title,
            author: `${data.user.full_name} (${data.user.username})`,
            playback: formatNumber(Number(data.playback_count)) || 0,
            likes: formatNumber(Number(data.likes_count)) || 0,
            comment: formatNumber(Number(data.comment_count)) || 0,
            share: formatNumber(Number(data.reposts_count)) || 0,
            duration: data.duration,
            created_at: data.created_at,
            attachments: [{
                type: "Audio",
                url: url
            }]
        }
    } catch (error) {
        console.error('Đã xảy ra lỗi khi gửi request:', error);
    }
}
const axios = require('axios');

async function download(link) {
    try {
        function formatNumber(number) {
            if (isNaN(number)) {
                return null;
             }
              return number.toLocaleString('de-DE');
        }
        const conDate = s => {
            const d = new Date(s);
            const f = n => String(n).padStart(2, '0');
            return `${f(d.getUTCHours())}:${f(d.getUTCMinutes())}:${f(d.getUTCSeconds())} || ${f(d.getUTCDate())}/${f(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
        };
        const conMs = ms => `${String(Math.floor(ms / 60000)).padStart(2, '0')}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`;
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
            title: data.title,
            author: `${data.user.full_name} (${data.user.username})`,
            playback: formatNumber(Number(data.playback_count)) || 0,
            likes: formatNumber(Number(data.likes_count)) || 0,
            comment: formatNumber(Number(data.comment_count)) || 0,
            share: formatNumber(Number(data.reposts_count)) || 0,
            duration: conMs(data.duration),
            create_at: conDate(data.created_at),
            attachments: [{
                type: "Audio",
                url: url
            }]
        }
    } catch (error) {
        console.error('Đã xảy ra lỗi khi gửi request:', error);
    }
}

async function search(keywords, limit) {
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
    const conMs = ms => `${String(Math.floor(ms / 60000)).padStart(2, '0')}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`;
    const clientId = await getClientID();
    var { data } = await axios.get(`https://api-v2.soundcloud.com/search/tracks?q=${encodeURI(keywords)}&client_id=${clientId}&limit=${limit || 5}`);
    var result = [];
    for (let i of data.collection) {
        var author = {
            avatar_url: i.user.avatar_url,
            full_name: i.user.full_name,
            id: i.user.id,
            type: i.user.kind,
            permalink_url: i.user.permalink_url,
            username: i.user.username,
            follow: i.user.followers_count,
            description: i.user.description
        }
        var dataMusic = {
            title: i.title,
            downloadable: i.downloadable,
            likes_count: i.likes_count,
            comment_count: i.comment_count,
            permalink_url: i.permalink_url,
            genre: i.genre,
            description: i.description,
            duration: conMs(i.duration),
            id: i.id,
            display_date: i.display_date,
        }
        result.push({
            author,
            dataMusic
        })
    }
    return result;
}

module.exports = {
    download,
    search
};
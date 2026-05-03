const fetch = require("node-fetch");

module.exports = async function(url) {
    const regex = /reddit\.com\/r\/([^\/]+)\/comments\/([^\/]+)\//;
    const match = url.match(regex);
    if (!match) {
        console.error("URL không hợp lệ");
        return null;
    }
    const subreddit = match[1];
    const postId = match[2];
    const apiUrl = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json`;
    try {
        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                "accept": "application/json,text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                "accept-encoding": "gzip, deflate, br, zstd",
                "accept-language": "vi,en;q=0.9",
                "cache-control": "max-age=0",
                "cookie": "edgebucket=u7gtQRIJUbiOyZ3ocf; rdt=88b86ac8948a984dc577399e8adac976; loid=000000001bniunf3v2.2.1729950232658.Z0FBQUFBQm5IUElZT1BkeGhtLW5FeXM3UnpNZURoZm00cGpDZ2w1bnVqMmhpT2RYcElhWDdSZVFCN2JmemlsV2pHNmx3QlNHcW1XTlNWX1pEY1VxZDRRSWNYUDc5SXhCUnV2ZTBDcTNqcTNHckRuNHdsa3M5NVI5ZHlkT2pabTJIZWJEZ25vMlFHdkk; csv=2; g_state={\"i_l\":0}; reddit_session=eyJhbGciOiJSUzI1NiIsImtpZCI6IlNIQTI1NjpsVFdYNlFVUEloWktaRG1rR0pVd1gvdWNFK01BSjBYRE12RU1kNzVxTXQ4IiwidHlwIjoiSldUIn0.eyJzdWIiOiJ0Ml8xYm5pdW5mM3YyIiwiZXhwIjoxNzQ1NTg4ODAyLjU4NDM5MSwiaWF0IjoxNzI5OTUwNDAyLjU4NDM5MSwianRpIjoiazFQVlpzbUFtejY3WjVfTy1CcHVTd0YtZE9YTVZ3IiwiY2lkIjoiY29va2llIiwibGNhIjoxNzI5OTUwMjMyNjU4LCJzY3AiOiJlSnlLamdVRUFBRF9fd0VWQUxrIiwidjEiOiIxMzQ0MzU1NzY4Mjc5ODIlMkMyMDI0LTEwLTI2VDEzJTNBNDYlM0E0MiUyQzg4ZDdmYmE1ZTIxN2Q5MGZlOTkxNmJhNmQ1OGFlZWNhMjE5ZGUyMmIiLCJmbG8iOjF9.hXd0Z4buLtIV84krePAjl9W9UU6ypruMbTltsiANRdeZTzaz_A5p_8IV7CSjtJ1cwRnnD6Lh74dWg8k_ydikcw_c4ERPTauooivzPTEYap8ekEd2mwip5SQogVzAV1bdMLzXOqoYbocwc7FYQtZMk40kLjD2FskH6Pv5PJJNJ2AogQ8lM6mm33CYcOyhbKKjj4lDmBpWpO9c6o5USnNkkdGrIZZ-qQCs4ImiQl6Qce5nzkxQQDrS4ziWfT6eZ75yIkL1kBSOk_sXKXzMjSjxsNYi54Y5zpqRb2n4sED1CzESemHfsnJH1uPdX3K3XDIfeNeMYJGsSvj7S0XNhUnMww; token_v2=eyJhbGciOiJSUzI1NiIsImtpZCI6IlNIQTI1NjpzS3dsMnlsV0VtMjVmcXhwTU40cWY4MXE2OWFFdWFyMnpLMUdhVGxjdWNZIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ1c2VyIiwiZXhwIjoxNzMwMDM2ODAzLjM2OTEwMywiaWF0IjoxNzI5OTUwNDAzLjM2OTEwMywianRpIjoic3ota3dqc2ZobFgxRW51UVhHdmdtWVhBQWtPQWpRIiwiY2lkIjoiMFItV0FNaHVvby1NeVEiLCJsaWQiOiJ0Ml8xYm5pdW5mM3YyIiwiYWlkIjoidDJfMWJuaXVuZjN2MiIsImxjYSI6MTcyOTk1MDIzMjY1OCwic2NwIjoiZUp4a2tkR090REFJaGQtbDF6N0JfeXBfTmh0c2NZYXNMUWFvazNuN0RWb2NrNzA3Y0w0aUhQOG5LSXFGTEUydUJLR2tLV0VGV3RPVU5pTHY1OHk5T1pFRlN5RlRSODQzeXdva2FVcFBVbU41cHlsUndXWmtMbGZhc1VLREI2WXBWUzZaMjBLUFM1dlEzSTFGejA2TXFseFdIdFRZbzNKcGJHTUsyeFBqemNacVF5cXV5NmxNWUZrb244V0xmdnlHLXRZLWY3YmZoSFl3cktnS0RfVE91Rnh3WV9IREZIYl9ucHIwYkYyd3FMM1hnOVEtMS1OMjdiTm1vZG01X1Z6UHZ6YVNjVG1HNWlmWXY3dC1DUjE0NUhtWlVRY3dZZzBfeXJBajZfQ3ZPb0RLQlFXTUpZaFBJNUFybDJfX0pkaXVUZjhhdHlkLS1HYkVUV180clJtbzV4TEVvVV9qNnpjQUFQX19YRF9lNHciLCJyY2lkIjoibzdSVVVEdXlPQjZkM0kwaFVwcVFwY1pUZHpWN3NoQVpfbkFZbUtPM0tzOCIsImZsbyI6Mn0.OsFR8LAhfxLEMg9B2465DN6D6biQnO245qC1hcpqfPo-mNTlArGxjAa-fSwcqRK_jjdAzXaU5cefR01YQQNacz4GcW95ANSn3vCnNCosHXtPnv96FugMePJLOewehQ3nifY3wlvqCVsMoDZqnXPLbgx3VuFO1A1k7OfndU6eRK0xDE7EJt7pCC9Nv1uqorWxLE7ps725ctwN895dqy6YFzYoaSFCLQUua08dtDoI-e-RpHshcI5-pwQasn3yU9GOBDyEJ3txyixfOgvl653FCay1RNvbGWhP3M6NmEXhV4AcbuVsrcZ77TSoV3IBNSnEf6lBHQXw0XHSFiz7knJiTw",
                "referer": "https://www.reddit.com/r/lotr/comments/1gcdxce/i_wanted_my_partner_to_be_arwen_but_she_insisted/",
                "sec-ch-ua": "\"Chromium\";v=\"130\", \"Google Chrome\";v=\"130\", \"Not?A_Brand\";v=\"99\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "document",
                "sec-fetch-mode": "navigate",
                "sec-fetch-site": "same-origin",
                "sec-fetch-user": "?1",
                "upgrade-insecure-requests": "1",
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
            }
        });
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const data = await response.json();
        const postData = data[0].data.children[0].data;
        let attachments = [];
        if (postData.is_video) {
            attachments.push({
                type: 'Video',
                url: postData.media.reddit_video.fallback_url
            });
        } else if (postData.post_hint === 'image') {
            attachments.push({
                type: 'Photo',
                url: postData.url
            });
        } else {
            attachments.push({
                type: 'Link',
                url: postData.url
            });
        }
        return {
            title: postData.title,
            author: postData.author,
            ups: postData.ups,
            created: new Date(postData.created_utc * 1000).toLocaleString('vi-VN'),
            num_comments: postData.num_comments,
            nsfw: postData.over_18,
            subreddit: postData.subreddit,
            attachments
        };
    } catch (error) {
        console.error("Error fetching post data:", error);
    }
}
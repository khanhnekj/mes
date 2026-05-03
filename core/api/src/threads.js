const axios = require('axios');
const cheerio = require('cheerio');

async function downloadv1(link) {
   function getIDThread(link) {
      const regex = /\/post\/([^\/]+)\/?/;
      const match = link.match(regex);
      if (match && match[1]) {
        return match[1];
      }
      return null;
    }
    const id = getIDThread(link);
    try {
        const response = await axios.get(`https://data.threadster.site/results/${id}`, {
        headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.63 Safari/537.36',
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive'
            }
        });
        const data = response.data.data;
        const results = [];
        if (data.media && data.media.length > 0) {
            data.media.forEach(media => {
                if (media.image_url) {
                    results.push({
                        type: 'image',
                        url: media.image_url
                    });
                } else if (media.video_url) {
                    results.push({
                        type: 'video',
                        url: media.video_url
                    });
                }
            });
        }
        const title = data.full_text;
        const user = {
            username: data.user.username,
            profile_pic_url: data.user.profile_pic_url
        };
        return { title, user, results };
    } catch (error) {
        throw new Error('Error fetching data:', error);
    }
}

async function downloadv2(url) {
  function formatNumber(number) {
    if (isNaN(number)) {
      return null;
    }
    return number.toLocaleString('de-DE');
  }
  try {
    const res = await axios.get(url, {
      headers: {
        authority: "www.threads.net",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache",
        pragma: "no-cache",
        "cookie": 'mid=ZcOUCAABAAFFgWZ58w6axcyTCFnA; ig_did=8D67B657-CAF8-4ED7-8474-5E4995089031; ps_n=1; ps_l=1; csrftoken=dNiAYOjnYFy2McUxsD9y6syTmL5boC6T; sessionid=66149999694%3AEAwXzw5TT5FbrN%3A28%3AAYex8thIgzBxKwByOJm44zpm9IcAWXasFEBIr9tNCQ; dpr=1.5294095277786255; useragent=TW96aWxsYS81LjAgKExpbnV4OyBBbmRyb2lkIDEwOyBLKSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTIwLjAuMC4wIE1vYmlsZSBTYWZhcmkvNTM3LjM2; _uafec=Mozilla%2F5.0%20(Linux%3B%20Android%2010%3B%20K)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F120.0.0.0%20Mobile%20Safari%2F537.36;',
        "sec-ch-ua": '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
      },
    });
    if (res.status !== 200) {
      throw new Error(`Status Error: ${res.status} ${res.config.url}`);
    }
    const content = res.data;
    const $ = cheerio.load(content);
    const scripts = $("script");
    let scriptContent;
    scripts.each((i, script) => {
      if (
        script.children[0] &&
        script.children[0].data.includes("username") &&
        script.children[0].data.includes("original_width")
      ) {
        scriptContent = script.children[0].data;
        return false;
      }
    });
    const parsedData = JSON.parse(scriptContent);
    const result = parsedData.require[0][3][0].__bbox.require[0][3][1].__bbox.result;
    const dataResponse = result?.data?.data?.edges?.[0].node?.thread_items?.[0]?.post;
    const attachments = [];
    if (dataResponse.video_versions && dataResponse.video_versions.length > 0) {
      attachments.push({
        type: 'Video',
        url: dataResponse.video_versions[0].url
      });
    }
    if (dataResponse.carousel_media && dataResponse.carousel_media.length > 0) {
      const photos = [];
      const videos = [];
      dataResponse.carousel_media.forEach(item => {
        if (item.image_versions2 && item.image_versions2.candidates && item.image_versions2.candidates.length > 0) {
          const firstCandidate = item.image_versions2.candidates.find(candidate => candidate.url);
          if (firstCandidate) {
            photos.push({
              type: 'Photo',
              url: firstCandidate.url
            });
          }
        }
        if (item.video_versions && item.video_versions.length > 0) {
          videos.push({
            type: 'Video',
            url: item.video_versions[0].url
          });
        }
      });
      attachments.push(...photos, ...videos);
    } else if (dataResponse.image_versions2 && dataResponse.image_versions2.candidates && dataResponse.image_versions2.candidates.length > 0) {
  const validCandidate = dataResponse.image_versions2.candidates.find(candidate => candidate.url);
  if (validCandidate) {
    attachments.push({
      type: 'Photo',
      url: validCandidate.url
          });
       }
    }
    if (dataResponse.audio && dataResponse.audio.audio_src) {
      attachments.push({
        type: 'Audio',
        url: dataResponse.audio.audio_src
      });
    }
    return {
      id: dataResponse.pk,
      message: dataResponse.caption.text || "Không có tiêu đề",
      like_count: formatNumber(Number(dataResponse.like_count)) || 0,
      reply_count: formatNumber(Number(dataResponse.text_post_app_info.direct_reply_count)) || 0,
      repost_count: formatNumber(Number(dataResponse.text_post_app_info.repost_count)) || 0,
      quote_count: formatNumber(Number(dataResponse.text_post_app_info.quote_count)) || 0,
      author: dataResponse.user.username,
      short_code: dataResponse.code,
      taken_at: dataResponse.taken_at,
      attachments
    };
  } catch (error) {
    console.error(error);
  }
};

module.exports = {
   downloadv1,
   downloadv2
};
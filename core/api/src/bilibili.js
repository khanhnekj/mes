const axios = require('axios');

async function download(url) {
  try {
    async function extractID(url) {
      const getOriginalUrl = async (shortUrl) => {
        try {
          const res = await axios.get(shortUrl, { maxRedirects: 0 });
          return res.headers.location;
        } catch {
          return shortUrl;
        }
      };
      const regex = /(?:https?:\/\/)?(?:www\.)?(?:bilibili\.com\/(?:video\/|v\/|play\/)?(BV[0-9A-Za-z]{10})|b23\.tv\/([0-9A-Za-z]{7})|(?:wwwy_webbili\.com\/(?:video\/|v\/|play\/)?(BV[0-9A-Za-z]{10})))?/;
      const finalUrl = url.startsWith('https://b23.tv/') ? await getOriginalUrl(url) : url;
      const match = finalUrl.match(regex);
      return match ? match[1] || match[2] || match[3] : null;
    }
    const id = await extractID(url);
    const { data: post } = await axios.get(`https://api.bilibili.com/x/web-interface/view?bvid=${id}`);
    if (post.code !== 0) throw new Error(post.message);
    const { data: video } = await axios.get(`https://api.bilibili.com/x/player/playurl?cid=${post.data.cid}&bvid=${id}&qn=16`);
    if (video.code !== 0) throw new Error(video.message);
    const data = post?.data;
    require('fs').writeFileSync('data.json', JSON.stringify(data, null, 2))
    const videoUrl = video?.data?.durl?.[0]?.url;
    return { 
        id: data.aid,
        title: data.title,
        author: data.owner.name,
        duration: data.duration,
        view: data.stat.view,
        like: data.stat.like,
        comment: data.stat.reply,
        share: data.stat.share,
        coin: data.stat.coin,
        danmaku: data.stat.danmaku,
        favorite: data.stat.favorite,
        create_at: data.pubdate,
        attachment: [
            {
            type: 'Video',
            url: videoUrl
            }
        ]
     };
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

module.exports = {
    download
};
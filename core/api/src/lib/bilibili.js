const axios = require('axios');

module.exports = async function(url) {
  try {
    async function extractID(url) {
  if (/^https?:\/\/(www\.)?b23\.tv\/[a-zA-Z0-9]+$/.test(url)) {
   const getOriginalUrl = async (shortUrl) => {
     try {
       const response = await axios.get(shortUrl, {
          maxRedirects: 0,
          validateStatus: null,
        });
        const originalUrl = response.headers.location;
        return originalUrl;
       } catch (error) {
        return shortUrl;
       }
    };
    const originalUrl = await getOriginalUrl(url);
    const match = originalUrl.match(/(?:https?:\/\/)?(?:www\.)?(?:m\.)?(bilibili\.com\/(?:video|bangumi|cheese|anime|medialist|read|space|topic|blackboard)\/|b23\.tv\/)([a-zA-Z0-9]+)/);
    return match ? match[2] : null;
  } else {
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:m\.)?(bilibili\.com\/(?:video|bangumi|cheese|anime|medialist|read|space|topic|blackboard)\/|b23\.tv\/)([a-zA-Z0-9]+)/);
    return match ? match[2] : null;
  }
};
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
        message: data.title,
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
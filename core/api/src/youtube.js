const axios = require("axios");
const qs = require('qs');
const cheerio = require('cheerio');

async function downloadv1(url) {
  function formatSeconds(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const pad = (num) => String(num).padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
  }
  function formatNumber(number) {
    if (isNaN(number)) {
        return null;
     }
      return number.toLocaleString('de-DE');
  }
  async function getInfo(id) {
    try {
      const { data } = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
        params: {
          id: id,
          key: 'AIzaSyDp7rbDJT_L60Yrj55mTCfov2eEfXQVwYA',
          part: 'snippet,contentDetails,statistics'
        }
      });
      if (!data.items || data.items.length === 0) {
        throw new Error('Video data not found');
      }
      const res = data.items[0];
      return {
        id: res.id,
        title: res.snippet.title,
        author: res.snippet.channelTitle,
        views: formatNumber(res.statistics.viewCount) || 0,
        likes: formatNumber(res.statistics.likeCount) || 0,
        favorites: formatNumber(res.statistics.favoriteCount) || 0,
        comments: formatNumber(res.statistics.commentCount) || 0
      };
    } catch (error) {
      console.error('Error fetching video youtube info:', error.message);
      return null;
    }
  }
  function getRandomUserAgent() {
    const browsers = ["Chrome", "Firefox", "Safari", "Edge", "Opera"];
    const osList = [
      "Windows NT 10.0; Win64; x64",
      "Macintosh; Intel Mac OS X 10_15_7",
      "X11; Linux x86_64",
    ];
    const webKitVersion = `537.${Math.floor(Math.random() * 100)}`;
    const browserVersion = `${Math.floor(Math.random() * 100)}.0.${Math.floor(Math.random() * 10000)}.${Math.floor(Math.random() * 100)}`;
    const browser = browsers[Math.floor(Math.random() * browsers.length)];
    const os = osList[Math.floor(Math.random() * osList.length)];
    return `Mozilla/5.0 (${os}) AppleWebKit/${webKitVersion} (KHTML, like Gecko) ${browser}/${browserVersion} Safari/${webKitVersion}`;
  }
  function getRandomValue() {
    return Math.floor(Math.random() * 10000000000);
  }
  function getRandomCookie() {
    const ga = `_ga=GA1.1.${getRandomValue()}.${getRandomValue()}`;
    const gaPSRPB96YVC = `_ga_PSRPB96YVC=GS1.1.${getRandomValue()}.2.1.${getRandomValue()}.0.0.0`;
    return `${ga}; ${gaPSRPB96YVC}`;
  }
  const userAgent = getRandomUserAgent();
  const cookies = getRandomCookie();
  async function getData(url) {
    try {
      const { data } = await axios.post(
        "https://www.y2mate.com/mates/vi854/analyzeV2/ajax",
        qs.stringify({
          k_query: url,
          k_page: "Youtube Downloader",
          hl: "vi",
          q_auto: 0,
        }),
        {
          headers: {
            Accept: "*/*",
            "Accept-Encoding": "gzip, deflate, br, zstd",
            "Accept-Language": "vi,en;q=0.9",
            "Content-Length": "104",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            Cookie: cookies,
            Origin: "https://www.y2mate.com",
            Priority: "u=1, i",
            Referer: "https://www.y2mate.com/vi854/download-youtube",
            "Sec-Ch-Ua":
              '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "User-Agent": userAgent,
            "X-Requested-With": "XMLHttpRequest",
          },
        },
      );
      return {
          id: data.vid,
          title: data.title,
          duration: data.t,
          author: data.a,
          k: data.links.mp4["134"]?.k || data.links.mp4["18"]?.k || data.links.mp4["135"]?.k || data.links.mp4["133"]?.k
       };
    } catch (error) {
      console.error("Error posting data:", error);
    }
  }
  let dataPost = await getData(url);
  let { author, likes, comments, views, favorites }= await getInfo(dataPost.id);
  try {
    const response = await axios.post(
      "https://www.y2mate.com/mates/convertV2/index",
      qs.stringify({
        vid: dataPost.id,
        k: dataPost.k,
      }),
      {
        headers: {
          Accept: "*/*",
          "Accept-Encoding": "gzip, deflate, br, zstd",
          "Accept-Language": "vi,en;q=0.9",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Cookie: cookies,
          Origin: "https://www.y2mate.com",
          Priority: "u=1, i",
          Referer: "https://www.y2mate.com/vi/",
          "Sec-Ch-Ua": '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
          "Sec-Ch-Ua-Mobile": "?0",
          "Sec-Ch-Ua-Platform": '"Windows"',
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-origin",
          "User-Agent": userAgent,
          "X-Requested-With": "XMLHttpRequest",
        },
      },
    );
    return {
      id: dataPost.id,
      title: dataPost.title,
      duration: formatSeconds(dataPost.duration),
      author,
      views,
      likes,
      comments,
      favorites,
      url: response.data.dlink,
    };
  } catch (error) {
    console.error("Error:", error);
  }
}

async function downloadPost(url) {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        let parsedData = null;
        $('script').each((i, script) => {
            const scriptContent = $(script).html();
            if (scriptContent && scriptContent.includes('var ytInitialData =')) {
                const jsonString = scriptContent.split('var ytInitialData = ')[1].split(';')[0];
                parsedData = JSON.parse(jsonString);
            }
        });
        if (!parsedData) {
            throw new Error('Không tìm thấy dữ liệu bài post YouTube');
        }
        const data = parsedData.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].backstagePostThreadRenderer.post.backstagePostRenderer;
        const attachments = [];
        const dataAtm = data?.backstageAttachment?.postMultiImageRenderer?.images ||
            data?.backstageAttachment?.videoRenderer ||
            data?.backstageAttachment;

        if (Array.isArray(dataAtm)) {
            dataAtm.forEach(item => {
                const thumbnails = item.backstageImageRenderer?.image?.thumbnails;
                if (thumbnails && thumbnails.length > 0) {
                    const highResImage = thumbnails.reduce((max, img) => img.width > max.width ? img : max, thumbnails[0]);
                    attachments.push({
                        type: 'Photo',
                        url: highResImage.url
                    });
                }
            });
        } else if (dataAtm?.backstageImageRenderer) {
            const thumbnails = dataAtm.backstageImageRenderer.image?.thumbnails;
            if (thumbnails && thumbnails.length > 0) {
                const highResImage = thumbnails.reduce((max, img) => img.width > max.width ? img : max, thumbnails[0]);
                attachments.push({
                    type: 'Photo',
                    url: highResImage.url
                });
            }
        } else if (dataAtm?.navigationEndpoint?.watchEndpoint?.watchEndpointSupportedOnesieConfig?.html5PlaybackOnesieConfig?.commonConfig?.url) {
            const videoUrl = dataAtm.navigationEndpoint.watchEndpoint.watchEndpointSupportedOnesieConfig.html5PlaybackOnesieConfig.commonConfig.url;
            attachments.push({
                type: 'Video',
                url: videoUrl
            });
        }
        return {
            id: data.postId,
            message: data.contentText.runs[0].text,
            author: data.authorText.runs[0].text,
            like: data.voteCount.simpleText,
            create_at: data.publishedTimeText.runs[0].text,
            attachments
        };
    } catch (error) {
        console.error('Có lỗi xảy ra:', error.message);
    }
}

module.exports = {
    downloadv1,
    downloadPost
};
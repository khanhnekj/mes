const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async function(link) {
  const cookie = global.cookie.instagram;
  function genUA() {
  const iosVersions = ["14_0", "14_1", "14_2", "15_0", "15_1", "15_2", "16_0"];
  const iphoneModels = ["iPhone10,6", "iPhone11,2", "iPhone12,3", "iPhone13,4", "iPhone14,5"];
  const instagramVersions = ["220.0.0.16.115", "219.0.0.17.110", "218.0.0.13.109"];
  const languages = ["en_US", "fr_FR", "es_ES", "de_DE", "pt_BR"];
  const iosVersion = iosVersions[Math.floor(Math.random() * iosVersions.length)];
  const iphoneModel = iphoneModels[Math.floor(Math.random() * iphoneModels.length)];
  const instagramVersion = instagramVersions[Math.floor(Math.random() * instagramVersions.length)];
  const language = languages[Math.floor(Math.random() * languages.length)];
  const userAgent = `Mozilla/5.0 (iPhone; CPU iPhone OS ${iosVersion} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram ${instagramVersion} (${iphoneModel}; iOS ${iosVersion}; ${language}; ${language}; scale=3.00; 1170x2532; 304111761)`;
  return userAgent;
  }
  class getID {
    static BASE64URL_CHARMAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    static BASE10_MOD2 = ['0', '1', '0', '1', '0', '1', '0', '1', '0', '1'];
    static bitValueTable = null;
    static getCode(code) {
      if (typeof code !== 'string' || /[^A-Za-z0-9\-_]/.test(code)) {
        throw new Error('Input must be a valid Instagram shortcode.');
      }
      let base2 = '';
      for (const char of code) {
        const base64 = this.BASE64URL_CHARMAP.indexOf(char);
        base2 += base64.toString(2).padStart(6, '0');
      }
      return this.base2to10(base2);
    }
    static base10to2(base10, padLeft = true) {
      base10 = base10.toString();
      if (base10 === '' || /[^0-9]/.test(base10)) {
        throw new Error('Input must be a positive integer.');
      }
      let base2 = '';
      while (base10 !== '0') {
        const lastDigit = base10[base10.length - 1];
        base2 += this.BASE10_MOD2[lastDigit];
        base10 = BigInt(base10) / BigInt(2);
      }
      base2 = base2.split('').reverse().join('');
      if (padLeft) {
        const padAmount = (8 - (base2.length % 8)) % 8;
        base2 = '0'.repeat(padAmount) + base2;
      } else {
        base2 = base2.replace(/^0+/, '');
      }
      return base2;
    }
    static buildBinaryLookupTable(maxBitCount) {
      const table = [];
      for (let bitPosition = 0; bitPosition < maxBitCount; bitPosition++) {
        table.push(BigInt(2) ** BigInt(bitPosition));
      }
      return table;
    }
    static base2to10(base2) {
      if (typeof base2 !== 'string' || /[^01]/.test(base2)) {
        throw new Error('Input must be a binary string.');
      }
      if (!this.bitValueTable) {
        this.bitValueTable = this.buildBinaryLookupTable(512);
      }
      const base2rev = base2.split('').reverse().join('');
      let base10 = BigInt(0);
      for (let bitPosition = 0; bitPosition < base2rev.length; bitPosition++) {
        if (base2rev[bitPosition] === '1') {
          if (bitPosition < this.bitValueTable.length) {
            base10 += this.bitValueTable[bitPosition];
          } else {
            const bitValue = BigInt(2) ** BigInt(bitPosition);
            this.bitValueTable[bitPosition] = bitValue;
            base10 += bitValue;
          }
        }
      }
      return base10.toString();
    }
  }

  function formatNumber(number) {
    if (isNaN(number)) {
      return null;
    }
    return number.toLocaleString('de-DE');
  }
  async function getPost(url, cookie) {
    const headers = {
      "accept": "*/*",
      "accept-language": "vi,en-US;q=0.9,en;q=0.8",
      "sec-ch-ua": "\"Chromium\";v=\"106\", \"Microsoft Edge\";v=\"106\", \"Not;A=Brand\";v=\"99\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "x-asbd-id": "198387",
      "x-csrftoken": "tJk2tDhaeYfUeJRImgbH75Vp6CV6PjtW",
      "x-ig-app-id": "936619743392459",
      "x-ig-www-claim": "hmac.AR1NFmgjJtkM68KRAAwpbEV2G73bqDP45PvNfY8stbZcFiRA",
      "x-instagram-ajax": "1006400422",
      "Referer": "https://www.instagram.com/",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      //"user-agent": "Instagram 10.3.2 (iPhone7,2; iPhone OS 9_3_3; en_US; en-US; scale=2.00; 750x1334) AppleWebKit/420+"
    };
    if (!url || !url.match(/https:\/\/www\.instagram\.com\/(p|tv|reel)\/[a-zA-Z0-9]+/)) {
      throw new Error("Invalid or missing URL");
    }
    headers.cookie = cookie;
    const extractShortcode = (link) => {
      const regex = /https:\/\/www\.instagram\.com\/(p|tv|reel)\/([^/?]+)\//;
      const match = link.match(regex);
      return match ? match[2] : null;
    };
    const shortcode = extractShortcode(link);
    let postId = getID.getCode(shortcode);
    if (!postId) throw new Error("Post not found");
    const {
      data: postInfo
    } = await axios.get(`https://www.instagram.com/api/v1/media/${postId}/info/`, {
      headers
    });
    /*headers.cookie = cookie;
    const { data: postInfo } = await axios.get(`https://www.instagram.com/api/v1/media/${postId}/info/`, {
      headers: { 
          headers
      },
      params: {
        path: {
          media_id: postId
        }
      }
    });*/
    delete headers.cookie;
    const info = postInfo.items?.[0] || {};
    const dataReturn = {
      images: [],
      videos: []
    };
    if (info.video_versions) {
      dataReturn.videos = [info.video_versions[0].url];
    } else {
      const allImage = info.carousel_media || [{
        image_versions2: info.image_versions2
      }];
      dataReturn.images = allImage.map(item => item.image_versions2.candidates[0].url);
    }
    const postData = {
      ...dataReturn,
      caption: info.caption?.text || "",
      owner: {
        id: info.user.pk,
        username: info.user.username,
        full_name: info.user.full_name,
        profile_pic_url: info.user.profile_pic_url
      },
      like_count: info.like_count,
      comment_count: info.comment_count,
      created_at: info.taken_at,
      media_type: info.media_type,
      originalData: info
    };
    const attachments = [];
    if (postData.images && postData.images.length > 0) {
      attachments.push(...postData.images.map(imageUrl => ({
        type: "Photo",
        url: imageUrl
      })));
    } else if (postData.videos && postData.videos.length > 0) {
      attachments.push(...postData.videos.map(videoUrl => ({
        type: "Video",
        url: videoUrl
      })));
    }
    return {
      id: postData.originalData.id,
      message: postData?.caption || null,
      author: postData ? `${postData.owner.full_name} (${postData.owner.username})` : null,
      like: formatNumber(postData?.like_count) || null,
      comment: formatNumber(postData?.comment_count) || null,
      play: formatNumber(postData.originalData.play_count) || null,
      attachments
    };
  }
  async function getStories(url, cookie) {
    const headers = {
      "accept": "*/*",
      "accept-language": "vi,en-US;q=0.9,en;q=0.8",
      "sec-ch-ua": "\"Chromium\";v=\"106\", \"Microsoft Edge\";v=\"106\", \"Not;A=Brand\";v=\"99\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "x-asbd-id": "198387",
      "x-csrftoken": "tJk2tDhaeYfUeJRImgbH75Vp6CV6PjtW",
      "x-ig-app-id": "936619743392459",
      "x-ig-www-claim": "hmac.AR1NFmgjJtkM68KRAAwpbEV2G73bqDP45PvNfY8stbZcFiRA",
      "x-instagram-ajax": "1006400422",
      "referer": "https://www.instagram.com/",
      "referrer-policy": "strict-origin-when-cross-origin",
      'x-ig-app-id': '936619743392459',
      'x-ig-www-claim': 'hmac.AR2zPqOnGfYtujT0tmDsmiq0fdQ3f9DN4xXJ-J3EXnE6vFfA',
      'x-instagram-ajax-c2': 'b9a1aaad95e9',
      'x-instagram-ajax-c2-t': '41e3f8b',
      'x-requested-with': 'XMLHttpRequest',
      // "user-agent": "Instagram 10.3.2 (iPhone7,2; iPhone OS 9_3_3; en_US; en-US; scale=2.00; 750x1334) AppleWebKit/420+"
    };
    headers.cookie = cookie;
    async function getUserId(username) {
      const userRes = await axios.get(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`, {
        headers
      });
      return userRes.data.data.user.id;
    }
    const username = url.match(/instagram\.com\/stories\/([^/]+)\//)?.[1] || null;
    const userId = await getUserId(username);
    const getId = url.match(/\/stories\/[^\/]+\/(\d+)/)?.[1] || null;
    const storiesRes = await axios.get(`https://www.instagram.com/graphql/query/?query_hash=de8017ee0a7c9c45ec4260733d81ea31&variables={"reel_ids":["${userId}"],"tag_names":[],"location_ids":[],"highlight_reel_ids":[],"precomposed_overlay":false,"show_story_viewer_list":true}`, {
      headers
    });
    delete headers.cookie;
    const data = storiesRes.data.data.reels_media[0].items;
    const res = data.find(item => item.id === getId);
    let attachments = [];
    if (res.video_resources && res.video_resources.length > 0) {
      attachments.push({
        type: "Video",
        url: res.video_resources[0].src
      });
    } else if (res.display_resources && res.display_resources.length > 0) {
      attachments.push({
        type: "Photo",
        url: res.display_resources[0].src
      });
    }
    return {
      id: res.id,
      message: null,
      author: null,
      like: null,
      comment: null,
      play: null,
      attachments
    };
  }
  async function getHighlight(url, cookie) {
    try {
      const headers = {
        "accept": "*/*",
        "accept-language": "vi,en-US;q=0.9,en;q=0.8",
        "sec-ch-ua": "\"Chromium\";v=\"106\", \"Microsoft Edge\";v=\"106\", \"Not;A=Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "x-asbd-id": "198387",
        "x-csrftoken": "tJk2tDhaeYfUeJRImgbH75Vp6CV6PjtW",
        "x-ig-app-id": "936619743392459",
        "x-ig-www-claim": "hmac.AR1NFmgjJtkM68KRAAwpbEV2G73bqDP45PvNfY8stbZcFiRA",
        "x-instagram-ajax": "1006400422",
        "referer": "https://www.instagram.com/",
        "referrer-policy": "strict-origin-when-cross-origin",
        'x-ig-app-id': '936619743392459',
        'x-ig-www-claim': 'hmac.AR2zPqOnGfYtujT0tmDsmiq0fdQ3f9DN4xXJ-J3EXnE6vFfA',
        'x-instagram-ajax-c2': 'b9a1aaad95e9',
        'x-instagram-ajax-c2-t': '41e3f8b',
        'x-requested-with': 'XMLHttpRequest',
        //  "user-agent": "Instagram 10.3.2 (iPhone7,2; iPhone OS 9_3_3; en_US; en-US; scale=2.00; 750x1334) AppleWebKit/420+"
      };
      const storyId = url.match(/story_media_id=([^&]+)/)?.[1];
      headers.cookie = cookie;
      const res = await axios.get(`https://i.instagram.com/api/v1/media/${storyId}/info/`, {
        headers
      });
      delete headers.cookie;
      const data = res.data.items;
      const resp = data.find(item => item.id === storyId);
      let attachments = [];
      if (resp.video_versions && resp.video_versions.length > 0) {
        attachments.push({
          type: "Video",
          url: resp.video_versions[0].url
        });
      } else if (resp.image_versions2 && resp.image_versions2.candidates && resp.image_versions2.candidates.length > 0) {
        attachments.push({
          type: "Photo",
          url: resp.image_versions2.candidates[0].url
        });
      }
      return {
        id: resp.id,
        message: resp.caption,
        author: `${resp.user.full_name} (${resp.user.username})`,
        like: null,
        comment: null,
        play: null,
        attachments
      }
    } catch (error) {
      console.error(error);
    }
  }
  if (/https:\/\/www\.instagram\.com\/(p|tv|reel)\/[a-zA-Z0-9]+/.test(link)) {
    const data = await getPost(link, cookie);
    return data;
  } else if (/https:\/\/www\.instagram\.com\/stories\/[\w.]+\/\d+(\?[^\s]*)?/.test(link)) {
    const data = await getStories(link, cookie);
    return data;
  } else {
    const data = await getHighlight(link, cookie);
    return data;
  }
}
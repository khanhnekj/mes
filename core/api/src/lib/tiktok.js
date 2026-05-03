var axios = require('axios');

module.exports = async function(url) {
  var cookie = 'tt_chain_token=pF1O3miGZImcpW95TRO/qQ==; tiktok_webapp_theme_source=light; tiktok_webapp_theme=light; perf_feed_cache={%22expireTimestamp%22:1727172000000%2C%22itemIds%22:[%227414475007230856466%22%2C%227411135674436439303%22]}; passport_csrf_token=18234c54ef91f21bdafbac11a4559191; passport_csrf_token_default=18234c54ef91f21bdafbac11a4559191; d_ticket=0e8d512de12d0fc3266b223f899fa6a473cb5; multi_sids=7200947234158068737%3A8aeade80a3539e9a275869b746c99734; cmpl_token=AgQQAPOFF-RO0rPQCfz6YB04_I5o2LVKv4UOYNSqDA; passport_auth_status=7dd5fb91f3ff404f1b87e553df6b62cc%2C; passport_auth_status_ss=7dd5fb91f3ff404f1b87e553df6b62cc%2C; sid_guard=8aeade80a3539e9a275869b746c99734%7C1727001135%7C15552000%7CFri%2C+21-Mar-2025+10%3A32%3A15+GMT; uid_tt=99f716603603e2b358807799ac140b3950449ce8df628439c5756b5e112197d8; uid_tt_ss=99f716603603e2b358807799ac140b3950449ce8df628439c5756b5e112197d8; sid_tt=8aeade80a3539e9a275869b746c99734; sessionid=8aeade80a3539e9a275869b746c99734; sessionid_ss=8aeade80a3539e9a275869b746c99734; sid_ucp_v1=1.0.0-KDk4Y2QxMjJiMTFiNWMyYzliNzlhNmVjNjFlMmNmYjI5M2Q5ZTA3ZDMKIgiBiMuSt-u592MQr-S_twYYswsgDDDxzrufBjgCQPEHSAQQAxoGbWFsaXZhIiA4YWVhZGU4MGEzNTM5ZTlhMjc1ODY5Yjc0NmM5OTczNA; ssid_ucp_v1=1.0.0-KDk4Y2QxMjJiMTFiNWMyYzliNzlhNmVjNjFlMmNmYjI5M2Q5ZTA3ZDMKIgiBiMuSt-u592MQr-S_twYYswsgDDDxzrufBjgCQPEHSAQQAxoGbWFsaXZhIiA4YWVhZGU4MGEzNTM5ZTlhMjc1ODY5Yjc0NmM5OTczNA; store-idc=alisg; store-country-code=vn; store-country-code-src=uid; tt-target-idc=alisg; tt-target-idc-sign=HWrT4Oq1l0noG3lXhTk6jxV94tMn2kAhNDyJcnpTBOSyD5B3nfHR6qZ8YXOuF6_e-8ub_eKOaQUEKXTdgHyj9lSBBUGH83j54iNHP3q8QaGW3rMtc5E1gR67raqJZV-1EKeu__Z89NjsjqgL9XfIuaktrkvYsv2Sc3f3xNGeFViWKmdn4Jq8MbV9qVOi_JxQtKOj9qvdiApIx_KaJNJX_xzaASlNq1G7OkhXYHpx5ivMJoA4QVJrGn1eoHXICiMTRHiMUPqNKLR5DxcESlve5MHfUggwsIrQtsqDDR7iC5rU65BTFDiOW0uX2m2ZkfSWkgI3eCl_Y0kzuX6jF0aIDiGARlJBmHdRw72Rr3tjnGv3aU9uX0Vuo8afX26cd63vzIzY0C9vu5eEa22eo6tnnxl4oNKZX7Kx8xKdT8MEWx_dA0up3IeW2zJEDBiRQwmvX8EztaA-d7r8pVqLK8Bcces3lqri8NtBaJmBaQVT2NPGrWrB_T-1X2nj55sJOVAa; last_login_method=sms_verification; msToken=dtkdUezVGfw9QwcYmYl0C3DraDzrX_bXWJUQcGVpN_V8GQPcZKYpvCqIyZ2xBuJJv9ONcE57AwReJCC2sUCqEKd_nXZ4wdotiP5i0z5D6j0apQm9AY-o95RgKeErBKdCTEcM0v_5L935; odin_tt=41a5f12a984ae03c56c086958993ac29d78cccbbd66a40e559a07f4f1944ff50bb23ac42cb5e80287a25aafca799d796940a417539db4c06aaeda98ac8395806f82775a752d4310f495e6786b2280e8b; ak_bmsc=CA96D9BCDE62C469B0A6367C58FA6485~000000000000000000000000000000~YAAQFvN0aFlDKBqSAQAAVlW/HRmiyBCy3SOEsG/nR1FTRVMnzXMuW5BNfwfB/ystRgWsyJFz1dJxK2JZ2f4pOjvRilqYa8uq+bDvat8bu6g+77BhDgHOL+q7qe5Fa+cCCoeZMG8PdNlq+UJDBLM0GDt5GqMVEFIJ51eNljg0oDenDjaQHGdbh+Wv7Z/cCNvCdiJU14EOSgr4iuJ5muoxVzCSt4OZBzniYIHWHupgjDT0pK5tX6L0qBPHmpuIagx6hdrkm5llit2E1SIX078Atc1uvWlWmK8GaQvvfi+Zoh4k51FqSrA1lXJ4G/uKqo1f/m5lG0bqy1E5xeQ+fAWG1IE1eZw96MwzMidEZgd8Ks3brZtcKfTWnKuuhN+q781QY5+Z3WmR/Q1+yw==; tt_csrf_token=fX8r0zRs-Z_ZwzcoROrJzLftJw03sFpdHT2c; bm_sv=1E7C4586F7034D2CD8B03A0E69E9A7DD~YAAQBPN0aFrhUxqSAQAAfCTaHRnOaq7jsMdLr8Q5TgNM0m27JU39Y2g5/+CM7I+DdL5Ez6Ve6cLrHgItyEJWriRHCRvoYuVoihfivCLWwyT+/0ITy8OosNKkwx0HFYtRXIYoB5MqpjQPqpA57TT10xwS0RMWQPN/3SHSDjZAQ7TqWZStvuP5oohJaBMrO6UeFzw3hkYH0LHY5G/YNzhYXbxbFM6nszu3Nymxujj8MQr6z1QZOfNoKpJWoBzljiqc~1; ttwid=1%7C4WQM04yNekQN0wLr7LUeSV-1wJQGkM-wem_VG43f9-Q%7C1727077691%7C266ded7cd7cc3b8c97d182189b98c6fd1d094afec0d22c38edf10a76f9490743; msToken=rhTC0GMRehrZpHi14hPI9yp23_sEloFyMUtoo5hPZQOZqFXSMov4r1xjF9L77POGm6XKkylhNhudWT0VE6oQFXe0QvjvqDUSQR2qgI7HSL03oxA7Q0FCgS028Az5nOAeDU3fJlgpAJB4; useragent=TW96aWxsYS81LjAgKExpbnV4OyBBbmRyb2lkIDEwOyBLKSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTI0LjAuMC4wIE1vYmlsZSBTYWZhcmkvNTM3LjM2; _uafec=Mozilla%2F5.0%20(Linux%3B%20Android%2010%3B%20K)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F124.0.0.0%20Mobile%20Safari%2F537.36;';
  var _tiktokapi = function(ID) {
      return `https://api16-va.tiktokv.com/aweme/v1/feed/?aweme_id=${ID}&version_name=1.1.9&version_code=119&build_number=1.1.9&manifest_version_code=119&update_version_code=119&openudid=dlcrw3zg28ajm4ml&uuid=3703699664470627&_rticket=1677813932976&ts=1677813932&device_brand=Realme&device_type=RMX1821&device_platform=android&resolution=720*1370&dpi=320&os_version=11&os_api=30&carrier_region=US&sys_region=US%C2%AEion=US&app_name=TK%20Downloader&app_language=en&language=en&timezone_name=Western%20Indonesia%20Time&timezone_offset=25200&channel=googleplay&ac=wifi&mcc_mnc=&is_my_cn=0&aid=1180&ssmix=a&as=a1qwert123`;
  };
  function formatTimestamp(timestamp) {
      const date = new Date(timestamp * 1000);
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')} | ${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  }
  function formatNumber(number) {
      return isNaN(number) ? null : number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
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
  try {
    url = url.replace("https://vm", "https://vt");
    const headResponse = await axios.head(url, {
      headers: {
        'Accept-Language': 'vi-VN',
        'Accept': '*/*',
        'Connection': 'keep-alive',
        ...headersss()
      },
      timeout: 10000
    });
    const responseUrl = headResponse.request.res.responseUrl;
    const ID = responseUrl.match(/\d{17,21}/g)?.[0];
    if (!ID) return;
    const optionsResponse = await axios.options(_tiktokapi(ID), {
      headers: {
        'Accept-Language': 'vi-VN',
        'Accept': '*/*',
        'Connection': 'keep-alive',
		'Cookie': cookie,
        ...headersss()
      },
      timeout: 10000
    });
    const content = optionsResponse.data.aweme_list.find(v => v.aweme_id === ID);
    if (!content) return;
    const author = {
       username: content.author.unique_id,
       nickname: content.author.nickname,
    };
    const music = {
      title: content.music.title,
      url: content.music.play_url.url_list[0]
    };
    const attachments = [];
    if (content.image_post_info) {
      attachments.push(...content.image_post_info.images.map(v => ({
        type: 'Photo',
        url: v.display_image.url_list[0]
      })));
    } else if (content.video) {
      attachments.push({
        type: 'Video',
        url: content.video.play_addr.url_list[0] || content.video.play_addr.url_list[1] || content.video.play_addr.url_list[2]
      });
    }
    return {
      id: content.aweme_id,
      message: content.desc || "Không có tiêu đề",
      createTime: formatTimestamp(content.create_time),
      author,
      music,
      views: formatNumber(content.statistics.play_count) || 0,
      likes: formatNumber(content.statistics.digg_count) || 0,
      comments: formatNumber(content.statistics.comment_count) || 0,
      shares: formatNumber(content.statistics.share_count) || 0,
      collects: formatNumber(content.statistics.collect_count) || 0,
      attachments
    };
  } catch (error) {
    return {
      status: "error",
      message: error.message
    };
  }
};
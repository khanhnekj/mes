const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('qs');
const fetch = require('node-fetch');

const cookie_main = 'tt_chain_token=pF1O3miGZImcpW95TRO/qQ==; tiktok_webapp_theme_source=light; tiktok_webapp_theme=light; perf_feed_cache={%22expireTimestamp%22:1727172000000%2C%22itemIds%22:[%227414475007230856466%22%2C%227411135674436439303%22]}; passport_csrf_token=18234c54ef91f21bdafbac11a4559191; passport_csrf_token_default=18234c54ef91f21bdafbac11a4559191; d_ticket=0e8d512de12d0fc3266b223f899fa6a473cb5; multi_sids=7200947234158068737%3A8aeade80a3539e9a275869b746c99734; cmpl_token=AgQQAPOFF-RO0rPQCfz6YB04_I5o2LVKv4UOYNSqDA; passport_auth_status=7dd5fb91f3ff404f1b87e553df6b62cc%2C; passport_auth_status_ss=7dd5fb91f3ff404f1b87e553df6b62cc%2C; sid_guard=8aeade80a3539e9a275869b746c99734%7C1727001135%7C15552000%7CFri%2C+21-Mar-2025+10%3A32%3A15+GMT; uid_tt=99f716603603e2b358807799ac140b3950449ce8df628439c5756b5e112197d8; uid_tt_ss=99f716603603e2b358807799ac140b3950449ce8df628439c5756b5e112197d8; sid_tt=8aeade80a3539e9a275869b746c99734; sessionid=8aeade80a3539e9a275869b746c99734; sessionid_ss=8aeade80a3539e9a275869b746c99734; sid_ucp_v1=1.0.0-KDk4Y2QxMjJiMTFiNWMyYzliNzlhNmVjNjFlMmNmYjI5M2Q5ZTA3ZDMKIgiBiMuSt-u592MQr-S_twYYswsgDDDxzrufBjgCQPEHSAQQAxoGbWFsaXZhIiA4YWVhZGU4MGEzNTM5ZTlhMjc1ODY5Yjc0NmM5OTczNA; ssid_ucp_v1=1.0.0-KDk4Y2QxMjJiMTFiNWMyYzliNzlhNmVjNjFlMmNmYjI5M2Q5ZTA3ZDMKIgiBiMuSt-u592MQr-S_twYYswsgDDDxzrufBjgCQPEHSAQQAxoGbWFsaXZhIiA4YWVhZGU4MGEzNTM5ZTlhMjc1ODY5Yjc0NmM5OTczNA; store-idc=alisg; store-country-code=vn; store-country-code-src=uid; tt-target-idc=alisg; tt-target-idc-sign=HWrT4Oq1l0noG3lXhTk6jxV94tMn2kAhNDyJcnpTBOSyD5B3nfHR6qZ8YXOuF6_e-8ub_eKOaQUEKXTdgHyj9lSBBUGH83j54iNHP3q8QaGW3rMtc5E1gR67raqJZV-1EKeu__Z89NjsjqgL9XfIuaktrkvYsv2Sc3f3xNGeFViWKmdn4Jq8MbV9qVOi_JxQtKOj9qvdiApIx_KaJNJX_xzaASlNq1G7OkhXYHpx5ivMJoA4QVJrGn1eoHXICiMTRHiMUPqNKLR5DxcESlve5MHfUggwsIrQtsqDDR7iC5rU65BTFDiOW0uX2m2ZkfSWkgI3eCl_Y0kzuX6jF0aIDiGARlJBmHdRw72Rr3tjnGv3aU9uX0Vuo8afX26cd63vzIzY0C9vu5eEa22eo6tnnxl4oNKZX7Kx8xKdT8MEWx_dA0up3IeW2zJEDBiRQwmvX8EztaA-d7r8pVqLK8Bcces3lqri8NtBaJmBaQVT2NPGrWrB_T-1X2nj55sJOVAa; last_login_method=sms_verification; msToken=dtkdUezVGfw9QwcYmYl0C3DraDzrX_bXWJUQcGVpN_V8GQPcZKYpvCqIyZ2xBuJJv9ONcE57AwReJCC2sUCqEKd_nXZ4wdotiP5i0z5D6j0apQm9AY-o95RgKeErBKdCTEcM0v_5L935; odin_tt=41a5f12a984ae03c56c086958993ac29d78cccbbd66a40e559a07f4f1944ff50bb23ac42cb5e80287a25aafca799d796940a417539db4c06aaeda98ac8395806f82775a752d4310f495e6786b2280e8b; ak_bmsc=CA96D9BCDE62C469B0A6367C58FA6485~000000000000000000000000000000~YAAQFvN0aFlDKBqSAQAAVlW/HRmiyBCy3SOEsG/nR1FTRVMnzXMuW5BNfwfB/ystRgWsyJFz1dJxK2JZ2f4pOjvRilqYa8uq+bDvat8bu6g+77BhDgHOL+q7qe5Fa+cCCoeZMG8PdNlq+UJDBLM0GDt5GqMVEFIJ51eNljg0oDenDjaQHGdbh+Wv7Z/cCNvCdiJU14EOSgr4iuJ5muoxVzCSt4OZBzniYIHWHupgjDT0pK5tX6L0qBPHmpuIagx6hdrkm5llit2E1SIX078Atc1uvWlWmK8GaQvvfi+Zoh4k51FqSrA1lXJ4G/uKqo1f/m5lG0bqy1E5xeQ+fAWG1IE1eZw96MwzMidEZgd8Ks3brZtcKfTWnKuuhN+q781QY5+Z3WmR/Q1+yw==; tt_csrf_token=fX8r0zRs-Z_ZwzcoROrJzLftJw03sFpdHT2c; bm_sv=1E7C4586F7034D2CD8B03A0E69E9A7DD~YAAQBPN0aFrhUxqSAQAAfCTaHRnOaq7jsMdLr8Q5TgNM0m27JU39Y2g5/+CM7I+DdL5Ez6Ve6cLrHgItyEJWriRHCRvoYuVoihfivCLWwyT+/0ITy8OosNKkwx0HFYtRXIYoB5MqpjQPqpA57TT10xwS0RMWQPN/3SHSDjZAQ7TqWZStvuP5oohJaBMrO6UeFzw3hkYH0LHY5G/YNzhYXbxbFM6nszu3Nymxujj8MQr6z1QZOfNoKpJWoBzljiqc~1; ttwid=1%7C4WQM04yNekQN0wLr7LUeSV-1wJQGkM-wem_VG43f9-Q%7C1727077691%7C266ded7cd7cc3b8c97d182189b98c6fd1d094afec0d22c38edf10a76f9490743; msToken=rhTC0GMRehrZpHi14hPI9yp23_sEloFyMUtoo5hPZQOZqFXSMov4r1xjF9L77POGm6XKkylhNhudWT0VE6oQFXe0QvjvqDUSQR2qgI7HSL03oxA7Q0FCgS028Az5nOAeDU3fJlgpAJB4; useragent=TW96aWxsYS81LjAgKExpbnV4OyBBbmRyb2lkIDEwOyBLKSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTI0LjAuMC4wIE1vYmlsZSBTYWZhcmkvNTM3LjM2; _uafec=Mozilla%2F5.0%20(Linux%3B%20Android%2010%3B%20K)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F124.0.0.0%20Mobile%20Safari%2F537.36;';

async function search(keywords, limit = 10) {
  try {
    const response = await axios.get(`https://m.tiktok.com/api/search/general/full/?keyword=${encodeURI(keywords)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:99.0) Gecko/20100101 Firefox/99.0",
        "cookie": '_ttp=2UYKQrM4SmZZenItvveYVoKcRbi; tt_chain_token=xJitPcTGnRtRoIQbkG1Rpg==; tiktok_webapp_theme=light; uid_tt=718bd1d8fc4d8a6eaf7fe1bd59d2fedb46158b25e382d5e9c0277697edac7c23; uid_tt_ss=718bd1d8fc4d8a6eaf7fe1bd59d2fedb46158b25e382d5e9c0277697edac7c23; sid_tt=5c175b76c99f4e3b07ab3ca7c0c1e151; sessionid=5c175b76c99f4e3b07ab3ca7c0c1e151; sessionid_ss=5c175b76c99f4e3b07ab3ca7c0c1e151; store-idc=alisg; store-country-code=vn; store-country-code-src=uid; tt-target-idc=alisg; tt-target-idc-sign=IZqkoGplb7W_eUgHBchKFio2X3juz96L66dacqHNIFz54B9LeKsejGtoGBSO6USJ8EByFEkqwevpeEZH0fqHZa99vQaFtdbVk8gkBN8dM0yJIWObx4NM2v5Cser9N5bP1ZLKMBFnVLUVPaeVO1cxRJsq3b4UGBPJg0AKWufql0hV6YztnBXYDZ7GcFxpS9JfmnRxkQL2DcyQaIz0jIYgZEvzrOuOzYhf0-7M0AOhhj5URcnGOt7m8T0BQLqIcXaT80jNjk1RoRQ_2l8Nm_l0N_V1428nyjt37mu83zFDdYsx5Kt0n77JbpNbfWhHxY6pFSVt-Dcn5ElzRfLPwrp8Fj7PQsuWd3rtSXv-VR4Gd5g2zOiu5i9xJwOXLoWaEnuT_i9jsA5PkZ1bdt561DpoWBnJyPqz9gl2VBmcmIq0OeefZIVnxUvVVaP5TlUvrbTB6xLHJ37hrNd1vh8I63Ux7EwTIplI5zyA2seFtUcq8OF5EiebFe6wlmy7qQd2_sVr; tt_csrf_token=DFfQHzT9-qG_2NUUsBZ5gtUV7aBvzodS9Ydc; ak_bmsc=9CDD4A265744E29B6FA10260420F838F~000000000000000000000000000000~YAAQF+ercU09wuCOAQAAbo2pRxd2vCSmrBA1B3BNtavmHKdqChmVpaxVoLvENxwnjbbBYp1e4lkavk1Rf7Jojl9SsYCS3mnTthMDsQKZQAyRz++JjSMMeHAd1M8j0443AMfQA5sICVZQ82VA4xmxvN1B3y0ZbKWcV1g/AkqBHHsryFt+JUJSHtJOYLcjp2Ric81qBS9e1YwUF3ux1aUNXkre6+DlysonlwvOQrgtscMz4tLI2ncqNq5AKPIGMOGbSinSMACkeyGedU15oYm9jM78KEZvctPfVqb/gmWQJBnbShm/BSvI2QalR2N4FOkbeg5FynyD5XYxbOY38rZMDl5Dmt3Jll/0ZLayQdqwsmFa8+G3FcnnOiP1pty2B6L261+1O90zN1mI; sid_guard=5c175b76c99f4e3b07ab3ca7c0c1e151%7C1714894249%7C15552000%7CFri%2C+01-Nov-2024+07%3A30%3A49+GMT; sid_ucp_v1=1.0.0-KDBjNTY5OTcxZTJmZWVmYjUzY2E5MzlmZjc3NjE1ZTg5YTQ1MTM2ZDEKHwiBiLaC6qSB32UQqevcsQYYswsgDDDcjfitBjgIQBIQAxoDc2cxIiA1YzE3NWI3NmM5OWY0ZTNiMDdhYjNjYTdjMGMxZTE1MQ; ssid_ucp_v1=1.0.0-KDBjNTY5OTcxZTJmZWVmYjUzY2E5MzlmZjc3NjE1ZTg5YTQ1MTM2ZDEKHwiBiLaC6qSB32UQqevcsQYYswsgDDDcjfitBjgIQBIQAxoDc2cxIiA1YzE3NWI3NmM5OWY0ZTNiMDdhYjNjYTdjMGMxZTE1MQ; bm_sv=D79A28FB79A2AA2D4375DD11DD4C18D1~YAAQF+ercVc9wuCOAQAAa6epRxeAqWI6x+0yefULIDep3YqsjNwgfBm2kWiNqwij6CQ5KQm7TDvDUK9/SpQc24JkqUO/0YFeMTd/wcfNrTVDVHOXPUZAVG85ZNcb/3OEYkrZ3Kq1dC0Q3mzSl4SAhYSHayS9ST01XN9WPmYYLlV75VOjnmFTUOLXy21blJ9joWJJ7itmCwegH/k/akeSferkLz7/VP1IQzB6lekufKy1dJYLnmmIARnF/g6HSTs+~1; ttwid=1%7C67Ck6lGLYwQNpr4_BgqfE_qwgXKSWvwhSGTP9p93qTI%7C1714894254%7C63ebeeeb770ac8e61e9daedfde5fcc6382d36b346acf65716f81e8b0b724918d; odin_tt=f2f120d733694b449f2a768f887bba1b92d0bb81b7c6bda293bfa5b76ac470c5a292c50e6fb2fdedf1ea303fae9285c4bda91c95c028b42159712ca8eebbcead6a0d50805b5897ee2b1bc01bf68ed67c; perf_feed_cache={%22expireTimestamp%22:1715065200000%2C%22itemIds%22:[%227363561802946514177%22%2C%227335701134037830944%22]}; msToken=wa0a75jJLYjR8eO8Lss9t-xUeKu5X5ahcqxparKNrQ0kng22XiqVAXzvYPpdcnErVQjXglCNtlGObqExtO_GeWV3fGSPJvDGM60GggT2RdhbhNXPRqyQKFgW1PVZ4KbIRXCLsw==; msToken=8qaceELHDaBpHf50xECAaCnmT8ajkcXCHLPYI9Rj9tHM2uTj1b3sjEsP1W_ByS-AOQDPD0gwCELp6vPonrmgsUg6Gb5PGbWU_xbUd428yGlidDHpV7Vm8eMynrRDJf9HQXAquw==; useragent=TW96aWxsYS81LjAgKExpbnV4OyBBbmRyb2lkIDEwOyBLKSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTIwLjAuMC4wIE1vYmlsZSBTYWZhcmkvNTM3LjM2; _uafec=Mozilla%2F5.0%20(Linux%3B%20Android%2010%3B%20K)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F120.0.0.0%20Mobile%20Safari%2F537.36;',
        "Accept-Language": "vi-VN,vi;q=0.9"
      }
    });
    const getData = response.data.data;
    const result = getData.filter(data => data.type === 1).slice(0, limit).map(data => ({
      id: data.item.id,
      desc: data.item.desc,
      createTime: data.item.createTime,
      stats: data.item.stats,
      video: data.item.video,
      author: data.item.author,
      music: data.item.music,
      challenges: data.item.challenges
    }));
    return result;
  } catch (error) {
    console.error("Error while fetching data:", error);
    return [];
  }
};

async function searchUser(username, page) {
  var _tiktokurl = "https://www.tiktok.com"; 
  if (page === void 0) {
    page = 1;
  }
  return new Promise(function(resolve, reject) {
    var cursor = 0;
    for (var i = 1; i < page; i++) {
      cursor += 10;
    }
    var params = qs.stringify({
      WebIdLastTime: Date.now(),
      aid: "1988",
      app_language: "en",
      app_name: "tiktok_web",
      browser_language: "en-US",
      browser_name: "Mozilla",
      browser_online: true,
      browser_platform: "Win32",
      browser_version:
        "5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0",
      channel: "tiktok_web",
      cookie_enabled: true,
      cursor: cursor,
      device_id: "7340508178566366722",
      device_platform: "web_pc",
      focus_state: false,
      from_page: "search",
      history_len: 5,
      is_fullscreen: false,
      is_page_visible: true,
      keyword: username,
      os: "windows",
      priority_region: "ID",
      referer: "",
      region: "ID",
      screen_height: 768,
      screen_width: 1366,
      search_id: "20240329123238075BE0FECBA0FE11C76B",
      tz_name: "Asia/Ho_Chi_Minh",
      web_search_code: {
        tiktok: {
          client_params_x: {
            search_engine: {
              ies_mt_user_live_video_card_use_libra: 1,
              mt_search_general_user_live_card: 1
            }
          },
          search_server: {}
        }
      },
      webcast_language: "en"
    });
    axios.get(_tiktokurl + "/api/search/user/full/?" + params, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0",
        cookie: "_ttp=2UYKQrM4SmZZenItvveYVoKcRbi; tt_chain_token=xJitPcTGnRtRoIQbkG1Rpg==; tiktok_webapp_theme=light; uid_tt=718bd1d8fc4d8a6eaf7fe1bd59d2fedb46158b25e382d5e9c0277697edac7c23; uid_tt_ss=718bd1d8fc4d8a6eaf7fe1bd59d2fedb46158b25e382d5e9c0277697edac7c23; sid_tt=5c175b76c99f4e3b07ab3ca7c0c1e151; sessionid=5c175b76c99f4e3b07ab3ca7c0c1e151; sessionid_ss=5c175b76c99f4e3b07ab3ca7c0c1e151; store-idc=alisg; store-country-code=vn; store-country-code-src=uid; tt-target-idc=alisg; tt-target-idc-sign=IZqkoGplb7W_eUgHBchKFio2X3juz96L66dacqHNIFz54B9LeKsejGtoGBSO6USJ8EByFEkqwevpeEZH0fqHZa99vQaFtdbVk8gkBN8dM0yJIWObx4NM2v5Cser9N5bP1ZLKMBFnVLUVPaeVO1cxRJsq3b4UGBPJg0AKWufql0hV6YztnBXYDZ7GcFxpS9JfmnRxkQL2DcyQaIz0jIYgZEvzrOuOzYhf0-7M0AOhhj5URcnGOt7m8T0BQLqIcXaT80jNjk1RoRQ_2l8Nm_l0N_V1428nyjt37mu83zFDdYsx5Kt0n77JbpNbfWhHxY6pFSVt-Dcn5ElzRfLPwrp8Fj7PQsuWd3rtSXv-VR4Gd5g2zOiu5i9xJwOXLoWaEnuT_i9jsA5PkZ1bdt561DpoWBnJyPqz9gl2VBmcmIq0OeefZIVnxUvVVaP5TlUvrbTB6xLHJ37hrNd1vh8I63Ux7EwTIplI5zyA2seFtUcq8OF5EiebFe6wlmy7qQd2_sVr; sid_guard=5c175b76c99f4e3b07ab3ca7c0c1e151%7C1714894249%7C15552000%7CFri%2C+01-Nov-2024+07%3A30%3A49+GMT; sid_ucp_v1=1.0.0-KDBjNTY5OTcxZTJmZWVmYjUzY2E5MzlmZjc3NjE1ZTg5YTQ1MTM2ZDEKHwiBiLaC6qSB32UQqevcsQYYswsgDDDcjfitBjgIQBIQAxoDc2cxIiA1YzE3NWI3NmM5OWY0ZTNiMDdhYjNjYTdjMGMxZTE1MQ; ssid_ucp_v1=1.0.0-KDBjNTY5OTcxZTJmZWVmYjUzY2E5MzlmZjc3NjE1ZTg5YTQ1MTM2ZDEKHwiBiLaC6qSB32UQqevcsQYYswsgDDDcjfitBjgIQBIQAxoDc2cxIiA1YzE3NWI3NmM5OWY0ZTNiMDdhYjNjYTdjMGMxZTE1MQ; ak_bmsc=D2DEEC727557AEFA1880607B6FE355C8~000000000000000000000000000000~YAAQPfrSFxJ15FCPAQAA6WLbURdmUR/gHeSztWgtzKurxOL3mJV0aUiPcvBk+iH1Vdre0RF8KXR5I9GODF6zkG23sQyNlZg12bXjGxTf48ie0cYYavJAkF1O9FuIpfl1Oe8AFyJgswn+gbgIVR+nrLTh5RnCzQiDG1Z9Fa1NKI7GHQ4GlYN86dYhwMbkzivWw4Un0/59UZUnhwElv8L69xeHoFDok1wc1b/3bLqR09C/95zVMuAphVcTAumJsKB5bKiv+2higq3bvZiI2NciUpykHlKLkRBl9juYxFIycvojbB6yxRvu1R2U9Y4xqb8xcfTc2h/24tWsB5VAPe5f6Vozs6La3EG3rcuy8JzBMamISX3Q/RHKLMtInxoVZTj0jVvQ99XC62jEUUg=; perf_feed_cache={%22expireTimestamp%22:1715238000000%2C%22itemIds%22:[%227363552342131658002%22%2C%227358518193217965355%22]}; msToken=uaWSQvOgmRZIhpqFA2pI_SKTZnDuG9KVv1sVUeUFBlxneFYtMMlTaic0IM0G6VkjW7ITYreUB-ZwDe_oFAG0a-d6jUlp6tdzr4bUU234By2abOTTzdPB_sxhJ2gQkS3r-L6miw==; tt_csrf_token=PD1aN6hB-mYJmqDIbVtxwcu3QQzXCEeUMre8; bm_sv=DE7CFE8AF7503AA93D11B22CA7DF64D3~YAAQJ6TUF6SEuz+PAQAA6X/5URcS9p5ofwbJTZsqYHIzutcxINWNOfPIqpL+pAD8Xj+Zfg77FVmNlv9vXBkXU33ZdnGfbH3+xscFa3HIr5uE1qQ6v7L+wah7XPZB8WlbSnVc/cOY71x8jvv3jPRKHZEvH4Kq24B1yxhDV8SUMeel0s3+b/865RTQUixUB1Uc+MVyE2rq+NNwuwBJkzmMhjOHsur94UxQchm3T2APGQbxgY2nLJIVS0Mm4GVpTE3/~1; ttwid=1%7C67Ck6lGLYwQNpr4_BgqfE_qwgXKSWvwhSGTP9p93qTI%7C1715067260%7C6dbd9fbd09e7c57a15623ebec0c5d10374eb2528077f99d5fa9cd9ba137c1b0f; msToken=6isKTBvl-dtXWDjq6SEs2d_sWwXUDH5-ZaY6SY5GTBzKgkZtDXX7lo4qFAIymrNAa7lgYUUjHKZI3ne05NIVZyKXHt4m_YN4Fwskfo0kCv55gVpYtIf5GdbhT-zCd_Rs8e0Piw==; odin_tt=05f9d29517864fa23b1d17639309ff469ef07504ebec55b61575e8f683f3ee62da6861e1d5bcb71a801c3492277fa11b7dac24a54b5f53e489a15263a95a51e4dca54eb9815c981f8650c02168dbadb5; useragent=TW96aWxsYS81LjAgKExpbnV4OyBBbmRyb2lkIDEwOyBLKSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTIwLjAuMC4wIE1vYmlsZSBTYWZhcmkvNTM3LjM2; _uafec=Mozilla%2F5.0%20(Linux%3B%20Android%2010%3B%20K)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F120.0.0.0%20Mobile%20Safari%2F537.36;"}}).then(function(_ref) {
        var data = _ref.data;
        if (data.status_code !== 0) {
          return resolve({
            status: "error",
            message: "Không tìm thấy người dùng. Đảm bảo từ khóa bạn đang tìm kiếm là chính xác..."});
        }
        var result = [];
        for (var i = 0; i < data.user_list.length; i++) {
          var user = data.user_list[i];
          result.push({
            uid: user.user_info.uid,
            username: user.user_info.unique_id,
            nickname: user.user_info.nickname,
            signature: user.user_info.signature,
            followerCount: user.user_info.follower_count,
            avatarThumb: user.user_info.avatar_thumb,
            isVerified: user.custom_verify !== "",
            secUid: user.user_info.sec_uid,
            url: _tiktokurl + "/@" + user.user_info.unique_id
          });
        }
        resolve(result);
      }).catch(function(e) {
        resolve({ status: "error", message: e.message });
      });
  });
};

async function infov2(user) {
  try {
    const { data } = await axios.get(`https://tiktok.com/@${user}`, {
      headers: {
        "User-Agent": "PostmanRuntime/7.32.2"
      }
    });
    const $ = cheerio.load(data);
    const dats = $("#__UNIVERSAL_DATA_FOR_REHYDRATION__").text();
    const result = JSON.parse(dats)
    if (result["__DEFAULT_SCOPE__"]["webapp.user-detail"].statusCode !== 0) {
      const ress = {
        status: "error",
        message: "User not found!"
      }
      return ress;
    };
    const res = result["__DEFAULT_SCOPE__"]["webapp.user-detail"]["userInfo"];
    return res;
  } catch (err) {
    return String(err);
  }
}

async function downloadv1(url) {
    try {
        const { data } = await axios.post('https://ttsave.app/download', qs.stringify({
            query: url,
            language_id: "1"
        }), {
            headers: {
                'authority': 'ttsave.app',
                'method': 'POST',
                'path': '/download',
                'scheme': 'https',
                'accept': 'application/json, text/plain, */*',
                'accept-encoding': 'gzip, deflate, br, zstd',
                'accept-language': 'vi,vi-VN;q=0.9',
                'content-type': 'application/x-www-form-urlencoded',
                'origin': 'https://ttsave.app',
                'referer': 'https://ttsave.app/en',
                'sec-ch-ua': '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',

            }
        });
        const $ = cheerio.load(data);
        const name = $('h2.font-extrabold.text-xl.text-center').text();
        const username = $('a[href^="https://www.tiktok.com/"]').text();
        const message = $('p.text-gray-600.px-2.text-center').text();
        const view = $('svg.text-gray-500').next('span').text();
        const like = $('svg.text-red-500').next('span').text();
        const comment = $('svg.text-green-500').next('span').text();
        const share = $('svg.text-yellow-500').next('span').text();
        const favorite = $('svg.text-blue-500').next('span').text();
        const soundName = $('div.flex-row.items-center.justify-center.gap-1.mt-5').text().trim();
        const audio = $('a[type="audio"]').attr('href');
        const attachments = [];
        if ($('div.flex.flex-col.text-center img').length > 0) {
            $('div.flex.flex-col.text-center img').each((i, elem) => {
                attachments.push({ type: 'Photo', url: $(elem).attr('src') });
            });
        } else {
            const videoLink = $('#button-download-ready a').attr('href');
            const videoType = $('#button-download-ready a').attr('type');
            if (videoLink && videoType === 'no-watermark') {
                attachments.push({ type: 'Video', url: videoLink });
            }
        }
        return {
            message,
            author: `${name} (${username})`,
            view,
            like,
            comment,
            share,
            favorite,
            soundName,
            audio,
            attachments,
        };
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
};

async function downloadv2(aweme_id) {
  function formatTimestamp(timestamp) {
      const date = new Date(timestamp * 1000);
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')} | ${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  }

  function formatNumber(number) {
      return isNaN(number) ? null : number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  if (!aweme_id) return;

  const response = await axios({
      method: 'OPTIONS',
      url: 'https://api22-normal-c-alisg.tiktokv.com/aweme/v1/feed/',
      headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
          'Cookie': cookie_main,
          'Accept-Language': 'vi-VN',
          'Accept': '*/*',
          'Connection': 'keep-alive'
      },
      params: {
          aweme_id,
          iid: '7318518857994389254',
          device_id: '7318517321748022790',
          channel: 'googleplay',
          app_name: 'musical_ly',
          version_code: '300904',
          device_platform: 'android',
          device_type: 'ASUS_Z01QD',
          version: '9'
      }
  });

  const data = response.data?.aweme_list?.[0];
  if (!data) return;

  const attachments = [];
  if (data.video?.bit_rate?.[0]?.play_addr?.url_list?.[0]) {
      attachments.push({ type: "Video", url: data.video.bit_rate[0].play_addr.url_list[0] });
  } else if (data.image_post_info?.images?.length) {
      attachments.push(...data.image_post_info.images.map(v => ({ type: "Photo", url: v.display_image.url_list[0] })));
  }

  return {
      id: data.aweme_id,
      message: data.desc,
      author: {
          id: data.author.uid,
          name: data.author.nickname,
          username: data.author.unique_id
      },
      stats: {
          views: formatNumber(data.statistics.play_count),
          likes: formatNumber(data.statistics.digg_count),
          comments: formatNumber(data.statistics.comment_count),
          shares: formatNumber(data.statistics.share_count),
          collects: formatNumber(data.statistics.collect_count)
      },
      createTime: formatTimestamp(data.create_time),
      music: {
          title: data.music.title,
          author: data.music.author,
          duration: data.music.duration,
          url: data.music.play_url.url_list[0]
      },
      attachments
  };
}

async function downloadv3(url) {
  function formatTimestamp(timestamp) {
      const date = new Date(timestamp * 1000);
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')} | ${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  }

  function formatNumber(number) {
      return isNaN(number) ? null : number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

const getId = async (url) => {
  const extractId = (url) => url.match(/(video|photo)?\/(\d+)/)?.[2];
  const headers = { 'User-Agent': 'Mozilla/5.0' };
  if (/https:\/\/(www|m)\.tiktok\.com\/@.+/.test(url)) {
    return extractId(url);
  } else if (/https:\/\/(vt|vm|www|m)\.tiktok\.com\/.+/.test(url)) {
    const res = await fetch(url, { headers, redirect: 'manual' });
    return extractId(res.headers.get('location'));
  } else {
    return null;
  }
};
  const aweme_id = await getId(url);
  const response = await axios({
      method: 'OPTIONS',
      url: 'https://api-m.tiktok.com/aweme/v1/feed/',
      headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
          'Cookie': cookie_main,
          'Accept-Language': 'vi-VN',
          'Accept': '*/*',
          'Connection': 'keep-alive'
      },
      params: {
          aweme_id,
          iid: '7318518857994389254',
          device_id: '7318517321748022790',
          channel: 'googleplay',
          app_name: 'musical_ly',
          version_code: '300904',
          device_platform: 'android',
          device_type: 'ASUS_Z01QD',
          version: '9'
      }
  });

  const data = response.data?.aweme_list?.[0];
  if (!data) return;

  const attachments = [];
  if (data.video?.bit_rate?.[0]?.play_addr?.url_list?.[0]) {
      attachments.push({ type: "Video", url: data.video.bit_rate[0].play_addr.url_list[0] });
  } else if (data.image_post_info?.images?.length) {
      attachments.push(...data.image_post_info.images.map(v => ({ type: "Photo", url: v.display_image.url_list[0] })));
  }

  return {
      id: data.aweme_id,
      message: data.desc,
      author: {
          id: data.author.uid,
          name: data.author.nickname,
          username: data.author.unique_id
      },
      stats: {
          views: formatNumber(data.statistics.play_count),
          likes: formatNumber(data.statistics.digg_count),
          comments: formatNumber(data.statistics.comment_count),
          shares: formatNumber(data.statistics.share_count),
          collects: formatNumber(data.statistics.collect_count)
      },
      createTime: formatTimestamp(data.create_time),
      music: {
          title: data.music.title,
          author: data.music.author,
          duration: data.music.duration,
          url: data.music.play_url.url_list[0]
      },
      attachments
  };
}

async function trending(count = 40) {
	function formatTimestamp(timestamp) {
       const date = new Date(timestamp * 1000);
       return date.toISOString();
    }
    function formatNumber(number) {
       return number.toLocaleString();
    }
    const maxRetries = 3;
    let attempts = 0;
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
        "Cookie": cookie_main
    });
    while (attempts < maxRetries) {
        try {
            const response = await axios.options(`https://api22-normal-c-alisg.tiktokv.com/aweme/v1/feed/`, {
                params: {
                    type: 5,
                    WebIdLastTime: '1725126217',
                    aid: '1988',
                    app_language: 'vi-VN',
                    app_name: 'tiktok_web',
                    browser_language: 'vi-VN',
                    browser_name: 'Mozilla',
                    browser_online: 'true',
                    browser_platform: 'Win32',
                    browser_version: '5.0 (Windows)',
                    channel: 'tiktok_web',
                    cookie_enabled: 'true',
                    count: count,
                    coverFormat: '0',
                    cursor: '0',
                    data_collection_enabled: 'true',
                    device_id: '7409360597660157447',
                    device_platform: 'web_pc',
                    focus_state: 'true',
                    from_page: 'user',
                    history_len: '4',
                    is_fullscreen: 'false',
                    is_page_visible: 'true',
                    language: 'vi-VN',
                    locate_item_id: '7433009056886934785',
                    needPinnedItemIds: 'true',
                    odinId: '7094086553546933249',
                    os: 'windows',
                    post_item_list_request_type: '0',
                    priority_region: 'VN',
                    referer: 'https://www.tiktok.com/',
                    region: 'VN',
                    root_referer: 'https://www.tiktok.com/',
                    screen_height: '1284',
                    screen_width: '600',
                    secUid: 'MS4wLjABAAAA1m6Bs_YxZa-s2JIOYteK70P9oLnwvMKAme7_NF7UkZ6BL7Or0qW32E3K8piqMHBu',
                    tz_name: 'Asia/Ho_Chi_Minh',
                    user_is_login: 'true',
                    verifyFp: 'verify_m35lgedb_hPVKdHsv_zOZb_4PsW_AtIX_exlluNE9yzV2',
                    webcast_language: 'vi-VN',
                    msToken: 'LdnhWkvdKq-x9yYrjPtV9F2U_vCKkGk2FpAXvZE9W6qcXmZ7PuAOw9VBBuk1L1ff6frAY0gdF-SdOQDgyQyYVAN7o7f2CyDpMOaiJDu47OxS6ivhcjtPTx0toOUPVrMOKVXeXAFzAD96B28bTtkx6ZQ',
                },
                headers: {
                    ...headersss(),
                    'Accept': 'application/json',
                    'Accept-Language': 'vi-VN,vi;q=0.9',
                    'Referer': 'https://www.tiktok.com/',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Connection': 'keep-alive',
                    'X-Gorgon': '840ad589000000ef7b415f8db5b7b5726c4389d88556f61663fe0f3469570833',
                    'X-Track': '2:0:0',
                    'X-SS-Req-Ticket': 'v2:1633329804000:ff395f09-0c82-45d7-bb52-8cb2a004042e'
                }
            });
            const data = response.data.aweme_list || [];
            const filteredData = data.filter(item => item.region === 'VN');
            if (filteredData.length > 0) {
                const formattedData = filteredData.map(content => {
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
                            thumb: v.display_image.url_list[0],
                            url: v.display_image.url_list[0]
                        })));
                    } else if (content.video) {
                        attachments.push({
                            type: 'Video',
                            thumb: content.video.cover.url_list[0],
                            url: content.video.play_addr.url_list[2]
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
                });
                return formattedData.length > 6 ? formattedData.slice(-6) : formattedData;
            }
        } catch (error) {}
        attempts++;
    }
    return [];
}

module.exports = {
   search,
   searchUser,
   infov2,
   downloadv1,
   downloadv2,
   downloadv3,
   trending
};
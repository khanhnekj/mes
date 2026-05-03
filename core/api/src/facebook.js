const got = require('got');
const JSONB = require('json-bigint');
const axios = require('axios');
const querystring = require('querystring');
/*
1. EAAAAU: 350685531728
2. EAAD: 256002347743983
3. EAAAAAY: 6628568379
4. EAADYP: 237759909591655
5. EAAD6V7: 275254692598279
6. EAAC2SPKT: 202805033077166
7. EAAGOfO: 200424423651082
8. EAAVB: 438142079694454
9. EAAC4: 1479723375646806
10. EAACW5F: 165907476854626
11. EAAB: 121876164619130
12. EAAQ: 1174099472704185
13. EAAGNO4: 436761779744620
14. EAAH: 522404077880990
15. EAAC: 184182168294603
16. EAAClA: 173847642670370
17. EAATK: 1348564698517390
18. EAAI7: 628551730674460
*/
class FB_TOKEN {
  constructor(cookie) {
    this.cookie = cookie;
    this.req = this._create_session();
  }
  _create_session() {
    const header = {
      'authority': 'www.facebook.com',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/jxl,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-language': 'vi,en-US;q=0.9,en;q=0.8',
      'cache-control': 'max-age=0',
      'dnt': '1',
      'dpr': '1.25',
      'sec-ch-ua': '"Chromium";v="117", "Not;A=Brand";v="8"',
      'sec-ch-ua-full-version-list': '"Chromium";v="117.0.5938.157", "Not;A=Brand";v="8.0.0.0"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-model': '""',
      'sec-ch-ua-platform': '"Windows"',
      'sec-ch-ua-platform-version': '"15.0.0"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'same-origin',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
      'viewport-width': '1038',
    };
    const session = axios.create({
      headers: header,
      withCredentials: true
    });
    session.defaults.headers['Cookie'] = this.cookie;
    return session;
  }
  async mot(app_id) {
    const deadline = Date.now() + 60000;
    while (Date.now() <= deadline) {
      try {
        const res_data1 = (await this.req.get('https://www.facebook.com')).data;
        if (res_data1.includes('DTSGInitialData",[],{"token":"')) {
          const fb_dtsg = res_data1.split('DTSGInitialData",[],{"token":"')[1].split('"')[0];
          const data = {
            'fb_dtsg': fb_dtsg
          };
          const query = querystring.stringify(data);
          const res_data2 = (await this.req.post(`https://www.facebook.com/dialog/oauth/business/cancel/?app_id=${app_id}&version=v12.0&logger_id=&user_scopes[0]=user_birthday&user_scopes[1]=user_religion_politics&user_scopes[2]=user_relationships&user_scopes[3]=user_relationship_details&user_scopes[4]=user_hometown&user_scopes[5]=user_location&user_scopes[6]=user_likes&user_scopes[7]=user_education_history&user_scopes[8]=user_work_history&user_scopes[9]=user_website&user_scopes[10]=user_events&user_scopes[11]=user_photos&user_scopes[12]=user_videos&user_scopes[13]=user_friends&user_scopes[14]=user_about_me&user_scopes[15]=user_posts&user_scopes[16]=email&user_scopes[17]=manage_fundraisers&user_scopes[18]=read_custom_friendlists&user_scopes[19]=read_insights&user_scopes[20]=rsvp_event&user_scopes[21]=xmpp_login&user_scopes[22]=offline_access&user_scopes[23]=publish_video&user_scopes[24]=openid&user_scopes[25]=catalog_management&user_scopes[26]=user_messenger_contact&user_scopes[27]=gaming_user_locale&user_scopes[28]=private_computation_access&user_scopes[29]=instagram_business_basic&user_scopes[30]=user_managed_groups&user_scopes[31]=groups_show_list&user_scopes[32]=pages_manage_cta&user_scopes[33]=pages_manage_instant_articles&user_scopes[34]=pages_show_list&user_scopes[35]=pages_messaging&user_scopes[36]=pages_messaging_phone_number&user_scopes[37]=pages_messaging_subscriptions&user_scopes[38]=read_page_mailboxes&user_scopes[39]=ads_management&user_scopes[40]=ads_read&user_scopes[41]=business_management&user_scopes[42]=instagram_basic&user_scopes[43]=instagram_manage_comments&user_scopes[44]=instagram_manage_insights&user_scopes[45]=instagram_content_publish&user_scopes[46]=publish_to_groups&user_scopes[47]=groups_access_member_info&user_scopes[48]=leads_retrieval&user_scopes[49]=whatsapp_business_management&user_scopes[50]=instagram_manage_messages&user_scopes[51]=attribution_read&user_scopes[52]=page_events&user_scopes[53]=business_creative_transfer&user_scopes[54]=pages_read_engagement&user_scopes[55]=pages_manage_metadata&user_scopes[56]=pages_read_user_content&user_scopes[57]=pages_manage_ads&user_scopes[58]=pages_manage_posts&user_scopes[59]=pages_manage_engagement&user_scopes[60]=whatsapp_business_messaging&user_scopes[61]=instagram_shopping_tag_products&user_scopes[62]=read_audience_network_insights&user_scopes[63]=user_about_me&user_scopes[64]=user_actions.books&user_scopes[65]=user_actions.fitness&user_scopes[66]=user_actions.music&user_scopes[67]=user_actions.news&user_scopes[68]=user_actions.video&user_scopes[69]=user_activities&user_scopes[70]=user_education_history&user_scopes[71]=user_events&user_scopes[72]=user_friends&user_scopes[73]=user_games_activity&user_scopes[74]=user_groups&user_scopes[75]=user_hometown&user_scopes[76]=user_interests&user_scopes[77]=user_likes&user_scopes[78]=user_location&user_scopes[79]=user_managed_groups&user_scopes[80]=user_photos&user_scopes[81]=user_posts&user_scopes[82]=user_relationship_details&user_scopes[83]=user_relationships&user_scopes[84]=user_religion_politics&user_scopes[85]=user_status&user_scopes[86]=user_tagged_places&user_scopes[87]=user_videos&user_scopes[88]=user_website&user_scopes[89]=user_work_history&user_scopes[90]=email&user_scopes[91]=manage_notifications&user_scopes[92]=manage_pages&user_scopes[93]=publish_actions&user_scopes[94]=publish_pages&user_scopes[95]=read_friendlists&user_scopes[96]=read_insights&user_scopes[97]=read_page_mailboxes&user_scopes[98]=read_stream&user_scopes[99]=rsvp_event&user_scopes[100]=read_mailbox&user_scopes[101]=business_creative_management&user_scopes[102]=business_creative_insights&user_scopes[103]=business_creative_insights_share&user_scopes[104]=whitelisted_offline_access&redirect_uri=fbconnect%3A%2F%2Fsuccess&response_types[0]=token&response_types[1]=code&display=page&action=finish&return_scopes=false&return_format[0]=access_token&return_format[1]=code&tp=unspecified&sdk=&selected_business_id=&set_token_expires_in_60_days=false`, query)).data;
          const token = res_data2.split('access_token=')[1].split('&')[0];
          return {
            'message': 'Thành Công',
            'code': 200,
            'token': token
          };
        } else {
          return {
            'message': 'Cookie có vấn đề!',
            'code': 0,
            'token': null
          };
        }
      } catch (error) {
        if (error.code === 'ENOTFOUND') {
          console.log('No internet');
        } else {
          //console.error(error);
        }
      }
    }
    return {
      'message': 'Thành Công',
      'code': 0,
      'token': null
    };
  }
}
async function token(id, cookie) {
    const fbToken = new FB_TOKEN(cookie);
    const token = await fbToken.mot(id);
    return token;
};
async function download(url) {
  function formatNumber(number) {
    if (isNaN(number)) {
        return null;
     }
     return number.toLocaleString('de-DE');
}
const AttachmentFormatter = {
    stories(data, storyID) {
        return {
            bucketID: data?.bucket?.id.toString(),
            message: '',
            author: data?.bucket?.story_bucket_owner?.name,
            queryStorieID: storyID ? storyID : null,
            attachments: data?.bucket?.unified_stories?.edges.map(item => ({
                id: item?.node?.id,
                like: formatNumber(item?.node?.story_card_info?.feedback_summary?.total_reaction_count) || 0,
                type: item?.node?.attachments?.[0]?.media?.__typename,
                url: item?.node?.attachments?.[0]?.media?.__typename === 'Photo' ? item?.node?.attachments?.[0]?.media?.image?.uri :
                    {
                        sd: item?.node?.attachments?.[0]?.media?.browser_native_sd_url,
                        hd: item?.node?.attachments?.[0]?.media?.browser_native_hd_url,
                    }
            }))
        };
    },
    previewMedia(data) {
        return {
            id: data?.link_preview?.story_attachment?.style_infos?.[0]?.fb_shorts_story?.post_id,
            message: (data?.link_preview?.story_attachment?.title || '') + '',
            like: formatNumber(data?.link_preview?.story_attachment?.target?.feedback?.reactors?.count) || 0,
            comment: formatNumber(data?.link_preview?.story_attachment?.target?.top_level_comments?.total_count) || 0,
            share: formatNumber(data?.link_preview?.story_attachment?.target?.reshares?.count) || 0,
            author: data?.link_preview?.story_attachment?.style_infos?.[0]?.fb_shorts_story?.short_form_video_context?.video_owner?.name || data?.link_preview?.story_attachment?.style_infos?.[0]?.actors[0]?.name || "",
            attachments: [{
                id: data?.link_preview?.story_attachment?.style_infos?.[0]?.fb_shorts_story?.short_form_video_context?.video?.id.toString(),
                type: 'Video',
                url: {
                    sd: data?.link_preview.story_attachment?.style_infos?.[0]?.fb_shorts_story?.short_form_video_context?.video?.original_download_url_sd,
                    hd: data?.link_preview.story_attachment?.style_infos?.[0]?.fb_shorts_story?.short_form_video_context?.video?.original_download_url_hd,
                }
            }]
        };
    },
    mobileMedia(data) {
        return {
            id: data?.reduced_node?.post_id.toString(),
            message: (data?.reduced_node?.message?.text || '') + '',
            like: formatNumber(data?.reduced_node?.feedback?.reactors?.count) || 0,
            comment: formatNumber(data?.reduced_node?.feedback?.top_level_comments?.total_count) || 0,
            author: (data?.reduced_node?.feedback?.owning_profile?.name),
            attachments: data?.mediaset?.media?.edges.map(item => ({
                id: item.node?.id.toString(),
                type: item.node?.__typename,
                url: item.node?.__typename == 'Photo' ? item?.node?.image?.uri :
                    {
                        sd: item?.node?.playable_url,
                        hd: item?.node?.hd_playable_url,
                    },
            }))
        };
    },
    webMedia(data) {
        const type = data?.attachments[0]?.styles?.attachment ||
            data.attached_story?.attachments[0]?.styles?.attachment ||
            data?.content?.story?.attached_story?.attachments[0]?.styles?.attachment ||
            data?.content?.story?.comet_sections ||
            data?.comet_sections?.attached_story?.story?.attached_story?.comet_sections?.attached_story_layout?.story?.attachments?.[0]?.styles?.attachment;
        if (type?.subattachments) {
            return {
                message: (data?.message?.text || '') + '',
                author: data?.actors[0]?.name,
                attachments: (data?.attachments[0]?.styles?.attachment?.subattachments || data?.comet_sections?.attached_story?.story?.attached_story?.comet_sections?.attached_story_layout?.story?.attachments?.[0]?.styles?.attachment?.subattachments).filter(item => item?.multi_share_media_card_renderer?.attachment?.media?.__typename !== 'GenericAttachmentMedia').map(item => ({
                    id: item?.multi_share_media_card_renderer?.attachment?.media?.id?.toString(),
                    type: item?.multi_share_media_card_renderer?.attachment?.media?.__typename,
                    url: item?.multi_share_media_card_renderer?.attachment?.media?.__typename === 'Photo' ? item?.multi_share_media_card_renderer?.attachment?.media?.image?.uri :
                        {
                            sd: item?.multi_share_media_card_renderer?.attachment?.media?.browser_native_sd_url,
                            hd: item?.multi_share_media_card_renderer?.attachment?.media?.browser_native_hd_url,
                        },

                }))
            };
        } else if (type?.media) {
            const mediaData = data?.attachments[0]?.styles?.attachment || data.attached_story?.attachments[0]?.styles?.attachment;
            return {
                message: (data?.message?.text || '') + '',
                author: data?.actors[0]?.name,
                attachments: [{
                    id: mediaData?.media?.id?.toString(),
                    type: mediaData?.media?.__typename,
                    url: mediaData?.media?.__typename == 'Photo' ? mediaData?.media?.photo_image?.uri || mediaData?.media?.image?.uri :
                        {
                            sd: mediaData?.media.browser_native_sd_url,
                            hd: mediaData?.media.browser_native_he_url,
                        }
                }]
            };
        } else if (type?.style_infos) {
            return {
                message: (data?.message?.text || (data?.attachments[0]?.styles?.attachment?.style_infos[0]?.fb_shorts_story?.message?.text || '')) + '',
                author: data?.actors[0]?.name,
                attachments: [{
                    id: data?.attachments[0]?.styles?.attachment?.style_infos?.[0]?.fb_shorts_story?.short_form_video_context?.playback_video?.id?.toString(),
                    type: 'Video',
                    url: {
                        sd: data?.attachments[0].styles.attachment.style_infos[0].fb_shorts_story.short_form_video_context.playback_video.browser_native_sd_url,
                        hd: data?.attachments[0].styles.attachment.style_infos[0].fb_shorts_story.short_form_video_context.playback_video.browser_native_hd_url,
                    }
                }]
            };
        } else return { error: 'Cannot fetch stories & media info.', at: 'FetchStoriesAndMedia', detail: 'Facebook did not respond with correct data.' };
    }
};
const Utils = {
    postWithToken: async (url, form, userAgent) => {
        return await got.post(url, {
            headers: {
                'authorization': 'OAuth ' + global.account.token.EAAAU,
                'user-agent': '[FBAN/FB4A;FBAV/417.0.0.33.65;FBBV/480085463;FBDM/{density=2.75,width=1080,height=2029};FBLC/vi_VN;FBRV/0;FBCR/VinaPhone;FBMF/Xiaomi;FBBD/Xiaomi;FBPN/com.facebook.katana;FBDV/MI 8 SE;FBSV/9;FBOP/1;FBCA/armeabi-v7a:armeabi;]',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            form,
            decompress: true,
        });
    },
    postWithCookie: async (url, form, userAgent) => {
        return await got.post(url, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': global.account.cookie,
            },
            form,
            decompress: true,
        });
    },
    getType: (obj) => {
        const cName = obj.constructor?.name;
        const gName = Object.prototype.toString.call(obj).slice(8, -1);
        if (cName?.toLowerCase() === gName?.toLowerCase()) return cName;
        else return !cName || cName?.toLowerCase() === 'object' ? gName : cName;
    },
    makeParsable: (data) => {
        const withoutForLoop = data.body.replace(/for\s*\(\s*;\s*;\s*\)\s*;\s*/, '');
        const maybeMultipleObjects = withoutForLoop.split(/\}\s*\{/);
        if (maybeMultipleObjects.length === 1) return maybeMultipleObjects[0];
        return `[${maybeMultipleObjects.join('},{')}]`;
    },
    parseFromBody: (data) => {
        if (typeof data.body !== 'string') return data.body;
        try {
            const result = JSON.parse(Utils.makeParsable(data));
            const type = Utils.getType(result);
            return type === 'Object' || type === 'Array' ? result : data.body;
        } catch (err) {
            return data.body;
        }
    },
    parseFromJSONB: (data) => {
        return JSONB.parse(data);
    }
};
const urlRegex = /\b(?:https?:\/\/(?:www\.)?(?:facebook\.com|mbasic\.facebook\.com|m\.facebook\.com|mobile\.facebook\.com|fb\.watch|web\.facebook)[^\s]*)\b/g;
const IGUrlRegex = /(https:\/\/www\.instagram\.com\/(stories|p|reel|tv)\/[a-zA-Z0-9_\-\/?=\.]+)(?=\s|\/|$)/g;
const onlyVideoRegex = /^https:\/\/(?:www|m|mbasic|mobile|web)\.facebook\.com\/(?:watch\?v=\d+|reel\/|videos\/[^\/?#]+\/?\??[^\/?#]*)$/;
const profileRegex = /^https:\/\/(?:(www|m|mbasic|mobile|web)\.)?facebook\.com\/(?!(?:watch|photo|groups|share|stories|reel|videos|pages|story.php|permalink.php|video.php))(?:(?!profile\.php\?id=\d+\?)[^\/?]+|profile\.php\?id=\d+\?(?!id=).*|\profile\.php\?id=\d+$)\/?\??[^\/?]*$/;
const storiesRegex = /\/stories\/(\d+)(?:\/([^\/?]+))?/;
async function StoriesBucketQuery(bucketID, storyID) {
    const resData = await Utils.postWithToken(
        'https://graph.facebook.com/graphql',
        {
            fb_api_caller_class: 'RelayModern',
            fb_api_req_friendly_name: 'StoriesSuspenseContentPaneRootWithEntryPointQuery',
            doc_id: '7114359461936746',
            variables: JSON.stringify({ bucketID: bucketID, blur: 10, cursor: null, scale: 1 })
        },
    ).then(data => Utils.parseFromBody(data)).catch(error => error?.response?.body || error.message);
    return AttachmentFormatter.stories((resData?.data || resData?.[0].data), storyID);
}
async function FetchStoriesAndMedia(url) {
    try {
        if (storiesRegex.test(url))
            return StoriesBucketQuery(storiesRegex.exec(url)[1], storiesRegex.exec(url)[2]);
        if (!urlRegex.test(url))
            return { error: 'Cannot fetch facebook stories & media info.', at: 'FetchStoriesAndMedia', detail: 'The URL you entered is not valid.' };
        if (profileRegex.test(url))
            return { error: 'Cannot fetch facebook stories & media info.', at: 'FetchStoriesAndMedia', detail: 'The URL you entered is not valid.' };
        let resData = await Utils.postWithToken(
            'https://graph.facebook.com/graphql',
            {
                fb_api_req_friendly_name: 'ComposerLinkPreviewQuery',
                client_doc_id: '89598650511870084207501691272',
                variables: JSON.stringify({
                    params: {
                        url: url
                    }
                })
            },
        ).then(data => Utils.parseFromBody(data)).catch(error => error?.response?.body || error.message);
        if (!resData || resData.error || resData.errors) return { error: 'Cannot fetch facebook stories & media info.', at: 'FetchStoriesAndMedia', detail: 'Facebook did not respond with correct data.' };
        if (onlyVideoRegex.test(url) || onlyVideoRegex.test(decodeURIComponent(resData?.data?.link_preview?.story_attachment?.style_infos?.[0]?.fb_shorts_story?.storyUrl)) || IGUrlRegex.test(decodeURIComponent(resData?.data?.link_preview?.story_attachment?.style_infos?.[0]?.fb_shorts_story?.storyUrl)))
            return AttachmentFormatter.previewMedia(resData.data);
        const share_params = Utils.parseFromJSONB(resData?.data?.link_preview?.share_scrape_data).share_params;
        if (share_params && storiesRegex.test(share_params?.urlInfo?.canonical))
            return StoriesBucketQuery(storiesRegex.exec(share_params?.urlInfo?.canonical)[1], storiesRegex.exec(share_params?.urlInfo?.canonical)[2]);
        if (!resData?.data?.link_preview?.story?.id) return { error: 'Cannot fetch facebook stories & media info.', at: 'FetchStoriesAndMedia', detail: 'Facebook did not respond with correct data.' };
        const post_id = share_params[0]?.toString();
        const node_id = resData?.data?.link_preview?.story?.id;
        resData = await Utils.postWithToken(
            'https://graph.facebook.com/graphql',
            {
                fb_api_req_friendly_name: 'FetchGraphQLStoryAndMediaFromTokenQuery',
                client_doc_id: '14968485422525517963281561600',
                variables: JSON.stringify({ action_location: "feed", include_image_ranges: true, image_medium_height: 2048, query_media_type: "ALL", automatic_photo_captioning_enabled: false, image_large_aspect_height: 565, angora_attachment_profile_image_size: 110, profile_pic_media_type: "image/x-auto", poll_facepile_size: 110, scale: 3, enable_cix_screen_rollout: true, default_image_scale: 3, angora_attachment_cover_image_size: 1320, poll_voters_count: 5, image_low_height: 2048, image_large_aspect_width: 1080, image_low_width: 360, image_high_height: 2048, question_poll_count: 100, node_id: node_id, icon_scale: 3, nt_context: { styles_id: "e6c6f61b7a86cdf3fa2eaaffa982fbd1", using_white_navbar: true, pixel_ratio: 3, is_push_on: true, bloks_version: "c3cc18230235472b54176a5922f9b91d291342c3a276e2644dbdb9760b96deec" }, can_fetch_suggestion: false, profile_image_size: 110, reading_attachment_profile_image_height: 371, reading_attachment_profile_image_width: 248, fetch_fbc_header: true, size_style: "contain-fit", photos_feed_reduced_data_fetch: true, media_paginated_object_first: 200, in_channel_eligibility_experiment: false, fetch_cix_screen_nt_payload: true, media_token: `pcb.${post_id}`, fetch_heisman_cta: true, fix_mediaset_cache_id: true, location_suggestion_profile_image_size: 110, image_high_width: 1080, media_type: "image/jpeg", image_medium_width: 540 }),
                fb_api_caller_class: 'graphservice',
                fb_api_analytics_tags: JSON.stringify(["At_Connection", "GraphServices"])
            },
        ).then(data => Utils.parseFromBody(data)).catch(error => error?.response?.body || error.message);
        if (!resData || resData.error || resData.errors) return { error: 'Cannot fetch facebook stories & media info.', at: 'FetchStoriesAndMedia', detail: 'Facebook did not respond with correct data.' };
        if (!resData?.data?.mediaset?.media?.edges || resData?.data?.mediaset?.media?.edges.length == 0) {
            resData = await Utils.postWithToken(
                'https://graph.facebook.com/graphql',
                {
                    fb_api_req_friendly_name: 'CometSinglePostContentQuery',
                    doc_id: 8362454010438212,
                    variables: JSON.stringify({ feedbackSource: 2, feedLocation: "PERMALINK", privacySelectorRenderLocation: "COMET_STREAM", renderLocation: "permalink", scale: 1.5, storyID: node_id, useDefaultActor: false, })
                },
            ).then(data => Utils.parseFromBody(data)).catch(error => error?.response?.body || error.message);

            if (!resData || resData.error || resData.errors) return { error: 'Cannot fetch facebook stories & media info.', at: 'FetchStoriesAndMedia', detail: 'Facebook did not respond with correct data.' };
            const { content } = resData?.data?.node?.comet_sections || resData[0]?.data?.node?.comet_sections;
            return { id: post_id, ...AttachmentFormatter.webMedia(content.story) };
        }
        return AttachmentFormatter.mobileMedia(resData?.data);
    } catch (error) {
        console.error(error);
        return { error: 'Cannot fetch facebook stories & media info.', at: 'FetchStoriesAndMedia', detail: error?.response || error.message };
    }
} try {
        const result = await FetchStoriesAndMedia(decodeURIComponent(url));
        return result;
    } catch (error) {
        console.log(error);
    }
}

async function timejoin(uid) {
  try {
    const { data } = await axios.get(`https://graph.facebook.com/v1.0/${uid}?fields=id,name,created_time&access_token=${global.account.token.EAAD6V7}`, {
        headers: {
         cookie: global.account.cookie
        }
    });
    const createdTime = data.created_time;
    const day = createdTime.split("-")[2].split("T")[0];
    const month = createdTime.split("-")[1].split("T")[0];
    const year = createdTime.split("-")[0];
    const hour = createdTime.split("T")[1].split(":")[0];
    const min = createdTime.split(":")[1].split("+")[0];
    const ss = createdTime.split(":")[2].split("+")[0];
    const date = `${day}/${month}/${year}`;
    const time = `${hour}:${min}:${ss}`;
    return {
      uid: data.id,
      name: data.name,
      day: `${date}`,
      time: `${time}`
    };
  } catch (e) {
    console.log(e);
  }
};

module.exports = {
    download, 
    timejoin,
    token
};
const axios = require('axios');

async function downloadv1(url) {
    try {
        let input = {};
        if (typeof url === 'object') {
            if (url.url) input.url = url.url;
            else return { found: false, error: 'Không có URL nào được cung cấp' };
        } else if (typeof url === 'string') {
            input.url = url;
        } else {
            return { found: false, error: 'Đối số đầu tiên không hợp lệ' };
        }
        if (/twitter\.com|x\.com/.test(input.url)) {
            const apiURL = input.url.replace(/twitter\.com|x\.com/g, 'api.vxtwitter.com');
            const result = await axios.get(apiURL).then(res => res.data).catch(() => {
                throw new Error('Đã xảy ra sự cố. Đảm bảo liên kết Twitter hợp lệ.');
            });
            if (!result.media_extended) return { found: false, error: 'Không tìm thấy phương tiện nào' };
            return {
                type: result.media_extended[0].type,
                media: result.mediaURLs,
                title: result.text || 'Không có tiêu đề',
                id: result.conversationID,
                date: result.date,
                likes: result.likes,
                replies: result.replies,
                retweets: result.retweets,
                author: result.user_name,
                username: result.user_screen_name
            };
        } else {
            return { found: false, error: `URL không hợp lệ: ${input.url}` };
        }
    } catch (error) {
        return { found: false, error: error.message }
    }
}

async function downloadv2(url) {
    const isValidUrl = (url) => /https?:\/\/(www\.)?(x\.com|twitter\.com)\/\w+\/status\/\d+/i.test(url);
    const rejectError = (msg) => Promise.reject(new Error(msg));
    if (!isValidUrl(url)) return rejectError("Invalid URL: " + url);
    const idMatch = url.match(/\/(\d+)/);
    if (!idMatch) return rejectError("Error getting Twitter ID. Ensure your URL is correct.");
    const tweetId = idMatch[1];
    function formatNumber(number) {
        if (isNaN(number)) {
          return null;
        }
        return number.toLocaleString('de-DE');
    }
    function removeLinks(title) {
        const cleanedTitle = title.replace(/https?:\/\/t\.co\/[a-zA-Z0-9]+/g, '');
        return cleanedTitle.trim();
    }
    const params = {
        variables: JSON.stringify({
            focalTweetId: tweetId,
            with_rux_injections: false,
            rankingMode: "Relevance",
            includePromotedContent: true,
            withCommunity: true,
            withQuickPromoteEligibilityTweetFields: true,
            withBirdwatchNotes: true,
            withVoice: true
        }),
        features: JSON.stringify({
            rweb_tipjar_consumption_enabled: true,
            responsive_web_graphql_exclude_directive_enabled: true,
            verified_phone_label_enabled: false,
            creator_subscriptions_tweet_preview_api_enabled: true,
            responsive_web_graphql_timeline_navigation_enabled: true,
            responsive_web_edit_tweet_api_enabled: true,
            graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
            view_counts_everywhere_api_enabled: true,
            longform_notetweets_consumption_enabled: true,
            tweet_awards_web_tipping_enabled: false,
            responsive_web_twitter_article_tweet_consumption_enabled: true,
            responsive_web_enhance_cards_enabled: false,
            c9s_tweet_anatomy_moderator_badge_enabled: true,
            freedom_of_speech_not_reach_fetch_enabled: true,
            longform_notetweets_rich_text_read_enabled: true,
            standardized_nudges_misinfo: true,
            creator_subscriptions_quote_tweet_preview_enabled: false,
            longform_notetweets_inline_media_enabled: true,
            articles_preview_enabled: true,
            rweb_video_timestamps_enabled: true,
            responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
            tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
            communities_web_enable_tweet_community_results_fetch: true
        }),
        fieldToggles: JSON.stringify({
            withArticleRichContentState: true,
            withArticlePlainText: false,
            withGrokAnalyze: false,
            withDisallowedReplyControls: false
        })
    };
    try {
        const response = await axios.get('https://x.com/i/api/graphql/QuBlQ6SxNAQCt6-kBiCXCQ/TweetDetail', {
            headers: {
                'Authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
                'Content-Type': 'application/json',
                'x-csrf-token': '5819e285dd2cb1ac0ce9c5bea7bd086aea8561b3ef33073d0e2c91c0e892daeae851fd0abf0e18ba8e79db28ccbc4eac55d3a7b76985e2a1abd29fbc971e5138860c9d38485a80f9c572434efdae1f82',
                'cookie': 'guest_id=v1%3A172448125289553271; night_mode=2; guest_id_marketing=v1%3A172448125289553271; guest_id_ads=v1%3A172448125289553271; gt=1829888822144115028; g_state={"i_l":0}; kdt=k63DQgDNfus4XWuHMtTMW7HYvXnYSlj8z8ba4CoR; auth_token=c0dae11514776ecdf819536c7b06e860b404dff4; ct0=5819e285dd2cb1ac0ce9c5bea7bd086aea8561b3ef33073d0e2c91c0e892daeae851fd0abf0e18ba8e79db28ccbc4eac55d3a7b76985e2a1abd29fbc971e5138860c9d38485a80f9c572434efdae1f82; att=1-QIUwm8VIR4ovPKsejWgMr8lh7vGQhGDtOQ4D4zpL; twid=u%3D1715378701687488512; lang=en; personalization_id="v1_qmEOb1xux1UScLDnWVn54w=="',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
            },
            params: params
        });
        const tweet = response?.data?.data?.threaded_conversation_with_injections_v2?.instructions?.[0]?.entries?.[0]?.content?.itemContent?.tweet_results?.result?.tweet || response?.data?.data?.threaded_conversation_with_injections_v2?.instructions?.[0]?.entries?.[0]?.content?.itemContent?.tweet_results?.result;
        const user = tweet.core.user_results.result;
        const media = tweet.legacy?.entities?.media || [];
        const attachments = media.map(m => {
          if (m.type === "photo") {
            return {
              type: "Photo",
              url: m.media_url_https
            };
          } else if (m.type === "animated_gif" || m.type === "video") {
            const bestVariant = m.video_info.variants.reduce((prev, curr) => (prev.bitrate > curr.bitrate ? prev : curr), {});
            return {
              type: "Video",
              url: bestVariant.url
            };
          }
        });
        return {
            id: tweet.legacy.id_str,
            message: removeLinks(tweet.legacy.full_text) || null,
            author: `${user.legacy.name} (${user.legacy.screen_name})`,
            created_at: tweet.legacy.created_at,
            comment: formatNumber(Number(tweet.legacy.reply_count)) || 0,
            retweets: formatNumber(Number(tweet.legacy.retweet_count)) || 0,
            like: formatNumber(Number(tweet.legacy.favorite_count)) || 0,
            views: formatNumber(Number(tweet.views.count)) || 0,
            bookmark: formatNumber(Number(tweet.legacy.bookmark_count)) || 0,
            attachments,
        };
    } catch (error) {
        console.error('Error fetching tweet details:', error.response ? error.response.data : error.message);
    }
}

async function info(username) {
    const params = {
        variables: JSON.stringify({
            screen_name: userInfo,
            withSafetyModeUserFields: true
        }),
        features: JSON.stringify({
            hidden_profile_subscriptions_enabled: true,
            rweb_tipjar_consumption_enabled: true,
            responsive_web_graphql_exclude_directive_enabled: true,
            verified_phone_label_enabled: false,
            subscriptions_verification_info_is_identity_verified_enabled: true,
            subscriptions_verification_info_verified_since_enabled: true,
            highlights_tweets_tab_ui_enabled: true,
            responsive_web_twitter_article_notes_tab_enabled: true,
            subscriptions_feature_can_gift_premium: true,
            creator_subscriptions_tweet_preview_api_enabled: true,
            responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
            responsive_web_graphql_timeline_navigation_enabled: true
        }),
        fieldToggles: JSON.stringify({
            withAuxiliaryUserLabels: false
        })
    };
    const headers = {
        'accept': '*/*',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'vi,en-US;q=0.9,en;q=0.8,fr-FR;q=0.7,fr;q=0.6',
        'authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
        'content-type': 'application/json',
        'cookie': 'guest_id=v1%3A172526109570733352; night_mode=2; guest_id_marketing=v1%3A172526109570733352; guest_id_ads=v1%3A172526109570733352; gt=1830503834009149479; g_state={"i_l":0}; kdt=C7hW1b42Eu5wPItmGf0wLVpsteCaRQK4MGyWdZwp; auth_token=c0b4910d1dbdccf5a39e4201e9913d53bad3f0ae; att=1-BjoWyeeeSVXMsuNqUNfi6unmxMfbivUUcwrAMtJH; ct0=c8dca48e4753829690bb9c3d1eef5ba044932184a74994f505072e297c0993fd78eab95260fba386651cf442c49bbd950daebeda53bbd61295397c4d1491601040a266f8240a787da34cd21982150112; lang=en; twid=u%3D1804416867974709248; personalization_id="v1_TjEt9zGZE7WZOIv5HAO7xw=="',
        'referer': 'https://x.com/',
        'sec-ch-ua': '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
        'x-client-transaction-id': '7EEGP7UROZjSVPBX7x9Zng88bUeeeDRFwOVBsVSYSEO4fn9TOlMLcdQNgVizXqpWIx/tau5dQ/2xlHjWQJK2Kuwvec087w',
        'x-client-uuid': '4441d014-baba-4cbe-b6e3-8a06856ecabd',
        'x-csrf-token': 'c8dca48e4753829690bb9c3d1eef5ba044932184a74994f505072e297c0993fd78eab95260fba386651cf442c49bbd950daebeda53bbd61295397c4d1491601040a266f8240a787da34cd21982150112',
        'x-twitter-active-user': 'yes',
        'x-twitter-auth-type': 'OAuth2Session',
        'x-twitter-client-language': 'en'
    };
    try {
        const response = await axios.get('https://x.com/i/api/graphql/Yka-W8dz7RaEuQNkroPkYw/UserByScreenName', {
            params: params,
            headers: headers
        });
        const data = response.data?.data?.user?.result;
        return {
            id: data.rest_id,
            name: data.legacy.name,
            username: data.legacy.screen_name,
            followers_count: data.legacy.followers_count,
            listed_count: data.legacy.listed_count,
            media_count: data.legacy.media_count,
            friends_count: data.legacy.friends_count,
            favourites_count: data.legacy.favourites_count,
            statuses_count: data.legacy.statuses_count,
            bio: data.legacy.description,
            verified: data.legacy.verified,
            highlighted_tweets: data.highlights_info.highlighted_tweets,
            creator_subscriptions_count: data.creator_subscriptions_count,
            created_at: data.legacy.created_at,
            profile_image: data.legacy.profile_image_url_https
        };
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
}

module.exports = {
   downloadv1,
   downloadv2,
   info
};
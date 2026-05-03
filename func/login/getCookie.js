const deviceID = require('uuid');
const adid = require('uuid');
const totp = require("totp-generator");
const axios = require("axios");

async function getCookie({ username, password, twofactor = '0', _2fa }) {
    try {
        const form = {
            adid: adid.v4(),
            email: username,
            password: password,
            format: 'json',
            device_id: deviceID.v4(),
            cpl: 'true',
            family_device_id: deviceID.v4(),
            locale: 'en_US',
            client_country_code: 'US',
            credentials_type: 'device_based_login_password',
            generate_session_cookies: '1',
            generate_analytics_claim: '1',
            generate_machine_id: '1',
            currently_logged_in_userid: '0',
            irisSeqID: 1,
            try_num: "1",
            enroll_misauth: "false",
            meta_inf_fbmeta: "NO_FILE",
            source: 'login',
            machine_id: randomString(24),
            fb_api_req_friendly_name: 'authenticate',
            fb_api_caller_class: 'com.facebook.account.login.protocol.Fb4aAuthHandler',
            api_key: '882a8490361da98702bf97a021ddc14d',
            access_token: '350685531728%7C62f8ce9f74b12f84c123cc23437a4a32'
        };
        form.sig = encodesig(sort(form));
        const options = {
            url: 'https://b-graph.facebook.com/auth/login',
            method: 'post',
            data: form,
            transformRequest: [(data) => require('querystring').stringify(data)],
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'x-fb-friendly-name': form["fb_api_req_friendly_name"],
                'x-fb-http-engine': 'Liger',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36'
            }
        };

        return new Promise((resolve) => {
            axios.request(options).then(async (response) => {
                try {
                    const cookies = await convertCookie(response.data.session_cookies);
                    resolve(cookies);
                } catch (e) {
                    resolve({
                        status: false,
                        message: "Please enable 2FA and try again!"
                    });
                }
            }).catch((error) => {
                if (error.response?.data?.error?.code == 401) {
                    resolve({
                        status: false,
                        message: error.response.data.error.message
                    });
                    return;
                }

                if (twofactor === '0' && (!_2fa || _2fa === "0")) {
                    resolve({
                        status: false,
                        message: 'Please provide the 2FA code!'
                    });
                    return;
                }

                const data = error.response?.data?.error?.error_data;
                if (!data) {
                    resolve({
                        status: false,
                        message: 'No error data from Facebook'
                    });
                    return;
                }

                let code;
                try {
                    code = (_2fa !== "0") ? _2fa : totp(decodeURI(twofactor).replace(/\s+/g, '').toLowerCase());
                } catch (e) {
                    resolve({
                        status: false,
                        message: 'Invalid 2FA code!'
                    });
                    return;
                }

                form.twofactor_code = code;
                form.encrypted_msisdn = "";
                form.userid = data.uid;
                form.machine_id = data.machine_id;
                form.first_factor = data.login_first_factor;
                form.credentials_type = "two_factor";
                form.sig = encodesig(sort(form));
                options.data = form;

                axios.request(options).then(async (response) => {
                    const cookies = await convertCookie(response.data.session_cookies);
                    resolve(cookies);
                }).catch((err) => {
                    resolve({
                        status: false,
                        message: err.response?.data || '2FA submission failed'
                    });
                });
            });
        });
    } catch (e) {
        return {
            status: false,
            message: 'Incorrect username or password. Please check your credentials!'
        };
    }
}

async function convertCookie(session) {
    if (!Array.isArray(session)) return "";
    return session.map(cookie => `${cookie.name}=${cookie.value}; `).join('');
}

function randomString(length) {
    length = length || 10;
    let char = 'abcdefghijklmnopqrstuvwxyz';
    let result = char.charAt(Math.floor(Math.random() * char.length));
    for (let i = 0; i < length - 1; i++) {
        result += 'abcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(36 * Math.random()));
    }
    return result;
}

function encodesig(string) {
    let data = '';
    Object.keys(string).forEach((key) => {
        data += `${key}=${string[key]}`;
    });
    return md5(data + '62f8ce9f74b12f84c123cc23437a4a32');
}

function md5(string) {
    return require('crypto').createHash('md5').update(string).digest('hex');
}

function sort(string) {
    const sortedKeys = Object.keys(string).sort();
    let sortedData = {};
    for (const key of sortedKeys) {
        sortedData[key] = string[key];
    }
    return sortedData;
}

module.exports = getCookie;
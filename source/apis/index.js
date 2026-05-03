"use strict";

var utils = require("./utils");
var cheerio = require("cheerio");
var log = require("npmlog");
var {
  getThemeColors
} = require("../../func/utils/log.js");
var logger = require("../../func/utils/log.js");
var {
  cra,
  cv,
  cb,
  co
} = getThemeColors();
log.maxRecordSize = 100;
var checkVerified = null;
const Boolean_Option = ['online', 'selfListen', 'listenEvents', 'updatePresence', 'forceLogin', 'autoMarkDelivery', 'autoMarkRead', 'listenTyping', 'autoReconnect', 'emitReady'];

function setOptions(globalOptions, options) {
  Object.keys(options).map(function(key) {
    switch (Boolean_Option.includes(key)) {
      case true: {
        globalOptions[key] = Boolean(options[key]);
        break;
      }
      case false: {
        switch (key) {
          case 'pauseLog': {
            if (options.pauseLog) log.pause();
            else log.resume();
            break;
          }
          case 'logLevel': {
            log.level = options.logLevel;
            globalOptions.logLevel = options.logLevel;
            break;
          }
          case 'logRecordSize': {
            log.maxRecordSize = options.logRecordSize;
            globalOptions.logRecordSize = options.logRecordSize;
            break;
          }
          case 'pageID': {
            globalOptions.pageID = options.pageID.toString();
            break;
          }
          case 'userAgent': {
            globalOptions.userAgent = (options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');
            break;
          }
          case 'proxy': {
            if (typeof options.proxy != "string") {
              delete globalOptions.proxy;
              utils.setProxy();
            } else {
              globalOptions.proxy = options.proxy;
              utils.setProxy(globalOptions.proxy);
            }
            break;
          }
          default: {
            log.warn("setOptions", "Unrecognized option given to setOptions: " + key);
            break;
          }
        }
        break;
      }
    }
  });
}

function cleanWarningAuto(resp, jar, globalOptions, appstate, ID) {
    global.Fca.cleanWarningAuto = cleanWarningAuto;
    try {
        let UID;
        if (ID) UID = ID
        else {
            UID = (appstate.find(i => i.key == 'c_user') || appstate.find(i => i.key == 'i_user'))
            UID = UID.value;
        }
        if (resp !== undefined) {
            if (resp.request.uri && resp.request.uri.href.includes("https://www.facebook.com/checkpoint/")) {
                if (resp.request.uri.href.includes('601051028565049')) {
                    const fb_dtsg = utils.getFrom(resp.body, '["DTSGInitData",[],{"token":"', '","');
                    const jazoest = utils.getFrom(resp.body, 'jazoest=', '",');
                    const lsd = utils.getFrom(resp.body, "[\"LSD\",[],{\"token\":\"", "\"}");
                    const FormBypass = {
                        av: UID,
                        fb_dtsg, jazoest, lsd,
                        fb_api_caller_class: "RelayModern",
                        fb_api_req_friendly_name: "FBScrapingWarningMutation",
                        variables: JSON.stringify({}),
                        server_timestamps: true,
                        doc_id: 6339492849481770
                    }
                    return utils.post("https://www.facebook.com/api/graphql/", jar, FormBypass, globalOptions)
                    .then(utils.saveCookies(jar)).then(function(res) {
                        logger.log('Đã xử lý cảnh báo hành vi thành công!', 'SUCCES');
                        return process.exit(1);                    
                    });
                }
                else {
                    return resp;
                }
            }
            else {
                return resp
            }
        } else {
            return utils.get('https://www.facebook.com/', jar, null, globalOptions).then(function(res) {
                if (res.request.uri && res.request.uri.href.includes("https://www.facebook.com/checkpoint/")) {
                    if (res.request.uri.href.includes('601051028565049')) return { Status: true, Body: res.body }
                    else return { Status: false, Body: res.body }
                } else return { Status: false, Body: res.body }
             }).then(function(res) {
                if (res.Status === true) {
                    const fb_dtsg = utils.getFrom(res.Body, '["DTSGInitData",[],{"token":"', '","');
                    const jazoest = utils.getFrom(res.Body, 'jazoest=', '",');
                    const lsd = utils.getFrom(res.Body, "[\"LSD\",[],{\"token\":\"", "\"}");
                    const FormBypass = {
                        av: UID,
                        fb_dtsg, jazoest, lsd,
                        fb_api_caller_class: "RelayModern",
                        fb_api_req_friendly_name: "FBScrapingWarningMutation",
                        variables: JSON.stringify({}),
                        server_timestamps: true,
                        doc_id: 6339492849481770
                   }
                   return utils.post("https://www.facebook.com/api/graphql/", jar, FormBypass, globalOptions).then(utils.saveCookies(jar))
                    .then(res => {
                        logger.log('Đã xử lý cảnh báo hành vi thành công!', 'SUCCES');
                        return res
                    })
                }
                else return res;
            })
            .then(function(res) {
                return utils.get('https://www.facebook.com/', jar, null, globalOptions, { noRef: true }).then(utils.saveCookies(jar))
            })
            .then(function(res) {
                return process.exit(1)
            })
        }
    }
    catch (e) {
        console.log(e)
    }
}

function buildAPI(globalOptions, html, token, jar) {
  let fb_dtsg = null;
  let irisSeqID = null;
  function extractFromHTML() {
    try {
      const $ = cheerio.load(html);
      $('script').each((i, script) => {
        if (!fb_dtsg) {
          const scriptText = $(script).html() || '';
          const patterns = [
            /\["DTSGInitialData",\[\],{"token":"([^"]+)"}]/,
            /\["DTSGInitData",\[\],{"token":"([^"]+)"/,
            /"token":"([^"]+)"/,
            /{\\"token\\":\\"([^\\]+)\\"/,
            /,\{"token":"([^"]+)"\},\d+\]/,
            /"async_get_token":"([^"]+)"/,
            /"dtsg":\{"token":"([^"]+)"/,
            /DTSGInitialData[^>]+>([^<]+)/
          ];
          for (const pattern of patterns) {
            const match = scriptText.match(pattern);
            if (match && match[1]) {
              try {
                const possibleJson = match[1].replace(/\\"/g, '"');
                const parsed = JSON.parse(possibleJson);
                fb_dtsg = parsed.token || parsed;
              } catch {
                fb_dtsg = match[1];
              }
              if (fb_dtsg) break;
            }
          }
        }
      });
      if (!fb_dtsg) {
        const dtsgInput = $('input[name="fb_dtsg"]').val();
        if (dtsgInput) fb_dtsg = dtsgInput;
      }
      const seqMatches = html.match(/irisSeqID":"([^"]+)"/);
      if (seqMatches && seqMatches[1]) {
        irisSeqID = seqMatches[1];
      }
      try {
        const jsonMatches = html.match(/\{"dtsg":({[^}]+})/);
        if (jsonMatches && jsonMatches[1]) {
          const dtsgData = JSON.parse(jsonMatches[1]);
          if (dtsgData.token) fb_dtsg = dtsgData.token;
        }
      } catch {}
      if (fb_dtsg) {
        logger.log(`${cra(`[ CONNECT ]`)} Đã tìm thấy fb_dtsg`, "DATABASE");
      }
    } catch (e) {
      console.log("Lỗi khi tìm fb_dtsg:", e);
    }
  }
  extractFromHTML();
  var userID;
  var cookies = jar.getCookies("https://www.facebook.com");
  var userCookie = cookies.find(cookie => cookie.cookieString().startsWith("c_user="));
  var tiktikCookie = cookies.find(cookie => cookie.cookieString().startsWith("i_user="));
  if (!userCookie && !tiktikCookie) {
    return log.error('login', "Không tìm thấy cookie cho người dùng, vui lòng kiểm tra lại thông tin đăng nhập");
  }
  if (html.includes("/checkpoint/block/?next")) {
    return log.error('login', "Appstate die, vui lòng thay cái mới!", 'error');
  }
  userID = (tiktikCookie || userCookie).cookieString().split("=")[1];
  process.env['UID'] = userID;
  logger.log(`${cra(`[ CONNECT ]`)} Logged in as ${userID}`, "DATABASE");
  try {
    clearInterval(checkVerified);
  } catch (_) {}
  const clientID = (Math.random() * 2147483648 | 0).toString(16);
  let mqttEndpoint, region;
  try {
    const endpointMatch = html.match(/"endpoint":"([^"]+)"/);
    if (endpointMatch) {
      mqttEndpoint = endpointMatch[1].replace(/\\\//g, '/');
      const url = new URL(mqttEndpoint);
      region = url.searchParams.get('region')?.toUpperCase();
    }
  } catch (e) {
    console.log('Using default MQTT endpoint');
  }
  const regions = [
            {
                code: "PRN",
                name: "Pacific Northwest Region",
                location: "Khu vực Tây Bắc Thái Bình Dương"
            },
            {
                code: "VLL",
                name: "Valley Region",
                location: "Valley"
            },
            {
                code: "ASH",
                name: "Ashburn Region",
                location: "Ashburn"
            },
            {
                code: "DFW",
                name: "Dallas/Fort Worth Region",
                location: "Dallas/Fort Worth"
            },
            {
                code: "LLA",
                name: "Los Angeles Region",
                location: "Los Angeles"
            },
            {
                code: "FRA",
                name: "Frankfurt",
                location: "Frankfurt"
            },
            {
                code: "SIN",
                name: "Singapore",
                location: "Singapore"
            },
            {
                code: "NRT",
                name: "Tokyo",
                location: "Japan"
            },
            {
                code: "HKG",
                name: "Hong Kong",
                location: "Hong Kong"
            },
            {
                code: "SYD",
                name: "Sydney",
                location: "Sydney"
            },
            {
                code: "PNB",
                name: "Pacific Northwest - Beta",
                location: "Pacific Northwest "
            }
        ];

		if (!region) {
            region = ['prn',"pnb","vll","hkg","sin"][Math.random()*5|0];
            
        }
        if (!mqttEndpoint) {
            mqttEndpoint = "wss://edge-chat.facebook.com/chat?region=" + region;
        }
		
		const Location = regions.find(r => r.code === region.toUpperCase());

        logger.log(`${cra(`[ CONNECT ]`)} Server region: ${Location?.name || region.toUpperCase()}`, "DATABASE"); 		
  var ctx = {
    userID: userID,
    jar: jar,
    clientID: clientID,
    globalOptions: globalOptions,
    loggedIn: true,
    access_token: token,
    clientMutationId: 0,
    mqttClient: undefined,
    lastSeqId: irisSeqID,
    syncToken: undefined,
    mqttEndpoint: mqttEndpoint,
    region: region,
    firstListen: true,
    fb_dtsg: fb_dtsg,
    req_ID: 0,
    callback_Task: {},
    wsReqNumber: 0,
    wsTaskNumber: 0,
    reqCallbacks: {}
  };
  var api = {
    setOptions: setOptions.bind(null, globalOptions),
    getAppState: () => utils.getAppState(jar),
    postFormData: (url, body) => utils.makeDefaults(html, userID, ctx).postFormData(url, ctx.jar, body)
  };
  var defaultFuncs = utils.makeDefaults(html, userID, ctx);
  api.getFreshDtsg = async function() {
    try {
      const res = await defaultFuncs.get('https://www.facebook.com/', jar, null, globalOptions);
      const $ = cheerio.load(res.body);
      let newDtsg;
      const patterns = [
        /\["DTSGInitialData",\[\],{"token":"([^"]+)"}]/,
        /\["DTSGInitData",\[\],{"token":"([^"]+)"/,
        /"token":"([^"]+)"/,
        /name="fb_dtsg" value="([^"]+)"/
      ];
      $('script').each((i, script) => {
        if (!newDtsg) {
          const scriptText = $(script).html() || '';
          for (const pattern of patterns) {
            const match = scriptText.match(pattern);
            if (match && match[1]) {
              newDtsg = match[1];
              break;
            }
          }
        }
      });
      if (!newDtsg) {
        newDtsg = $('input[name="fb_dtsg"]').val();
      }
      return newDtsg;
    } catch (e) {
      console.log("Error getting fresh dtsg:", e);
      return null;
    }
  };
  require('fs').readdirSync(__dirname + '/lib/').filter(v => v.endsWith('.js')).forEach(v => {
    api[v.replace('.js', '')] = require(`./lib/${v}`)(utils.makeDefaults(html, userID, ctx), api, ctx);
  });
  api.listen = api.listenMqtt;
  return {
    ctx,
    defaultFuncs,
    api
  };
}

function makeLogin(jar, email, password, loginOptions, callback, prCallback) {
  return function(res) {
    const html = res.body;
    const $ = cheerio.load(html);
    let arr = [];

    // This will be empty, but just to be sure we leave it
    $("#login_form input").map((i, v) => arr.push({
      val: $(v).val(),
      name: $(v).attr("name")
    }));

    arr = arr.filter(function(v) {
      return v.val && v.val.length;
    });

    const form = utils.arrToForm(arr);
    form.lsd = utils.getFrom(html, "[\"LSD\",[],{\"token\":\"", "\"}");
    form.lgndim = Buffer.from("{\"w\":1440,\"h\":900,\"aw\":1440,\"ah\":834,\"c\":24}").toString('base64');
    form.email = email;
    form.pass = password;
    form.default_persistent = '0';
    form.lgnrnd = utils.getFrom(html, "name=\"lgnrnd\" value=\"", "\"");
    form.locale = 'en_US';
    form.timezone = '240';
    form.lgnjs = ~~(Date.now() / 1000);



    const willBeCookies = html.split("\"_js_");
    willBeCookies.slice(1).map(function(val) {
      const cookieData = JSON.parse("[\"" + utils.getFrom(val, "", "]") + "]");
      jar.setCookie(utils.formatCookie(cookieData, "facebook"), "https://www.facebook.com");
    });
    // ---------- Very Hacky Part Ends -----------------


    return utils
      .post("https://www.facebook.com/login/device-based/regular/login/?login_attempt=1&lwv=110", jar, form, loginOptions)
      .then(utils.saveCookies(jar))
      .then(function(res) {
        const headers = res.headers;
        if (!headers.location) throw {
          error: "Wrong username/password."
        };

        // This means the account has login approvals turned on.
        if (headers.location.indexOf('https://www.facebook.com/checkpoint/') > -1) {
          log.info("login", "You have login approvals turned on.");
          const nextURL = 'https://www.facebook.com/checkpoint/?next=https%3A%2F%2Fwww.facebook.com%2Fhome.php';

          return utils
            .get(headers.location, jar, null, loginOptions)
            .then(utils.saveCookies(jar))
            .then(function(res) {
              const html = res.body;
              // Make the form in advance which will contain the fb_dtsg and nh
              const $ = cheerio.load(html);
              let arr = [];
              $("form input").map((i, v) => arr.push({
                val: $(v).val(),
                name: $(v).attr("name")
              }));

              arr = arr.filter(function(v) {
                return v.val && v.val.length;
              });

              const form = utils.arrToForm(arr);
              if (html.indexOf("checkpoint/?next") > -1) {
                setTimeout(() => {
                  checkVerified = setInterval((_form) => {}, 5000, {
                    fb_dtsg: form.fb_dtsg,
                    jazoest: form.jazoest,
                    dpr: 1
                  });
                }, 2500);
                throw {
                  error: 'login-approval',
                  continue: function submit2FA(code) {
                    form.approvals_code = code;
                    form['submit[Continue]'] = $("#checkpointSubmitButton").html(); //'Continue';
                    let prResolve = null;
                    let prReject = null;
                    const rtPromise = new Promise(function(resolve, reject) {
                      prResolve = resolve;
                      prReject = reject;
                    });
                    if (typeof code == "string") {
                      utils
                        .post(nextURL, jar, form, loginOptions)
                        .then(utils.saveCookies(jar))
                        .then(function(res) {
                          const $ = cheerio.load(res.body);
                          const error = $("#approvals_code").parent().attr("data-xui-error");
                          if (error) {
                            throw {
                              error: 'login-approval',
                              errordesc: "Invalid 2FA code.",
                              lerror: error,
                              continue: submit2FA
                            };
                          }
                        })
                        .then(function() {
                          // Use the same form (safe I hope)
                          delete form.no_fido;
                          delete form.approvals_code;
                          form.name_action_selected = 'dont_save'; //'save_device';

                          return utils.post(nextURL, jar, form, loginOptions).then(utils.saveCookies(jar));
                        })
                        .then(function(res) {
                          const headers = res.headers;
                          if (!headers.location && res.body.indexOf('Review Recent Login') > -1) throw {
                            error: "Something went wrong with login approvals."
                          };

                          const appState = utils.getAppState(jar);

                          if (callback === prCallback) {
                            callback = function(err, api) {
                              if (err) return prReject(err);
                              return prResolve(api);
                            };
                          }

                          // Simply call loginHelper because all it needs is the jar
                          // and will then complete the login process
                          return loginHelper(appState, email, password, loginOptions, callback);
                        })
                        .catch(function(err) {
                          // Check if using Promise instead of callback
                          if (callback === prCallback) prReject(err);
                          else callback(err);
                        });
                    } else {
                      utils
                        .post("https://www.facebook.com/checkpoint/?next=https%3A%2F%2Fwww.facebook.com%2Fhome.php", jar, form, loginOptions, null, {
                          "Referer": "https://www.facebook.com/checkpoint/?next"
                        })
                        .then(utils.saveCookies(jar))
                        .then(res => {
                          try {
                            JSON.parse(res.body.replace(/for\s*\(\s*;\s*;\s*\)\s*;\s*/, ""));
                          } catch (ex) {
                            clearInterval(checkVerified);
                            log.info("login", "Verified from browser. Logging in...");
                            if (callback === prCallback) {
                              callback = function(err, api) {
                                if (err) return prReject(err);
                                return prResolve(api);
                              };
                            }
                            return loginHelper(utils.getAppState(jar), email, password, loginOptions, callback);
                          }
                        })
                        .catch(ex => {
                          log.error("login", ex);
                          if (callback === prCallback) prReject(ex);
                          else callback(ex);
                        });
                    }
                    return rtPromise;
                  }
                };
              } else {
                if (!loginOptions.forceLogin) throw {
                  error: "Couldn't login. Facebook might have blocked this account. Please login with a browser or enable the option 'forceLogin' and try again."
                };

                if (html.indexOf("Suspicious Login Attempt") > -1) form['submit[This was me]'] = "This was me";
                else form['submit[This Is Okay]'] = "This Is Okay";

                return utils
                  .post(nextURL, jar, form, loginOptions)
                  .then(utils.saveCookies(jar))
                  .then(function() {
                    // Use the same form (safe I hope)
                    form.name_action_selected = 'save_device';

                    return utils.post(nextURL, jar, form, loginOptions).then(utils.saveCookies(jar));
                  })
                  .then(function(res) {
                    const headers = res.headers;

                    if (!headers.location && res.body.indexOf('Review Recent Login') > -1) throw {
                      error: "Something went wrong with review recent login."
                    };

                    const appState = utils.getAppState(jar);

                    // Simply call loginHelper because all it needs is the jar
                    // and will then complete the login process
                    return loginHelper(appState, email, password, loginOptions, callback);
                  })
                  .catch(e => callback(e));
              }
            });
        }

        return utils.get('https://www.facebook.com/', jar, null, loginOptions).then(utils.saveCookies(jar));
      });
  };
}

function loginHelper(appState, email, password, globalOptions, callback, prCallback) {
  let mainPromise = null;
  const jar = utils.getJar();
  if (appState) {
    try {
      appState = JSON.parse(appState);
    } catch (e) {
      try {
        appState = appState;
      } catch (e) {
        return callback(new Error("Failed to parse appState"));
      }
    }
    try {
      appState.forEach(c => {
        const str = `${c.key}=${c.value}; expires=${c.expires}; domain=${c.domain}; path=${c.path};`;
        jar.setCookie(str, "http://" + c.domain);
      });
      mainPromise = utils.get('https://www.facebook.com/', jar, null, globalOptions, {
          noRef: true
        })
        .then(utils.saveCookies(jar));
    } catch (e) {
      process.exit(0);
    }
  } else {
    mainPromise = utils
      .get("https://www.facebook.com/", null, null, globalOptions, {
        noRef: true
      })
      .then(utils.saveCookies(jar))
      .then(makeLogin(jar, email, password, globalOptions, callback, prCallback))
      .then(() => utils.get('https://www.facebook.com/', jar, null, globalOptions).then(utils.saveCookies(jar)));
  }

  function handleRedirect(res) {
    const reg = /<meta http-equiv="refresh" content="0;url=([^"]+)[^>]+>/;
    const redirect = reg.exec(res.body);
    if (redirect && redirect[1]) {
      return utils.get(redirect[1], jar, null, globalOptions).then(utils.saveCookies(jar));
    }
    return res;
  }

  let ctx, api;
  mainPromise = mainPromise
    .then(handleRedirect)
    .then(res => {
      const mobileAgentRegex = /MPageLoadClientMetrics/gs;
      if (!mobileAgentRegex.test(res.body)) {
        globalOptions.userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";
        return utils.get('https://www.facebook.com/', jar, null, globalOptions, {
          noRef: true
        }).then(utils.saveCookies(jar));
      }
      return res;
    })
    .then(handleRedirect)
    .then(utils.getAccessFromBusiness(jar, globalOptions))
    .then(res => {
      const html = res[0];
      const Obj = buildAPI(globalOptions, res[0], res[1], jar);
      ctx = Obj.ctx;
      api = Obj.api;
      return res;
    });
  if (globalOptions.pageID) {
    mainPromise = mainPromise
      .then(() => utils.get(`https://www.facebook.com/${globalOptions.pageID}/messages/?section=messages&subsection=inbox`, jar, null, globalOptions))
      .then(resData => {
        let url = utils.getFrom(resData.body, 'window.location.replace("https:\\/\\/www.facebook.com\\', '");').split('\\').join('');
        url = url.substring(0, url.length - 1);
        return utils.get('https://www.facebook.com' + url, jar, null, globalOptions);
      });
  }
  mainPromise
    .then(async () => {
      logger.log(`${cra(`[ CONNECT ]`)} Done logging in.`, 'DATABASE');
      callback(null, api);
    })
    .catch(e => {
      callback(e);
    });
}

function login(loginData, options, callback) {
  if (utils.getType(options) === 'Function' || utils.getType(options) === 'AsyncFunction') {
    callback = options;
    options = {};
  }

  var globalOptions = {
    selfListen: false,
    listenEvents: true,
    listenTyping: false,
    updatePresence: false,
    forceLogin: false,
    autoMarkDelivery: false,
    autoMarkRead: false,
    autoReconnect: true,
    logRecordSize: 100,
    online: false,
    emitReady: false,
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
  };

  var prCallback = null;
  if (utils.getType(callback) !== "Function" && utils.getType(callback) !== "AsyncFunction") {
    var rejectFunc = null;
    var resolveFunc = null;
    var returnPromise = new Promise(function(resolve, reject) {
      resolveFunc = resolve;
      rejectFunc = reject;
    });
    prCallback = function(error, api) {
      if (error) return rejectFunc(error);
      return resolveFunc(api);
    };
    callback = prCallback;
  }
  require('./extra/database');
  if (loginData.email && loginData.password) {
    setOptions(globalOptions, {
      logLevel: "silent",
      forceLogin: true,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
    });
    loginHelper(loginData.appState, loginData.email, loginData.password, globalOptions, callback, prCallback);
  } else if (loginData.appState) {
    setOptions(globalOptions, options);
    return loginHelper(loginData.appState, loginData.email, loginData.password, globalOptions, callback, prCallback);
  }
  return returnPromise;
}


module.exports = login;
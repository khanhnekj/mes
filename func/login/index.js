const fs = require("fs");
const path = require("path");
const GoogleAuthenticator = require(path.join(process.cwd(), "source/googleAuth.js"));
const getCookie = require(path.join(process.cwd(), "func/login/getCookie.js"));
const checkLiveCookie = require("../utils/checkLiveCookie");
const config = require("../config/config.main.json");
const cookieFilePath = path.join(process.cwd(), "cookie.txt");
const login = require("../../source/apis/index.js");
const logger = require("../utils/log");
const { getThemeColors } = require("../utils/log");
const { cra, cv, cb, co } = getThemeColors();

async function getNewCookie() {
    const ga = new GoogleAuthenticator();
    const code = ga.getCode(config.facebookAccount["2FASecret"]);
    const loginData = {
        username: config.facebookAccount.email,
        password: config.facebookAccount.password,
        twofactor: 0,
        _2fa: code
    };

    logger.log(`${cra("[ CONNECT ]")} Getting new cookie...`, "DATABASE");
    const result = await getCookie(loginData);

    if (!result || typeof result !== 'string' || result.includes('status') || result.trim() === "") {
        throw new Error("getCookie failed: " + JSON.stringify(result));
    }

    fs.writeFileSync(cookieFilePath, result);
    logger.log(`${cra("[ CONNECT ]")} New cookie saved`, "DATABASE");
    return result;
}

async function onBot({ models, client, tools, apis }) {
    let cookies = "";

    if (fs.existsSync(cookieFilePath)) {
        cookies = fs.readFileSync(cookieFilePath, "utf-8").trim();
        if (!cookies) {
            logger.log(`${cra("[ CONNECT ]")} Cookie file empty!`, "DATABASE");
            cookies = "";
        } else {
            logger.log(`${cra("[ CONNECT ]")} Cookie loaded`, "DATABASE");
        }
    } else {
        logger.log(`${cra("[ CONNECT ]")} No cookie file to get new`, "DATABASE");
    }

    if (!cookies) {
        await getNewCookie();
        cookies = fs.readFileSync(cookieFilePath, "utf-8").trim();
        if (!cookies) {
            logger.error(`${cra("[ CONNECT ]")} Failed to get cookie!`, "DATABASE");
            process.exit(1);
        }
    }

    let isCookieLive = false;
    try {
        isCookieLive = await checkLiveCookie(cookies);
    } catch (err) {
        logger.error(`${cra("[ CONNECT ]")} checkLiveCookie error: ${err.message}`, "DATABASE");
    }

    if (!isCookieLive) {
        logger.log(`${cra("[ CONNECT ]")} Cookie DEAD to get new`, "DATABASE");
        await getNewCookie();
        await new Promise(resolve => setTimeout(resolve, 7000));
        cookies = fs.readFileSync(cookieFilePath, "utf-8").trim();

        if (cookies) {
            try {
                isCookieLive = await checkLiveCookie(cookies);
                if (!isCookieLive) {
                    logger.error(`${cra("[ CONNECT ]")} New cookie STILL DEAD!`, "DATABASE");
                    process.exit(1);
                }
            } catch (err) {
                logger.error(`${cra("[ CONNECT ]")} Final check failed`, "DATABASE");
                process.exit(1);
            }
        } else {
            logger.error(`${cra("[ CONNECT ]")} No cookie after retry`, "DATABASE");
            process.exit(1);
        }
    } else {
        logger.log(`${cra("[ CONNECT ]")} Cookie LIVE to login`, "DATABASE");
    }

    login({ appState: global.utils.parseCookies(cookies) }, async (loginError, api) => {
        if (loginError) {
            logger.error(`${cra("[ CONNECT ]")} Login failed: ${loginError.message || loginError}`, "DATABASE");
            if (loginError.message?.includes("Invalid") || loginError.message?.includes("checkpoint")) {
                logger.log(`${cra("[ CONNECT ]")} Invalid session to re-login`, "DATABASE");
                await getNewCookie();
                await new Promise(resolve => setTimeout(resolve, 7000));
                process.exit(1);
            }
            return console.error(loginError);
        }

        api.setOptions(global.config.FCA_Option);
        fs.writeFileSync(path.join(process.cwd(), "core/data/fbstate.json"), JSON.stringify(api.getAppState(), null, 2));
        global.Seiko.api = api;
        global.config.version = "5.0.0";

        const formatMemory = bytes => (bytes / (1024 * 1024)).toFixed(2);
        const logMemoryUsage = () => {
            const { rss } = process.memoryUsage();
            logger.log(`${cra("[ MONITOR ]")} RAM: ${formatMemory(rss)} MB`, "SYSTEM");
            if (rss > 500 * 1024 * 1024) {
                logger.log(`${co("[ WARNING ]")} Memory leak to restart`, "SYSTEM");
                process.exit(1);
            }
        };
        setInterval(logMemoryUsage, 60000);

        await global.utils.loadPlugins({ api, models, client, tools, cra, cv, cb, apis });
        fs.writeFileSync(global.Seiko.configPath, JSON.stringify(global.config, null, 4), "utf8");

        const listener = require(path.join(process.cwd(), "core/listen.js"))({ api, apis, models, client, tools, cra, cv, cb, co });

        async function refreshFb_dtsg() {
            try {
                await api.refreshFb_dtsg();
                logger.log("fb_dtsg refreshed", "LOGIN");
            } catch (err) {
                logger.err(`fb_dtsg error: ${err.message}`, "LOGIN");
            }
        }
        setInterval(refreshFb_dtsg, 1000 * 60 * 60 * 48);

        async function listenEvent(error, event) {
            if (error) {
                if (JSON.stringify(error).includes("601051028565049")) {
                    api.httpPost("https://www.facebook.com/api/graphql/", {
                        av: api.getCurrentUserID(),
                        fb_api_caller_class: "RelayModern",
                        fb_api_req_friendly_name: "FBScrapingWarningMutation",
                        variables: "{}",
                        server_timestamps: "true",
                        doc_id: "6339492849481770"
                    }, (e, i) => {
                        const res = JSON.parse(i);
                        if (e || res.errors) return logger.err("Clear warning failed", "LOGIN");
                        if (res.data.fb_scraping_warning_clear.success) {
                            logger.log("Cleared FB warning", "LOGIN");
                            global.handleListen = api.listen(listenEvent);
                        }
                    });
                } else if (error.error === "Not logged in." || error.error === "Not logged in") {
                    logger.error("Logged out to relogin", "LOGIN");
                    await getNewCookie();
                    await new Promise(resolve => setTimeout(resolve, 7000));
                    process.exit(1);
                } else {
                    logger.error(`Listener error: ${JSON.stringify(error, null, 2)}`, "LOGIN");
                }
                return;
            }

            if (["presence", "typ", "read_receipt"].includes(event?.type)) return;
            if (global.config.DeveloperMode) console.log(event);
            return listener(event);
        }

        function connect_mqtt() {
            global.handleListen = api.listen(listenEvent);
            logger.log(`${cra("[ CONNECT ]")} MQTT Connected`, "LOADED");

            const timeRestart = config.mqtt.timeRestartInHours * 60 * 60 * 1000;
            const restartInterval = setInterval(async () => {
                if (!config.mqtt.enable) {
                    clearInterval(restartInterval);
                    return logger.warn(`${cra("[ CONNECT ]")} MQTT restart off`);
                }
                try {
                    await api.stopListening();
                    await new Promise(r => setTimeout(r, config.mqtt.delayStop));
                    global.handleListen = api.listen(listenEvent);
                    logger.log(`${cra("[ CONNECT ]")} MQTT Restarted`, "LOADED");
                } catch (error) {
                    logger.error(`${cra("[ CONNECT ]")} MQTT restart error`, error);
                }
            }, timeRestart);
        }

        connect_mqtt();
    });
}

module.exports = onBot;
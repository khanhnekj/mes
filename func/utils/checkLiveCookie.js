const axios = require("axios");

module.exports = async function checkLiveCookie(cookie) {
    if (!cookie || cookie.trim() === "") return false;

    let finalUrl = "";
    let statusCode = 0;

    try {
        const response = await axios({
            url: "https://www.facebook.com/me",
            method: "GET",
            headers: {
                cookie: cookie,
                "user-agent": "Mozilla/5.0 (Linux; Android 12; M2102J20SG) AppleWebKit/537.36"
            },
            maxRedirects: 0,
            timeout: 15000,
            validateStatus: () => true
        });

        statusCode = response.status;
        finalUrl = response.request?.res?.responseUrl || "NO_REDIRECT_URL";

        if (statusCode === 200) {
            console.log(`[DEBUG] /me → 200 OK → LIVE`);
            return true;
        }

    } catch (error) {
        if (error.response) {
            statusCode = error.response.status;
            finalUrl = error.response.headers.location || "NO_LOCATION";
        } else {
            finalUrl = "TIMEOUT_OR_NETWORK_ERROR";
        }
    }

    console.log(`[DEBUG] /me → ${statusCode} → ${finalUrl}`);

    const url = finalUrl.toLowerCase();

    const isDead = url.includes("login") || 
                   url.includes("checkpoint") || 
                   url.includes("recover") || 
                   url.includes("device-based");

    const isLiveRedirect = url.includes("facebook.com/") && 
                           (url.match(/\/\d{5,}/) || 
                            url.includes("profile.php?id=") || 
                            url === "https://www.facebook.com/" || 
                            url.endsWith("/"));

    return !isDead && (statusCode === 200 || isLiveRedirect);
};
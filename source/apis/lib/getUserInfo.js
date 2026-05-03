"use strict";

const utils = require("../utils");
const log = require("npmlog");
const Database = require('../extra/database/index.js')();
const formatData = (data) => {
  const retObj = {};
  for (const prop in data) {
    if (data.hasOwnProperty(prop)) {
      const innerObj = data[prop];
      retObj[prop] = {
        name: innerObj.name,
        firstName: innerObj.firstName,
        vanity: innerObj.vanity,
        thumbSrc: innerObj.thumbSrc,
        profileUrl: innerObj.uri,
        gender: innerObj.gender,
        type: innerObj.type,
        isFriend: innerObj.is_friend,
        isBirthday: !!innerObj.is_birthday,
      };
    }
  }
  return retObj;
};

module.exports = function (defaultFuncs, api, ctx) {
  return async function getUserInfo(id, callback) {
    let resolveFunc = () => {};
    let rejectFunc = () => {};
    const returnPromise = new Promise((resolve, reject) => {
      resolveFunc = resolve;
      rejectFunc = reject;
    });
    if (!callback) {
      callback = (err, userInfo) => {
        if (err) return rejectFunc(err);
        resolveFunc(userInfo);
      };
    }

    if (!Array.isArray(id)) id = [id];
    const userInfoMap = new Map();
    const AlreadyGet = [];
    const NeedGet = [];

    try {
      for (const idu of id) {
        const userData = await Database.get(idu);
        if (userData) {
          let Format = {};
          Format[idu] = JSON.parse(userData);
          AlreadyGet.push(Format);
        } else {
          NeedGet.push(idu);
        }
      }

      if (NeedGet.length > 0) {
        let form = {};
        NeedGet.forEach((v, i) => {
          form[`ids[${i}]`] = v;
        });

        defaultFuncs
          .post("https://www.facebook.com/chat/user_info/", ctx.jar, form)
          .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
          .then(async (resData) => {
            if (resData.error) throw resData;

            const newUserInfo = formatData(resData.payload.profiles);

            for (const [idu, data] of Object.entries(newUserInfo)) {
              await Database.set(idu, JSON.stringify(data));
              let Format = {};
              Format[idu] = data;
              AlreadyGet.push(Format);
            }

            callback(null, AlreadyGet);
          })
          .catch(err => {
            log.error("getUserInfo", "Error: getUserInfo might be due to excessive requests. Please try again.");
            callback(err, null);
          });
      } else if (AlreadyGet.length === 1) {
        callback(null, AlreadyGet[0]);
      } else if (AlreadyGet.length > 1) {
        callback(null, AlreadyGet);
      }
    } catch (error) {
      callback(error, null);
    }

    return returnPromise;
  };
};
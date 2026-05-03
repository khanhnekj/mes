"use strict";

var utils = require("../utils");
var log = require("npmlog");

module.exports = function (defaultFuncs, api, ctx) {
  function addUserToGroupNoMqtt(userID, threadID, callback) {
    var resolveFunc = function () { };
    var rejectFunc = function () { };
    var returnPromise = new Promise(function (resolve, reject) {
      resolveFunc = resolve;
      rejectFunc = reject;
    });
    if (!callback && (utils.getType(threadID) === "Function" || utils.getType(threadID) === "AsyncFunction")) throw { error: "please pass a threadID as a second argument." };
    if (!callback) {
      callback = function (err) {
        if (err) return rejectFunc(err);
        resolveFunc();
      };
    }
    if (utils.getType(threadID) !== "Number" && utils.getType(threadID) !== "String") throw { error: "ThreadID should be of type Number or String and not " + utils.getType(threadID) + "." };
    if (utils.getType(userID) !== "Array") userID = [userID];
    var messageAndOTID = utils.generateOfflineThreadingID();
    var form = {
      client: "mercury",
      action_type: "ma-type:log-message",
      author: "fbid:" + ctx.userID,
      thread_id: "",
      timestamp: Date.now(),
      timestamp_absolute: "Today",
      timestamp_relative: utils.generateTimestampRelative(),
      timestamp_time_passed: "0",
      is_unread: false,
      is_cleared: false,
      is_forward: false,
      is_filtered_content: false,
      is_filtered_content_bh: false,
      is_filtered_content_account: false,
      is_spoof_warning: false,
      source: "source:chat:web",
      "source_tags[0]": "source:chat",
      log_message_type: "log:subscribe",
      status: "0",
      offline_threading_id: messageAndOTID,
      message_id: messageAndOTID,
      threading_id: utils.generateThreadingID(ctx.clientID),
      manual_retry_cnt: "0",
      thread_fbid: threadID
    };
    for (var i = 0; i < userID.length; i++) {
      if (utils.getType(userID[i]) !== "Number" && utils.getType(userID[i]) !== "String") throw { error: "Elements of userID should be of type Number or String and not " + utils.getType(userID[i]) + "." };
      form["log_message_data[added_participants][" + i + "]"] = "fbid:" + userID[i];
    }
    defaultFuncs
      .post("https://www.facebook.com/messaging/send/", ctx.jar, form)
      .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
      .then(function (resData) {
        if (!resData) throw { error: "Add to group failed." };
        if (resData.error) throw resData;
        return callback();
      })
      .catch(function (err) {
        log.error("addUserToGroup", err);
        return callback(err);
      });
    return returnPromise;
  };

  function addUserToGroupMqtt(userID, threadID, callback) {
    if (!ctx.mqttClient) {
      throw new Error("Not connected to MQTT");
    }
    var resolveFunc = function () { };
    var rejectFunc = function () { };
    var returnPromise = new Promise(function (resolve, reject) {
      resolveFunc = resolve;
      rejectFunc = reject;
    });
    if (!callback) {
      callback = function (err) {
        if (err) return rejectFunc(err);
        resolveFunc();
      };
    }
    if (utils.getType(threadID) !== "Number" && utils.getType(threadID) !== "String") throw { error: "ThreadID should be of type Number or String and not " + utils.getType(threadID) + "." };
    if (utils.getType(userID) !== "Array") userID = [userID];
    let count_req = 0;
    const payload = {
      epoch_id: utils.generateOfflineThreadingID(),
      tasks: [
        {
          failure_count: null,
          label: "23",
          payload: JSON.stringify({
            thread_key: threadID,
            contact_ids: userID,
            sync_group: 1
          }),
          queue_name: threadID.toString(),
          task_id: Math.floor(Math.random() * 1001)
        }
      ],
      version_id: "8410157442424172"
    };
    const form = JSON.stringify({
      app_id: "2220391788200892",
      payload: JSON.stringify(payload),
      request_id: ++count_req,
      type: 3
    });
    ctx.mqttClient.publish("/ls_req", form, (err) => {
      if (err) {
        log.error("addUserToGroupMqtt", err);
        return callback(err);
      }
      return callback();
    });
    return returnPromise;
  }
  
  return function addUserToGroup(userID, threadID, callback) {
    if (ctx.mqttClient) {
      try {
        return addUserToGroupMqtt(userID, threadID, callback);
      } catch (e) {
        return addUserToGroupNoMqtt(userID, threadID, callback);
      }
    } else {
      return addUserToGroupNoMqtt(userID, threadID, callback);
    }
  };
};
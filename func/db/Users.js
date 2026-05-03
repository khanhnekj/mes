module.exports = function ({ models, api }) {
  const Users = models.use('Users');

  async function getInfo(id) {
    try {
      return (await api.getUserInfo(id))[id];
    }
    catch(e) {
      return false;
    }
  }

  async function getNameUser(id) {
    try {
      if (global.data.userName.has(id)) {
        let userName = global.data.userName.get(id);
        if (userName === "Người dùng Facebook") {
          const userInfo = await getInfo(id);
          if (userInfo && userInfo.gender !== undefined) {
            userName = userInfo.name || "Người dùng Facebook";
            await setData(id, { name: userName });
            return userName;
          } else {
            return "Người dùng Facebook";
          }
        }
        return userName;
      } else if (global.data.allUserID.includes(id)) {
        let userData = await getData(id);
        if (userData && userData.name === "Người dùng Facebook") {
          const userInfo = await getInfo(id);
          if (userInfo && userInfo.gender !== undefined) {
            const nameUser = userInfo.name || "Người dùng Facebook";
            await setData(id, { name: nameUser });
            return nameUser;
          } else {
            return "Người dùng Facebook";
          }
        }
        return userData ? userData.name : "Người dùng Facebook";
      } else {
        return "Người dùng Facebook";
      }
    } catch {
      return "Người dùng Facebook";
    }
  }

  async function getData(userID) {
    try {
      let data = await Users.findOne({ where: { userID } });
  
      if (!data) {
        const userInfo = await getInfo(userID);
  
        if (userInfo) {
          const nameUser = userInfo.name || "Người dùng Facebook";
          await setData(userID, {
            name: nameUser,
            gender: userInfo.gender
          });
  
          return {
            userID,
            name: nameUser,
            gender: userInfo.gender
          };
        } else {
          return {
            userID,
            name: "Người dùng Facebook"
          };
        }
      }
  
      const userData = data.get({ plain: true });
      if (userData.name === "Người dùng Facebook") {
        const userInfo = await getInfo(userID);
  
        if (userInfo && userInfo.gender !== undefined) {
          const nameUser = userInfo.name || "Người dùng Facebook";
          await setData(userID, { name: nameUser });
          userData.name = nameUser;
        } else {
          return {
            ...userData,
            name: "Người dùng Facebook"
          };
        }
      }
  
      return userData;
  
    } catch (error) {
      console.error(error);
      throw new Error(error);
    }
  }  

  async function getUserFull(id) {
    var resolveFunc = function () { };
      var rejectFunc = function () { };
      var returnPromise = new Promise(function (resolve, reject) {
        resolveFunc = resolve;
        rejectFunc = reject;
      });
    try {
          api.httpGet(`https://graph.facebook.com/${id}?fields=name,email,about,birthday,gender,hometown,link,location,quotes,relationship_status,significant_other,username,subscribers.limite(0),website&access_token=${client.account.token.EAAD6V7}`, (e, i) => {
              if (e) return rejectFunc(e);
              var t = JSON.parse(i);
              var dataUser = {
                  data: {
                      name: t.name || null,
                      username: t.username || null,
                      uid: t.id || null,
                      about: t.about || null,
                      follow: t.subscribers.summary.total_count || 0,
                      birthday: t.birthday || null,
                      gender: t.gender,
                      hometown: t.hometown || null,
                      link: t.link || null,
                      location: t.location || null,
                      relationship_status: t.relationship_status || null,
                      love: t.significant_other || null,
                      quotes: t.quotes || null,
                      website: t.website || null,
                      imgavt: `https://graph.facebook.com/${t.id}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
                  }
              };
              return resolveFunc(dataUser);
          });
          return returnPromise;
      }
    catch(error) { 
        return resolveFunc({
        error: 1, 
            data: {}
        });
    }
  }

  async function getAll(...data) {
    var where, attributes;
    for (const i of data) {
      if (typeof i != 'object') throw new Error("Cần một đối tượng hoặc mảng.");
      if (Array.isArray(i)) attributes = i;
      else where = i;
    }
    try {
      return (await Users.findAll({ where, attributes })).map(e => e.get({ plain: true }));
    }
    catch (error) {
      console.error(error);
      throw new Error(error);
    }
  }

  async function setData(userID, options = {}) {
    if (typeof options != 'object' && !Array.isArray(options)) throw new Error("Cần một đối tượng.");
    try {
      (await Users.findOne({ where: { userID } })).update(options);
      return true;
    }
    catch (error) {
      try {
        await createData(userID, options);
      } catch (error) {
        console.error(error);
        throw new Error(error);
      }
    }
  }

  async function delData(userID) {
    try {
      (await Users.findOne({ where: { userID } })).destroy();
      return true;
    }
    catch (error) {
      console.error(error);
      throw new Error(error);
    }
  }

  async function createData(userID, defaults = {}) {
    if (typeof defaults != 'object' && !Array.isArray(defaults)) throw new Error("Cần một đối tượng.");
    try {
      await Users.findOrCreate({ where: { userID }, defaults });
      return true;
    }
    catch (error) {
      console.error(error);
      throw new Error(error);
    }
  }

  return {
    getInfo,
    getNameUser,
    getAll,
    getData,
    setData,
    delData,
    createData,
    getUserFull
  };
};
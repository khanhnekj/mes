module.exports = function ({ models, api }) {
  const Threads = models.use('Threads');

  async function getInfo(threadID) {
    try {
      const result = await api.getThreadInfo(threadID);
      return result;
    } catch (error) { 
      console.log(error);
      throw new Error("Lỗi khi lấy thông tin nhóm.");
    }
  }

  async function getAll(...data) {
    var where, attributes;
    for (const i of data) {
      if (typeof i != 'object') throw "Yêu cầu tham số kiểu đối tượng hoặc mảng.";
      if (Array.isArray(i)) attributes = i;
      else where = i;
    }
    try { 
      return (await Threads.findAll({ where, attributes })).map(e => e.get({ plain: true })); 
    } catch (error) {
      console.error(error);
      throw new Error("Lỗi khi lấy tất cả dữ liệu.");
    }
  }

  async function getData(threadID) {
    try {
      const data = await Threads.findOne({ where: { threadID }});
      if (data) return data.get({ plain: true });
      else return false;
    } catch (error) { 
      console.error(error);
      throw new Error("Lỗi khi lấy dữ liệu nhóm.");
    }
  }

  async function setData(threadID, options = {}) {
    if (typeof options != 'object' && !Array.isArray(options)) throw "Yêu cầu tham số kiểu đối tượng.";
    try {
      const thread = await Threads.findOne({ where: { threadID } });
      if (thread) {
        await thread.update(options);
        return true;
      } else {
        // Nếu không tìm thấy, tạo mới
        await createData(threadID, options);
        return true;
      }
    } catch (error) { 
      console.error(error);
      throw new Error("Lỗi khi cập nhật dữ liệu nhóm.");
    }
  }

  async function delData(threadID) {
    try {
      const thread = await Threads.findOne({ where: { threadID } });
      if (thread) {
        await thread.destroy();
        return true;
      }
      return false;
    } catch (error) {
      console.error(error);
      throw new Error("Lỗi khi xoá dữ liệu nhóm.");
    }
  }

  async function createData(threadID, defaults = {}) {
    if (typeof defaults != 'object' && !Array.isArray(defaults)) throw "Yêu cầu tham số kiểu đối tượng.";
    try {
      await Threads.findOrCreate({ where: { threadID }, defaults });
      return true;
    } catch (error) {
      console.error(error);
      throw new Error("Lỗi khi tạo dữ liệu nhóm.");
    }
  }

  return {
    getInfo,
    getAll,
    getData,
    setData,
    delData,
    createData
  };
};
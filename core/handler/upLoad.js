// credits là của bố m

const cron = require('node-cron');
const axios = require('axios');

module.exports = function ({ api, client }) {
  async function stream_url(url) {
    return axios({
      url: url,
      responseType: 'stream',
    }).then(_ => _.data);
  }

  async function upload(url) {
    return api
      .postFormData('https://upload.facebook.com/ajax/mercury/upload.php', {
        upload_1024: await stream_url(url),
      })
      .then(res =>
        Object.entries(
          JSON.parse(res.body.replace('for (;;);', '')).payload?.metadata?.[0] || {}
        )[0]
      );
  }

  let status = false;
  cron.schedule('*/5 * * * * *', async () => {
    if (status === true) return;
    status = true;

    // ===== vdgai =====
    if (global.Seiko.queues.length < 20) {
      try {
        if (!client.api.vdgai || !Array.isArray(client.api.vdgai) || client.api.vdgai.length === 0) {
          console.log('❌ vdgai API not available or empty');
        } else {
          const itemsNeeded = Math.min(20 - global.Seiko.queues.length, 5);
          const uploadPromises = [...Array(itemsNeeded)].map(() =>
            upload(client.api.vdgai[Math.floor(Math.random() * client.api.vdgai.length)])
          );
          const res = await Promise.all(uploadPromises);
          console.log('✅ vdgai upload:', res);
          global.Seiko.queues.push(...res);
        }
      } catch (error) {
        console.log('❌ vdgai upload error:', error.message);
      }
    }

    // ===== vdanime =====
    if (global.Seiko.animeQueues.length < 20) {
      try {
        if (!client.api.vdanime || !Array.isArray(client.api.vdanime) || client.api.vdanime.length === 0) {
          console.log('❌ vdanime API not available or empty');
        } else {
          const itemsNeeded = Math.min(20 - global.Seiko.animeQueues.length, 5);
          const uploadPromises = [...Array(itemsNeeded)].map(() =>
            upload(client.api.vdanime[Math.floor(Math.random() * client.api.vdanime.length)])
          );
          const res = await Promise.all(uploadPromises);
          console.log('✅ vdanime upload:', res);
          global.Seiko.animeQueues.push(...res);
        }
      } catch (error) {
        console.log('❌ vdanime upload error:', error.message);
      }
    }

    // ===== vdcos =====
    if (global.Seiko.cosQueues.length < 20) {
      try {
        if (!client.api.vdcos || !Array.isArray(client.api.vdcos) || client.api.vdcos.length === 0) {
          console.log('❌ vdcos API not available or empty');
        } else {
          const itemsNeeded = Math.min(20 - global.Seiko.cosQueues.length, 5);
          const uploadPromises = [...Array(itemsNeeded)].map(() =>
            upload(client.api.vdcos[Math.floor(Math.random() * client.api.vdcos.length)])
          );
          const res = await Promise.all(uploadPromises);
          console.log('✅ vdcos upload:', res);
          global.Seiko.cosQueues.push(...res);
        }
      } catch (error) {
        console.log('❌ vdcos upload error:', error.message);
      }
    }

    // ===== vdchill =====
    if (global.Seiko.chillQueues?.length < 20) {
      try {
        if (!client.api.vdchill || !Array.isArray(client.api.vdchill) || client.api.vdchill.length === 0) {
          console.log('❌ vdchill API not available or empty');
        } else {
          const itemsNeeded = Math.min(20 - global.Seiko.chillQueues.length, 5);
          const uploadPromises = [...Array(itemsNeeded)].map(() =>
            upload(client.api.vdchill[Math.floor(Math.random() * client.api.vdchill.length)])
          );
          const res = await Promise.all(uploadPromises);
          console.log('✅ vdchill upload:', res);
          global.Seiko.chillQueues.push(...res);
        }
      } catch (error) {
        console.log('❌ vdchill upload error:', error.message);
      }
    }

    // ===== vdtrai =====
    if (global.Seiko.traiQueues?.length < 20) {
      try {
        if (!client.api.vdtrai || !Array.isArray(client.api.vdtrai) || client.api.vdtrai.length === 0) {
          console.log('❌ vdtrai API not available or empty');
        } else {
          const itemsNeeded = Math.min(20 - global.Seiko.traiQueues.length, 5);
          const uploadPromises = [...Array(itemsNeeded)].map(() =>
            upload(client.api.vdtrai[Math.floor(Math.random() * client.api.vdtrai.length)])
          );
          const res = await Promise.all(uploadPromises);
          console.log('✅ vdtrai upload:', res);
          global.Seiko.traiQueues.push(...res);
        }
      } catch (error) {
        console.log('❌ vdtrai upload error:', error.message);
      }
    }

    status = false;
  });
};
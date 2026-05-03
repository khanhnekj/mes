const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');

async function downloadv1(url) {
    const form = new FormData();
    form.append('link', url);
    try {
        const response = await axios.post('https://m.vuiz.net/getlink/mp3zing/apizing.php', form, {
            headers: {
                ...form.getHeaders()
            }
        });
        const res = response.data;            
        const $ = cheerio.load(res.success);
        const audioElement = $('#amazingaudioplayer-1 ul.amazingaudioplayer-audios li').first();
        const data = {
         title: audioElement.attr('data-title'),
         artist: audioElement.attr('data-artist'),
         thumb: audioElement.attr('data-image'),
         duration: audioElement.attr('data-duration'),
         source: audioElement.find('.amazingaudioplayer-source').attr('data-src'),
         type: audioElement.find('.amazingaudioplayer-source').attr('data-type')
    };
    const medias = [];
    $('.menu div a').each((index, element) => {
        const link = $(element).attr('href');
        const quality = $(element).text().trim();
        medias.push({
              link,
              quality
             });
         });      
      return { data, medias };
    } catch (error) {
      console.error(error.message);
    }
}

module.exports = {
    downloadv1
};
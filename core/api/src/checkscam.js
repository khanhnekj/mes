const axios = require('axios');
const cheerio = require('cheerio');

async function web(domain) {
  try {
    const { data: html } = await axios.get(`https://scam.vn/check-website?domain=${domain}`);
    const $ = cheerio.load(html);
    const registrationDate = $('h6').first().text().trim();
    const trustScore = $('div.bg-warning b').text().trim();
    const trustScoreInfo = $('div.bg-warning').text().replace(/\s+/g, ' ').trim();
    const positivePoints = [];
    $('.col-md-6').each((i, el) => {
      if ($(el).find('i.fas.fa-check-circle').length) {
        const points = $(el).html().split(/<\/i>/)
          .map(text => text.replace(/<[^>]+>/g, '').trim())
          .filter(text => text);
        positivePoints.push(...points);
      }
    });
    const negativePoints = [];
    $('.col-md-6').each((i, el) => {
      if ($(el).find('i.fas.fa-times-circle').length) {
        const points = $(el).html().split(/<\/i>/)
          .map(text => text.replace(/<[^>]+>/g, '').trim())
          .filter(text => text);
        negativePoints.push(...points);
      }
    });
    const neutralPoints = [];
    $('.col-md-6').each((i, el) => {
      if ($(el).find('i.fas.fa-info-circle').length) {
        const points = $(el).html().split(/<\/i>/)
          .map(text => text.replace(/<[^>]+>/g, '').trim())
          .filter(text => text);
        neutralPoints.push(...points);
      }
    });
    const screenshots = [];
    $('#screenshot img').each((i, el) => {
      let src = $(el).attr('src');
      if (src && !src.startsWith('http')) {
        src = `https://scam.vn${src}`;
      }
      screenshots.push(src);
    });
    const domainRegistrar = $('pre a').first().text().trim();
    const metaTitle = $('#meta_title').text().trim();
    const metaDesc = $('#meta_desc').text().trim();
    const metaKeys = $('#meta_keys').text().trim();
    return {
      domain,
      registrationDate,
      trustScore,
      trustScoreInfo,
      positivePoints,
      negativePoints,
      neutralPoints,
      screenshots,
      domainRegistrar,
      metaTitle,
      metaDesc,
      metaKeys
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

module.exports = {
    web
};
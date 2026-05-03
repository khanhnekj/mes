const axios = require('axios');
const fetch = require('node-fetch');
const qs = require('qs');

async function downloadv1(url) {
  if (!url) {
    throw new Error('URL is required');
  }
  try {
    const getOriginalUrl = async (url) => {
      try {
        const response = await fetch(url);
        return response.url;
      } catch (error) {
        throw new Error('Please input a valid URL');
      }
    };
    const originalUrl = await getOriginalUrl(url);
    const trackId = originalUrl.split('track/')[1].split('?')[0];
    const headers = {
      Origin: 'https://spotifydown.com',
      Referer: 'https://spotifydown.com/',
    };
    let apiUrl = '';
    if (url.includes('spotify.link')) {
      apiUrl = `https://api.spotifydown.com/metadata/track/${trackId}`;
    } else if (url.includes('open.spotify.com')) {
      apiUrl = `https://api.spotifydown.com/download/${trackId}`;
    } else {
      throw new Error('Invalid Spotify URL');
    }
    const response = await axios.get(apiUrl, { headers });
    return response.data;
  } catch (error) {
    throw new Error(`Error: ${error.message}`);
  }
};

async function downloadv2(link) {
  async function getInfo(urls) {
    const params = {
      url: urls
    };
    try {
      const {
        data
      } = await axios.get('https://spotisongdownloader.com/api/composer/spotify/xsingle_track.php', {
        params: params,
        headers: {
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8,fr-FR;q=0.7,fr;q=0.6',
          'Cookie': 'PHPSESSID=r9bs7fivkeipu3u40k5236teaq; _ga=GA1.1.724901594.1724552167; ip=14.161.34.103; _ga_X67PVRK9F0=GS1.1.1724552167.1.1.1724552305.0.0.0',
          'Referer': 'https://spotisongdownloader.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      return data;
    } catch (error) {
      console.error('Error:', error);
    }
  }
  async function getId(song_name, artist, album_name, url) {
    const params = {
      name: song_name,
      artist: artist,
      album: album_name,
      link: url
    };
    try {
      const {
        data
      } = await axios.get(`https://members.spotisongdownloader.com/api/composer/ytsearch/mytsearch.php?${qs.stringify(params, { encode: false })}`, {
        headers: {
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8,fr-FR;q=0.7,fr;q=0.6',
          'Cookie': '_ga=GA1.1.724901594.1724552167; rank=1; dcount=1; _ga_X67PVRK9F0=GS1.1.1724552167.1.1.1724552319.0.0.0; quality=128',
          'Referer': 'https://members.spotisongdownloader.com/track.php',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      return data.videoid;
    } catch (error) {
      console.error('Error:', error);
    }
  }
  const {
    song_name,
    artist,
    album_name,
    url,
    released,
    duration
  } = await getInfo(link);
  const id = await getId(song_name, artist, album_name, url);
  const params = {
    q: id
  };
  try {
    const {
      data
    } = await axios.get(`https://members.spotisongdownloader.com/api/ytdl.php?${qs.stringify(params, { encode: false })}`, {
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8,fr-FR;q=0.7,fr;q=0.6',
        'Cookie': '_ga=GA1.1.724901594.1724552167; rank=1; dcount=1; _ga_X67PVRK9F0=GS1.1.1724552167.1.1.1724552319.0.0.0; quality=128',
        'Referer': 'https://members.spotisongdownloader.com/track.php',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    return {
      title: song_name,
      artist,
      duration,
      released,
      url: data.dlink
    };
  } catch (error) {
    console.error('Error:', error);
  }
}

module.exports = { 
   downloadv1,
   downloadv2
};
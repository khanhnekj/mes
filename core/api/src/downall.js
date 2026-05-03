const fs = require('fs'); 
const path = require('path'); 

const modules = {};
fs.readdirSync(path.join(__dirname, 'lib')).forEach(f => { 
  if (path.extname(f) === '.js') {
    const moduleName = path.basename(f, '.js'); 
    modules[moduleName] = require(path.join(__dirname, 'lib', f));
  }
});

module.exports = async function(url) {
  try { 
    if (/^(https?:\/\/)?(?:www\.)?(vt\.|vm\.)?tiktok\.com\/.+/.test(url)) { 
      return await modules.tiktok(url); 
    }
    else if (/https:\/\/(?:www\.)?reddit\.com\/r\/[a-zA-Z0-9_]+\/comments\/[a-zA-Z0-9]+\/[a-zA-Z0-9_]+/.test(url)) { 
      return await modules.reddit(url); 
    }
    else if (/^(https?:\/\/)?(?:www\.)?(youtube\.com|youtu\.be|music\.youtube\.com)\/.+/.test(url)) { 
      return await modules.youtube(url); 
    }
    else if(/https:\/\/(?:www\.)?xiaohongshu\.com\/.+/.test(url)) { 
      return await modules.xiaohongshu(url); 
    }
    else if (/(?:https?:\/\/)?(?:www\.)?(?:m\.)?(bilibili\.com\/(?:video|bangumi|cheese|anime|medialist|read|space|topic|blackboard)\/|b23\.tv\/)([a-zA-Z0-9]+)/.test(url)) { 
      return await modules.bilibili(url); 
    }
    /*else if (/https:\/\/(?:www\.)?open\.spotify\.com\/track\/([a-zA-Z0-9]+)(\?si=[a-zA-Z0-9]+)?/.test(url)) { 
      return await modules.spotify(url); 
    }*/
    else if (/^(https?:\/\/)?(?:www\.)?facebook\.com\/.+/.test(url)) { 
      return await modules.facebook(url); 
    }
    else if (/^(https?:\/\/)?(?:www\.)?threads\.net\/.+/.test(url)) { 
      return await modules.threads(url); 
    }
    else if (/^(https?:\/\/)?(?:www\.)?instagram\.com\/.+/.test(url)) { 
      return await modules.instagram(url); 
    }
    else if (/^https:\/\/(?:www\.)?(?:m\.)?capcut\.(com|net)\/.+/.test(url)) { 
      return await modules.capcut2(url); 
    }
    else if (/https?:\/\/(?:www\.)?(?:m\.)?(?:on\.)?soundcloud\.com\/.+/.test(url)) { 
      return await modules.soundcloud(url); 
    }
    else { 
      throw new Error("Unsupported platform or invalid URL"); 
    } 
  } catch (err) { 
    console.error(err); 
    throw new Error("Error processing request: " + err.message); 
  }
}
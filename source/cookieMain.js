const fs = require('fs');
const path = require('path');

class CookieLoader {
  constructor(folderPath) {
    this.folderPath = folderPath;
    this.cookies = {};
    this.loadCookies();
  }

  loadCookies() {
    fs.readdirSync(this.folderPath).forEach(file => {
      if (path.extname(file) === '.txt') {
        const fileNameWithoutExt = path.basename(file, '.txt');
        const filePath = path.join(this.folderPath, file);
        const cookieContent = fs.readFileSync(filePath, 'utf-8').trim();
        this.cookies[fileNameWithoutExt] = cookieContent;
      }
    });
  }

  getCookies() {
    return this.cookies;
  }
}

const cookieLoader = new CookieLoader(path.join(__dirname, 'cookie'));
module.exports = cookieLoader.getCookies();
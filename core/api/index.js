const fs = require("fs");
const path = require('path');

const folderPathL = path.join(process.cwd(), 'core', 'data', 'media');
const filesL = fs.readdirSync(folderPathL);
filesL.forEach(file => {
    if (path.extname(file) === '.json') {
        const fileNameWithoutExt = path.basename(file, '.json');
        const filePath = path.join(folderPathL, file);
        const data = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(data);
        module.exports[fileNameWithoutExt] = jsonData;
    }
});

fs.readdirSync(path.join(__dirname, 'src')).filter(file => file.endsWith('.js')).forEach(file => {
    const moduleName = path.basename(file, '.js');
    module.exports[moduleName] = require(path.join(__dirname, 'src', file));
});
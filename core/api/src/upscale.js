const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { v4: uuidv4 } = require('uuid');

async function v1(imageUrl) {
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/112.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/90.0.818.66 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:88.0) Gecko/20100101 Firefox/88.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:87.0) Gecko/20100101 Firefox/87.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:86.0) Gecko/20100101 Firefox/86.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:85.0) Gecko/20100101 Firefox/85.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.89 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:81.0) Gecko/20100101 Firefox/81.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:80.0) Gecko/20100101 Firefox/80.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:79.0) Gecko/20100101 Firefox/79.0',
    ];
        const tempFilePath = path.join(process.cwd(), 'srcipts', 'cmds', 'cache', `${uuidv4()}.jpg`);
        const headers = {
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Accept-Language': 'vi,en;q=0.9',
            'Content-Type': 'multipart/form-data',
            'Cookie': `_ga=GA1.1.${Math.random().toString().substr(2)}; __eoi=ID=${uuidv4()}:T=1717863522:RT=${Math.floor(Date.now() / 1000)}:S=AA-AfjYNKyeeSeFWOceLt_cXZHyy; _ga_WBHK34L0J9=GS1.1.${Math.random().toString().substr(2)}`,
            'Origin': 'https://taoanhdep.com',
            'Sec-Ch-Ua': `"Not.A/Brand";v="24", "Google Chrome";v="125", "Chromium";v="125"`,
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
            'X-Requested-With': 'XMLHttpRequest',
        };
        const downloadImage = async (url, filePath) => {
            const writer = fs.createWriteStream(filePath);
            const response = await axios({ url, method: 'GET', responseType: 'stream' });
            response.data.pipe(writer);
            return new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
        };
        const postToTaoanhdep = async (filePath) => {
            const form = new FormData();
            form.append('file', fs.createReadStream(filePath));
            const response = await axios.post('https://taoanhdep.com/public/net-anh-nguoi.php', form, { headers });
            return response.data.split(',')[1];
        };
        const uploadToImgbb = async (base64Image) => {
            const form = new FormData();
            form.append('image', base64Image);
            const response = await axios.post(`https://api.imgbb.com/1/upload?key=ce5a95195ebc1c1d27af4d32d749cf7e`, form, { headers: form.getHeaders() });
            return response.data.data.url;
        };
        try {
            await downloadImage(imageUrl, tempFilePath);
            await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 2000));
            const base64Image = await postToTaoanhdep(tempFilePath);
            const imgbbUrl = await uploadToImgbb(base64Image);
            return imgbbUrl;
        } catch (error) {
            console.error('Error in processImage function:', error);
        }
        fs.unlink(tempFilePath);
}
    
async function v2(imageURL) {
    async function upscaleImage(imageData) {
        try {
            const url = 'https://api.imggen.ai/guest-upscale-image';
            const payload = {
                image: {
                    ...imageData,
                    url: 'https://api.imggen.ai' + imageData.url
                }
            };
            const response = await axios.post(url, payload);
            return {
                original_image: 'https://api.imggen.ai' + response.data.original_image,
                upscaled_image: 'https://api.imggen.ai' + response.data.upscaled_image
            };
        } catch (error) {
            console.error('Error during upscaling:', error.response ? error.response.data : error.message);
            throw error;
        }
    }
    try {
        const imageBuffer = await axios.get(imageURL, { responseType: 'arraybuffer' });
        const formData = new FormData();
        formData.append('image', imageBuffer.data, { filename: 'image.png' });
        const uploadResponse = await axios.post('https://api.imggen.ai/guest-upload', formData, {
            headers: formData.getHeaders()
        });
        const upscaledResponse = await upscaleImage(uploadResponse.data.image);
        return upscaledResponse;
    } catch (error) {
        console.error('Error uploading or processing image:', error.response ? error.response.data : error.message);
        throw error;
    }
};

module.exports = {
    v1,
    v2
};
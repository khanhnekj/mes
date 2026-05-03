const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

module.exports = async function(url) {
    const {
        headers
    } = await axios.head(url);
    const contentType = headers['content-type'];
    const extension = contentType.split('/')[1] || 'bin';
    const filePath = path.join(process.cwd(), 'plugins', 'cmds', 'cache', `${Date.now()}.${extension}`);
    const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream'
    });
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
    const form = new FormData();
    form.append('image', fs.createReadStream(filePath));
    form.append('type', 'file');
    form.append('name', Date.now());
    const {
        data
    } = await axios({
        method: 'post',
        url: 'https://api.imgur.com/3/upload',
        headers: {
            'accept': '*/*',
            'accept-encoding': 'gzip, deflate, br, zstd',
            'accept-language': 'vi',
            'content-type': `multipart/form-data; boundary=${form._boundary}`,
            'cookie': 'postpagebeta=1; _gid=GA1.2.465892830.1726501136; ana_id=5f0bb069-2d8a-422e-b6a4-509340af587b; is_emerald=0; __gads=ID=c58f9a3f494df397:T=1726501144:RT=1726501144:S=ALNI_MZyKEPDvs0jR_o_EeyegeHvqobG4w; __gpi=UID=00000f0daebd8e77:T=1726501144:RT=1726501144:S=ALNI_MYl5yKYt-26B9Gi248lBi9otQkung; __eoi=ID=288f3b0bf438b399:T=1726501144:RT=1726501144:S=AA-AfjZau9JyK5Y7cnkvuryIHS9O; SESSIONDATA=%7B%22sessionCount%22%3A1%2C%22sessionTime%22%3A1726501151491%7D; IMGURUIDJAFO=96b0cb307fc22ece29ee576e06a81871750de691569ff83487232585607fd649; authautologin=58d25a52db6e58d27eb1c739cbdf64e5%7E9h8hosHiurTL7Nqnn5R7y5nVWj5fbosC; IMGURSESSION=673ab8b6a95e1a224d40b9a87b72fe82; just_logged_in=1; accesstoken=9767485bbbf7eb4de1fc02d7069cb634acd59d57; is_authed=1; user_id=170169977; _nc=1; mp_d7e83c929082d17b884d6c71de740244_mixpanel=%7B%22distinct_id%22%3A%20170169977%2C%22%24device_id%22%3A%20%22191fb7ce2fd110f-046cf5cd5ff7d7-26001151-135000-191fb7ce2fd110f%22%2C%22signed_in%22%3A%20true%2C%22%24initial_referrer%22%3A%20%22https%3A%2F%2Fimgur.com%2F%22%2C%22%24initial_referring_domain%22%3A%20%22imgur.com%22%2C%22__mps%22%3A%20%7B%7D%2C%22__mpso%22%3A%20%7B%7D%2C%22__mpus%22%3A%20%7B%7D%2C%22__mpa%22%3A%20%7B%7D%2C%22__mpu%22%3A%20%7B%7D%2C%22__mpr%22%3A%20%5B%5D%2C%22__mpap%22%3A%20%5B%5D%2C%22imgur_platform%22%3A%20%22desktop%20web%22%2C%22version_name%22%3A%20%2212c46d6%22%2C%22user%20agent%22%3A%20%22Mozilla%2F5.0%20(Windows%20NT%2010.0%3B%20Win64%3B%20x64)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F128.0.0.0%20Safari%2F537.36%22%2C%22assembly_uid%22%3A%20%225f0bb069-2d8a-422e-b6a4-509340af587b%22%2C%22%24user_id%22%3A%20170169977%7D; _ga_1HL8WM6LBS=GS1.1.1726501141.1.1.1726501172.0.0.0; _ga=GA1.1.2114854472.1726501136; _awl=2.1726501171.5-dc00fce079a99fa9105730a827e3f9df-6763652d617369612d6561737431-0; FCNEC=%5B%5B%22AKsRol-Rn6orMtoG_AMMVsSvBVPZWx-P8yz-uKxBstl8E-4y23O-mxiRKlWefg2B0jpG-EEZxWowIp52GHr7-L0RR0jKE84rL9jEVGCtZrM-227C4xxS3Mds8wkvlq3p2YEGNf3EXGY5l0HFNE_3Bp4-QlviAmrr0w%3D%3D%22%5D%5D; _gat=1; _ga_N9VZ79TB1D=GS1.2.1726501139.1.1.1726501232.0.0.0',
            'origin': 'https://imgur.com',
            'referer': 'https://imgur.com/',
            'sec-ch-ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
            ...form.getHeaders()
        },
        params: {
            client_id: '546c25a59c58ad7'
        },
        data: form
    });
    return data.data.link;
}
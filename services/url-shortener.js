const axios = require('axios');

// خدمات الاختصار المجانية (بدون تسجيل)
const FREE_SERVICES = [
    {
        name: 'is.gd',
        url: 'https://is.gd/create.php?format=simple&url=',
        parse: (data) => data.trim()
    },
    {
        name: 'v.gd',
        url: 'https://v.gd/create.php?format=simple&url=',
        parse: (data) => data.trim()
    },
    {
        name: 'TinyURL',
        url: 'https://tinyurl.com/api-create.php?url=',
        parse: (data) => data.trim()
    },
    {
        name: 'shrtco.de',
        url: 'https://api.shrtco.de/v2/shorten?url=',
        parse: (data) => {
            try {
                const j = JSON.parse(data);
                return j.ok ? j.result.full_short_link : null;
            } catch { return null; }
        }
    },
    {
        name: 'CleanURI',
        url: 'https://cleanuri.com/api/v1/shorten',
        method: 'post',
        parse: (data) => {
            try {
                const j = JSON.parse(data);
                return j.result_url || null;
            } catch { return null; }
        }
    }
];

// اختصار رابط
async function shortenUrl(longUrl) {
    if (!/^https?:\/\//i.test(longUrl)) {
        longUrl = 'https://' + longUrl;
    }

    for (const service of FREE_SERVICES) {
        try {
            let response;
            if (service.method === 'post') {
                response = await axios.post(service.url,
                    'url=' + encodeURIComponent(longUrl),
                    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000 }
                );
            } else {
                response = await axios.get(service.url + encodeURIComponent(longUrl), {
                    timeout: 10000
                });
            }

            const shortUrl = service.parse(response.data);
            if (shortUrl && shortUrl.startsWith('http')) {
                return { ok: true, short: shortUrl, service: service.name };
            }
        } catch (e) {
            console.log(service.name + ' failed:', e.message);
            continue;
        }
    }

    return { ok: false, msg: 'كل الخدمات فشلت، جرب تاني' };
}

module.exports = { shortenUrl };

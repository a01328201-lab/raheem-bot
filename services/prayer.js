const axios = require('axios');

const BASE_URL = 'https://api.aladhan.com/v1';

// مواقيت الصلاة بالإحداثيات
async function getPrayerTimesByCoords(latitude, longitude, method = 5) {
    try {
        const res = await axios.get(`${BASE_URL}/timings`, {
            params: {
                latitude,
                longitude,
                method
            }
        });
        return res.data.data;
    } catch (e) {
        console.error('getPrayerTimesByCoords error:', e.message);
        return null;
    }
}

// مواقيت الصلاة بالمدينة
async function getPrayerTimesByCity(city, country, method = 5) {
    try {
        const res = await axios.get(`${BASE_URL}/timingsByCity`, {
            params: { city, country, method }
        });
        return res.data.data;
    } catch (e) {
        console.error('getPrayerTimesByCity error:', e.message);
        return null;
    }
}

// اتجاه القبلة
async function getQiblaDirection(latitude, longitude) {
    try {
        const res = await axios.get(`${BASE_URL}/qibla/${latitude}/${longitude}`);
        return res.data.data;
    } catch (e) {
        console.error('getQiblaDirection error:', e.message);
        return null;
    }
}

// تحويل ميلادي لهجري
async function gregorianToHijri(day, month, year) {
    try {
        const res = await axios.get(`${BASE_URL}/gToH`, {
            params: { date: `${day}-${month}-${year}` }
        });
        return res.data.data;
    } catch (e) {
        console.error('gregorianToHijri error:', e.message);
        return null;
    }
}

// أسماء طرق الحساب المعتمدة
const CALCULATION_METHODS = {
    1: 'جامعة العلوم الإسلامية - كراتشي',
    2: 'الجمعية الإسلامية لأمريكا الشمالية (ISNA)',
    3: 'رابطة العالم الإسلامي',
    4: 'جامعة أم القرى - مكة',
    5: 'الهيئة المصرية العامة للمساحة',
    6: 'معهد الجيوفيزياء - طهران',
    7: 'جامعة طهران',
    8: 'الجمعية الإسلامية الخليجية',
    9: 'جامعة الكويت',
    10: 'وزارة الأوقاف - قطر',
    11: 'مجلس الإفتاء - سنغافورة',
    12: 'الاتحاد الإسلامي الفرنسي',
    13: 'رئاسة الشؤون الدينية - تركيا',
    14: 'روسيا'
};

module.exports = {
    getPrayerTimesByCoords,
    getPrayerTimesByCity,
    getQiblaDirection,
    gregorianToHijri,
    CALCULATION_METHODS
};

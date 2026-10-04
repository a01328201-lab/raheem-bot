const axios = require('axios');

const BASE_URL = 'https://api.alquran.cloud/v1';

// النسخة الرسمية: القرآن الكريم بالرسم العثماني (مجمع الملك فهد)
const UTHMANI_EDITION = 'quran-uthmani';

// جلب كل السور
async function getAllSurahs() {
    try {
        const res = await axios.get(`${BASE_URL}/surah`);
        return res.data.data;
    } catch (e) {
        console.error('getAllSurahs error:', e.message);
        return [];
    }
}

// جلب سورة كاملة بالنص العثماني (كامل بالتشكيل)
async function getSurahWithAudio(surahNumber) {
    try {
        const res = await axios.get(
            `${BASE_URL}/surah/${surahNumber}/${UTHMANI_EDITION}`
        );
        return res.data.data;
    } catch (e) {
        console.error('getSurahWithAudio error:', e.message);
        return null;
    }
}

// جلب التلاوة الصوتية (بصوت العفاسي)
async function getSurahAudio(surahNumber) {
    try {
        const res = await axios.get(
            `${BASE_URL}/surah/${surahNumber}/ar.alafasy`
        );
        return res.data.data;
    } catch (e) {
        console.error('getSurahAudio error:', e.message);
        return null;
    }
}

// جلب تفسير السورة (الميسر)
async function getSurahTafsir(surahNumber) {
    try {
        const res = await axios.get(
            `${BASE_URL}/surah/${surahNumber}/ar.muyassar`
        );
        return res.data.data;
    } catch (e) {
        console.error('getSurahTafsir error:', e.message);
        return null;
    }
}

// جلب آية معينة
async function getAyah(surahNumber, ayahNumber) {
    try {
        const res = await axios.get(
            `${BASE_URL}/ayah/${surahNumber}:${ayahNumber}/${UTHMANI_EDITION}`
        );
        return res.data.data;
    } catch (e) {
        console.error('getAyah error:', e.message);
        return null;
    }
}

// بحث في القرآن
async function searchQuran(keyword, language = 'ar') {
    try {
        const res = await axios.get(
            `${BASE_URL}/search/${encodeURIComponent(keyword)}/all/${language}`
        );
        return res.data.data;
    } catch (e) {
        console.error('searchQuran error:', e.message);
        return null;
    }
}

// آية عشوائية
async function getRandomAyah() {
    try {
        const res = await axios.get(`${BASE_URL}/ayah/random/${UTHMANI_EDITION}`);
        return res.data.data;
    } catch (e) {
        console.error('getRandomAyah error:', e.message);
        return null;
    }
}

module.exports = {
    getAllSurahs,
    getSurahWithAudio,
    getSurahAudio,
    getSurahTafsir,
    getAyah,
    searchQuran,
    getRandomAyah,
    UTHMANI_EDITION
};

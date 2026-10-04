const axios = require('axios');
const authentic = require('../data/authentic-azkar');

// ========== المصدر القديم (hisn almuslim) ==========
const URL = 'https://raw.githubusercontent.com/rn0x/hisn_almuslim_json/main/hisn_almuslim.json';

let azkarByCategory = null;

async function loadAllAzkar() {
    if (azkarByCategory) return azkarByCategory;
    try {
        const res = await axios.get(URL, { timeout: 15000 });
        if (res.data && typeof res.data === 'object') {
            azkarByCategory = res.data;
            return azkarByCategory;
        }
    } catch (e) {
        console.error('loadAllAzkar:', e.message);
    }
    return null;
}

function extractTexts(category) {
    if (!category) return [];
    if (category.text && Array.isArray(category.text)) return category.text;
    if (Array.isArray(category)) return category.map(i => i.text || i.content || JSON.stringify(i));
    return [];
}

async function getCategories() {
    const all = await loadAllAzkar();
    if (!all) return [];
    return Object.keys(all);
}

async function getCategoryByName(keyword) {
    const all = await loadAllAzkar();
    if (!all) return null;
    for (const [key, val] of Object.entries(all)) {
        if (key.includes(keyword)) {
            return { title: key, texts: extractTexts(val) };
        }
    }
    return null;
}

// ========== الأذكار الموثوقة (الكتاب) ==========
function getMorningEveningAzkar() { return authentic.morningEvening; }
function getPrayerAzkar() { return authentic.afterPrayer; }
function getDailyAzkar() { return authentic.daily; }
function getSleepAzkar() { return authentic.sleep; }
function getWakeupAzkar() { return authentic.wakeup; }

async function searchAzkar(keyword) {
    const all = await loadAllAzkar();
    if (!all) return [];
    const results = [];
    for (const [category, val] of Object.entries(all)) {
        const texts = extractTexts(val);
        const matches = texts.filter(t => t.includes(keyword));
        if (matches.length) results.push({ title: category, texts: matches });
    }
    return results;
}

module.exports = {
    loadAllAzkar,
    getCategories,
    getCategoryByName,
    searchAzkar,
    getMorningEveningAzkar,
    getPrayerAzkar,
    getDailyAzkar,
    getSleepAzkar,
    getWakeupAzkar
};

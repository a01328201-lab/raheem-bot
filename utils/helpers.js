// دوال مساعدة عامة

// تقسيم النص الطويل لرسائل
function splitMessage(text, maxLength = 4000) {
    const parts = [];
    while (text.length > maxLength) {
        let cut = text.lastIndexOf('\n', maxLength);
        if (cut === -1) cut = maxLength;
        parts.push(text.slice(0, cut));
        text = text.slice(cut);
    }
    if (text.length) parts.push(text);
    return parts;
}

// إرسال رسالة طويلة (مقسّمة)
async function sendLongMessage(ctx, text, options = {}) {
    const parts = splitMessage(text);
    for (const part of parts) {
        await ctx.reply(part, options);
    }
}

// تنسيق الوقت
function formatTime(date) {
    return date.toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// تحويل الأرقام للعربية
function toArabicNumbers(str) {
    const arabic = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
    return String(str).replace(/\d/g, d => arabic[d]);
}

module.exports = {
    splitMessage,
    sendLongMessage,
    formatTime,
    toArabicNumbers
};

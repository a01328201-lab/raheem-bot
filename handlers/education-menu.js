const { Markup } = require('telegraf');

function eduMainMenu() {
    return Markup.inlineKeyboard([
        [
            Markup.button.callback('📝 ملخص نص', 'edu_summarize'),
            Markup.button.callback('📖 شرح مفهوم', 'edu_explain')
        ],
        [
            Markup.button.callback('❓ توليد أسئلة', 'edu_quiz'),
            Markup.button.callback('🌍 ترجمة', 'edu_translate')
        ],
        [
            Markup.button.callback('🧮 حل مسائل', 'edu_solve'),
            Markup.button.callback('📅 خطة مذاكرة', 'edu_plan')
        ],
        [
            Markup.button.callback('✍️ كتابة مقال', 'edu_essay'),
            Markup.button.callback('💻 شرح كود', 'edu_code')
        ],
        [
            Markup.button.callback('🔙 الأقسام', 'all_sections'),
            Markup.button.callback('🏠 الرئيسية', 'back_main')
        ]
    ]);
}

module.exports = { eduMainMenu };

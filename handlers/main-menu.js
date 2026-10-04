const { Markup } = require('telegraf');
const db = require('../services/database');

const DEVELOPER = 'عبدالرحمن النورج';
const DEVELOPER_USERNAME = '@boodyalnorg1320';

function mainMenuKeyboard() {
    return Markup.inlineKeyboard([
        [
            Markup.button.callback('📚 التعليم', 'section_edu'),
            Markup.button.callback('💼 الأعمال', 'section_biz')
        ],
        [
            Markup.button.callback('🕌 إسلاميات', 'section_islamic'),
            Markup.button.callback('💻 تريمكس', 'section_termux')
        ],
        [
            Markup.button.callback('💻 البرمجة', 'section_prog'),
            Markup.button.callback('🎨 التصميم', 'section_design')
        ],
        [
            Markup.button.callback('🌍 الترجمة', 'section_trans'),
            Markup.button.callback('📱 التطبيقات', 'section_apps')
        ],
        [
            Markup.button.callback('🏥 الصحة', 'section_health'),
            Markup.button.callback('💪 الرياضة', 'section_sport')
        ],
        [
            Markup.button.callback('🔐 أمن سيبراني', 'section_sec'),
            Markup.button.callback('👶 الأطفال', 'section_kids')
        ],
        [
            Markup.button.callback('🔗 اختصار روابط', 'section_short'),
            Markup.button.callback('🎬 وسائط', 'section_media')
        ],
        [
            Markup.button.callback('💎 الاشتراك', 'section_sub'),
            Markup.button.callback('👤 حسابي', 'section_account')
        ],
        [
            Markup.button.callback('📞 الدعم', 'section_support'),
            Markup.button.callback('ℹ️ عن البوت', 'about_bot')
        ]
    ]);
}

function buildMainText(ctx) {
    const user = db.getUser(ctx.from.id);
    const plan = db.getPlan(ctx.from.id);
    const name = ctx.from.first_name || 'صديقي';

    let planText = '🆓 *مجاني*';
    if (plan.active) {
        const daysLeft = Math.ceil((plan.expires * 1000 - Date.now()) / 86400000);
        planText = '💎 *Pro* | باقي: ' + daysLeft + ' يوم';
    }

    const today = new Date().toISOString().split('T')[0];
    let remaining = 5;
    if (user.daily_reset === today) {
        remaining = Math.max(0, 5 - user.daily_count);
    }

    return '🤍 *أهلاً ' + name + '*\n\n' +
        '━━━━━━━━━━━━━━━\n' +
        '💎 خطتك: ' + planText + '\n' +
        '📊 متبقي اليوم: *' + remaining + '* استخدام\n' +
        '━━━━━━━━━━━━━━━\n\n' +
        '🌟 *اختر قسم:*\n\n' +
        '_تطوير: ' + DEVELOPER + ' 👨‍💻_';
}

function registerMainMenuHandlers(bot) {

    bot.start(async (ctx) => {
        try {
            await ctx.reply('جاري التحميل...', Markup.removeKeyboard());
        } catch (e) {}
        await ctx.replyWithMarkdown(buildMainText(ctx), mainMenuKeyboard());
    });

    bot.command('menu', async (ctx) => {
        await ctx.replyWithMarkdown(buildMainText(ctx), mainMenuKeyboard());
    });

    bot.action('back_main', async (ctx) => {
        ctx.answerCbQuery();
        try { await ctx.deleteMessage(); } catch (e) {}
        await ctx.replyWithMarkdown(buildMainText(ctx), mainMenuKeyboard());
    });

    bot.action('all_sections', async (ctx) => {
        ctx.answerCbQuery();
        try { await ctx.deleteMessage(); } catch (e) {}
        await ctx.replyWithMarkdown('🌟 *كل الأقسام:*', mainMenuKeyboard());
    });

    bot.action('section_support', async (ctx) => {
        ctx.answerCbQuery();
        try { await ctx.deleteMessage(); } catch (e) {}
        await ctx.replyWithMarkdown(
            '📞 *الدعم الفني*\n\n' +
            '━━━━━━━━━━━━━━━\n' +
            '👨‍💻 *المطور:* ' + DEVELOPER + '\n' +
            '📱 *التواصل:* ' + DEVELOPER_USERNAME + '\n' +
            '━━━━━━━━━━━━━━━\n\n' +
            'لو عندك أي مشكلة أو استفسار،\n' +
            'أو عايز تطلب ميزة جديدة،\n' +
            'كلمني في أي وقت 🤍',
            Markup.inlineKeyboard([
                [Markup.button.url('💬 تواصل مع المطور', 'https://t.me/boodyalnorg1320')],
                [Markup.button.callback('🏠 الرئيسية', 'back_main')]
            ])
        );
    });

    bot.action('section_account', async (ctx) => {
        ctx.answerCbQuery();
        try { await ctx.deleteMessage(); } catch (e) {}
        const user = db.getUser(ctx.from.id);
        const plan = db.getPlan(ctx.from.id);

        let text = '👤 *حسابك*\n\n━━━━━━━━━━━━━━━\n';
        text += '🆔 *ID:* `' + user.user_id + '`\n';
        text += '👤 *الاسم:* ' + (ctx.from.first_name || 'بدون') + '\n';
        text += '📱 *Username:* @' + (ctx.from.username || 'بدون') + '\n\n';

        if (plan.active) {
            const exp = new Date(plan.expires * 1000);
            const daysLeft = Math.ceil((plan.expires * 1000 - Date.now()) / 86400000);
            text += '💎 *الباقة:* Pro\n';
            text += '📅 *ينتهي:* ' + exp.toLocaleDateString('ar-EG') + '\n';
            text += '⏳ *باقي:* ' + daysLeft + ' يوم\n\n';
        } else {
            text += '💎 *الباقة:* 🆓 مجاني\n\n';
        }

        text += '━━━━━━━━━━━━━━━\n📊 *إحصائياتك:*\n';
        text += '• إجمالي: *' + user.total_uses + '*\n';
        text += '• اليوم: *' + user.daily_count + '*\n';

        await ctx.replyWithMarkdown(text,
            Markup.inlineKeyboard([
                [Markup.button.callback('💎 ترقية لـ Pro', 'section_sub')],
                [Markup.button.callback('🏠 الرئيسية', 'back_main')]
            ])
        );
    });

    bot.action('about_bot', async (ctx) => {
        ctx.answerCbQuery();
        try { await ctx.deleteMessage(); } catch (e) {}
        await ctx.replyWithMarkdown(
            'ℹ️ *عن البوت*\n\n' +
            '━━━━━━━━━━━━━━━\n\n' +
            '🤍 *رحيم* - بوت بيحبك ويساعدك\n\n' +
            '━━━━━━━━━━━━━━━\n\n' +
            '✨ *15 قسم متكامل:*\n' +
            '📚 التعليم | 💼 الأعمال\n' +
            '💻 البرمجة | 🎨 التصميم\n' +
            '🌍 الترجمة | 📱 التطبيقات\n' +
            '🏥 الصحة | 💪 الرياضة\n' +
            '🔐 الأمن | 👶 الأطفال\n' +
            '💻 تريمكس | 🕌 إسلاميات\n' +
            '🎬 وسائط | 🔗 اختصار روابط\n' +
            '💎 الاشتراك\n\n' +
            '━━━━━━━━━━━━━━━\n\n' +
            '👨‍💻 *المطور:* ' + DEVELOPER + '\n' +
            '📱 *التواصل:* ' + DEVELOPER_USERNAME + '\n\n' +
            '━━━━━━━━━━━━━━━\n\n' +
            '_صنع بـ ❤️ في مصر 🇪🇬_',
            Markup.inlineKeyboard([
                [Markup.button.url('💬 تواصل مع المطور', 'https://t.me/boodyalnorg1320')],
                [Markup.button.callback('🏠 الرئيسية', 'back_main')]
            ])
        );
    });
}

module.exports = { registerMainMenuHandlers, mainMenuKeyboard, buildMainText, DEVELOPER, DEVELOPER_USERNAME };

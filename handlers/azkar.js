const { Markup } = require('telegraf');
const azkar = require('../services/azkar');
const { splitMessage } = require('../utils/helpers');

function azkarMenu() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('🌅 أذكار الصباح والمساء', 'azkar_me')],
        [Markup.button.callback('🕌 أذكار بعد الصلاة', 'azkar_prayer')],
        [Markup.button.callback('🌙 أذكار النوم', 'azkar_sleep')],
        [Markup.button.callback('☀️ أذكار الاستيقاظ', 'azkar_wakeup')],
        [Markup.button.callback('📿 أذكار يومية', 'azkar_daily')],
        [Markup.button.callback('🔙 رجوع', 'islam_menu')]
    ]);
}

function registerAzkarHandlers(bot) {

    bot.action('islam_azkar', async (ctx) => {
        ctx.answerCbQuery();
        await ctx.editMessageText(
            '📿 *الأذكار*\n\nاختر القسم:',
            { parse_mode: 'Markdown', ...azkarMenu() }
        ).catch(() => {});
    });

    bot.action('azkar_me', async (ctx) => {
        ctx.answerCbQuery('⏳');
        await sendRichAzkar(ctx, azkar.getMorningEveningAzkar());
    });

    bot.action('azkar_prayer', async (ctx) => {
        ctx.answerCbQuery('⏳');
        await sendRichAzkar(ctx, azkar.getPrayerAzkar());
    });

    bot.action('azkar_sleep', async (ctx) => {
        ctx.answerCbQuery('⏳');
        await sendRichAzkar(ctx, azkar.getSleepAzkar());
    });

    bot.action('azkar_wakeup', async (ctx) => {
        ctx.answerCbQuery('⏳');
        await sendRichAzkar(ctx, azkar.getWakeupAzkar());
    });

    bot.action('azkar_daily', async (ctx) => {
        ctx.answerCbQuery('⏳');
        await sendRichAzkar(ctx, azkar.getDailyAzkar());
    });
}

async function sendRichAzkar(ctx, data) {
    if (!data || !data.items || !data.items.length) {
        return ctx.reply('❌ مفيش أذكار متاحة');
    }

    await ctx.replyWithMarkdown('📿 *' + data.title + '*\n\n_' + data.items.length + ' ذكر - من الكتاب والسنة الصحيحة_');

    for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        let msg = '*' + (i + 1) + '.* ' + item.text + '\n\n';
        msg += '🔢 *العدد:* ' + item.count + '\n';
        if (item.source) msg += '📍 ' + item.source + '\n';
        if (item.narrator) msg += '👤 *الراوي:* ' + item.narrator + '\n';
        if (item.muhaddith) msg += '📚 *المحدث:* ' + item.muhaddith + '\n';
        if (item.note) msg += '💡 ' + item.note;

        if (msg.length > 4000) {
            const parts = splitMessage(msg, 4000);
            for (const p of parts) await ctx.replyWithMarkdown(p).catch(() => ctx.reply(p));
        } else {
            await ctx.replyWithMarkdown(msg).catch(() => ctx.reply(msg));
        }
    }

    await ctx.reply('اختر:', Markup.inlineKeyboard([
        [Markup.button.callback('🔙 رجوع للأذكار', 'islam_azkar')]
    ]));
}

module.exports = { registerAzkarHandlers };

const { Markup } = require('telegraf');
const { shortenUrl } = require('../services/url-shortener');
const db = require('../services/database');

const userState = {};

function getFooter(userId) {
    const user = db.getUser(userId);
    const plan = db.getPlan(userId);
    if (plan.active) {
        const daysLeft = Math.ceil((plan.expires * 1000 - Date.now()) / 86400000);
        return '\n\n💎 *Pro* | باقي: ' + daysLeft + ' يوم';
    }
    const today = new Date().toISOString().split('T')[0];
    let remaining = 10;
    if (user.daily_reset === today) {
        remaining = Math.max(0, 10 - user.daily_count);
    }
    return '\n\n📊 *متبقي اليوم:* ' + remaining + ' استخدام';
}

function registerShortenerHandlers(bot) {

    // فتح القسم
    bot.action('section_short', async (ctx) => {
        ctx.answerCbQuery();
        try { await ctx.deleteMessage(); } catch (e) {}
        userState[ctx.from.id] = null;
        await ctx.replyWithMarkdown(
            '🔗 *اختصار الروابط*\n\n' +
            '━━━━━━━━━━━━━━━\n\n' +
            'ابعتلي أي رابط طويل، وأنا هعملك رابط قصير وسريع!\n\n' +
            '✨ *المميزات:*\n' +
            '• روابط قصيرة وسهلة\n' +
            '• تعمل على كل المنصات\n' +
            '• سرعة عالية\n' +
            '• مجاني تماماً\n\n' +
            '📎 *ابعت الرابط:*' + getFooter(ctx.from.id),
            Markup.inlineKeyboard([
                [Markup.button.callback('🏠 الرئيسية', 'back_main')]
            ])
        );

        userState[ctx.from.id] = { action: 'shorten' };
    });

    // معالج الرسائل
    bot.on('text', async (ctx, next) => {
        const userId = ctx.from.id;
        const state = userState[userId];
        const text = ctx.message.text;

        if (text.startsWith('/')) return next();
        if (!state || state.action !== 'shorten') return next();

        // تأكد إنه رابط
        if (!/https?:\/\//i.test(text) && !/^[\w.-]+\.[a-z]{2,}/i.test(text)) {
            return ctx.reply('❌ ابعتلي رابط صحيح');
        }

        // فحص الحد
        const check = db.checkAndIncrement(userId, 'short');
        if (!check.allowed) {
            userState[userId] = null;
            return ctx.replyWithMarkdown(
                '⚠️ *وصلت الحد اليومي*\n\n' +
                'قسم الاختصار: *10 استخدامات يومياً*\n\n' +
                '💎 رقّي لـ Pro واستخدم بدون حدود!',
                Markup.inlineKeyboard([
                    [Markup.button.callback('💎 اشترك الآن', 'section_sub')],
                    [Markup.button.callback('🏠 الرئيسية', 'back_main')]
                ])
            );
        }

        userState[userId] = null;
        const processing = await ctx.reply('🔗 جاري الاختصار...');

        try {
            const result = await shortenUrl(text);

            await ctx.telegram.deleteMessage(ctx.chat.id, processing.message_id).catch(() => {});

            if (result.ok) {
                await ctx.replyWithMarkdown(
                    '✅ *تم الاختصار بنجاح!*\n\n' +
                    '━━━━━━━━━━━━━━━\n' +
                    '🔗 *الرابط الأصلي:*\n' +
                    '`' + text.substring(0, 100) + (text.length > 100 ? '...' : '') + '`\n\n' +
                    '✨ *الرابط المختصر:*\n' +
                    '`' + result.short + '`\n\n' +
                    '━━━━━━━━━━━━━━━\n' +
                    '🌐 *الخدمة:* ' + result.service + '\n\n' +
                    '_اضغط على الرابط لنسخه_ 📋',
                    Markup.inlineKeyboard([
                        [Markup.button.url('🔗 افتح الرابط', result.short)],
                        [Markup.button.callback('🔄 اختصار تاني', 'section_short')],
                        [Markup.button.callback('🏠 الرئيسية', 'back_main')]
                    ])
                );
            } else {
                await ctx.replyWithMarkdown(
                    '❌ *فشل الاختصار*\n\n' + result.msg,
                    Markup.inlineKeyboard([
                        [Markup.button.callback('🔄 جرب تاني', 'section_short')],
                        [Markup.button.callback('🏠 الرئيسية', 'back_main')]
                    ])
                );
            }
        } catch (e) {
            console.error('Shortener error:', e.message);
            await ctx.telegram.editMessageText(
                ctx.chat.id, processing.message_id, null,
                '❌ حصل خطأ، جرب تاني'
            ).catch(() => ctx.reply('❌ حصل خطأ'));
        }
    });

    // أمر /short
    bot.command('short', async (ctx) => {
        const text = ctx.message.text.replace('/short', '').trim();
        if (!text) {
            return ctx.replyWithMarkdown(
                '📝 *الاستخدام:*\n`/short https://example.com`',
                Markup.inlineKeyboard([
                    [Markup.button.callback('🔗 قسم الاختصار', 'section_short')]
                ])
            );
        }
        const result = await shortenUrl(text);
        if (result.ok) {
            await ctx.replyWithMarkdown(
                '✨ *الرابط المختصر:*\n`' + result.short + '`\n\n' +
                '🌐 ' + result.service
            );
        } else {
            await ctx.reply('❌ ' + result.msg);
        }
    });
}

module.exports = { registerShortenerHandlers };

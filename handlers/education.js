const { Markup } = require('telegraf');
const ai = require('../services/ai');
const db = require('../services/database');
const { splitMessage } = require('../utils/helpers');
const { eduMainMenu } = require('./education-menu');

const userState = {};

function getFooter(userId) {
    const user = db.getUser(userId);
    const plan = db.getPlan(userId);
    if (plan.active) {
        const daysLeft = Math.ceil((plan.expires * 1000 - Date.now()) / 86400000);
        return '\n\n💎 *Pro* | باقي: ' + daysLeft + ' يوم';
    }
    const today = new Date().toISOString().split('T')[0];
    let remaining = 5;
    if (user.daily_reset === today) {
        remaining = Math.max(0, 5 - user.daily_count);
    }
    return '\n\n📊 *متبقي اليوم:* ' + remaining + ' استخدام';
}

function registerEducationHandlers(bot) {

    // فتح القسم من الزر الرئيسي
    bot.action('section_edu', async (ctx) => {
        ctx.answerCbQuery();
        try { await ctx.deleteMessage(); } catch (e) {}
        await ctx.replyWithMarkdown(
            '📚 *قسم التعليم*\n\n' +
            '━━━━━━━━━━━━━━━\n' +
            'اختر الخدمة اللي محتاجها:' + getFooter(ctx.from.id),
            eduMainMenu()
        );
    });

    // رجوع للقسم
    bot.action('edu_menu', async (ctx) => {
        ctx.answerCbQuery();
        try { await ctx.deleteMessage(); } catch (e) {}
        await ctx.replyWithMarkdown(
            '📚 *قسم التعليم*\n\nاختر:' + getFooter(ctx.from.id),
            eduMainMenu()
        );
    });

    const buttons = {
        edu_summarize: { action: 'summarize', msg: '📝 *ملخص نص/مقال*\n\nابعتلي النص اللي عايز ألخصه.' },
        edu_explain: { action: 'explain', msg: '📖 *شرح مفهوم*\n\nاكتب اسم المفهوم أو الموضوع.' },
        edu_quiz: { action: 'quiz', msg: '❓ *توليد أسئلة*\n\nاكتب الموضوع اللي عايز أسئلة عنه.' },
        edu_translate: { action: 'translate', msg: '🌍 *ترجمة*\n\nابعتلي النص.\n\n_مثال:_ `إلى الإنجليزية: مرحبا`' },
        edu_solve: { action: 'solve', msg: '🧮 *حل مسائل*\n\nابعتلي المسألة.\n\n_مثال:_ `2x + 5 = 15`' },
        edu_plan: { action: 'plan', msg: '📅 *خطة مذاكرة*\n\nقوللي:\n- المواد\n- المدة\n- ساعات يومياً' },
        edu_essay: { action: 'essay', msg: '✍️ *كتابة مقال*\n\nاكتبلي:\n- الموضوع\n- عدد الكلمات' },
        edu_code: { action: 'code', msg: '💻 *شرح كود*\n\nالصق الكود اللي عايزني أشرحه.' }
    };

    Object.entries(buttons).forEach(([btnAction, config]) => {
        bot.action(btnAction, async (ctx) => {
            ctx.answerCbQuery();
            userState[ctx.from.id] = { action: config.action };
            try { await ctx.deleteMessage(); } catch (e) {}
            await ctx.replyWithMarkdown(
                config.msg + getFooter(ctx.from.id),
                Markup.inlineKeyboard([
                    [Markup.button.callback('🔙 رجوع للتعليم', 'edu_menu')]
                ])
            );
        });
    });

    bot.on('text', async (ctx, next) => {
        const userId = ctx.from.id;
        const state = userState[userId];
        const text = ctx.message.text;

        if (text.startsWith('/')) return next();
        if (!state || !state.action) return next();

        const check = db.checkAndIncrement(userId, 'edu');
        if (!check.allowed) {
            userState[userId] = null;
            return ctx.replyWithMarkdown(
                '⚠️ *وصلت الحد اليومي*\n\n' +
                'قسم التعليم: *5 استخدامات يومياً*\n\n' +
                '💎 رقّي لـ Pro واستخدم بدون حدود!\n\n' +
                '💰 تبدأ من *20 ج.م/أسبوع*',
                Markup.inlineKeyboard([
                    [Markup.button.callback('💎 اشترك الآن', 'section_sub')],
                    [Markup.button.callback('🏠 الرئيسية', 'back_main')]
                ])
            );
        }

        userState[userId] = null;
        const processing = await ctx.reply('⏳ جاري المعالجة...');

        try {
            let result = '';
            let title = '';

            if (state.action === 'summarize') {
                title = '📝 ملخص النص';
                result = await ai.summarizeText(text, 'medium');
            } else if (state.action === 'explain') {
                title = '📖 شرح: ' + text.slice(0, 50);
                result = await ai.explainConcept(text);
            } else if (state.action === 'quiz') {
                title = '❓ أسئلة عن: ' + text.slice(0, 50);
                result = await ai.generateQuiz(text, 10, 'mixed');
            } else if (state.action === 'translate') {
                let toLang = 'العربية';
                let content = text;
                const match = text.match(/^(?:إلى|to)\s+([^:：]+)[:：]\s*([\s\S]+)$/i);
                if (match) { toLang = match[1].trim(); content = match[2].trim(); }
                title = '🌍 ترجمة إلى ' + toLang;
                result = await ai.translate(content, toLang);
            } else if (state.action === 'solve') {
                title = '🧮 حل المسألة';
                result = await ai.solveProblem(text, 'عام');
            } else if (state.action === 'plan') {
                title = '📅 خطة مذاكرة';
                result = await ai.eduAI('اعملي خطة مذاكرة عملية:\n\n' + text);
            } else if (state.action === 'essay') {
                title = '✍️ المقال';
                result = await ai.eduAI('اكتبلي مقال عالي الجودة:\n\n' + text);
            } else if (state.action === 'code') {
                title = '💻 شرح الكود';
                result = await ai.eduAI('اشرحلي الكود ده:\n\n' + text);
            }

            await ctx.telegram.deleteMessage(ctx.chat.id, processing.message_id).catch(() => {});

            const fullMsg = '*' + title + '*\n\n' + result;
            const parts = splitMessage(fullMsg, 4000);
            for (const part of parts) {
                await ctx.replyWithMarkdown(part).catch(() => ctx.reply(part));
            }

            await ctx.replyWithMarkdown('اختر:' + getFooter(userId),
                Markup.inlineKeyboard([
                    [Markup.button.callback('🔄 استخدام تاني', 'edu_menu')],
                    [Markup.button.callback('🏠 الرئيسية', 'back_main')]
                ])
            );
        } catch (e) {
            console.error('Education error:', e.message);
            await ctx.telegram.editMessageText(
                ctx.chat.id, processing.message_id, null,
                '❌ حصل خطأ، جرب تاني'
            ).catch(() => ctx.reply('❌ حصل خطأ'));
        }
    });
}

module.exports = { registerEducationHandlers };

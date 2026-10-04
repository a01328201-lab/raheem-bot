const { Markup } = require('telegraf');
const ai = require('../services/ai');
const { splitMessage } = require('../utils/helpers');

const userState = {};

function bizMenu() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('📄 بناء CV', 'biz_cv')],
        [Markup.button.callback('✉️ كتابة إيميل', 'biz_email')],
        [Markup.button.callback('📊 تحويل تقرير لعرض', 'biz_presentation')],
        [Markup.button.callback('💰 حاسبة الراتب', 'biz_salary')],
        [Markup.button.callback('📝 كتابة عرض/عقد', 'biz_contract')],
        [Markup.button.callback('💡 أفكار مشاريع', 'biz_ideas')],
        [Markup.button.callback('📈 خطة عمل', 'biz_plan')],
        [Markup.button.callback('🔙 الأقسام', 'all_sections'), Markup.button.callback('🏠 الرئيسية', 'back_main')]
    ]);
}

function registerBusinessHandlers(bot) {

    bot.hears(['💼 الأعمال', '💼 Business'], async (ctx) => {
        userState[ctx.from.id] = null;
        await ctx.replyWithMarkdown(
            '💼 *قسم الأعمال*\n\nاختر الخدمة:',
            bizMenu()
        );
    });

    bot.action('biz_menu', async (ctx) => {
        ctx.answerCbQuery();
        userState[ctx.from.id] = null;
        await ctx.editMessageText(
            '💼 *قسم الأعمال*\n\nاختر الخدمة:',
            { parse_mode: 'Markdown', ...bizMenu() }
        ).catch(() => {});
    });

    const buttons = {
        biz_cv: { action: 'cv', msg: '📄 *بناء CV*\n\nابعتلي بياناتك:\n\n• الاسم\n• المؤهل\n• الخبرات (الشغل السابق)\n• المهارات\n• اللغات\n• الشهادات\n\n_اكتب كل حاجة في رسالة واحدة._' },
        biz_email: { action: 'email', msg: '✉️ *كتابة إيميل*\n\nقوللي:\n\n• المرسل له (مدير، عميل، شركة)\n• الموضوع\n• المطلوب\n• النبرة (رسمي/ودي)' },
        biz_presentation: { action: 'presentation', msg: '📊 *تحويل تقرير لعرض تقديمي*\n\nالصق نص التقرير وأنا هعملك هيكل عرض تقديمي كامل (سلايدات + نقاط).' },
        biz_salary: { action: 'salary', msg: '💰 *حاسبة الراتب*\n\nقوللي:\n\n• الراتب الأساسي\n• البلد (مصر/السعودية/الإمارات)\n• لو فيه خصومات أو بدلات\n\nهحسبلك صافي الراتب + الضرائب.' },
        biz_contract: { action: 'contract', msg: '📝 *كتابة عرض/عقد*\n\nقوللي:\n\n• نوع المستند (عرض سعر، عقد عمل، اتفاقية)\n• الأطراف\n• التفاصيل الأساسية\n• الشروط' },
        biz_ideas: { action: 'ideas', msg: '💡 *أفكار مشاريع*\n\nقوللي:\n\n• رأس المال المتاح\n• المجال (مطعم، تجارة إلكترونية، خدمات)\n• البلد\n• المهارات اللي عندك' },
        biz_plan: { action: 'plan', msg: '📈 *خطة عمل*\n\nقوللي:\n\n• اسم المشروع\n• الفكرة\n• السوق المستهدف\n• الميزانية' }
    };

    Object.entries(buttons).forEach(([btnAction, config]) => {
        bot.action(btnAction, async (ctx) => {
            ctx.answerCbQuery();
            userState[ctx.from.id] = { action: config.action };
            await ctx.replyWithMarkdown(
                config.msg,
                Markup.inlineKeyboard([[Markup.button.callback('🔙 رجوع', 'biz_menu')]])
            );
        });
    });

    bot.on('text', async (ctx, next) => {
        const userId = ctx.from.id;
        const state = userState[userId];
        const text = ctx.message.text;

        if (text.startsWith('/')) return next();
        if (!state || !state.action) return next();

        userState[userId] = null;
        const processing = await ctx.reply('⏳ جاري المعالجة...');

        try {
            let result = '';
            let title = '';

            if (state.action === 'cv') {
                title = '📄 السيرة الذاتية';
                const system = 'أنت خبير في كتابة السير الذاتية. اكتب CV احترافي بتنسيق منظم مع عناوين واضحة (البيانات الشخصية، الهدف الوظيفي، التعليم، الخبرات، المهارات، اللغات). استخدم Markdown.';
                result = await ai.askAI('اكتبلي CV احترافي بناءً على:\n\n' + text, system);
            } else if (state.action === 'email') {
                title = '✉️ الإيميل';
                const system = 'أنت خبير في كتابة الإيميلات الرسمية والمهنية. اكتب إيميل احترافي بأسلوب مناسب.';
                result = await ai.askAI('اكتبلي إيميل:\n\n' + text, system);
            } else if (state.action === 'presentation') {
                title = '📊 هيكل العرض التقديمي';
                const system = 'أنت خبير في إعداد العروض التقديمية. حول النص لعرض تقديمي منظم. اعرض كل سلايد بشكل واضح مع عنوان ومحتوى مختصر.';
                result = await ai.askAI('حول التقرير ده لعرض تقديمي:\n\n' + text, system);
            } else if (state.action === 'salary') {
                title = '💰 حساب الراتب';
                const system = 'أنت خبير في حسابات الرواتب والضرائب في الدول العربية. احسب صافي الراتب بدقة مع توضيح الخصومات والبدلات. اعرض الحساب بشكل منظم.';
                result = await ai.askAI('احسبلي الراتب:\n\n' + text, system);
            } else if (state.action === 'contract') {
                title = '📝 المستند';
                const system = 'أنت خبير في صياغة العقود والمستندات الرسمية. اكتب المستند بشكل قانوني منظم مع بنود واضحة.';
                result = await ai.askAI('اكتبلي مستند:\n\n' + text, system);
            } else if (state.action === 'ideas') {
                title = '💡 أفكار المشاريع';
                const system = 'أنت خبير في ريادة الأعمال. اقترح أفكار مشاريع عملية ومربحة مناسبة للسوق العربي. اذكر لكل فكرة: الفكرة، رأس المال، الربح المتوقع، التحديات.';
                result = await ai.askAI('اقترحلي أفكار مشاريع:\n\n' + text, system);
            } else if (state.action === 'plan') {
                title = '📈 خطة العمل';
                const system = 'أنت خبير في كتابة خطط الأعمال. اعمل خطة عمل شاملة تشمل: الملخص التنفيذي، السوق، المنافسين، التسويق، الميزانية، التوقعات المالية.';
                result = await ai.askAI('اعملي خطة عمل:\n\n' + text, system);
            }

            await ctx.telegram.deleteMessage(ctx.chat.id, processing.message_id).catch(() => {});

            const fullMsg = '*' + title + '*\n\n' + result;
            const parts = splitMessage(fullMsg, 4000);
            for (const part of parts) {
                await ctx.replyWithMarkdown(part).catch(() => ctx.reply(part));
            }

            await ctx.reply('اختر:',
                Markup.inlineKeyboard([
                    [Markup.button.callback('🔙 رجوع للأعمال', 'biz_menu')],
                    [Markup.button.callback('🏠 القائمة الرئيسية', 'back_main')]
                ])
            );
        } catch (e) {
            console.error('Business error:', e.message);
            await ctx.telegram.editMessageText(
                ctx.chat.id, processing.message_id, null,
                '❌ حصل خطأ، جرب تاني'
            ).catch(() => ctx.reply('❌ حصل خطأ'));
        }
    });
}

module.exports = { registerBusinessHandlers };

const { Markup } = require('telegraf');
const db = require('../services/database');

const ADMIN_ID = parseInt(process.env.ADMIN_ID);
const SUPPORT_USERNAME = '@boodyalnorg1320';  // هنعدلها
const VODAFONE_NUMBER = '01092312266';

const PLANS = {
    weekly: { name: '🥉 أسبوعي', egp: 20, usd: 1, days: 7 },
    monthly: { name: '🥈 شهري', egp: 60, usd: 3, days: 30 },
    quarterly: { name: '🥇 3 شهور', egp: 150, usd: 7, days: 90 },
    yearly: { name: '👑 سنة', egp: 500, usd: 20, days: 365 },
    lifetime: { name: '💎 مدى الحياة', egp: 1000, usd: 35, days: 36500 }
};

function subMenu(userId) {
    const plan = db.getPlan(userId);
    let statusText = '';

    if (plan.active) {
        const expDate = new Date(plan.expires * 1000).toLocaleDateString('ar-EG');
        statusText = '✅ *اشتراكك نشط* - ينتهي: ' + expDate;
    } else {
        statusText = '❌ *غير مشترك حالياً*';
    }

    return {
        statusText,
        buttons: Markup.inlineKeyboard([
            [Markup.button.callback('💎 عرض الباقات', 'sub_plans')],
            [Markup.button.callback('🎟️ استخدام كود', 'sub_code')],
            [Markup.button.callback('👤 حسابي', 'sub_account')],
            [Markup.button.callback('💳 طرق الدفع', 'sub_methods')],
            [Markup.button.callback('🔙 الأقسام', 'all_sections'), Markup.button.callback('🏠 الرئيسية', 'back_main')]
        ])
    };
}

function plansMenu() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('🥉 أسبوعي - 20 ج.م', 'buy_weekly')],
        [Markup.button.callback('🥈 شهري - 60 ج.م ⭐', 'buy_monthly')],
        [Markup.button.callback('🥇 3 شهور - 150 ج.م', 'buy_quarterly')],
        [Markup.button.callback('👑 سنة - 500 ج.م', 'buy_yearly')],
        [Markup.button.callback('💎 مدى الحياة - 1000 ج.م', 'buy_lifetime')],
        [Markup.button.callback('🔙 رجوع', 'sub_menu')]
    ]);
}

function registerSubscriptionHandlers(bot) {

    bot.action('section_sub', async (ctx) => {
        ctx.answerCbQuery();
        try { await ctx.deleteMessage(); } catch (e) {}
        const data = subMenu(ctx.from.id);
        await ctx.replyWithMarkdown(
            '💎 *باقات الاشتراك*\n\n' +
            data.statusText + '\n\n' +
            '💡 *مميزات Pro:*\n' +
            '✅ استخدام غير محدود\n' +
            '✅ أولوية قصوى\n' +
            '✅ ردود أسرع\n' +
            '✅ تحميلات بجودة أعلى\n' +
            '✅ دعم شخصي\n\n' +
            'اختر:',
            data.buttons
        );
    });

    bot.action('sub_menu', async (ctx) => {
        ctx.answerCbQuery();
        const data = subMenu(ctx.from.id);
        await ctx.editMessageText(
            '💎 *باقات الاشتراك*\n\n' + data.statusText + '\n\nاختر:',
            { parse_mode: 'Markdown', ...data.buttons }
        ).catch(() => {});
    });

    bot.action('sub_plans', async (ctx) => {
        ctx.answerCbQuery();
        let text = '💎 *باقات رحيم*\n\n';
        Object.entries(PLANS).forEach(([key, p]) => {
            text += p.name + ': *' + p.egp + ' ج.م* / $' + p.usd + '\n';
            text += '_' + p.days + ' يوم_\n\n';
        });
        text += '━━━━━━━━━━━━━━━\n';
        text += '💡 *كل الباقات فيها:*\n';
        text += '✅ استخدام غير محدود\n';
        text += '✅ تحميلات بلا حدود\n';
        text += '✅ دعم فني\n';

        await ctx.editMessageText(text, {
            parse_mode: 'Markdown',
            ...plansMenu()
        }).catch(() => {});
    });

    bot.action(/^buy_(\w+)$/, async (ctx) => {
        const planKey = ctx.match[1];
        const plan = PLANS[planKey];
        if (!plan) return ctx.answerCbQuery('خطأ');

        ctx.answerCbQuery();
        await ctx.editMessageText(
            '💳 *الدفع - ' + plan.name + '*\n\n' +
            '💰 المبلغ: *' + plan.egp + ' ج.م*\n' +
            '⏱️ المدة: ' + plan.days + ' يوم\n\n' +
            '━━━━━━━━━━━━━━━\n' +
            '📱 *فودافون كاش:*\n' +
            '`' + VODAFONE_NUMBER + '`\n\n' +
            '💳 *PayPal* (للعالم):\n' +
            'تواصل مع الدعم\n\n' +
            '━━━━━━━━━━━━━━━\n' +
            '📸 *بعد التحويل، ابعت صورة الإيصال هنا.*\n\n' +
            '✍️ _وتأكد تكتب الباقة المطلوبة._',
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('📤 بعت الإيصال', 'send_receipt_' + planKey)],
                    [Markup.button.callback('🔙 رجوع', 'sub_plans')]
                ])
            }
        ).catch(() => {});
    });

    bot.action(/^send_receipt_(\w+)$/, async (ctx) => {
        ctx.answerCbQuery();
        const planKey = ctx.match[1];
        const plan = PLANS[planKey];

        global.pendingReceipts = global.pendingReceipts || {};
        global.pendingReceipts[ctx.from.id] = { plan: planKey, amount: plan.egp };

        await ctx.replyWithMarkdown(
            '📸 *ارفع صورة الإيصال الآن*\n\n' +
            'الباقة: ' + plan.name + '\n' +
            'المبلغ: ' + plan.egp + ' ج.م\n\n' +
            '_هنراجع الإيصال ونفعّل حسابك في أسرع وقت._',
            Markup.inlineKeyboard([
                [Markup.button.callback('❌ إلغاء', 'sub_menu')]
            ])
        );
    });

    bot.on('photo', async (ctx) => {
        global.pendingReceipts = global.pendingReceipts || {};
        const pending = global.pendingReceipts[ctx.from.id];
        if (!pending) return;

        const plan = PLANS[pending.plan];
        const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;

        const paymentId = db.addPayment(
            ctx.from.id,
            pending.plan,
            pending.amount,
            'vodafone',
            fileId
        );

        delete global.pendingReceipts[ctx.from.id];

        await ctx.replyWithMarkdown(
            '✅ *تم استلام الإيصال!*\n\n' +
            '📄 *رقم الطلب:* #' + paymentId + '\n' +
            '💎 *الباقة:* ' + plan.name + '\n' +
            '💰 *المبلغ:* ' + pending.amount + ' ج.م\n\n' +
            '⏳ *هنراجع الإيصال ونفعّل حسابك خلال ساعة.*\n\n' +
            '_شكراً لثقتك! 🤍_'
        );

        try {
            await ctx.telegram.sendPhoto(ADMIN_ID, fileId, {
                caption:
                    '🔔 *طلب اشتراك جديد*\n\n' +
                    '👤 *الاسم:* ' + (ctx.from.first_name || 'بدون') + '\n' +
                    '🆔 *User ID:* `' + ctx.from.id + '`\n' +
                    '📱 *Username:* @' + (ctx.from.username || 'بدون') + '\n\n' +
                    '💎 *الباقة:* ' + plan.name + '\n' +
                    '💰 *المبلغ:* ' + pending.amount + ' ج.م\n' +
                    '📄 *الطلب:* #' + paymentId,
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('✅ موافقة', 'appr_' + paymentId)],
                    [Markup.button.callback('❌ رفض', 'rej_' + paymentId)]
                ])
            });
        } catch (e) {
            console.error('Admin notify error:', e.message);
        }
    });

    bot.action(/^appr_(\d+)$/, async (ctx) => {
        if (ctx.from.id !== ADMIN_ID) return ctx.answerCbQuery('❌');
        const paymentId = parseInt(ctx.match[1]);
        const p = db.approvePayment(paymentId);

        if (!p) return ctx.answerCbQuery('❌ مفيش');

        ctx.answerCbQuery('✅ تم التفعيل');
        await ctx.editMessageCaption(
            '✅ *تم التفعيل*\n\n' +
            '👤 User: `' + p.user_id + '`\n' +
            '💎 ' + p.plan + '\n' +
            '💰 ' + p.amount + ' ج.م',
            { parse_mode: 'Markdown' }
        );

        try {
            await ctx.telegram.sendMessage(p.user_id,
                '🎉 *تم تفعيل اشتراكك!*\n\n' +
                '💎 *الباقة:* ' + p.plan + '\n' +
                '✅ تقدر تستخدم كل الميزات بدون حدود.\n\n' +
                '_شكراً لثقتك! 🤍_',
                { parse_mode: 'Markdown' }
            );
        } catch (e) {}
    });

    bot.action(/^rej_(\d+)$/, async (ctx) => {
        if (ctx.from.id !== ADMIN_ID) return ctx.answerCbQuery('❌');
        const paymentId = parseInt(ctx.match[1]);
        const p = db.db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);
        db.rejectPayment(paymentId);

        ctx.answerCbQuery('تم الرفض');
        await ctx.editMessageCaption('❌ *مرفوض*\n\nUser: ' + p.user_id);

        try {
            await ctx.telegram.sendMessage(p.user_id,
                '❌ *تم رفض الإيصال*\n\n' +
                'لو الإيصال صحيح، تواصل مع الدعم: ' + SUPPORT_USERNAME,
                { parse_mode: 'Markdown' }
            );
        } catch (e) {}
    });

    bot.action('sub_code', async (ctx) => {
        ctx.answerCbQuery();
        global.awaitingCode = global.awaitingCode || {};
        global.awaitingCode[ctx.from.id] = true;
        await ctx.replyWithMarkdown(
            '🎟️ *استخدام كود تفعيل*\n\n' +
            'ابعتلي الكود بتاعك:',
            Markup.inlineKeyboard([[Markup.button.callback('❌ إلغاء', 'sub_menu')]])
        );
    });

    bot.on('text', async (ctx, next) => {
        global.awaitingCode = global.awaitingCode || {};
        if (!global.awaitingCode[ctx.from.id]) return next();

        const text = ctx.message.text.trim().toUpperCase();
        if (!text.startsWith('RH-')) return next();

        delete global.awaitingCode[ctx.from.id];
        const result = db.redeemCode(ctx.from.id, text);

        if (result.ok) {
            await ctx.replyWithMarkdown(
                '✅ *تم تفعيل الكود بنجاح!*\n\n' +
                '💎 *الباقة:* ' + result.plan + '\n' +
                '⏱️ *المدة:* ' + result.days + ' يوم\n\n' +
                'استمتع بالمميزات! 🎉'
            );
        } else {
            await ctx.replyWithMarkdown('❌ ' + result.msg);
        }
    });

    bot.action('sub_account', async (ctx) => {
        ctx.answerCbQuery();
        const user = db.getUser(ctx.from.id);
        const plan = db.getPlan(ctx.from.id);

        let text = '👤 *حسابك*\n\n';
        text += '🆔 ID: `' + user.user_id + '`\n';
        text += '👤 الاسم: ' + (user.first_name || 'بدون') + '\n\n';

        if (plan.active) {
            const exp = new Date(plan.expires * 1000);
            const daysLeft = Math.ceil((plan.expires * 1000 - Date.now()) / 86400000);
            text += '💎 *الباقة:* Pro\n';
            text += '📅 *ينتهي:* ' + exp.toLocaleDateString('ar-EG') + '\n';
            text += '⏳ *باقي:* ' + daysLeft + ' يوم\n\n';
        } else {
            text += '💎 *الباقة:* 🆓 مجاني\n\n';
        }

        text += '📊 *إحصائيات:*\n';
        text += '• إجمالي الاستخدامات: ' + user.total_uses + '\n';
        text += '• استخدامات اليوم: ' + user.daily_count + '\n';

        await ctx.editMessageText(text, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([[Markup.button.callback('🔙 رجوع', 'sub_menu')]])
        }).catch(() => {});
    });

    bot.action('sub_methods', async (ctx) => {
        ctx.answerCbQuery();
        await ctx.editMessageText(
            '💳 *طرق الدفع المتاحة*\n\n' +
            '📱 *فودافون كاش:*\n' +
            '`' + VODAFONE_NUMBER + '`\n\n' +
            '💳 *PayPal* (للعالم):\n' +
            'تواصل مع الدعم\n\n' +
            '━━━━━━━━━━━━━━━\n' +
            '📞 *الدعم:* ' + SUPPORT_USERNAME,
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([[Markup.button.callback('🔙 رجوع', 'sub_menu')]])
            }
        ).catch(() => {});
    });
}

module.exports = { registerSubscriptionHandlers, PLANS };

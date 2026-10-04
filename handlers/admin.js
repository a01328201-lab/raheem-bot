const { Markup } = require('telegraf');
const db = require('../services/database');

const ADMIN_ID = parseInt(process.env.ADMIN_ID);

function isAdmin(ctx) {
    return ctx.from.id === ADMIN_ID;
}

function registerAdminHandlers(bot) {

    bot.command('stats', async (ctx) => {
        if (!isAdmin(ctx)) return;
        const s = db.getStats();
        await ctx.replyWithMarkdown(
            '📊 *إحصائيات البوت*\n\n' +
            '👥 *إجمالي المستخدمين:* ' + s.total + '\n' +
            '💎 *المشتركين Pro:* ' + s.pro + '\n' +
            '🔥 *نشطين اليوم:* ' + s.active + '\n\n' +
            '📅 ' + new Date().toLocaleString('ar-EG')
        );
    });

    bot.command('gencode', async (ctx) => {
        if (!isAdmin(ctx)) return;
        const args = ctx.message.text.split(' ').slice(1);
        if (args.length < 2) {
            return ctx.replyWithMarkdown(
                '📝 *الاستخدام:*\n' +
                '`/gencode pro 30`\n\n' +
                '_أو:_\n' +
                '`/gencode pro 365`'
            );
        }
        const plan = args[0];
        const days = parseInt(args[1]);
        const code = db.createCode(plan, days);
        await ctx.replyWithMarkdown(
            '✅ *تم إنشاء كود جديد*\n\n' +
            '🎟️ الكود: `' + code + '`\n' +
            '💎 الباقة: ' + plan + '\n' +
            '⏱️ المدة: ' + days + ' يوم'
        );
    });

    bot.command('addpro', async (ctx) => {
        if (!isAdmin(ctx)) return;
        const args = ctx.message.text.split(' ').slice(1);
        if (args.length < 2) {
            return ctx.reply('الاستخدام: /addpro 12345 30');
        }
        const userId = parseInt(args[0]);
        const days = parseInt(args[1]);
        db.setPlan(userId, 'pro', days);
        await ctx.replyWithMarkdown(
            '✅ تم تفعيل المستخدم `' + userId + '` لمدة ' + days + ' يوم',
            { parse_mode: 'Markdown' }
        );
    });

    bot.command('user', async (ctx) => {
        if (!isAdmin(ctx)) return;
        const args = ctx.message.text.split(' ').slice(1);
        if (!args[0]) return ctx.reply('الاستخدام: /user 12345');
        const userId = parseInt(args[0]);
        const user = db.getUser(userId);
        const plan = db.getPlan(userId);

        let text = '👤 *معلومات المستخدم*\n\n';
        text += '🆔 `' + user.user_id + '`\n';
        text += '👤 ' + (user.first_name || 'بدون') + '\n';
        text += '📱 @' + (user.username || 'بدون') + '\n';
        text += '💎 ' + user.plan + '\n';
        text += '📊 استخدامات: ' + user.total_uses + '\n';
        if (plan.active) {
            const exp = new Date(plan.expires * 1000);
            text += '📅 ينتهي: ' + exp.toLocaleDateString('ar-EG') + '\n';
        }

        await ctx.replyWithMarkdown(text);
    });

    bot.command('codes', async (ctx) => {
        if (!isAdmin(ctx)) return;
        const codes = db.db.prepare('SELECT * FROM codes WHERE used_by IS NULL ORDER BY created_at DESC LIMIT 20').all();
        if (!codes.length) return ctx.reply('مفيش أكواد متاحة');

        let text = '🎟️ *الأكواد المتاحة:*\n\n';
        codes.forEach(c => {
            text += '`' + c.code + '` - ' + c.plan + ' (' + c.days + ' يوم)\n';
        });

        await ctx.replyWithMarkdown(text);
    });

    bot.command('broadcast', async (ctx) => {
        if (!isAdmin(ctx)) return;
        const msg = ctx.message.text.replace('/broadcast ', '');
        if (!msg || msg === '/broadcast') return ctx.reply('الاستخدام: /broadcast رسالتك');

        const users = db.db.prepare('SELECT user_id FROM users').all();
        let sent = 0;
        for (const u of users) {
            try {
                await ctx.telegram.sendMessage(u.user_id, msg);
                sent++;
                await new Promise(r => setTimeout(r, 50));
            } catch (e) {}
        }
        await ctx.reply('✅ تم الإرسال لـ ' + sent + '/' + users.length);
    });

    bot.command('help_admin', async (ctx) => {
        if (!isAdmin(ctx)) return;
        await ctx.replyWithMarkdown(
            '👑 *أوامر الأدمن*\n\n' +
            '`/stats` - الإحصائيات\n' +
            '`/gencode pro 30` - إنشاء كود\n' +
            '`/addpro 12345 30` - تفعيل يدوي\n' +
            '`/user 12345` - معلومات مستخدم\n' +
            '`/codes` - عرض الأكواد\n' +
            '`/broadcast نص` - إرسال جماعي'
        );
    });

    bot.command('admin', async (ctx) => {
        if (!isAdmin(ctx)) return;
        await ctx.replyWithMarkdown(
            '👑 *لوحة الأدمن*\n\nاختر:',
            Markup.inlineKeyboard([
                [Markup.button.callback('📊 إحصائيات', 'admin_stats')],
                [Markup.button.callback('🎟️ توليد كود', 'admin_gencode')],
                [Markup.button.callback('🔙 رجوع', 'back_main')]
            ])
        );
    });

    bot.action('admin_stats', async (ctx) => {
        if (!isAdmin(ctx)) return ctx.answerCbQuery('❌');
        ctx.answerCbQuery();
        const s = db.getStats();
        await ctx.replyWithMarkdown(
            '📊 إجمالي: ' + s.total + '\n' +
            '💎 Pro: ' + s.pro + '\n' +
            '🔥 نشطين: ' + s.active
        );
    });
}

module.exports = { registerAdminHandlers };

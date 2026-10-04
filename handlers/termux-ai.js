const { Markup } = require('telegraf');
const ai = require('../services/ai');
const { splitMessage } = require('../utils/helpers');

const termuxState = {};

function termuxMenu() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('💬 اسأل أي سؤال', 'termux_ask')],
        [Markup.button.callback('📦 تثبيت أداة', 'termux_install')],
        [Markup.button.callback('🔧 حل مشكلة', 'termux_fix')],
        [Markup.button.callback('📜 أوامر جاهزة', 'termux_commands')],
        [Markup.button.callback('🐍 Python في Termux', 'termux_python')],
        [Markup.button.callback('🟢 Node.js في Termux', 'termux_node')],
        [Markup.button.callback('🔙 الأقسام', 'all_sections'), Markup.button.callback('🏠 الرئيسية', 'back_main')]
    ]);
}

function registerTermuxHandlers(bot) {

    bot.hears(['💻 تريمكس', '💻 Termux'], async (ctx) => {
        termuxState[ctx.from.id] = null;
        await ctx.replyWithMarkdown(
            '💻 *مساعد تريمكس (Termux)*\n\n' +
            'أنا متخصص في:\n' +
            '• أوامر Termux\n' +
            '• تثبيت الأدوات والمكتبات\n' +
            '• حل المشاكل والأخطاء\n' +
            '• البرمجة (Python، Node.js، Bash)\n' +
            '• Git و GitHub\n' +
            '• تشغيل السيرفرات\n\n' +
            '_مش هجاوب على أسئلة خارج التخصص._',
            termuxMenu()
        );
    });

    bot.action('termux_menu', async (ctx) => {
        ctx.answerCbQuery();
        termuxState[ctx.from.id] = null;
        await ctx.editMessageText(
            '💻 *مساعد تريمكس*\n\nاختر:',
            { parse_mode: 'Markdown', ...termuxMenu() }
        ).catch(() => {});
    });

    const buttons = {
        termux_ask: { action: 'ask', msg: '💬 *اسأل أي سؤال تقني*\n\n_مثال:_\n• إزاي أثبت Python؟\n• إيه الفرق بين pkg و apt؟\n• إزاي أعمل Backup؟' },
        termux_install: { action: 'install', msg: '📦 *تثبيت أداة*\n\nاكتب اسم الأداة أو المكتبة.\n\n_مثال:_ ffmpeg, nodejs, python-pip, git' },
        termux_fix: { action: 'fix', msg: '🔧 *حل مشكلة*\n\nاشرحلي المشكلة اللي بتواجهك والأخطاء اللي ظهرتلك.' },
        termux_commands: { action: 'commands', msg: '📜 *أوامر جاهزة*\n\nاكتب عايز تعمل إيه.\n\n_مثال:_ نسخ ملفات، ضغط مجلد، بحث عن ملف' },
        termux_python: { action: 'python', msg: '🐍 *Python في Termux*\n\nاكتب سؤالك عن Python أو مكتباته.' },
        termux_node: { action: 'node', msg: '🟢 *Node.js في Termux*\n\nاكتب سؤالك عن Node.js أو npm.' }
    };

    Object.entries(buttons).forEach(([btnAction, config]) => {
        bot.action(btnAction, async (ctx) => {
            ctx.answerCbQuery();
            termuxState[ctx.from.id] = { action: config.action };
            await ctx.replyWithMarkdown(
                config.msg,
                Markup.inlineKeyboard([[Markup.button.callback('🔙 رجوع', 'termux_menu')]])
            );
        });
    });

    bot.on('text', async (ctx, next) => {
        const userId = ctx.from.id;
        const state = termuxState[userId];
        const text = ctx.message.text;

        if (text.startsWith('/')) return next();
        if (!state || !state.action) return next();

        termuxState[userId] = null;
        const processing = await ctx.reply('💻 جاري التفكير...');

        try {
            let question = '';
            if (state.action === 'install') {
                question = 'إزاي أثبت الأداة دي في Termux وأشرح كل خطوة: ' + text;
            } else if (state.action === 'fix') {
                question = 'عندي مشكلة في Termux وحلها بالتفصيل: ' + text;
            } else if (state.action === 'commands') {
                question = 'أديني الأوامر الجاهزة في Termux للعمل ده: ' + text;
            } else if (state.action === 'python') {
                question = 'سؤال عن Python في Termux: ' + text;
            } else if (state.action === 'node') {
                question = 'سؤال عن Node.js في Termux: ' + text;
            } else {
                question = text;
            }

            const result = await ai.termuxAI(question);

            await ctx.telegram.deleteMessage(ctx.chat.id, processing.message_id).catch(() => {});

            const parts = splitMessage(result, 4000);
            for (const part of parts) {
                await ctx.replyWithMarkdown(part).catch(() => ctx.reply(part));
            }

            await ctx.reply('اختر:',
                Markup.inlineKeyboard([
                    [Markup.button.callback('💬 سؤال تاني', 'termux_ask')],
                    [Markup.button.callback('🔙 رجوع', 'termux_menu')]
                ])
            );
        } catch (e) {
            console.error('Termux AI error:', e.message);
            await ctx.telegram.editMessageText(
                ctx.chat.id, processing.message_id, null,
                '❌ حصل خطأ، جرب تاني'
            ).catch(() => ctx.reply('❌ حصل خطأ'));
        }
    });
}

module.exports = { registerTermuxHandlers };

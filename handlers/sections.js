const { Markup } = require('telegraf');
const ai = require('../services/section-ai');
const db = require('../services/database');
const { splitMessage } = require('../utils/helpers');

const userState = {};

// ========== إعدادات كل الأقسام ==========
const SECTIONS = {
    prog: {
        icon: '💻',
        title: 'البرمجة',
        aiFunc: ai.programmingAI,
        limit: 5,
        items: [
            { id: 'solve', name: '🐛 حل مشكلة كود', prompt: 'الصق الكود والمشكلة اللي عندك:' },
            { id: 'explain', name: '📖 شرح لغة/مفهوم', prompt: 'اكتب اللغة أو المفهوم اللي عايز تفهمه:' },
            { id: 'project', name: '🚀 مشروع كامل', prompt: 'وصفلي المشروع اللي عايز تعمله:' },
            { id: 'learn', name: '🎓 خطة تعلم', prompt: 'قوللي عايز تتعلم إيه ووقتك المتاح:' },
            { id: 'compare', name: '⚖️ مقارنة تقنيات', prompt: 'قوللي التقنيات اللي عايز تقارن بينها:' }
        ]
    },
    design: {
        icon: '🎨',
        title: 'التصميم',
        aiFunc: ai.designAI,
        limit: 5,
        items: [
            { id: 'ideas', name: '💡 أفكار تصميم', prompt: 'وصفلي المشروع اللي عايز تصممه:' },
            { id: 'colors', name: '🎨 اقتراح ألوان', prompt: 'قوللي نوع المشروع والجمهور:' },
            { id: 'tools', name: '🛠️ أدوات تصميم', prompt: 'قوللي محتاج تعمل إيه:' },
            { id: 'tips', name: '📐 نصائح تصميم', prompt: 'اكتب المجال اللي عايز تحترف فيه:' },
            { id: 'logo', name: '🏷️ فكرة لوجو', prompt: 'قوللي عن الشركة/المشروع:' }
        ]
    },
    trans: {
        icon: '🌍',
        title: 'الترجمة',
        aiFunc: ai.translateAI,
        limit: 10,
        items: [
            { id: 'ar_en', name: '🇬🇧 عربي → إنجليزي', prompt: 'ابعتلي النص العربي:' },
            { id: 'en_ar', name: '🇪🇬 إنجليزي → عربي', prompt: 'ابعتلي النص الإنجليزي:' },
            { id: 'fr', name: '🇫🇷 عربي → فرنسي', prompt: 'ابعتلي النص:' },
            { id: 'es', name: '🇪🇸 عربي → إسباني', prompt: 'ابعتلي النص:' },
            { id: 'custom', name: '🌐 لغة تانية', prompt: 'اكتب: `اللغة: النص`' }
        ]
    },
    apps: {
        icon: '📱',
        title: 'التطبيقات',
        aiFunc: ai.appsAI,
        limit: 5,
        items: [
            { id: 'find', name: '🔍 اقتراح تطبيق', prompt: 'قوللي محتاج تطبيق لإيه:' },
            { id: 'alternative', name: '🔄 بدائل تطبيق', prompt: 'قوللي اسم التطبيق:' },
            { id: 'explain', name: '📖 شرح تطبيق', prompt: 'قوللي اسم التطبيق اللي عايز تفهمه:' },
            { id: 'compare', name: '⚖️ مقارنة تطبيقات', prompt: 'قوللي التطبيقات اللي عايز تقارنها:' },
            { id: 'safe', name: '🔒 هل التطبيق آمن؟', prompt: 'قوللي اسم التطبيق:' }
        ]
    },
    health: {
        icon: '🏥',
        title: 'الصحة',
        aiFunc: ai.healthAI,
        limit: 5,
        items: [
            { id: 'tips', name: '💊 نصائح صحية', prompt: 'قوللي المشكلة أو الاستفسار:' },
            { id: 'food', name: '🍎 نظام غذائي', prompt: 'قوللي هدفك ووزنك وطولك:' },
            { id: 'exercise', name: '🏃 تمارين', prompt: 'قوللي هدفك (تخسيس/بناء عضلات):' },
            { id: 'bmi', name: '⚖️ حساب BMI', prompt: 'قوللي وزنك وطولك (مثال: 70 كجم، 175 سم):' },
            { id: 'mental', name: '🧠 صحة نفسية', prompt: 'قوللي اللي بتحس بيه:' }
        ]
    },
    sec: {
        icon: '🔐',
        title: 'الأمن السيبراني',
        aiFunc: ai.securityAI,
        limit: 5,
        items: [
            { id: 'protect', name: '🛡️ حماية جهازك', prompt: 'قوللي بتستخدم إيه:' },
            { id: 'password', name: '🔑 كلمة سر قوية', prompt: 'قوللي محتاج كلمة سر لإيه:' },
            { id: 'vpn', name: '🌐 VPN', prompt: 'قوللي استخدامك وميزانيتك:' },
            { id: 'ethical', name: '⚔️ اختراق أخلاقي', prompt: 'قوللي السياق (اختبار/تعلم):' },
            { id: 'phishing', name: '🎣 اكتشاف التصيد', prompt: 'الصق الرسالة المشبوهة:' }
        ]
    },
    sport: {
        icon: '💪',
        title: 'الرياضة',
        aiFunc: ai.sportsAI,
        limit: 5,
        items: [
            { id: 'plan', name: '📋 خطة تمارين', prompt: 'قوللي هدفك ومستواك:' },
            { id: 'muscle', name: '💪 بناء عضلات', prompt: 'قوللي العضلة المستهدفة:' },
            { id: 'weight', name: '🔥 تخسيس', prompt: 'قوللي وزنك وهدفك:' },
            { id: 'nutrition', name: '🍗 تغذية رياضية', prompt: 'قوللي نظامك الحالي:' },
            { id: 'home', name: '🏠 تمارين منزلية', prompt: 'قوللي الوقت المتاح والأدوات:' }
        ]
    },
    kids: {
        icon: '👶',
        title: 'الأطفال',
        aiFunc: ai.kidsAI,
        limit: 10,
        items: [
            { id: 'story', name: '📖 قصة', prompt: 'قوللي موضوع القصة وعمر الطفل:' },
            { id: 'game', name: '🎮 لعبة', prompt: 'قوللي عمر الطفل والمكان:' },
            { id: 'learn', name: '📚 تعليم', prompt: 'قوللي عايز تعلمه إيه وعمره:' },
            { id: 'riddle', name: '🧩 ألغاز', prompt: 'قوللي عمر الطفل:' },
            { id: 'song', name: '🎵 أغنية تعليمية', prompt: 'قوللي الموضوع وعمر الطفل:' }
        ]
    }
};

// ========== دالة العداد ==========
function getFooter(userId, sectionKey) {
    const user = db.getUser(userId);
    const plan = db.getPlan(userId);
    if (plan.active) {
        const daysLeft = Math.ceil((plan.expires * 1000 - Date.now()) / 86400000);
        return '\n\n💎 *Pro* | باقي: ' + daysLeft + ' يوم';
    }
    const limit = SECTIONS[sectionKey].limit;
    const today = new Date().toISOString().split('T')[0];
    let remaining = limit;
    if (user.daily_reset === today) {
        remaining = Math.max(0, limit - user.daily_count);
    }
    return '\n\n📊 *متبقي اليوم:* ' + remaining + ' استخدام';
}

// ========== قائمة القسم ==========
function sectionMenu(sectionKey) {
    const sec = SECTIONS[sectionKey];
    const buttons = [];

    // كل زرين في صف
    for (let i = 0; i < sec.items.length; i += 2) {
        const row = [Markup.button.callback(sec.items[i].name, 'do_' + sectionKey + '_' + sec.items[i].id)];
        if (sec.items[i + 1]) {
            row.push(Markup.button.callback(sec.items[i + 1].name, 'do_' + sectionKey + '_' + sec.items[i + 1].id));
        }
        buttons.push(row);
    }

    // أزرار التنقل
    buttons.push([
        Markup.button.callback('🔙 الأقسام', 'all_sections'),
        Markup.button.callback('🏠 الرئيسية', 'back_main')
    ]);

    return Markup.inlineKeyboard(buttons);
}

// ========== تسجيل المعالجات ==========
function registerSectionHandlers(bot) {

    Object.keys(SECTIONS).forEach(key => {
        // فتح القسم
        bot.action('section_' + key, async (ctx) => {
            ctx.answerCbQuery();
            try { await ctx.deleteMessage(); } catch (e) {}
            userState[ctx.from.id] = null;
            const sec = SECTIONS[key];
            await ctx.replyWithMarkdown(
                sec.icon + ' *قسم ' + sec.title + '*\n\n' +
                '━━━━━━━━━━━━━━━\n' +
                'اختر الخدمة:' + getFooter(ctx.from.id, key),
                sectionMenu(key)
            );
        });

        // رجوع للقسم
        bot.action('menu_' + key, async (ctx) => {
            ctx.answerCbQuery();
            try { await ctx.deleteMessage(); } catch (e) {}
            userState[ctx.from.id] = null;
            const sec = SECTIONS[key];
            await ctx.replyWithMarkdown(
                sec.icon + ' *قسم ' + sec.title + '*\n\nاختر:' + getFooter(ctx.from.id, key),
                sectionMenu(key)
            );
        });
    });

    // معالج الأزرار الديناميكية
    bot.action(/^do_(\w+)_(\w+)$/, async (ctx) => {
        ctx.answerCbQuery();
        const sectionKey = ctx.match[1];
        const itemId = ctx.match[2];
        const sec = SECTIONS[sectionKey];
        if (!sec) return;

        const item = sec.items.find(i => i.id === itemId);
        if (!item) return;

        userState[ctx.from.id] = { section: sectionKey, item: itemId };

        try { await ctx.deleteMessage(); } catch (e) {}

        await ctx.replyWithMarkdown(
            sec.icon + ' *' + item.name + '*\n\n' +
            item.prompt + getFooter(ctx.from.id, sectionKey),
            Markup.inlineKeyboard([
                [Markup.button.callback('🔙 رجوع للقسم', 'menu_' + sectionKey)]
            ])
        );
    });

    // معالج الرسائل
    bot.on('text', async (ctx, next) => {
        const userId = ctx.from.id;
        const state = userState[userId];
        const text = ctx.message.text;

        if (text.startsWith('/')) return next();
        if (!state || !state.section || !state.item) return next();

        const sec = SECTIONS[state.section];
        if (!sec) return next();

        // فحص الحد
        const check = db.checkAndIncrement(userId, state.section);
        if (!check.allowed) {
            userState[userId] = null;
            return ctx.replyWithMarkdown(
                '⚠️ *وصلت الحد اليومي*\n\n' +
                'قسم ' + sec.title + ': *' + sec.limit + ' استخدامات يومياً*\n\n' +
                '💎 رقّي لـ Pro واستخدم بدون حدود!\n\n' +
                '💰 تبدأ من *20 ج.م/أسبوع*',
                Markup.inlineKeyboard([
                    [Markup.button.callback('💎 اشترك الآن', 'section_sub')],
                    [Markup.button.callback('🏠 الرئيسية', 'back_main')]
                ])
            );
        }

        const item = sec.items.find(i => i.id === state.item);
        userState[userId] = null;

        const processing = await ctx.reply('⏳ جاري التفكير...');

        try {
            const fullPrompt = item.name + ' - ' + item.prompt + '\n\n' + text;
            const result = await sec.aiFunc(fullPrompt);

            await ctx.telegram.deleteMessage(ctx.chat.id, processing.message_id).catch(() => {});

            const parts = splitMessage(result, 4000);
            for (const part of parts) {
                await ctx.replyWithMarkdown(part).catch(() => ctx.reply(part));
            }

            await ctx.replyWithMarkdown('اختر:' + getFooter(userId, state.section),
                Markup.inlineKeyboard([
                    [Markup.button.callback('🔄 استخدام تاني', 'menu_' + state.section)],
                    [Markup.button.callback('🏠 الرئيسية', 'back_main')]
                ])
            );
        } catch (e) {
            console.error('Section error:', e.message);
            await ctx.telegram.editMessageText(
                ctx.chat.id, processing.message_id, null,
                '❌ حصل خطأ، جرب تاني'
            ).catch(() => ctx.reply('❌ حصل خطأ'));
        }
    });
}

module.exports = { registerSectionHandlers, SECTIONS };

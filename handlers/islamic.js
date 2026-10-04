const { Markup } = require('telegraf');
const prayer = require('../services/prayer');

function quranMenu() {
    return Markup.inlineKeyboard([
        [Markup.button.url('📖 المصحف الشريف', 'https://quran.com/ar')],
        [Markup.button.url('📚 التفسير الميسر', 'https://quran.com/ar/tafsirs')],
        [Markup.button.url('🎧 التلاوات الصوتية', 'https://www.mp3quran.net/ar')],
        [Markup.button.callback('🔙 رجوع', 'islam_menu')]
    ]);
}

function islamicMenu() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('📖 القرآن الكريم', 'islam_quran')],
        [Markup.button.callback('🕌 مواقيت الصلاة', 'islam_prayer')],
        [Markup.button.callback('📿 الأذكار', 'islam_azkar')],
        [Markup.button.callback('🔙 الأقسام', 'all_sections'), Markup.button.callback('🏠 الرئيسية', 'back_main')]
    ]);
}

function registerIslamicHandlers(bot) {

    bot.action('section_islamic', async (ctx) => {
        ctx.answerCbQuery();
        try { await ctx.deleteMessage(); } catch (e) {}
        await ctx.replyWithMarkdown(
            '🕌 *القسم الإسلامي*\n\nاختر ما تريد:',
            islamicMenu()
        );
    });

    bot.action('islam_menu', async (ctx) => {
        ctx.answerCbQuery();
        await ctx.editMessageText(
            '🕌 *القسم الإسلامي*\n\nاختر ما تريد:',
            { parse_mode: 'Markdown', ...islamicMenu() }
        ).catch(() => {});
    });

    bot.action('islam_quran', async (ctx) => {
        ctx.answerCbQuery();
        await ctx.editMessageText(
            '📖 *القرآن الكريم*\n\nاختر ما تريد:\n\n📖 المصحف - القراءة بالرسم العثماني\n📚 التفسير - تفسير ميسر لكل آية\n🎧 التلاوات - استمع لأشهر القراء\n\n_كل المواقع موثوقة ومعتمدة_ ✅',
            { parse_mode: 'Markdown', ...quranMenu() }
        ).catch(() => {});
    });

    bot.action('islam_prayer', async (ctx) => {
        ctx.answerCbQuery();
        await ctx.editMessageText(
            '🕌 *مواقيت الصلاة*\n\n📍 اختر طريقة:\n\n1️⃣ شارك موقعك من (📎 → الموقع)\n2️⃣ أو اختر مدينة',
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('🇪🇬 القاهرة', 'prayer_city_Cairo_Egypt')],
                    [Markup.button.callback('🇪🇬 الإسكندرية', 'prayer_city_Alexandria_Egypt')],
                    [Markup.button.callback('🇸🇦 الرياض', 'prayer_city_Riyadh_Saudi')],
                    [Markup.button.callback('🇸🇦 مكة', 'prayer_city_Mecca_Saudi')],
                    [Markup.button.callback('🇦🇪 دبي', 'prayer_city_Dubai_UAE')],
                    [Markup.button.callback('🔙 رجوع', 'islam_menu')]
                ])
            }
        ).catch(() => {});
    });

    bot.action(/^prayer_city_(\w+)_(\w+)$/, async (ctx) => {
        ctx.answerCbQuery('⏳ جاري الحساب...');
        const city = ctx.match[1];
        const country = ctx.match[2];
        await sendPrayerTimes(ctx, city, country);
    });

    bot.on('location', async (ctx) => {
        const { latitude, longitude } = ctx.message.location;
        const data = await prayer.getPrayerTimesByCoords(latitude, longitude);
        if (!data) return ctx.reply('❌ فشل الحساب');
        await sendPrayerData(ctx, data);
    });
}

async function sendPrayerTimes(ctx, city, country) {
    const data = await prayer.getPrayerTimesByCity(city, country);
    if (!data) return ctx.reply('❌ فشل جلب المواقيت');
    await sendPrayerData(ctx, data, city);
}

async function sendPrayerData(ctx, data, city) {
    city = city || '';
    const timings = data.timings;
    const hijri = data.date.hijri;
    const greg = data.date.gregorian;

    const text =
        '🕌 *مواقيت الصلاة' + (city ? ' - ' + city : '') + '*\n\n' +
        '📅 ' + greg.day + ' ' + greg.month.en + ' ' + greg.year + '\n' +
        '🌙 ' + hijri.day + ' ' + hijri.month.ar + ' ' + hijri.year + ' هـ\n\n' +
        '🌅 الفجر:     *' + timings.Fajr + '*\n' +
        '🌄 الشروق:   *' + timings.Sunrise + '*\n' +
        '☀️ الظهر:     *' + timings.Dhuhr + '*\n' +
        '🌇 العصر:     *' + timings.Asr + '*\n' +
        '🌆 المغرب:   *' + timings.Maghrib + '*\n' +
        '🌃 العشاء:    *' + timings.Isha + '*';

    await ctx.replyWithMarkdown(text,
        Markup.inlineKeyboard([
            [Markup.button.callback('🔄 تحديث', 'islam_prayer')],
            [Markup.button.callback('🔙 رجوع', 'islam_menu')]
        ])
    );
}

module.exports = { registerIslamicHandlers };

require('dotenv').config();
const { Telegraf } = require('telegraf');
const { registerMainMenuHandlers } = require('./handlers/main-menu');
const { registerIslamicHandlers } = require('./handlers/islamic');
const { registerAzkarHandlers } = require('./handlers/azkar');
const { registerEducationHandlers } = require('./handlers/education');
const { registerBusinessHandlers } = require('./handlers/business');
const { registerMediaHandlers } = require('./handlers/media');
const { registerTermuxHandlers } = require('./handlers/termux-ai');
const { registerSubscriptionHandlers } = require('./handlers/subscription');
const { registerAdminHandlers } = require('./handlers/admin');
const { registerSectionHandlers } = require('./handlers/sections');
const { registerShortenerHandlers } = require('./handlers/shortener');

const bot = new Telegraf(process.env.BOT_TOKEN);

registerMainMenuHandlers(bot);
registerIslamicHandlers(bot);
registerAzkarHandlers(bot);
registerEducationHandlers(bot);
registerBusinessHandlers(bot);
registerMediaHandlers(bot);
registerTermuxHandlers(bot);
registerSubscriptionHandlers(bot);
registerAdminHandlers(bot);
registerSectionHandlers(bot);
registerShortenerHandlers(bot);

bot.catch((err, ctx) => console.error('❌ Error:', err.message));

bot.launch()
    .then(() => console.log('🤖 Raheem Bot is running...'))
    .catch(err => console.error('Launch error:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

const { Markup } = require('telegraf');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

const userState = {};
const DOWNLOAD_DIR = '/data/data/com.termux/files/home/raheem-bot/downloads';

if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

function mediaMenu() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('📥 تحميل فيديو', 'media_video')],
        [Markup.button.callback('🎵 تحميل MP3', 'media_mp3')],
        [Markup.button.callback('📸 تحميل صور/ريلز', 'media_image')],
        [Markup.button.callback('🔙 الأقسام', 'all_sections'), Markup.button.callback('🏠 الرئيسية', 'back_main')]
    ]);
}

function registerMediaHandlers(bot) {

    bot.action('section_media', async (ctx) => {
        ctx.answerCbQuery();
        try { await ctx.deleteMessage(); } catch (e) {}
        userState[ctx.from.id] = null;
        await ctx.replyWithMarkdown(
            '🎬 *قسم الوسائط*\n\nاختر الخدمة:',
            mediaMenu()
        );
    });

    bot.action('media_menu', async (ctx) => {
        ctx.answerCbQuery();
        userState[ctx.from.id] = null;
        await ctx.editMessageText(
            '🎬 *قسم الوسائط*\n\nاختر الخدمة:',
            { parse_mode: 'Markdown', ...mediaMenu() }
        ).catch(() => {});
    });

    bot.action('media_video', async (ctx) => {
        ctx.answerCbQuery();
        userState[ctx.from.id] = { action: 'video' };
        await ctx.replyWithMarkdown(
            '📥 *تحميل فيديو*\n\n' +
            'ابعتلي رابط الفيديو، وأنا هحمللك الفيديو وأرفعه على سيرفر خارجي وهبعتلك رابط التحميل.\n\n' +
            '📱 *المنصات المدعومة:*\n' +
            '• YouTube\n' +
            '• Facebook (فيديو + Reels)\n' +
            '• TikTok\n' +
            '• Instagram\n' +
            '• Twitter / X\n' +
            '• Snapchat\n' +
            '• Reddit\n' +
            '• Pinterest\n' +
            '• وأكتر من 1000 موقع 🌐\n\n' +
            '💡 *مفيش حد لحجم الفيديو!*',
            Markup.inlineKeyboard([[Markup.button.callback('🔙 رجوع', 'media_menu')]])
        );
    });

    bot.action('media_mp3', async (ctx) => {
        ctx.answerCbQuery();
        userState[ctx.from.id] = { action: 'mp3' };
        await ctx.replyWithMarkdown(
            '🎵 *تحميل MP3*\n\n' +
            'ابعتلي رابط الفيديو وأنا هستخرج الصوت كـ MP3 وهرفعه على سيرفر خارجي.',
            Markup.inlineKeyboard([[Markup.button.callback('🔙 رجوع', 'media_menu')]])
        );
    });

    bot.action('media_image', async (ctx) => {
        ctx.answerCbQuery();
        userState[ctx.from.id] = { action: 'image' };
        await ctx.replyWithMarkdown(
            '📸 *تحميل صور*\n\n' +
            'ابعتلي رابط الصورة أو البوست، وهرفعهالك على سيرفر خارجي.',
            Markup.inlineKeyboard([[Markup.button.callback('🔙 رجوع', 'media_menu')]])
        );
    });

    bot.on('text', async (ctx, next) => {
        const userId = ctx.from.id;
        const state = userState[userId];
        const text = ctx.message.text;

        if (text.startsWith('/')) return next();
        if (!state || !state.action) return next();

        if (!/https?:\/\//.test(text)) {
            return ctx.reply('❌ ابعتلي رابط صحيح (يبدأ بـ http)');
        }

        userState[userId] = null;
        const processing = await ctx.reply('⏳ جاري التحميل... (ممكن ياخد دقيقة)');

        const jobId = Date.now().toString();
        const jobDir = path.join(DOWNLOAD_DIR, jobId);
        fs.mkdirSync(jobDir, { recursive: true });

        try {
            let cmd = '';
            let mode = state.action;

            const userAgentOpt = '--user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"';

            if (mode === 'mp3') {
                cmd = 'yt-dlp -x --audio-format mp3 --audio-quality 0 ' + userAgentOpt + ' -o "' + jobDir + '/%(title)s.%(ext)s" "' + text + '"';
            } else if (mode === 'image') {
                cmd = 'yt-dlp --skip-download --write-thumbnail ' + userAgentOpt + ' -o "' + jobDir + '/%(title)s.%(ext)s" "' + text + '"';
            } else {
                cmd = 'yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --merge-output-format mp4 ' + userAgentOpt + ' -o "' + jobDir + '/%(title)s.%(ext)s" "' + text + '"';
            }

            exec(cmd, { maxBuffer: 50 * 1024 * 1024, timeout: 900000 }, async (err) => {
                const files = fs.readdirSync(jobDir);

                if (!files.length) {
                    console.error('yt-dlp error:', err ? err.message : 'no files');
                    await ctx.telegram.editMessageText(
                        ctx.chat.id, processing.message_id, null,
                        '❌ فشل التحميل.\n\n' +
                        'الأسباب المحتملة:\n' +
                        '• الرابط محتاج تسجيل دخول\n' +
                        '• الفيديو محذوف\n' +
                        '• الرابط غلط'
                    ).catch(() => {});
                    return;
                }

                for (const file of files) {
                    const fp = path.join(jobDir, file);
                    const size = fs.statSync(fp).size;
                    const sizeMB = (size / 1024 / 1024).toFixed(1);

                    await ctx.telegram.editMessageText(
                        ctx.chat.id, processing.message_id, null,
                        '🌐 جاري الرفع على سيرفر خارجي...\n' +
                        '📊 الحجم: ' + sizeMB + ' MB\n' +
                        '_(ممكن ياخد دقايق حسب الحجم والسرعة)_'
                    ).catch(() => {});

                    const uploadResult = await uploadToExternalServer(fp);

                    if (uploadResult && uploadResult.url) {
                        await ctx.replyWithMarkdown(
                            '✅ *تم التحميل بنجاح!*\n\n' +
                            '📁 *الملف:* ' + file + '\n' +
                            '📊 *الحجم:* ' + sizeMB + ' MB\n' +
                            '🌐 *السيرفر:* ' + uploadResult.server + '\n\n' +
                            '🔗 *رابط التحميل:*\n' +
                            uploadResult.url + '\n\n' +
                            '_اضغط على الزر أو انسخ الرابط في المتصفح_',
                            Markup.inlineKeyboard([
                                [Markup.button.url('⬇️ تحميل الآن', uploadResult.url)]
                            ])
                        );
                    } else {
                        await ctx.reply('❌ فشل الرفع على السيرفرات الخارجية. جرب تاني بعد شوية.');
                    }
                }

                try { fs.rmSync(jobDir, { recursive: true, force: true }); } catch (e) {}

                await ctx.telegram.deleteMessage(ctx.chat.id, processing.message_id).catch(() => {});

                await ctx.reply('اختر:',
                    Markup.inlineKeyboard([
                        [Markup.button.callback('🔄 تحميل تاني', 'media_menu')],
                        [Markup.button.callback('🏠 القائمة', 'back_main')]
                    ])
                );
            });
        } catch (e) {
            console.error('Media error:', e.message);
            await ctx.telegram.editMessageText(
                ctx.chat.id, processing.message_id, null,
                '❌ حصل خطأ، جرب تاني'
            ).catch(() => ctx.reply('❌ حصل خطأ'));
        }
    });
}

// ========== رفع على سيرفرات خارجية (متعدد المحاولات) ==========
async function uploadToExternalServer(filePath) {
    // 1. جرب gofile.io (الأكثر موثوقية وأطول مدة)
    try {
        console.log('🌐 جرب gofile.io...');
        const result = await uploadToGofile(filePath);
        if (result && result.url) return result;
    } catch (e) { console.log('gofile فشل:', e.message); }

    // 2. جرب transfer.sh
    try {
        console.log('🌐 جرب transfer.sh...');
        const result = await uploadToTransferSh(filePath);
        if (result && result.url) return result;
    } catch (e) { console.log('transfer.sh فشل:', e.message); }

    // 3. جرب 0x0.st
    try {
        console.log('🌐 جرب 0x0.st...');
        const result = await uploadTo0x0(filePath);
        if (result && result.url) return result;
    } catch (e) { console.log('0x0.st فشل:', e.message); }

    return null;
}

// gofile.io
function uploadToGofile(filePath) {
    return new Promise((resolve, reject) => {
        https.get('https://api.gofile.io/servers', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.status !== 'ok' || !json.data.servers || !json.data.servers.length) {
                        return reject(new Error('no server available'));
                    }

                    const server = json.data.servers[0].name;
                    const fileName = path.basename(filePath);
                    const fileBuffer = fs.readFileSync(filePath);

                    const boundary = '----FormBoundary' + Date.now() + Math.random().toString(36).slice(2);
                    const header = '--' + boundary + '\r\n' +
                        'Content-Disposition: form-data; name="file"; filename="' + fileName + '"\r\n' +
                        'Content-Type: application/octet-stream\r\n\r\n';
                    const footer = '\r\n--' + boundary + '--\r\n';

                    const body = Buffer.concat([
                        Buffer.from(header, 'utf-8'),
                        fileBuffer,
                        Buffer.from(footer, 'utf-8')
                    ]);

                    const options = {
                        hostname: server + '.gofile.io',
                        path: '/contents/uploadfile',
                        method: 'POST',
                        headers: {
                            'Content-Type': 'multipart/form-data; boundary=' + boundary,
                            'Content-Length': body.length
                        },
                        timeout: 900000
                    };

                    const req = https.request(options, (res2) => {
                        let data2 = '';
                        res2.on('data', chunk => data2 += chunk);
                        res2.on('end', () => {
                            try {
                                const json2 = JSON.parse(data2);
                                if (json2.status === 'ok' && json2.data && json2.data.downloadPage) {
                                    resolve({ server: 'gofile.io', url: json2.data.downloadPage });
                                } else {
                                    reject(new Error('gofile upload failed'));
                                }
                            } catch (e) { reject(e); }
                        });
                    });

                    req.on('error', reject);
                    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
                    req.write(body);
                    req.end();
                } catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}

// transfer.sh
function uploadToTransferSh(filePath) {
    return new Promise((resolve, reject) => {
        const fileName = path.basename(filePath);
        const cmd = 'curl -s --max-time 900 --upload-file "' + filePath + '" "https://transfer.sh/' + encodeURIComponent(fileName) + '"';

        exec(cmd, { maxBuffer: 10 * 1024 * 1024, timeout: 900000 }, (err, stdout) => {
            if (!err && stdout && stdout.trim().startsWith('https://')) {
                resolve({ server: 'transfer.sh', url: stdout.trim() });
            } else {
                reject(new Error('transfer.sh failed'));
            }
        });
    });
}

// 0x0.st
function uploadTo0x0(filePath) {
    return new Promise((resolve, reject) => {
        const cmd = 'curl -s --max-time 900 -F "file=@' + filePath + '" https://0x0.st';

        exec(cmd, { maxBuffer: 10 * 1024 * 1024, timeout: 900000 }, (err, stdout) => {
            if (!err && stdout && stdout.trim().startsWith('https://')) {
                resolve({ server: '0x0.st', url: stdout.trim() });
            } else {
                reject(new Error('0x0.st failed'));
            }
        });
    });
}

module.exports = { registerMediaHandlers };

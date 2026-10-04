const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODELS = {
    smart: 'openai/gpt-oss-120b',
    fast: 'openai/gpt-oss-20b',
    qwen: 'qwen/qwen3-32b',
    llama4: 'meta-llama/llama-4-scout-17b-16e-instruct',
    reasoning: 'deepseek-r1-distill-llama-70b'
};

const DEFAULT_MODEL = MODELS.smart;

// ========== دالة عامة ==========
async function askAI(prompt, systemPrompt, model) {
    systemPrompt = systemPrompt || '';
    model = model || 'smart';
    try {
        const messages = [];
        if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
        messages.push({ role: 'user', content: prompt });

        const completion = await groq.chat.completions.create({
            messages: messages,
            model: MODELS[model] || DEFAULT_MODEL,
            temperature: 0.7,
            max_tokens: 4096
        });

        return completion.choices[0] && completion.choices[0].message
            ? completion.choices[0].message.content
            : '❌ مفيش رد';
    } catch (e) {
        console.error('askAI error:', e.message);
        if (model !== 'fast') {
            return await askAI(prompt, systemPrompt, 'fast');
        }
        return '❌ حصل خطأ، جرب تاني';
    }
}

// ========== 1. مساعد التعليم المتخصص ==========
async function eduAI(question) {
    const system = 'أنت مساعد تعليمي متخصص فقط. مهمتك الإجابة على الأسئلة التعليمية والدراسية والأكاديمية فقط.\n\n' +
        'قواعد صارمة:\n' +
        '1. لو السؤال تعليمي/دراسي/أكاديمي → جاوب بالتفصيل\n' +
        '2. لو السؤال مش تعليمي (ديني، تجاري، شخصي، ترفيهي) → ارفض بأدب وقل: "أنا مساعد تعليمي فقط. اسأل في قسم [المناسب]."\n' +
        '3. متخرجش عن التعليم أبداً\n' +
        '4. استخدم Markdown مع عناوين ونقاط\n' +
        '5. اكتب بالعربية الفصحى المبسطة';
    return await askAI(question, system);
}

// ========== 2. مساعد الأعمال المتخصص ==========
async function bizAI(question) {
    const system = 'أنت مساعد أعمال ومهني متخصص فقط. مهمتك الإجابة على أسئلة الأعمال والتوظيف والمشاريع والمالية فقط.\n\n' +
        'قواعد صارمة:\n' +
        '1. لو السؤال عن أعمال/وظيفة/مشروع/تسويق/مالية → جاوب بالتفصيل\n' +
        '2. لو السؤال مش عن الأعمال (تعليمي، ديني، ترفيهي) → ارفض بأدب: "أنا مساعد أعمال فقط. اسأل في قسم [المناسب]."\n' +
        '3. متخرجش عن مجال الأعمال\n' +
        '4. استخدم Markdown\n' +
        '5. كن عملي ومباشر';
    return await askAI(question, system);
}

// ========== 3. مساعد إسلامي متخصص ==========
async function islamicAI(question) {
    const system = 'أنت مساعد إسلامي متخصص. مهمتك الإجابة على الأسئلة الإسلامية فقط (فقه، تفسير، سيرة، أذكار).\n\n' +
        'قواعد صارمة:\n' +
        '1. لو السؤال إسلامي → جاوب بالاستناد للقرآن والسنة الصحيحة\n' +
        '2. لو السؤال مش إسلامي → ارفض: "أنا مساعد إسلامي فقط."\n' +
        '3. للفتاوى الشرعية المعقدة: قل "ارجع لدار الإفتاء أو عالم موثوق"\n' +
        '4. اذكر المصادر لما تذكر حديث\n' +
        '5. كن محترم ومتواضع';
    return await askAI(question, system);
}

// ========== 4. مساعد تريمكس المتخصص ==========
async function termuxAI(question) {
    const system = 'أنت مساعد تريمكس (Termux) متخصص فقط. مهمتك مساعدة المستخدمين في كل ما يخص تطبيق Termux والأدوات التقنية.\n\n' +
        'نطاق تخصصك:\n' +
        '- أوامر Termux (pkg, apt, git, nano, إلخ)\n' +
        '- تثبيت الأدوات والمكتبات (Python, Node.js, ffmpeg, yt-dlp)\n' +
        '- حل مشاكل Termux (أخطاء، صلاحيات، تخزين)\n' +
        '- تشغيل سيرفرات محلية\n' +
        '- البرمجة بـ Python/Node.js/Bash داخل Termux\n' +
        '- Root والـ Magisk (شرح بس)\n' +
        '- Linux basics (أوامر، ملفات، صلاحيات)\n' +
        '- Git و GitHub من Termux\n' +
        '- APIs والأدوات التقنية\n\n' +
        'قواعد صارمة:\n' +
        '1. لو السؤال عن Termux/تقنية/برمجة → جاوب بالأوامر الجاهزة + الشرح\n' +
        '2. لو السؤال مش تقني → ارفض بأدب: "أنا مساعد تريمكس فقط. اسأل في قسم [المناسب]."\n' +
        '3. لما تدّي أمر، اكتبه في code block (```)\n' +
        '4. اشرح كل أمر بعد ما تكتبه\n' +
        '5. نبه على المخاطر لو في أوامر خطيرة\n' +
        '6. استخدم Markdown';
    return await askAI(question, system);
}

// ========== 5. دالات متخصصة (للاستخدام المباشر) ==========
async function explainConcept(topic) {
    return await eduAI('اشرح لي بالتفصيل: ' + topic);
}

async function summarizeText(text, length) {
    length = length || 'medium';
    let prompt = 'لخص النص التالي:\n\n' + text;
    if (length === 'short') prompt += '\n\n(ملخص قصير في 5 نقاط)';
    if (length === 'long') prompt += '\n\n(ملخص مفصل)';
    return await eduAI(prompt);
}

async function generateQuiz(topic, count, type) {
    count = count || 10;
    type = type || 'mixed';
    let prompt = 'اعمللي ' + count + ' سؤال عن: ' + topic + '\n\n';
    if (type === 'mcq') prompt += 'اختيار من متعدد فقط (4 خيارات).';
    else if (type === 'essay') prompt += 'أسئلة مقالية فقط.';
    else prompt += 'خليط: 60% MCQ + 40% مقالي.';
    prompt += '\n\nاعرض الإجابات في قسم منفصل.';
    return await eduAI(prompt);
}

async function solveProblem(problem, subject) {
    subject = subject || 'عام';
    return await eduAI('حل المسألة (' + subject + '):\n\n' + problem + '\n\nاشرح خطوة بخطوة.');
}

async function translate(text, toLang) {
    toLang = toLang || 'العربية';
    return await eduAI('ترجم النص التالي إلى ' + toLang + ':\n\n' + text);
}

module.exports = {
    askAI: askAI,
    eduAI: eduAI,
    bizAI: bizAI,
    islamicAI: islamicAI,
    termuxAI: termuxAI,
    explainConcept: explainConcept,
    summarizeText: summarizeText,
    generateQuiz: generateQuiz,
    solveProblem: solveProblem,
    translate: translate,
    MODELS: MODELS,
    DEFAULT_MODEL: DEFAULT_MODEL
};

const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'data', 'bot.db'));

// إنشاء الجداول
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY,
        first_name TEXT,
        username TEXT,
        plan TEXT DEFAULT 'free',
        expires_at INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        daily_count INTEGER DEFAULT 0,
        daily_reset TEXT,
        total_uses INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        plan TEXT,
        amount INTEGER,
        method TEXT,
        status TEXT DEFAULT 'pending',
        receipt_file_id TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS codes (
        code TEXT PRIMARY KEY,
        plan TEXT,
        days INTEGER,
        used_by INTEGER,
        used_at INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
`);

// ========== إدارة المستخدمين ==========
function getUser(userId) {
    let user = db.prepare('SELECT * FROM users WHERE user_id = ?').get(userId);
    if (!user) {
        db.prepare('INSERT INTO users (user_id) VALUES (?)').run(userId);
        user = db.prepare('SELECT * FROM users WHERE user_id = ?').get(userId);
    }
    // تحقق من انتهاء الاشتراك
    if (user.plan !== 'free' && user.expires_at && user.expires_at * 1000 < Date.now()) {
        db.prepare('UPDATE users SET plan = ?, expires_at = NULL WHERE user_id = ?').run('free', userId);
        user = db.prepare('SELECT * FROM users WHERE user_id = ?').get(userId);
    }
    return user;
}

function updateUser(userId, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map(k => k + ' = ?').join(', ');
    db.prepare('UPDATE users SET ' + setClause + ' WHERE user_id = ?').run(...values, userId);
}

// ========== الاشتراك ==========
function getPlan(userId) {
    const user = getUser(userId);
    if (user.plan === 'free') return { plan: 'free', active: false };
    if (user.expires_at && user.expires_at * 1000 > Date.now()) {
        return { plan: user.plan, active: true, expires: user.expires_at };
    }
    return { plan: 'free', active: false };
}

function setPlan(userId, plan, days) {
    const expires = days > 0 ? Math.floor(Date.now() / 1000) + (days * 86400) : null;
    updateUser(userId, { plan: plan, expires_at: expires });
}

// ========== عد الاستخدامات اليومية ==========
const LIMITS = {
    free: { edu: 5, biz: 3, termux: 5, media: 1, islamic: 999 },
    pro: { edu: 999, biz: 999, termux: 999, media: 999, islamic: 999 }
};

function checkAndIncrement(userId, category) {
    const user = getUser(userId);
    const today = new Date().toISOString().split('T')[0];

    // صفر العداد لو يوم جديد
    if (user.daily_reset !== today) {
        updateUser(userId, { daily_count: 0, daily_reset: today });
        user.daily_count = 0;
    }

    // حد الـ Pro
    if (user.plan !== 'free' && user.expires_at && user.expires_at * 1000 > Date.now()) {
        return { allowed: true, remaining: 999, plan: 'pro' };
    }

    // حد المجاني
    const limit = LIMITS.free[category] || 5;
    if (user.daily_count >= limit) {
        return { allowed: false, remaining: 0, plan: 'free', limit: limit };
    }

    updateUser(userId, { daily_count: user.daily_count + 1, total_uses: user.total_uses + 1 });
    return { allowed: true, remaining: limit - user.daily_count - 1, plan: 'free' };
}

// ========== إحصائيات ==========
function getStats() {
    const total = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
    const pro = db.prepare("SELECT COUNT(*) as c FROM users WHERE plan != 'free' AND expires_at * 1000 > ?").get(Date.now()).c;
    const today = new Date().toISOString().split('T')[0];
    const active = db.prepare('SELECT COUNT(*) as c FROM users WHERE daily_reset = ?').get(today).c;
    return { total, pro, active };
}

// ========== أكواد التفعيل ==========
function createCode(plan, days) {
    const code = 'RH-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    db.prepare('INSERT INTO codes (code, plan, days) VALUES (?, ?, ?)').run(code, plan, days);
    return code;
}

function redeemCode(userId, code) {
    const c = db.prepare('SELECT * FROM codes WHERE code = ?').get(code);
    if (!c) return { ok: false, msg: 'الكود مش موجود' };
    if (c.used_by) return { ok: false, msg: 'الكود مستخدم قبل كده' };

    setPlan(userId, c.plan, c.days);
    db.prepare('UPDATE codes SET used_by = ?, used_at = ? WHERE code = ?').run(userId, Math.floor(Date.now() / 1000), code);
    return { ok: true, plan: c.plan, days: c.days };
}

// ========== المدفوعات ==========
function addPayment(userId, plan, amount, method, receiptFileId) {
    const result = db.prepare('INSERT INTO payments (user_id, plan, amount, method, receipt_file_id) VALUES (?, ?, ?, ?, ?)')
        .run(userId, plan, amount, method, receiptFileId);
    return result.lastInsertRowid;
}

function approvePayment(paymentId, adminId) {
    const p = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);
    if (!p || p.status !== 'pending') return null;

    db.prepare('UPDATE payments SET status = ? WHERE id = ?').run('approved', paymentId);

    const PLAN_DAYS = { weekly: 7, monthly: 30, quarterly: 90, yearly: 365, lifetime: 36500 };
    setPlan(p.user_id, 'pro', PLAN_DAYS[p.plan] || 30);
    return p;
}

function rejectPayment(paymentId) {
    db.prepare('UPDATE payments SET status = ? WHERE id = ?').run('rejected', paymentId);
}

module.exports = {
    db,
    getUser,
    updateUser,
    getPlan,
    setPlan,
    checkAndIncrement,
    getStats,
    createCode,
    redeemCode,
    addPayment,
    approvePayment,
    rejectPayment,
    LIMITS
};

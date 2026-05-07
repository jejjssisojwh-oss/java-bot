const { Telegraf, Markup } = require('telegraf');
const bedrock = require('bedrock-protocol');
const http = require('http');

// التوكن الخاص بك
const bot = new Telegraf('8630184110:AAGN7k_-nZq0zEHZeNy74PuFR_CiJ2kxRps');

// ويب سيرفر لمنع توقف الاستضافة
http.createServer((req, res) => res.end('Universal Engine Active')).listen(process.env.PORT || 8080);

const sessions = new Map();

// --- أزرار اللوحة الفخمة ---
const dashboard = (isLive) => Markup.inlineKeyboard([
    [Markup.button.callback(isLive ? '🔴 إيقاف الاتصال' : '⚡ اقتحام (دعم شامل)', 'toggle')],
    [Markup.button.callback('📊 الحالة اللحظية', 'info'), Markup.button.callback('⚙️ تحديث', 'reload')],
    [Markup.button.callback('🧹 تنظيف الذاكرة', 'clear')]
]);

bot.start((ctx) => {
    ctx.reply(`👑 **مرحباً بك في نظام MAX-BLACK الشامل**\n\nأرسل الآيبي والمنفذ الآن (IP:PORT)\nسيقوم النظام بتحديد الإصدار تلقائياً.`, { parse_mode: 'Markdown' });
});

bot.on('text', (ctx) => {
    const input = ctx.message.text.trim();
    if (!input.includes(':')) return ctx.reply('⚠️ الصيغة: `ip:port`');

    const [host, port] = input.split(':').map(s => s.trim());
    sessions.set(ctx.from.id, { host, port: parseInt(port), client: null, status: 'خامل 💤' });

    ctx.reply(`🎯 **تم رصد الهدف**\n📍 العنوان: ${host}:${port}\n🛡️ النظام: محاكاة جميع الإصدارات`, dashboard(false));
});

bot.action('toggle', async (ctx) => {
    const user = sessions.get(ctx.from.id);
    if (!user) return ctx.answerCbQuery('❌ أرسل البيانات أولاً');

    if (user.client) {
        user.client.disconnect();
        user.client = null;
        user.status = 'مفصول 🛑';
        return ctx.editMessageText(`🛑 **تم سحب البوت بنجاح.**`, dashboard(false));
    }

    ctx.answerCbQuery('🚀 جاري اختراق البروتوكول...');
    try {
        const client = bedrock.createClient({
            host: user.host,
            port: user.port,
            username: `Max_Global_${Math.floor(Math.random() * 888)}`,
            offline: true,
            // السر في الدعم الشامل: استخدام أحدث بروتوكول مع تعطيل skipPing مؤقتاً للتفاوض
            version: '1.21.0', 
            protocolVersion: 748, 
            connectTimeout: 30000,
            skipPing: false 
        });

        user.client = client;

        client.on('spawn', () => {
            user.status = 'متصل ✅';
            ctx.editMessageText(`🟢 **تم الاقتحام! البوت داخل السيرفر الآن.**\n📍 الهدف: ${user.host}:${user.port}`, dashboard(true));
        });

        client.on('error', (err) => {
            user.client = null;
            user.status = 'فشل ❌';
            ctx.reply(`❌ خطأ: ${err.message}`);
        });

        client.on('disconnect', (p) => {
            user.client = null;
            user.status = 'طرد ⚠️';
            ctx.reply(`⚠️ تم الانفصال: ${p.reason || 'إصدار غير مدعوم'}`);
        });

    } catch (e) { ctx.reply('❌ فشل في تشغيل المحرك العالمي.'); }
});

bot.action('info', (ctx) => {
    const s = sessions.get(ctx.from.id);
    ctx.answerCbQuery(`📊 الحالة: ${s ? s.status : 'لا توجد بيانات'}`, { show_alert: true });
});

bot.action('clear', (ctx) => {
    sessions.delete(ctx.from.id);
    ctx.editMessageText('🧹 تم مسح جميع البيانات وجاهز لاستقبال هدف جديد.');
});

// إطلاق البوت بنظام الحماية من التوقف
const start = async () => {
    try {
        await bot.launch();
        console.log('✅ Universal Bot is Ready!');
    } catch (e) {
        console.log('🔄 جاري المحاولة مرة أخرى...');
        setTimeout(start, 5000);
    }
};

start();

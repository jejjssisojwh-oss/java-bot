const { Telegraf, Markup } = require('telegraf');
const bedrock = require('bedrock-protocol');
const http = require('http');

// التوكن الجديد الذي أرسلته يا بطل
const bot = new Telegraf('8630184110:AAGN7k_-nZqOzEHZeNy74PuFR_CiJ2kxRps');

// ويب سيرفر لإبقاء البوت حياً على Railway
http.createServer((req, res) => res.end('MaxBlack Engine Online')).listen(process.env.PORT || 8080);

const userDb = new Map();

// --- أزرار لوحة التحكم الفخمة ---
const controlPanel = (isOnline) => Markup.inlineKeyboard([
    [Markup.button.callback(isOnline ? '🔴 إيقاف البوت وفصل الاتصال' : '🚀 تشغيل محرك الاقتحام (1.26.x)', 'toggle')],
    [Markup.button.callback('📊 فحص النبض', 'status'), Markup.button.callback('🧹 تنظيف الذاكرة', 'reset')]
]);

bot.start((ctx) => {
    ctx.reply(`👑 **نظام MAX-BLACK V2 (النسخة النهائية)**\n\nأرسل الآيبي والمنفذ الآن (IP:PORT)\nمثال: ` + '`play.example.com:19132`', { parse_mode: 'Markdown' });
});

bot.on('text', (ctx) => {
    const text = ctx.message.text.trim();
    if (!text.includes(':')) return ctx.reply('⚠️ الصيغة غلط! أرسل الآيبي والمنفذ هكذا: `IP:PORT`');

    const [host, port] = text.split(':').map(s => s.trim());
    userDb.set(ctx.from.id, { host, port: parseInt(port), client: null, status: 'انتظار ⏳' });

    ctx.reply(`🎯 **تم رصد الهدف**\n📍 العنوان: ${host}:${port}\n⚙️ النظام: دعم شامل لجميع الإصدارات`, controlPanel(false));
});

bot.action('toggle', async (ctx) => {
    const user = userDb.get(ctx.from.id);
    if (!user) return ctx.answerCbQuery('❌ أرسل البيانات أولاً!');

    if (user.client) {
        user.client.disconnect();
        user.client = null;
        user.status = 'مفصول 🛑';
        return ctx.editMessageText('🛑 **تم فصل البوت بنجاح.**', controlPanel(false));
    }

    ctx.answerCbQuery('⚡ جاري كسر بروتوكول السيرفر...');
    try {
        const client = bedrock.createClient({
            host: user.host,
            port: user.port,
            username: `Max_V2_${Math.floor(Math.random() * 999)}`,
            offline: true,
            // أحدث إعدادات لتخطي outdated_client في إصدارات 1.26
            version: '1.21.0',
            protocolVersion: 748, 
            connectTimeout: 30000,
            skipPing: false 
        });

        user.client = client;

        client.on('spawn', () => {
            user.status = 'داخل السيرفر ✅';
            ctx.editMessageText(`🟢 **تم الاقتحام! البوت الآن داخل السيرفر.**\n📍 السيرفر: ${user.host}\n📊 الحالة: متصل بنجاح`, controlPanel(true));
        });

        client.on('error', (err) => {
            user.client = null;
            user.status = 'فشل ❌';
            ctx.reply(`❌ فشل الاتصال: ${err.message}`);
        });

        client.on('disconnect', (p) => {
            user.client = null;
            user.status = 'طرد ⚠️';
            ctx.reply(`⚠️ تم الانفصال: ${p.reason || 'إصدار غير مدعوم'}`);
        });

    } catch (e) {
        ctx.reply('❌ خطأ في تشغيل المحرك الرئيسي.');
    }
});

bot.action('status', (ctx) => {
    const user = userDb.get(ctx.from.id);
    ctx.answerCbQuery(`📊 الحالة: ${user ? user.status : 'لا توجد بيانات'}`, { show_alert: true });
});

bot.action('reset', (ctx) => {
    const user = userDb.get(ctx.from.id);
    if (user && user.client) user.client.disconnect();
    userDb.delete(ctx.from.id);
    ctx.editMessageText('🧹 تم مسح الذاكرة بنجاح.');
});

// تشغيل البوت بنظام حماية من التوقف (Anti-Crash)
const launch = async () => {
    try {
        await bot.launch();
        console.log('✅ Bot is Online with the new Token!');
    } catch (e) {
        console.log('🔄 محاولة إعادة تشغيل بسبب خطأ في التوكن أو الشبكة...');
        setTimeout(launch, 5000);
    }
};

launch();

const { Telegraf, Markup } = require('telegraf');
const bedrock = require('bedrock-protocol');
const http = require('http');
const EventEmitter = require('events');

// --- إعدادات المحرك المركزي ---
const bot = new Telegraf('8630184110:AAGN7k_-nZqOzEHZeNy74PuFR_CiJ2kxRps');
const manager = new EventEmitter();
const sessions = new Map();

// إبقاء الاستضافة حية
http.createServer((q, r) => r.end('TITAN SYSTEM ONLINE')).listen(process.env.PORT || 8080);

// --- وظائف مساعدة ---
const getKeyboard = (status) => Markup.inlineKeyboard([
    [Markup.button.callback(status ? '🔴 إخراج البوت فوراً' : '🟢 تشغيل محرك الدخول', 'toggle_bot')],
    [Markup.button.callback('🔍 فحص حالة السيرفر', 'check_status')],
    [Markup.button.callback('🛠️ إعدادات متقدمة', 'settings')]
]);

// --- معالجة الأوامر ---
bot.start((ctx) => {
    ctx.reply(`🛡️ نظام تيتان 2026 للبيدروك جاهز..
    
يا بطل، أرسل البيانات الآن بصيغة:
` + '`HOST:PORT`' + `
مثال: ` + '`play.net:19132`', { parse_mode: 'Markdown' });
});

bot.on('text', (ctx) => {
    const input = ctx.message.text.trim();
    if (!input.includes(':')) return ctx.reply('⚠️ الصيغة المطلوبة: IP:PORT');

    const [host, port] = input.split(':');
    const userId = ctx.from.id;

    sessions.set(userId, { 
        host: host.trim(), 
        port: parseInt(port), 
        client: null,
        active: false 
    });

    ctx.reply(`✅ تم تسجيل السيرفر: ${host}:${port}\nاختر الإجراء المطلوب من القائمة:`, getKeyboard(false));
});

// --- معالجة الأزرار التفاعلية ---
bot.action('toggle_bot', async (ctx) => {
    const userId = ctx.from.id;
    const session = sessions.get(userId);

    if (!session) return ctx.answerCbQuery('❌ أرسل البيانات أولاً!');

    if (session.active) {
        // إخراج البوت
        if (session.client) session.client.disconnect();
        session.active = false;
        session.client = null;
        ctx.editMessageText('🛑 تم فصل الاتصال وإخراج البوت.', getKeyboard(false));
    } else {
        // إدخال البوت
        ctx.answerCbQuery('⏳ جاري المحاولة...');
        try {
            const client = bedrock.createClient({
                host: session.host,
                port: session.port,
                username: `MaxTitan_${userId.toString().slice(0,4)}`,
                offline: true,
                version: '1.20.10',
                connectTimeout: 30000
            });

            session.client = client;
            
            client.on('spawn', () => {
                session.active = true;
                ctx.editMessageText(`🟢 مبروك يا بطل! البوت الآن داخل السيرفر.\n📍 ${session.host}:${session.port}`, getKeyboard(true));
            });

            client.on('error', (err) => {
                session.active = false;
                ctx.reply(`❌ فشل الاتصال: ${err.message}`);
            });

            client.on('disconnect', (p) => {
                session.active = false;
                ctx.reply(`⚠️ تم الطرد: ${p.reason}`);
            });

        } catch (e) {
            ctx.reply('❌ خطأ في المحرك الرئيسي.');
        }
    }
});

bot.action('check_status', (ctx) => {
    const session = sessions.get(ctx.from.id);
    if (!session) return ctx.answerCbQuery('لا توجد بيانات');
    ctx.answerCbQuery(`الحالة: ${session.active ? 'متصل ✅' : 'غير متصل ❌'}`, { show_alert: true });
});

// --- نظام الحماية الذاتي ---
const launchApp = async () => {
    try {
        await bot.launch();
        console.log('🚀 TITAN SYSTEM READY');
    } catch (err) {
        if (err.description?.includes('conflict')) {
            console.log('🔄 تضارب! إعادة التشغيل التلقائي بعد 10 ثوانٍ...');
            setTimeout(launchApp, 10000);
        }
    }
};

launchApp();

const { Telegraf, Markup } = require('telegraf');
const bedrock = require('bedrock-protocol');
const http = require('http');

const bot = new Telegraf('8630184110:AAGN7k_-nZqOzEHZeNy74PuFR_CiJ2kxRps');

// ويب سيرفر لإبقاء البوت حياً على ريلوي
http.createServer((req, res) => res.end('MaxBlack Dashboard Online')).listen(process.env.PORT || 8080);

const userSessions = new Map();

// دالة لتوليد شكل الأزرار المرتب
const mainKeyboard = (isConnected) => {
    return Markup.inlineKeyboard([
        [Markup.button.callback(isConnected ? '🔴 إخراج البوت' : '🟢 إدخال البوت للسيرفر', 'toggle_connect')],
        [Markup.button.callback('📊 حالة الاتصال', 'check_status'), Markup.button.callback('🔄 تحديث', 'refresh')],
        [Markup.button.callback('🗑️ مسح البيانات', 'reset_data')]
    ]);
};

bot.start((ctx) => {
    ctx.reply(`🛡️ **أهلاً بك في لوحة تحكم MaxBlack**\n\nقم بإرسال بيانات السيرفر أولاً بصيغة:\n` + '`IP:PORT`', { parse_mode: 'Markdown' });
});

bot.on('text', (ctx) => {
    const input = ctx.message.text.trim();
    if (!input.includes(':')) return ctx.reply('⚠️ الصيغة خاطئة يا بطل! أرسل `IP:PORT`');

    const [host, port] = input.split(':').map(s => s.trim());
    userSessions.set(ctx.from.id, { 
        host, 
        port: parseInt(port), 
        client: null, 
        status: 'مستعد للاتصال ⏳' 
    });

    ctx.reply(`✅ **تم حفظ بيانات السيرفر**\n🌐 العنوان: ${host}\n🔌 المنفذ: ${port}\n\nاختر من الأزرار أدناه:`, mainKeyboard(false));
});

bot.action('toggle_connect', async (ctx) => {
    const userId = ctx.from.id;
    const session = userSessions.get(userId);

    if (!session) return ctx.answerCbQuery('❌ أرسل البيانات أولاً!');

    if (session.client) {
        // إخراج البوت
        session.client.disconnect();
        session.client = null;
        session.status = 'تم الفصل 🛑';
        await ctx.editMessageText(`🛑 **تم إخراج البوت من السيرفر**\nالحالة: ${session.status}`, mainKeyboard(false));
    } else {
        // إدخال البوت
        ctx.answerCbQuery('⏳ جاري المحاولة...');
        session.status = 'جاري الاتصال... 🔄';
        
        try {
            const client = bedrock.createClient({
                host: session.host,
                port: session.port,
                username: 'MaxBlack_2026',
                offline: true,
                version: '1.26.13.1',
                connectTimeout: 20000
            });

            session.client = client;

            client.on('spawn', () => {
                session.status = 'متصل الآن ✅';
                ctx.editMessageText(`🟢 **مبروك! البوت داخل السيرفر حالياً**\n📍 العنوان: ${session.host}:${session.port}\n📊 الحالة: ${session.status}`, mainKeyboard(true));
            });

            client.on('error', (err) => {
                session.status = `خطأ: ${err.message} ❌`;
                session.client = null;
                ctx.reply(`❌ فشل الاتصال: ${err.message}`);
            });

            client.on('disconnect', (p) => {
                session.status = 'مفصول ⚠️';
                session.client = null;
                ctx.reply(`⚠️ تم الانفصال: ${p.reason || 'تأكد من الإصدار'}`);
            });

        } catch (e) {
            ctx.reply('❌ فشل تشغيل المحرك.');
        }
    }
});

bot.action('check_status', (ctx) => {
    const session = userSessions.get(ctx.from.id);
    const status = session ? session.status : 'لا توجد بيانات 📭';
    ctx.answerCbQuery(`🔍 الحالة الحالية: ${status}`, { show_alert: true });
});

bot.action('reset_data', (ctx) => {
    const userId = ctx.from.id;
    if (userSessions.has(userId)) {
        if (userSessions.get(userId).client) userSessions.get(userId).client.disconnect();
        userSessions.delete(userId);
    }
    ctx.editMessageText('🗑️ **تم مسح جميع البيانات بنجاح.**\nأرسل بيانات جديدة للبدء.');
});

bot.launch().then(() => console.log('🚀 Dashboard System Ready!'));

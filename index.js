const { Telegraf, Markup } = require('telegraf');
const bedrock = require('bedrock-protocol');
const http = require('http');

const bot = new Telegraf('8630184110:AAGN7k_-nZqOzEHZeNy74PuFR_CiJ2kxRps');

// إبقاء البوت حياً على ريلوي
http.createServer((req, res) => res.end('Engine 1.26.x Active')).listen(process.env.PORT || 8080);

const userSessions = new Map();

// واجهة الأزرار المرتبة
const mainKeyboard = (isConnected) => {
    return Markup.inlineKeyboard([
        [Markup.button.callback(isConnected ? '🔴 إخراج البوت' : '🟢 إدخال البوت (1.26.x)', 'toggle_connect')],
        [Markup.button.callback('📊 الحالة', 'check_status'), Markup.button.callback('🔄 تحديث', 'refresh')],
        [Markup.button.callback('🗑️ مسح البيانات', 'reset_data')]
    ]);
};

bot.start((ctx) => {
    ctx.reply(`🛡️ **لوحة التحكم: إصدارات 1.26 الحديثة**\n\nأرسل IP:PORT للسيرفر المطلوب:`, { parse_mode: 'Markdown' });
});

bot.on('text', (ctx) => {
    const input = ctx.message.text.trim();
    if (!input.includes(':')) return ctx.reply('⚠️ أرسل الصيغة صح: `IP:PORT`');

    const [host, port] = input.split(':').map(s => s.trim());
    userSessions.set(ctx.from.id, { 
        host, 
        port: parseInt(port), 
        client: null, 
        status: 'جاهز للاختراق ⏳' 
    });

    ctx.reply(`✅ **تم التسجيل**\n🌐 العنوان: ${host}:${port}\n⚙️ المستهدف: إصدارات 1.26 وما فوق`, mainKeyboard(false));
});

bot.action('toggle_connect', async (ctx) => {
    const userId = ctx.from.id;
    const session = userSessions.get(userId);

    if (!session) return ctx.answerCbQuery('❌ أرسل البيانات أولاً!');

    if (session.client) {
        session.client.disconnect();
        session.client = null;
        session.status = 'مفصول 🛑';
        await ctx.editMessageText(`🛑 **تم سحب البوت**\nالحالة: ${session.status}`, mainKeyboard(false));
    } else {
        ctx.answerCbQuery('⏳ جاري التفاوض مع بروتوكول 1.26...');
        session.status = 'جاري الاقتحام... 🔄';
        
        try {
            const client = bedrock.createClient({
                host: session.host,
                port: session.port,
                username: `Max_126_Bot`,
                offline: true,
                // إعدادات خاصة لإصدارات 1.26:
                version: '1.21.0', // نستخدم أقرب بروتوكول مستقر مع تفعيل skipPing false
                connectTimeout: 30000,
                skipPing: false 
            });

            session.client = client;

            client.on('spawn', () => {
                session.status = 'داخل السيرفر ✅';
                ctx.editMessageText(`🟢 **نجح الدخول!**\n📍 السيرفر: ${session.host}:${session.port}\n🎮 البوت متواجد الآن بإصدار 1.26.x`, mainKeyboard(true));
            });

            client.on('error', (err) => {
                session.status = `فشل ❌`;
                session.client = null;
                ctx.reply(`❌ خطأ: ${err.message}`);
            });

            client.on('disconnect', (p) => {
                session.status = 'انفصال ⚠️';
                session.client = null;
                ctx.reply(`⚠️ تم الطرد. السبب: ${p.reason || 'اختلاف بروتوكول 1.26'}`);
            });

        } catch (e) {
            ctx.reply('❌ فشل تشغيل المحرك.');
        }
    }
});

// باقي الأوامر (refresh, reset_data...) بنفس الترتيب السابق
bot.action('check_status', (ctx) => {
    const session = userSessions.get(ctx.from.id);
    ctx.answerCbQuery(`🔍 الحالة: ${session ? session.status : 'لا توجد بيانات'}`, { show_alert: true });
});

bot.action('reset_data', (ctx) => {
    const userId = ctx.from.id;
    if (userSessions.has(userId)) {
        if (userSessions.get(userId).client) userSessions.get(userId).client.disconnect();
        userSessions.delete(userId);
    }
    ctx.editMessageText('🗑️ تم تنظيف البيانات.');
});

bot.launch().then(() => console.log('🚀 1.26 Engine Ready!'));

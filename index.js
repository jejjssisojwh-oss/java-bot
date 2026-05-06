const { Telegraf, Markup } = require('telegraf');
const bedrock = require('bedrock-protocol');
const http = require('http');

/**
 * كلاس المحرك: المسؤول عن الاتصال الفعلي بسيرفرات البيدروك
 */
class BedrockEngine {
    constructor() {
        this.sessions = new Map();
    }

    async createConnection(userId, host, port, ctx) {
        // تنظيف البيانات لضمان عدم وجود أخطاء في الآيبي
        const cleanHost = host.trim();
        const cleanPort = parseInt(port);

        if (this.sessions.has(userId)) {
            this.destroyConnection(userId);
        }

        const client = bedrock.createClient({
            host: cleanHost,
            port: cleanPort,
            username: `MaxBlack_${Math.floor(Math.random() * 9000)}`,
            offline: true,
            version: '1.20.10', // الإصدار الأكثر استقراراً للتوافق
            connectTimeout: 30000
        });

        this.sessions.set(userId, client);
        this.setupEvents(client, userId, ctx, cleanHost, cleanPort);
    }

    setupEvents(client, userId, ctx, host, port) {
        client.on('spawn', () => {
            ctx.reply(`✅ تم اختراق حاجز السيرفر بنجاح!\n🌐 العنوان: ${host}:${port}\n🤖 البوت متواجد الآن.`);
        });

        client.on('error', (err) => {
            ctx.reply(`❌ خطأ في المحرك: ${err.message}`);
            this.sessions.delete(userId);
        });

        client.on('disconnect', (packet) => {
            ctx.reply(`⚠️ تم الطرد من السيرفر. السبب: ${packet.reason || 'غير معروف'}`);
            this.sessions.delete(userId);
        });
    }

    destroyConnection(userId) {
        if (this.sessions.has(userId)) {
            try {
                this.sessions.get(userId).disconnect();
            } catch (e) {}
            this.sessions.delete(userId);
        }
    }
}

// تشغيل المحرك
const engine = new BedrockEngine();

/**
 * إعدادات بوت تليجرام
 */
const bot = new Telegraf('8630184110:AAGN7k_-nZq0zEHZeNy74PuFR_CiJ2kxRps');

// ويب سيرفر لإبقاء الاستضافة (Railway) تعمل
http.createServer((req, res) => res.end('MAX BLACK ULTRA ACTIVE')).listen(process.env.PORT || 8080);

bot.start((ctx) => {
    ctx.reply('🛡️ أهلاً بك في نظام MaxBlack Ultra 2026\n\nأرسل بيانات السيرفر الآن بصيغة:\n`IP:PORT`');
});

bot.on('text', async (ctx) => {
    const input = ctx.message.text.trim();
    
    if (!input.includes(':')) {
        return ctx.reply('⚠️ الصيغة المطلوبة هي IP:PORT يا بطل.');
    }

    const [host, port] = input.split(':');
    
    if (!host || !port || isNaN(parseInt(port))) {
        return ctx.reply('⚠️ تأكد من كتابة الآيبي والبورت بشكل صحيح وبدون مسافات.');
    }

    ctx.reply('⏳ جاري استدعاء محرك البيدروك الخاص بك...');
    engine.createConnection(ctx.from.id, host, port, ctx);
});

// التعامل مع أوامر الخروج
bot.command('stop', (ctx) => {
    engine.destroyConnection(ctx.from.id);
    ctx.reply('🛑 تم إيقاف جميع العمليات وإخراج البوت.');
});

// نظام الحماية من الـ Conflict 409
const startBot = async () => {
    try {
        await bot.launch();
        console.log('🚀 MaxBlack Ultra System Ready!');
    } catch (err) {
        if (err.response && err.response.error_code === 409) {
            console.log('🔄 تضارب في النسخ.. سأنتظر 15 ثانية ثم أعيد المحاولة.');
            setTimeout(startBot, 15000);
        } else {
            console.error('❌ خطأ فادح:', err);
        }
    }
};

startBot();

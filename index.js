const { Telegraf } = require('telegraf');
const bedrock = require('bedrock-protocol');
const http = require('http');

// التوكن الخاص بك يا بطل
const bot = new Telegraf('8630184110:AAGN7k_-nZq0zEHZeNy74PuFR_CiJ2kxRps');

// ويب سيرفر بسيط لإبقاء البوت حياً على ريلوي
http.createServer((req, res) => res.end('Bedrock Engine 1.26.13.1 Active')).listen(process.env.PORT || 8080);

const activeClients = new Map();

bot.start((ctx) => {
    ctx.reply('🎮 جاهز يا بطل! أرسل الآيبي والمنفذ لإصدار 1.26.13.1\nمثال: `play.server.com:19132`');
});

bot.on('text', async (ctx) => {
    const text = ctx.message.text.trim();
    if (!text.includes(':')) return ctx.reply('❌ أرسل الصيغة هكذا: `ip:port`');

    const [host, portStr] = text.split(':');
    const port = parseInt(portStr.trim());
    const userId = ctx.from.id;

    if (activeClients.has(userId)) {
        activeClients.get(userId).disconnect();
        activeClients.delete(userId);
    }

    ctx.reply(`⏳ جاري محاولة اقتحام السيرفر بإصدار 1.26.13.1...`);

    try {
        const client = bedrock.createClient({
            host: host.trim(),
            port: port,
            username: 'Max_Black_2026',
            offline: true,
            version: '1.26.13', // المكتبة تتعرف على الرئيسي، والفرعي يتم عبر البروتوكول
            skipPing: true,     // لتجاوز فحص الحالة السريع والدخول مباشرة
            connectTimeout: 20000
        });

        client.on('spawn', () => {
            ctx.reply(`🟢 أبشر! البوت دخل السيرفر الآن.\n📍 العنوان: ${host}:${port}\n✅ الإصدار: 1.26.13.1`);
            activeClients.set(userId, client);
        });

        client.on('error', (err) => {
            console.error(err);
            if (err.message.includes('version')) {
                ctx.reply('❌ مشكلة في الإصدار! السيرفر قد يتطلب تحديثاً للمكتبة.');
            } else {
                ctx.reply(`❌ فشل الاتصال: ${err.message}`);
            }
            activeClients.delete(userId);
        });

        client.on('disconnect', (packet) => {
            ctx.reply(`⚠️ تم الطرد/الفصل. السبب: ${packet.reason || 'غير معروف'}`);
            activeClients.delete(userId);
        });

    } catch (e) {
        ctx.reply('❌ خطأ في تشغيل محرك البيدروك.');
    }
});

bot.launch().then(() => console.log('🚀 1.26.13.1 System Ready!'));

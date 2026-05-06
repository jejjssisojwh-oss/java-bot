const { Telegraf, Markup } = require('telegraf');
const bedrock = require('bedrock-protocol');
const http = require('http');

// التوكن الخاص بك يا بطل
const bot = new Telegraf('8630184110:AAGN7k_-nZq0zEHZeNy74PuFR_CiJ2kxRps');

// لإبقاء ريلوي يعمل
http.createServer((req, res) => res.end('System v2 Online')).listen(process.env.PORT || 8080);

const activeClients = new Map();

// واجهة التحكم المبسطة
const menu = Markup.inlineKeyboard([
    [Markup.button.callback('🚀 دخول السيرفر', 'JOIN')],
    [Markup.button.callback('🛑 خروج', 'LEAVE')]
]);

bot.start((ctx) => ctx.reply('🎮 نظام البيدروك v2 جاهز! أرسل IP و Port السيرفر الآن.', menu));

// معالجة الرسائل النصية (IP:PORT)
bot.on('text', async (ctx) => {
    const msg = ctx.message.text;
    if (msg.includes(':')) {
        const [ip, port] = msg.split(':');
        ctx.reply(`✅ تم استلام السيرفر: ${ip}:${port}\nاضغط "دخول" للبدء.`, menu);
        // حفظ الإعدادات مؤقتاً في الجلسة
        ctx.session = { host: ip.trim(), port: parseInt(port.trim()) };
    }
});

bot.action('JOIN', async (ctx) => {
    if (!ctx.session || !ctx.session.host) return ctx.answerCbQuery('❌ أرسل IP السيرفر أولاً!');
    
    const { host, port } = ctx.session;
    const userId = ctx.from.id;

    if (activeClients.has(userId)) return ctx.answerCbQuery('⚠️ البوت متصل بالفعل!');

    ctx.reply(`⏳ جاري محاولة الدخول لإصدار 1.26.13...`);

    try {
        const client = bedrock.createClient({
            host: host,
            port: port,
            username: 'Max_Black_V2',
            offline: true,
            version: '1.26.13' // الإصدار المطلوب
        });

        client.on('spawn', () => {
            ctx.reply('🟢 أبشر! البوت دخل السيرفر بنجاح وهو الآن مستيقظ هناك.');
            activeClients.set(userId, client);
        });

        client.on('error', (err) => {
            console.error(err);
            ctx.reply(`❌ فشل الاتصال: ${err.message}`);
            activeClients.delete(userId);
        });

        client.on('disconnect', (packet) => {
            ctx.reply(`🔴 تم الفصل من السيرفر. السبب: ${packet.reason}`);
            activeClients.delete(userId);
        });

    } catch (e) {
        ctx.reply('❌ خطأ غير متوقع في محرك الاتصال.');
    }
});

bot.action('LEAVE', (ctx) => {
    const client = activeClients.get(ctx.from.id);
    if (client) {
        client.disconnect();
        activeClients.delete(ctx.from.id);
        ctx.reply('🛑 تم إخراج البوت بنجاح.');
    } else {
        ctx.answerCbQuery('❌ البوت غير متصل أصلاً!');
    }
});

// التعامل مع أخطاء التضارب 409
bot.launch().then(() => console.log('🚀 v2 System Ready!')).catch(err => {
    if (err.description?.includes('conflict')) {
        console.log('🔄 تضارب في النسخ.. أوقف البوت في أي مكان آخر ثم انتظر دقيقة.');
    }
});

const { Telegraf, Markup } = require('telegraf');
const bedrock = require('bedrock-protocol');
const http = require('http');

// المحرك الرئيسي
const bot = new Telegraf('8630184110:AAGN7k_-nZq0zEHZeNy74PuFR_CiJ2kxRps');

// ويب سيرفر احترافي لريلوي
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('MaxBlack Engine is Running...');
}).listen(process.env.PORT || 8080);

const db = new Map();

// --- تصميم الأزرار الجديد (لوحة تحكم عريضة) ---
const drawMenu = (online) => Markup.inlineKeyboard([
    [Markup.button.callback(online ? '❌ سحب البوت وإغلاق المنفذ' : '🚀 تشغيل بروتوكول الاقتحام', 'switch')],
    [Markup.button.callback('🔍 فحص النبض', 'ping'), Markup.button.callback('🛠️ إرسال تحديث', 'update')],
    [Markup.button.callback('🧹 تنظيف الذاكرة', 'wipe')]
]);

bot.start((ctx) => {
    ctx.reply(`🎛️ **نظام MaxBlack للتحكم بالسيرفرات**\n\nأرسل الآيبي والمنفذ الآن يا بطل:\n` + '`IP:PORT`', { parse_mode: 'Markdown' });
});

bot.on('text', (ctx) => {
    const data = ctx.message.text.split(':');
    if (data.length !== 2) return ctx.reply('⚠️ اكتبها كذا: `ip:port`');
    
    db.set(ctx.from.id, { host: data[0].trim(), port: parseInt(data[1]), client: null });
    ctx.reply(`🛰️ **تم رصد الهدف**\n📍 العنوان: ${data[0].trim()}\n🔌 المنفذ: ${data[1].trim()}`, drawMenu(false));
});

bot.action('switch', async (ctx) => {
    const user = db.get(ctx.from.id);
    if (!user) return ctx.answerCbQuery('❌ لا توجد بيانات!');

    if (user.client) {
        user.client.disconnect();
        user.client = null;
        return ctx.editMessageText('🛑 **تم فصل الاتصال.**', drawMenu(false));
    }

    ctx.answerCbQuery('⚡ جاري كسر حماية السيرفر...');
    try {
        const client = bedrock.createClient({
            host: user.host,
            port: user.port,
            username: `Max_B_${Math.floor(Math.random() * 999)}`,
            offline: true,
            version: '1.21.0', 
            protocolVersion: 748, // أحدث بروتوكول لـ 1.26.x
            connectTimeout: 30000,
            skipPing: true
        });

        user.client = client;

        client.on('spawn', () => {
            ctx.editMessageText(`🟢 **تم الاقتحام بنجاح!**\nالبوت الآن داخل السيرفر ويتحرك.`, drawMenu(true));
        });

        client.on('error', (err) => {
            user.client = null;
            ctx.reply(`❌ فشل: ${err.message}`);
        });

        client.on('disconnect', (p) => {
            user.client = null;
            ctx.reply(`⚠️ طرد: ${p.reason || 'بروتوكول غير متوافق'}`);
        });

    } catch (e) { ctx.reply('❌ خطأ في المحرك.'); }
});

bot.action('ping', (ctx) => ctx.answerCbQuery('📡 النظام يعمل بكفاءة 100%'));

bot.action('wipe', (ctx) => {
    db.delete(ctx.from.id);
    ctx.editMessageText('🧹 **تم تصفير البيانات.**');
});

// --- حل مشكلة "البوت لا يرد" (التصادم) ---
const run = async () => {
    try {
        await bot.launch();
        console.log('✅ Bot is Online and Responding!');
    } catch (e) {
        if (e.response && e.response.error_code === 409) {
            console.log('🔄 تضارب! جاري إعادة التشغيل...');
            setTimeout(run, 5000);
        }
    }
};

run();

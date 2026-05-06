const { Telegraf, Markup } = require('telegraf');
const bedrock = require('bedrock-protocol');
const http = require('http');

// ⚠️ ضع التوكن الجديد هنا يا بطل
const bot = new Telegraf('8630184110:AAGN7k_-nZq0zEHZeNy74PuFR_CiJ2kxRps');

// ويب سيرفر بسيط لإبقاء البوت حياً على استضافة ريلوي
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Max Black Bedrock System 2026 is Online');
}).listen(process.env.PORT || 8080);

const activeClients = new Map();

// قائمة التحكم الرئيسية
const controlMenu = Markup.inlineKeyboard([
    [Markup.button.callback('🛑 قطع الاتصال بالبوت', 'LEAVE')]
]);

bot.start((ctx) => {
    ctx.reply(`🎮 أهلاً بك يا بطل في نظام البيدروك 2026!
    
الآن، أرسل عنوان السيرفر والمنفذ بهذا الشكل:
` + '`IP:PORT`' + `

مثال: ` + '`play.example.com:19132`', { parse_mode: 'Markdown' });
});

bot.on('text', async (ctx) => {
    const text = ctx.message.text.trim();
    
    // فحص صيغة الإدخال وتنظيفها من المسافات
    if (!text.includes(':')) {
        return ctx.reply('❌ الصيغة خاطئة! يجب أن تكون (الآيبي:البورت)');
    }

    const [rawHost, rawPort] = text.split(':');
    const host = rawHost.trim();
    const port = parseInt(rawPort.trim());

    if (isNaN(port)) {
        return ctx.reply('❌ رقم البورت غير صحيح، تأكد أنه أرقام فقط.');
    }

    const userId = ctx.from.id;

    // إذا كان هناك اتصال قديم لنفس المستخدم، نقوم بإغلاقه
    if (activeClients.has(userId)) {
        try { activeClients.get(userId).disconnect(); } catch (e) {}
        activeClients.delete(userId);
    }

    ctx.reply(`⏳ جاري محاولة دخول السيرفر بإصدار 1.26.13.1...`);

    try {
        const client = bedrock.createClient({
            host: host,
            port: port,
            username: 'Max_Black_2026', // يمكنك تغيير اسم البوت هنا
            offline: true,
            version: '1.20.10', // هذا الإصدار المستقر يتوافق مع معظم سيرفرات 1.26.x
            connectTimeout: 25000
        });

        client.on('spawn', () => {
            ctx.reply(`🟢 أبشر! تم الدخول بنجاح لـ ${host}:${port}\nالبوت الآن متواجد في السيرفر.`, controlMenu);
            activeClients.set(userId, client);
        });

        client.on('error', (err) => {
            console.error('Connection Error:', err.message);
            let errorMsg = `❌ فشل الاتصال: `;
            if (err.message.includes('ENOTFOUND')) errorMsg += "الآيبي غير موجود.";
            else if (err.message.includes('ETIMEDOUT')) errorMsg += "انتهت مهلة الاتصال (السيرفر مغلق).";
            else errorMsg += err.message;
            
            ctx.reply(errorMsg);
            activeClients.delete(userId);
        });

        client.on('disconnect', (packet) => {
            ctx.reply(`⚠️ تم الفصل من السيرفر. السبب: ${packet.reason || 'غير معروف'}`);
            activeClients.delete(userId);
        });

    } catch (e) {
        ctx.reply(`❌ خطأ مفاجئ في تشغيل المحرك: ${e.message}`);
    }
});

bot.action('LEAVE', (ctx) => {
    const client = activeClients.get(ctx.from.id);
    if (client) {
        client.disconnect();
        activeClients.delete(ctx.from.id);
        ctx.reply('🛑 تم إخراج البوت من السيرفر بنجاح.');
    } else {
        ctx.answerCbQuery('البوت غير متصل حالياً!');
    }
});

// تشغيل البوت مع نظام حماية من الـ Conflict (409)
bot.launch().then(() => {
    console.log('✅ Java Bot 2026 is Ready!');
}).catch((err) => {
    if (err.response && err.response.error_code === 409) {
        console.log('🔄 تضارب في النسخ، جاري إعادة المحاولة خلال 10 ثوانٍ...');
        setTimeout(() => bot.launch(), 10000);
    } else {
        console.error('❌ خطأ في تشغيل تليجرام:', err);
    }
});

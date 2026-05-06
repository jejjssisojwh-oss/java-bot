const { Telegraf, Markup } = require('telegraf');
const bedrock = require('bedrock-protocol');
const http = require('http');

const bot = new Telegraf('8630184110:AAGN7k_-nZqOzEHZeNy74PuFR_CiJ2kxRps');

http.createServer((req, res) => res.end('Protocol 1.26 Fixed')).listen(process.env.PORT || 8080);

const userSessions = new Map();

const mainKeyboard = (isConnected) => {
    return Markup.inlineKeyboard([
        [Markup.button.callback(isConnected ? '🔴 إخراج البوت' : '🟢 إدخال البوت (قوة 1.26)', 'toggle_connect')],
        [Markup.button.callback('📊 الحالة', 'check_status'), Markup.button.callback('🔄 تحديث', 'refresh')],
        [Markup.button.callback('🗑️ مسح البيانات', 'reset_data')]
    ]);
};

bot.start((ctx) => {
    ctx.reply(`🛡️ **لوحة التحكم المتقدمة لـ 1.26.13.1**\n\nأرسل IP:PORT الآن:`, { parse_mode: 'Markdown' });
});

bot.on('text', (ctx) => {
    const input = ctx.message.text.trim();
    if (!input.includes(':')) return ctx.reply('⚠️ أرسل الصيغة صح: `IP:PORT`');
    const [host, port] = input.split(':').map(s => s.trim());
    userSessions.set(ctx.from.id, { host, port: parseInt(port), client: null, status: 'جاهز ⏳' });
    ctx.reply(`✅ **تم التسجيل**\n🌐 العنوان: ${host}:${port}`, mainKeyboard(false));
});

bot.action('toggle_connect', async (ctx) => {
    const userId = ctx.from.id;
    const session = userSessions.get(userId);
    if (!session) return ctx.answerCbQuery('❌ أرسل البيانات أولاً!');

    if (session.client) {
        session.client.disconnect();
        session.client = null;
        session.status = 'مفصول 🛑';
        await ctx.editMessageText(`🛑 **تم إخراج البوت**`, mainKeyboard(false));
    } else {
        ctx.answerCbQuery('⏳ جاري تخطي فحص الإصدار...');
        try {
            const client = bedrock.createClient({
                host: session.host,
                port: session.port,
                username: `Max_126_Pro`,
                offline: true,
                // --- التعديل الجوهري هنا ---
                version: '1.21.0', // نستخدم هذا الإصدار كقاعدة
                protocolVersion: 712, // هذا هو رقم البروتوكول التقريبي لإصدارات 1.26
                // ---------------------------
                connectTimeout: 30000,
                skipPing: true // نتجاوز البينج لأنه هو من يسبب خطأ Unsupported Version
            });

            session.client = client;

            client.on('spawn', () => {
                session.status = 'متصل ✅';
                ctx.editMessageText(`🟢 **نجح الاقتحام!**\nالبوت الآن داخل سيرفر 1.26.13.1 بنجاح.`, mainKeyboard(true));
            });

            client.on('error', (err) => {
                session.client = null;
                ctx.reply(`❌ خطأ: ${err.message}`);
            });

            client.on('disconnect', (p) => {
                session.client = null;
                ctx.reply(`⚠️ انفصال: ${p.reason || 'تأكد من إعدادات السيرفر'}`);
            });

        } catch (e) { ctx.reply('❌ فشل المحرك.'); }
    }
});

// الأزرار الفرعية
bot.action('check_status', (ctx) => {
    const session = userSessions.get(ctx.from.id);
    ctx.answerCbQuery(`الحالة: ${session ? session.status : 'لا يوجد'}`, { show_alert: true });
});

bot.action('reset_data', (ctx) => {
    userSessions.delete(ctx.from.id);
    ctx.editMessageText('🗑️ تم تنظيف البيانات.');
});

bot.launch().then(() => console.log('🚀 1.26.13.1 Fixed Engine Ready!'));

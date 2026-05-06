const { Telegraf, Markup } = require('telegraf');
const bedrock = require('bedrock-protocol');
const http = require('http');

const bot = new Telegraf('8630184110:AAGN7k_-nZqOzEHZeNy74PuFR_CiJ2kxRps');

http.createServer((req, res) => res.end('Protocol 1.26.x Forced')).listen(process.env.PORT || 8080);

const userSessions = new Map();

const mainKeyboard = (isConnected) => {
    return Markup.inlineKeyboard([
        [Markup.button.callback(isConnected ? '🔴 إخراج البوت' : '⚡ اقتحام السيرفر (بروتوكول حديث)', 'toggle_connect')],
        [Markup.button.callback('📊 الحالة', 'check_status'), Markup.button.callback('🔄 تحديث', 'refresh')],
        [Markup.button.callback('🗑️ مسح البيانات', 'reset_data')]
    ]);
};

bot.on('text', (ctx) => {
    const input = ctx.message.text.trim();
    if (!input.includes(':')) return; 
    const [host, port] = input.split(':').map(s => s.trim());
    userSessions.set(ctx.from.id, { host, port: parseInt(port), client: null, status: 'انتظار ⏳' });
    ctx.reply(`✅ **تم تجهيز المحرك**\n📍 الهدف: ${host}:${port}\n🚀 النظام: إجبار البروتوكول الحديث`, mainKeyboard(false));
});

bot.action('toggle_connect', async (ctx) => {
    const userId = ctx.from.id;
    const session = userSessions.get(userId);
    if (!session) return;

    if (session.client) {
        session.client.disconnect();
        session.client = null;
        await ctx.editMessageText(`🛑 تم الفصل.`, mainKeyboard(false));
    } else {
        ctx.answerCbQuery('🚀 جاري إجبار السيرفر على القبول...');
        try {
            const client = bedrock.createClient({
                host: session.host,
                port: session.port,
                // اسم عشوائي لتجنب التعرف على البوت
                username: `Max_${Math.floor(Math.random() * 9999)}`,
                offline: true,
                // --- رفع رقم البروتوكول لأقصى درجة ---
                version: '1.21.0', 
                protocolVersion: 748, // رقم بروتوكول حديث جداً لتخطي outdated_client
                // ------------------------------------
                connectTimeout: 30000,
                skipPing: true 
            });

            session.client = client;

            client.on('spawn', () => {
                session.status = 'داخل السيرفر ✅';
                ctx.editMessageText(`🟢 **تم الاقتحام بنجاح!**\nالبوت الآن مستقر داخل السيرفر.`, mainKeyboard(true));
            });

            client.on('error', (err) => {
                session.client = null;
                ctx.reply(`❌ فشل: ${err.message}`);
            });

            client.on('disconnect', (p) => {
                session.client = null;
                // إذا ظهرت outdated_client مرة أخرى، سنرفع الرقم أكثر
                ctx.reply(`⚠️ تنبيه: ${p.reason || 'انفصال'}`);
            });

        } catch (e) { ctx.reply('❌ خطأ محرك.'); }
    }
});

bot.action('check_status', (ctx) => {
    const session = userSessions.get(ctx.from.id);
    ctx.answerCbQuery(`الحالة: ${session ? session.status : 'لا يوجد'}`, { show_alert: true });
});

bot.action('reset_data', (ctx) => {
    userSessions.delete(ctx.from.id);
    ctx.editMessageText('🗑️ البيانات نُظفت.');
});

bot.launch().catch(e => console.error(e));

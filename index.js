const { Telegraf, Markup } = require('telegraf');
const mineflayer = require('mineflayer');
const http = require('http');
const fs = require('fs');

// استخدم التوكن الجديد الخاص بك هنا
const bot = new Telegraf('8630184110:AAGN7k_-nZqOzEHZeNy74PuFR_CiJ2kxRps');

// --- نظام قاعدة البيانات ---
let servers = {};
if (fs.existsSync('servers.json')) {
    try { servers = JSON.parse(fs.readFileSync('servers.json')); } catch (e) { servers = {}; }
}
const saveDB = () => fs.writeFileSync('servers.json', JSON.stringify(servers, null, 2));

const clients = {};
const waitIP = {};

// إنشاء سيرفر ويب بسيط لإبقاء الخدمة حية في ريلوي
http.createServer((req, res) => res.end('MAX BLACK BEDROCK 2026 ACTIVE')).listen(process.env.PORT || 8080);

const mainMenu = () => Markup.inlineKeyboard([
  [Markup.button.callback('➕ إضافة سيرفر بيدروك', 'ADD')],
  [Markup.button.callback('📂 قائمة سيرفراتي', 'LIST')]
]);

bot.on('text', async (ctx) => {
  const uid = ctx.from.id;
  if (waitIP[uid]) {
    const text = ctx.message.text.trim();
    if (!text.includes(':')) return ctx.reply('❌ يا بطل، أرسل الصيغة هكذا ip:port');
    const [h, p] = text.split(':');
    servers[uid] = servers[uid] || [];
    servers[uid].push({ host: h.trim(), port: p.trim() });
    saveDB();
    delete waitIP[uid];
    return ctx.reply('✅ تم حفظ السيرفر بنجاح!', mainMenu());
  }
  if (ctx.message.text === '/start') ctx.reply('🎮 أهلاً بك في نظام تحكم البيدروك المتطور:', mainMenu());
});

bot.action('ADD', ctx => { waitIP[ctx.from.id] = true; ctx.answerCbQuery(); ctx.reply('📡 أرسل عنوان السيرفر والمنفذ (ip:port):'); });

bot.action('LIST', ctx => {
  const list = servers[ctx.from.id] || [];
  if (list.length === 0) return ctx.answerCbQuery('📭 لا توجد سيرفرات مضافة', { show_alert: true });
  const btns = list.map((s, i) => [Markup.button.callback(`📍 ${s.host}:${s.port}`, `SRV_${i}`)]);
  btns.push([Markup.button.callback('⬅️ رجوع', 'BACK')]);
  ctx.editMessageText('📂 اختر السيرفر المطلوب:', Markup.inlineKeyboard(btns));
});

bot.action(/^SRV_(\d+)$/, ctx => {
  const id = ctx.match[1]; const s = servers[ctx.from.id][id];
  const active = !!clients[`${ctx.from.id}_${id}`];
  const text = `🖥 سيرفر: ${s.host}:${s.port}\nالحالة: ${active ? '🟢 متصل' : '🔴 غير متصل'}`;
  const kb = Markup.inlineKeyboard([
    [Markup.button.callback(active ? '⏹ إخراج البوت' : '▶️ إدخال البوت', `TOGGLE_${id}`)],
    [Markup.button.callback('🗑 حذف السيرفر', `DELETE_${id}`)],
    [Markup.button.callback('⬅️ رجوع', 'LIST')]
  ]);
  ctx.editMessageText(text, kb);
});

// --- محرك الاتصال ببيدروك إصدار 1.26.13 ---
bot.action(/^TOGGLE_(\d+)$/, async ctx => {
  const id = ctx.match[1]; const uid = ctx.from.id; const s = servers[uid][id];
  const clientKey = `${uid}_${id}`;

  if (clients[clientKey]) {
    clients[clientKey].quit();
    delete clients[clientKey];
    return ctx.reply('🔴 تم إخراج البوت من السيرفر.');
  }

  ctx.answerCbQuery('⏳ جاري محاولة الدخول...');
  try {
    const mcBot = mineflayer.createBot({
      host: s.host,
      port: parseInt(s.port),
      username: 'Max_Black_2026',
      version: '1.26.13', // الإصدار الذي طلبته
      auth: 'offline',
      hideErrors: true,
      connectTimeout: 30000
    });

    clients[clientKey] = mcBot;

    mcBot.on('spawn', () => {
      ctx.reply(`✅ أبشر! البوت دخل السيرفر بنجاح وهو الآن متواجد.`);
    });

    mcBot.on('error', (err) => {
      console.log('Error:', err.message);
      delete clients[clientKey];
    });

    mcBot.on('kicked', (reason) => {
      ctx.reply(`⚠️ البوت طُرد من السيرفر. السبب: ${reason}`);
      delete clients[clientKey];
    });

  } catch (e) { ctx.reply('❌ فشل الاتصال بالسيرفر، تأكد من الـ IP والـ Port.'); }
});

bot.action('BACK', ctx => ctx.editMessageText('🎮 لوحة التحكم:', mainMenu()));

// تشغيل البوت مع معالجة الأخطاء لتجنب الـ Conflict
bot.launch().then(() => {
    console.log('✅ Java Bot 2026 is Ready!');
}).catch((err) => {
    if (err.response && err.response.error_code === 409) {
        console.log('⚠️ تضارب في البوت! النسخة القديمة لا تزال تعمل. سيتم إعادة المحاولة بعد قليل...');
        setTimeout(() => bot.launch(), 5000);
    } else {
        console.error('❌ خطأ في التشغيل:', err);
    }
});

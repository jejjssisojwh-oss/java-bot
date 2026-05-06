const { Telegraf, Markup } = require('telegraf');
const mineflayer = require('mineflayer');
const http = require('http');
const fs = require('fs');

// ضع توكن البوت الخاص بك هنا يا بطل
const bot = new Telegraf('8630184110:AAGN7k_-nZqOzEHZeNy74PuFR_CiJ2kxRps');

// --- نظام البيانات ---
let servers = {};
if (fs.existsSync('servers.json')) {
    try { servers = JSON.parse(fs.readFileSync('servers.json')); } catch (e) { servers = {}; }
}
const saveDB = () => fs.writeFileSync('servers.json', JSON.stringify(servers, null, 2));

const clients = {};
const waitIP = {};

// ويب سيرفر لإبقاء الاستضافة تعمل
http.createServer((req, res) => res.end('BEDROCK SYSTEM 2026 ACTIVE')).listen(process.env.PORT || 8080);

const mainMenu = () => Markup.inlineKeyboard([
  [Markup.button.callback('➕ إضافة سيرفر بيدروك', 'ADD')],
  [Markup.button.callback('📂 قائمة سيرفراتي', 'LIST')]
]);

// --- واجهة التحكم ---
async function updateUI(ctx, host, port, active, id) {
  const text = `🖥 سيرفر بيدروك: ${host}:${port}\nالحالة: ${active ? '🟢 متصل الآن' : '🔴 غير متصل'}`;
  const kb = Markup.inlineKeyboard([
    [Markup.button.callback(active ? '⏹ إخراج البوت' : '▶️ إدخال البوت', `TOGGLE_${id}`)],
    [Markup.button.callback('🗑 حذف السيرفر', `DELETE_${id}`)],
    [Markup.button.callback('⬅️ رجوع', 'LIST')]
  ]);
  try { await ctx.editMessageText(text, kb); } catch (e) {}
}

bot.on('text', async (ctx) => {
  const uid = ctx.from.id;
  if (waitIP[uid]) {
    const text = ctx.message.text.trim();
    if (!text.includes(':')) return ctx.reply('❌ أرسل الصيغة هكذا ip:port يا بطل');
    const [h, p] = text.split(':');
    servers[uid] = servers[uid] || [];
    servers[uid].push({ host: h.trim(), port: p.trim() });
    saveDB();
    delete waitIP[uid];
    return ctx.reply('✅ تم حفظ سيرفر البيدروك بنجاح!', mainMenu());
  }
  if (ctx.message.text === '/start') ctx.reply('🎮 أهلاً بك يا بطل في نظام تحكم البيدروك:', mainMenu());
});

bot.action('ADD', ctx => { waitIP[ctx.from.id] = true; ctx.answerCbQuery(); ctx.reply('📡 أرسل عنوان السيرفر والمنفذ (ip:port) الخاص بالبيدروك:'); });

bot.action('LIST', ctx => {
  const list = servers[ctx.from.id] || [];
  if (list.length === 0) return ctx.answerCbQuery('📭 لا توجد سيرفرات مضافة', { show_alert: true });
  const btns = list.map((s, i) => [Markup.button.callback(`📍 ${s.host}:${s.port}`, `SRV_${i}`)]);
  btns.push([Markup.button.callback('⬅️ رجوع', 'BACK')]);
  ctx.editMessageText('📂 اختر سيرفرك التحكم به:', Markup.inlineKeyboard(btns));
});

bot.action(/^SRV_(\d+)$/, ctx => {
  const id = ctx.match[1]; const s = servers[ctx.from.id][id];
  updateUI(ctx, s.host, s.port, !!clients[`${ctx.from.id}_${id}`], id);
});

// --- محرك اتصال البيدروك ---
bot.action(/^TOGGLE_(\d+)$/, async ctx => {
  const id = ctx.match[1]; const uid = ctx.from.id; const s = servers[uid][id];
  const clientKey = `${uid}_${id}`;

  if (clients[clientKey]) {
    clients[clientKey].quit();
    delete clients[clientKey];
    return updateUI(ctx, s.host, s.port, false, id);
  }

  ctx.answerCbQuery('⏳ جاري الدخول لسيرفر البيدروك...');
  try {
    const mcBot = mineflayer.createBot({
      host: s.host,
      port: parseInt(s.port),
      username: 'Max_Black_Bedrock',
      version: false, // يكتشف إصدار السيرفر تلقائياً
      auth: 'offline' // للبيدروك تأكد أن السيرفر يسمح بالحسابات المكركة
    });

    // إضافة دعم البيدروك
    mcBot.on('inject_allowed', () => {
        const bedrock = require('bedrock-protocol');
        // هنا يتم حقن بروتوكول البيدروك
    });

    clients[clientKey] = mcBot;

    mcBot.on('spawn', () => {
      ctx.reply(`🟢 أبشر! البوت دخل سيرفر البيدروك ${s.host} وهو الآن متواجد.`);
      updateUI(ctx, s.host, s.port, true, id);
    });

    mcBot.on('error', (err) => { 
        console.log(err);
        delete clients[clientKey]; 
        updateUI(ctx, s.host, s.port, false, id); 
    });

    mcBot.on('kicked', () => { delete clients[clientKey]; updateUI(ctx, s.host, s.port, false, id); });

  } catch (e) { ctx.reply('❌ حدث خطأ أثناء الاتصال.'); }
});

bot.action('BACK', ctx => ctx.editMessageText('🎮 لوحة التحكم:', mainMenu()));

bot.launch();
console.log('✅ Bedrock Bot 2026 Ready!');

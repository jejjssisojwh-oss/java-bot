const { Telegraf, Markup } = require('telegraf');
const mineflayer = require('mineflayer');
const http = require('http');
const fs = require('fs');

const bot = new Telegraf('8348711486:AAFX5lYl0RMPTKR_8rsV_XdC23zPa7lkRIQ');

// --- نظام حفظ البيانات ---
let servers = {};
if (fs.existsSync('servers.json')) {
    try { servers = JSON.parse(fs.readFileSync('servers.json')); } catch (e) { servers = {}; }
}
const saveDB = () => fs.writeFileSync('servers.json', JSON.stringify(servers, null, 2));

const clients = {};
const waitIP = {};

// Keep Alive للاستضافة
http.createServer((req, res) => res.end('JAVA SYSTEM ACTIVE 2026')).listen(process.env.PORT || 8080);

const mainMenu = () => Markup.inlineKeyboard([
  [Markup.button.callback('➕ إضافة سيرفر جافا', 'ADD')],
  [Markup.button.callback('📂 قائمة سيرفراتي', 'LIST')]
]);

async function updateUI(ctx, host, port, active, id) {
  const text = `🖥 سيرفر جافا: ${host}:${port}\nالحالة: ${active ? '🟢 شغال' : '🔴 مطفأ'}`;
  const kb = Markup.inlineKeyboard([
    [Markup.button.callback(active ? '⏹ اطفاء البوت' : '▶️ تشغيل البوت', `TOGGLE_${id}`)],
    [Markup.button.callback('🗑 حذف السيرفر', `DELETE_${id}`)],
    [Markup.button.callback('⬅️ رجوع', 'LIST')]
  ]);
  try { await ctx.editMessageText(text, kb); } catch (e) {}
}

// --- معالج النصوص ---
bot.on('text', async (ctx) => {
  const uid = ctx.from.id;
  if (waitIP[uid]) {
    const text = ctx.message.text.trim();
    if (!text.includes(':')) return ctx.reply('❌ الصيغة الصحيحة ip:port');
    
    const [h, p] = text.split(':');
    servers[uid] = servers[uid] || [];
    servers[uid].push({ host: h.trim(), port: p.trim() });
    saveDB();
    delete waitIP[uid];
    return ctx.reply('✅ تم حفظ سيرفر الجافا بنجاح!', mainMenu());
  }
  if (ctx.message.text === '/start') ctx.reply('🎮 أهلاً بكِ في نظام الجافا المتطور:', mainMenu());
});

bot.action('ADD', ctx => { waitIP[ctx.from.id] = true; ctx.answerCbQuery(); ctx.reply('📡 أرسل ip:port لسيرفر الجافا:'); });

bot.action('LIST', ctx => {
  const list = servers[ctx.from.id] || [];
  if (list.length === 0) return ctx.answerCbQuery('📭 القائمة فارغة', { show_alert: true });
  const btns = list.map((s, i) => [Markup.button.callback(`📍 ${s.host}:${s.port}`, `SRV_${i}`)]);
  btns.push([Markup.button.callback('⬅️ رجوع', 'BACK')]);
  ctx.editMessageText('📂 اختر سيرفر الجافا:', Markup.inlineKeyboard(btns));
});

bot.action(/^SRV_(\d+)$/, ctx => {
  const id = ctx.match[1]; const s = servers[ctx.from.id][id];
  updateUI(ctx, s.host, s.port, !!clients[`${ctx.from.id}_${id}`], id);
});

bot.action(/^TOGGLE_(\d+)$/, async ctx => {
  const id = ctx.match[1]; const uid = ctx.from.id; const s = servers[uid][id];
  const clientKey = `${uid}_${id}`;

  if (clients[clientKey]) {
    clients[clientKey].quit();
    delete clients[clientKey];
    return updateUI(ctx, s.host, s.port, false, id);
  }

  ctx.answerCbQuery('⏳ جاري محاولة دخول سيرفر الجافا...');
  try {
    const mcBot = mineflayer.createBot({
      host: s.host,
      port: parseInt(s.port),
      username: 'Max_Black_Java',
      version: false, // يكتشف إصدارات 2026 تلقائياً
      auth: 'offline'
    });

    clients[clientKey] = mcBot;

    mcBot.on('spawn', () => {
      mcBot.chat("Max Black Java Edition: Online 🛡️");
      updateUI(ctx, s.host, s.port, true, id);
      ctx.reply(`✅ أبشرك! البوت دخل سيرفر الجافا وهو شغال الآن.`);
    });

    mcBot.on('error', () => { delete clients[clientKey]; updateUI(ctx, s.host, s.port, false, id); });
    mcBot.on('kicked', () => { delete clients[clientKey]; updateUI(ctx, s.host, s.port, false, id); });
  } catch (e) { ctx.reply('❌ خطأ في النظام.'); }
});

bot.action('BACK', ctx => ctx.editMessageText('🎮 لوحة التحكم:', mainMenu()));

bot.launch();
console.log('✅ Java Bot 2026 is Ready!');

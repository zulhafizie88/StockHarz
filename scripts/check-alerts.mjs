// Checks the price alerts in data/alerts.json and sends a Telegram message when one triggers.
// Runs every 15 minutes during US market hours in GitHub Actions (.github/workflows/alerts.yml).
// Needs these repository secrets: FINNHUB_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID.
// An alert fires once when its condition becomes true, and fires again only after the
// condition has gone false and then true again (so you don't get a message every 15 minutes).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KEY = (process.env.FINNHUB_API_KEY || '').trim();
const TG = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
const CHAT = (process.env.TELEGRAM_CHAT_ID || '').trim();
const TEST = process.env.ALERTS_TEST === 'true';
const FINNHUB = process.env.FINNHUB_BASE || 'https://finnhub.io/api/v1';
const TG_BASE = process.env.TELEGRAM_BASE || 'https://api.telegram.org';
const [owner, repo] = (process.env.GITHUB_REPOSITORY || '/').split('/');
const appUrl = owner && repo ? `https://${owner.toLowerCase()}.github.io/${repo}/` : '';

const alertsFile = path.join(root, 'data', 'alerts.json');
const stateFile = path.join(root, 'data', 'alerts-state.json');
const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const money = v => '$' + Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = v => (v >= 0 ? '+' : '') + Number(v).toFixed(2) + '%';
const describe = a => a.type === 'above' ? `above ${money(a.value)}` : a.type === 'below' ? `below ${money(a.value)}` : a.type === 'up' ? `up ${a.value}% today` : `down ${a.value}% today`;
const isHit = (a, q) => (a.type === 'above' && q.c >= a.value) || (a.type === 'below' && q.c <= a.value) || (a.type === 'up' && q.dp >= a.value) || (a.type === 'down' && q.dp <= -a.value);
const alertId = a => a.id || `${a.symbol}-${a.type}-${a.value}`;

async function telegram(text) {
  const r = await fetch(`${TG_BASE}/bot${TG}/sendMessage`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.ok) throw new Error(`Telegram said: ${j.description || r.status}. Check TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID, and that you pressed Start in your bot.`);
}

if (!TG || !CHAT) { console.error('TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set. Add them as repository secrets.'); process.exit(1); }

const list = (readJson(alertsFile, { alerts: [] }).alerts || [])
  .filter(a => a && /^[A-Z0-9.\-]{1,12}$/.test(String(a.symbol || '').toUpperCase()) && ['above', 'below', 'up', 'down'].includes(a.type) && isFinite(+a.value))
  .map(a => ({ ...a, symbol: String(a.symbol).toUpperCase(), value: +a.value }));

if (TEST) {
  await telegram(`✅ <b>StockHarz</b> is connected. You have ${list.length} alert${list.length === 1 ? '' : 's'} in data/alerts.json:\n` + (list.map(a => `• ${a.symbol} ${describe(a)}`).join('\n') || '• none yet'));
  console.log('Test message sent.');
}
if (!list.length) { console.log('No alerts in data/alerts.json.'); process.exit(0); }
if (!KEY) { console.error('FINNHUB_API_KEY is not set. Add it as a repository secret.'); process.exit(1); }

const prev = readJson(stateFile, {});
const next = {};
let sent = 0;
for (const s of [...new Set(list.map(a => a.symbol))]) {
  let q;
  try {
    const r = await fetch(`${FINNHUB}/quote?symbol=${encodeURIComponent(s)}&token=${encodeURIComponent(KEY)}`);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    q = await r.json();
    if (!(q && q.c > 0)) throw new Error('no price');
  } catch (e) {
    console.warn(`${s}: could not get a quote (${e.message})`);
    for (const a of list.filter(x => x.symbol === s)) if (prev[alertId(a)]) next[alertId(a)] = prev[alertId(a)];
    continue;
  }
  for (const a of list.filter(x => x.symbol === s)) {
    const id = alertId(a), hit = isHit(a, q), was = prev[id] && prev[id].hit;
    next[id] = hit ? { hit: true, at: was ? prev[id].at : new Date().toISOString(), price: was ? prev[id].price : q.c } : { hit: false };
    if (hit && !was) {
      const link = appUrl ? `\n<a href="${appUrl}#stock/${s}/overview">Open ${s} in StockHarz</a>` : '';
      await telegram(`🔔 <b>${s}</b> is ${describe(a)}\nNow ${money(q.c)} (${pct(q.dp || 0)} today)${a.note ? '\n' + String(a.note).replace(/[<>&]/g, '') : ''}${link}`);
      sent++; console.log(`Sent: ${s} ${describe(a)} at ${q.c}`);
    }
  }
  await new Promise(r => setTimeout(r, 1100));
}
const before = JSON.stringify(prev), after = JSON.stringify(next);
if (before !== after) fs.writeFileSync(stateFile, JSON.stringify(next, null, 1) + '\n');
console.log(`Checked ${list.length} alerts, sent ${sent} message${sent === 1 ? '' : 's'}.`);

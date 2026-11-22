// Builds data/sp500.json: fair value and moat rating for every S&P 500 stock.
// It loads index.html in jsdom and calls the app's own functions (D, fundamentals,
// valuations, moatAnalysis), so the numbers match what each stock page shows.
// Runs nightly in GitHub Actions (.github/workflows/sp500.yml).
// Needs FINNHUB_API_KEY in the environment. Finnhub free plan: 60 calls/minute.
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KEY = (process.env.FINNHUB_API_KEY || '').trim();
const LIST_URL = process.env.SP500_LIST_URL || 'https://raw.githubusercontent.com/datasets/s-and-p-500-companies/main/data/constituents.csv';
const LIMIT = +(process.env.SP500_LIMIT || 0); // for testing: only the first N symbols
const SPACING_MS = +(process.env.FINNHUB_SPACING_MS || 1100); // ~55 calls a minute
if (!KEY) { console.error('FINNHUB_API_KEY is not set. Add it as a repository secret.'); process.exit(1); }

const sleep = ms => new Promise(r => setTimeout(r, ms));
let nextAt = 0;
async function throttledFetch(url, opts) {
  const u = String(url);
  if (u.includes('finnhub.io')) {
    for (let attempt = 0; attempt < 4; attempt++) {
      const wait = nextAt - Date.now(); nextAt = Math.max(Date.now(), nextAt) + SPACING_MS;
      if (wait > 0) await sleep(wait);
      const r = await fetch(u, opts);
      if (r.status !== 429) return r;
      console.warn('Rate limited, waiting 30s');
      await sleep(30000);
    }
  }
  return fetch(u, opts);
}

function parseCsv(text) {
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') { if (cur || row.length) { row.push(cur); rows.push(row); row = []; cur = ''; } if (c === '\r' && text[i + 1] === '\n') i++; }
    else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

async function getList() {
  const r = await fetch(LIST_URL);
  if (!r.ok) throw new Error('Could not download the S&P 500 list: ' + r.status);
  const rows = parseCsv(await r.text());
  const h = rows.shift().map(x => x.trim().toLowerCase());
  const iS = h.indexOf('symbol'), iN = h.findIndex(x => x === 'security' || x === 'name'), iSec = h.findIndex(x => x.includes('sector'));
  return rows.filter(r => r[iS]).map(r => ({ s: r[iS].trim().toUpperCase(), name: (r[iN] || '').trim(), sector: (r[iSec] || '').trim() }));
}

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const dom = new JSDOM(html, {
  url: 'https://stockharz.local/#glossary',
  runScripts: 'dangerously',
  beforeParse(win) {
    win.fetch = throttledFetch;
    win.scrollTo = () => {};
    win.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
    win.localStorage.setItem('stockharz:keys', JSON.stringify({ finnhub: KEY, twelve: '' }));
    win.localStorage.setItem('stockharz:alerts', '[]');
  },
});
const W = dom.window;
const app = W.eval('({ D, fundamentals, valuations, moatAnalysis, shariahScreen, harzScore, mem })');

let list = await getList();
if (LIMIT) list = list.slice(0, LIMIT);
console.log(`Rating ${list.length} stocks`);
const out = [], failed = [];
const t0 = Date.now();
for (const [i, it] of list.entries()) {
  try {
    const q = await app.D.quote(it.s);
    const p = await app.D.profile(it.s).catch(() => ({}));
    const m = await app.D.metrics(it.s);
    const fin = await app.D.financials(it.s).catch(() => null);
    const f = app.fundamentals(q, p, m, fin);
    const v = app.valuations(f);
    const mo = app.moatAnalysis(f, fin);
    const sh = app.shariahScreen(it.s, f, fin);
    const r2 = x => (typeof x === 'number' && isFinite(x)) ? Math.round(x * 100) / 100 : null;
    out.push({ s: it.s, name: it.name || (p && p.name) || '', sector: it.sector, price: r2(f.price), iv: r2(v.blend), moat: mo.rating, moatPts: mo.pts, moatMax: mo.max, sh: sh.status === 'Compliant' ? 'C' : sh.status === 'Not compliant' ? 'N' : 'D', mcap: r2(f.mcap),
      // Extra fields for the home page's screening ideas (percent values are in %).
      pe: r2(f.pe), pb: r2(f.pb), dy: r2(f.divYield), po: r2(f.payout), dg5: r2(f.divG5), beta: r2(f.beta),
      roe: r2(f.roe), gm: r2(f.grossM), om: r2(f.opM), nm: r2(f.netM), rg: r2(f.revG), rg3: r2(f.revG3), rg5: r2(f.revG5),
      eg: r2(f.growE && f.growE.v), de: r2(f.de), cr: r2(f.curRatio), hi52: r2(f.hi52), ret52: r2(f.ret52), hs: app.harzScore(f).total });
  } catch (e) {
    failed.push(it.s); console.warn(`${it.s}: ${e.message}`);
  }
  app.mem.clear();
  if ((i + 1) % 25 === 0) console.log(`${i + 1}/${list.length} done, ${Math.round((Date.now() - t0) / 60000)} min`);
}
W.close();

if (out.length < Math.min(50, list.length * 0.5)) { console.error(`Only ${out.length} stocks rated. Not writing the file. Check the API key.`); process.exit(1); }
fs.mkdirSync(path.join(root, 'data'), { recursive: true });
fs.writeFileSync(path.join(root, 'data', 'sp500.json'), JSON.stringify({ generated: new Date().toISOString(), source: 'Finnhub', count: out.length, failed, stocks: out }));
console.log(`Wrote ${out.length} stocks (${failed.length} failed) in ${Math.round((Date.now() - t0) / 60000)} min`);
process.exit(0);

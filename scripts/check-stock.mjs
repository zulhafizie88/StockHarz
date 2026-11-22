// Prints the inputs and every fair value method for one or more stocks, using live Finnhub data.
// Used to debug "Not enough data". Run from Actions: "Check a stock's fair value".
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KEY = (process.env.FINNHUB_API_KEY || '').trim();
const SYMS = (process.env.SYMBOLS || 'EOG').toUpperCase().split(/[ ,]+/).filter(Boolean);
if (!KEY) { console.error('FINNHUB_API_KEY is not set.'); process.exit(1); }
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const dom = new JSDOM(html, { url: 'https://stockharz.local/#glossary', runScripts: 'dangerously', beforeParse(win) {
  win.fetch = (u, o) => fetch(u, o); win.scrollTo = () => {};
  win.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  win.localStorage.setItem('stockharz:keys', JSON.stringify({ finnhub: KEY, twelve: '' }));
} });
const app = dom.window.eval('({ D, fundamentals, valuations })');
for (const s of SYMS) {
  const q = await app.D.quote(s), p = await app.D.profile(s).catch(e => ({ err: e.message })), m = await app.D.metrics(s).catch(e => ({ err: e.message }));
  const fin = await app.D.financials(s).catch(e => ({ err: e.message }));
  const f = app.fundamentals(q, p, m, fin), v = app.valuations(f);
  const ser = (m && m.series && m.series.annual) || {};
  console.log(`===== ${s}`);
  console.log('series keys:', Object.keys(ser).join(','));
  for (const k of ['pe', 'ps', 'pb']) console.log(`series ${k}:`, JSON.stringify((ser[k] || []).slice(0, 6)));
  const pick = ['price', 'sharesM', 'industry', 'pe', 'ps', 'pb', 'eps', 'bvps', 'sps', 'revG', 'revG5', 'epsG5', 'fcfPS', 'pfcf'];
  console.log('f:', JSON.stringify(Object.fromEntries(pick.map(k => [k, f[k]]))), 'hist:', JSON.stringify(f.hist));
  console.log('last year:', JSON.stringify(f.last), 'years:', (fin.years || []).map(y => y.year).join(','), fin.err || '');
  console.log('dcf inputs:', JSON.stringify(v.inputs));
  for (const x of v.all) console.log(`  ${x.code.padEnd(18)} ${x.v == null ? '-' : x.v.toFixed(2)} ${x.ok ? 'used' : x.why}`);
  console.log('blend:', v.blend);
}
dom.window.close(); process.exit(0);

// Temporary: prints the Shariah checks for a few symbols (uses the app's own functions).
import { JSDOM } from 'jsdom'; import fs from 'node:fs';
const KEY = process.env.FINNHUB_API_KEY.trim();
const dom = new JSDOM(fs.readFileSync('index.html', 'utf8'), { url: 'https://stockharz.local/#glossary', runScripts: 'dangerously', beforeParse(w) { w.fetch = fetch; w.scrollTo = () => {}; w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} }); w.localStorage.setItem('stockharz:keys', JSON.stringify({ finnhub: KEY, twelve: '' })); } });
const app = dom.window.eval('({ D, fundamentals, shariahScreen })');
for (const s of (process.env.SYMS || 'AAPL,MSFT,KO,GOOGL').split(',')) {
  const [q, p, m, fin] = await Promise.all([app.D.quote(s), app.D.profile(s).catch(() => ({})), app.D.metrics(s), app.D.financials(s).catch(() => null)]);
  const f = app.fundamentals(q, p, m, fin); const r = app.shariahScreen(s, f, fin);
  const last = fin && fin.years && fin.years[fin.years.length - 1];
  console.log(s, r.status, JSON.stringify(r.checks.map(c => [c.value, c.st])), JSON.stringify(last && { y: last.year, assets: last.assets, cash: last.cash, stInv: last.stInv, debt: last.debt, ltDebt: last.ltDebt, revenue: last.revenue, intIncome: last.intIncome }));
}
process.exit(0);

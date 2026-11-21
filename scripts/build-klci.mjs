// Writes data/klci.json with the latest FTSE Bursa Malaysia KLCI level.
// Runs in GitHub Actions (.github/workflows/klci.yml), because the free browser data
// providers StockHarz uses don't cover Bursa Malaysia and Yahoo Finance can't be read from a browser.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = 'https://query1.finance.yahoo.com/v8/finance/chart/%5EKLSE?range=5d&interval=1d';
let j;
for (let i = 0; i < 3; i++) {
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (StockHarz data job)' } });
  if (r.ok) { j = await r.json(); break; }
  console.warn('Yahoo returned', r.status); await new Promise(res => setTimeout(res, 5000));
}
const meta = j && j.chart && j.chart.result && j.chart.result[0] && j.chart.result[0].meta;
if (!meta || !isFinite(meta.regularMarketPrice)) { console.error('No KLCI data'); process.exit(1); }
const out = { symbol: '^KLSE', name: 'FTSE Bursa Malaysia KLCI', currency: meta.currency || 'MYR', price: meta.regularMarketPrice, prevClose: meta.chartPreviousClose ?? meta.previousClose ?? null, time: meta.regularMarketTime || null, source: 'Yahoo Finance' };
const res = j.chart.result[0], closes = (res.indicators && res.indicators.quote && res.indicators.quote[0] && res.indicators.quote[0].close) || [];
// Previous close = last daily close before today's session
if (res.timestamp && closes.length >= 2) {
  const day = t => new Date(t * 1000 + 8 * 3600e3).toISOString().slice(0, 10);
  const today = day(out.time || res.timestamp[res.timestamp.length - 1]);
  for (let i = res.timestamp.length - 1; i >= 0; i--) if (day(res.timestamp[i]) < today && isFinite(closes[i]) && closes[i] != null) { out.prevClose = closes[i]; break; }
}
fs.mkdirSync(path.join(root, 'data'), { recursive: true });
fs.writeFileSync(path.join(root, 'data', 'klci.json'), JSON.stringify(out));
console.log(out);

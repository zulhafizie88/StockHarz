# StockHarz: setup

**Live app:** https://zulhafizie88.github.io/StockHarz/

StockHarz is a free stock research app that runs in your web browser. It's a single file, `index.html`, with no server and no subscription.

## 1. Open it
Double-click `index.html` to open it in Chrome, Edge, Safari or Firefox. Bookmark it.

## 2. Get two free keys (about 2 minutes)
1. **Finnhub (required):** sign up at https://finnhub.io/register and copy the API key from your dashboard. It covers prices, company info, financials, metrics, news, earnings and analyst ratings. The limit is 60 requests a minute.
2. **Twelve Data (for charts):** sign up at https://twelvedata.com/register and copy your API key. The limit is 800 requests a day. Without it, charts only work for AAPL.

In StockHarz, open **Settings**, paste each key and press **Save and test**.

## 3. Optional: use it on your phone and any computer (free)
Put `index.html` on GitHub Pages (free):
1. Create a public repository on github.com, for example `stockharz`.
2. Upload `index.html` (Add file > Upload files).
3. Go to Settings > Pages, set Source to "Deploy from a branch", pick `main` and `/ (root)`, then press Save.
4. After about a minute the app is live at `https://<your-username>.github.io/StockHarz/`.

Your keys and data are stored in each browser separately. To copy your watchlist, portfolio and alerts to another browser, use Settings > Export backup, then Import backup on the other browser.

## What's included
- Stock pages with tabs for Overview, Chart (candlesticks or line, 1D to MAX, 50- and 200-period averages, volume), Financials (10-K income, cash flow and balance sheet), Key metrics with trends, Valuation (DCF you can adjust, Graham number, earnings growth formula, multiples vs the stock's own history and vs peers, overall verdict), Moat (Wide / Narrow / None rating from returns on capital, margins, cash flow, growth and scale), Dividends (safety and an income calculator), Harz Score (0 to 100 across five pillars), Insights, News and Earnings
- Watchlist with auto-refresh, Portfolio with gains, allocation and dividend income, Price alerts, Compare up to 4 stocks, Glossary
- Light and dark themes, works on phones

## S&P 500 Valuation & Moat (home page)
The home page rates every S&P 500 stock with StockHarz's fair value and moat rules. A free GitHub Action (`.github/workflows/sp500.yml`) rebuilds `data/sp500.json` every weekday night, after the US market closes. Each run takes about 40 minutes because it stays under Finnhub's free limit of 60 requests a minute.

One-time setup:
1. In the repository, open Settings > Secrets and variables > Actions > New repository secret. Name it `FINNHUB_API_KEY` and paste your Finnhub key.
2. Open the Actions tab, pick "Update S&P 500 valuation and moat data", and press "Run workflow" to build it the first time.

## Limits of the free setup
- Alerts only run while a StockHarz tab is open. Phone or email alerts in the background would need a server.
- Insights come from fixed rules, not an AI model. Real AI summaries would need a paid AI API key.
- US-listed stocks only (Finnhub free plan). No dividend payment calendar or intraday history before the last trading day.
- The S&P 500 view updates once a day, so its prices are from the previous close.
- Not investment advice.

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
- Stock pages with tabs for Overview, Chart (candlesticks or line, 1D to MAX, 50- and 200-period averages, volume; zoom and pan with scroll, drag or pinch; draw price lines and trend lines, saved per stock; full screen), Financials (10-K income, cash flow and balance sheet), Key metrics with trends, Valuation (DCF you can adjust, Graham number, earnings growth formula, multiples vs the stock's own history and vs peers, overall verdict), Moat (Wide / Narrow / None rating from returns on capital, margins, cash flow, growth and scale), Dividends (safety and an income calculator), Harz Score (0 to 100 across five pillars), Insights, News and Earnings
- Watchlist with auto-refresh, Portfolio with gains, allocation and dividend income, Price alerts, Compare up to 4 stocks, Glossary
- Light and dark themes, works on phones

## S&P 500 Valuation & Moat (home page)
The home page rates every S&P 500 stock with StockHarz's fair value and moat rules. A free GitHub Action (`.github/workflows/sp500.yml`) rebuilds `data/sp500.json` every weekday night, after the US market closes. Each run takes about 40 minutes because it stays under Finnhub's free limit of 60 requests a minute.

One-time setup:
1. In the repository, open Settings > Secrets and variables > Actions > New repository secret. Name it `FINNHUB_API_KEY` and paste your Finnhub key.
2. Open the Actions tab, pick "Update S&P 500 valuation and moat data", and press "Run workflow" to build it the first time.

## 24-hour alerts on Telegram

A free GitHub Action (`.github/workflows/alerts.yml`) checks the alerts in `data/alerts.json` every 15 minutes on weekdays from 13:00 to 21:59 UTC (9 PM to 6 AM Malaysia time, which covers the US market). When one triggers, it sends you a Telegram message. Your phone and computer can be off. Each alert fires once when it's hit, and again only after the price moves back and hits it again.

One-time setup (about 5 minutes):
1. In Telegram, open a chat with **@BotFather**, send `/newbot`, pick a name and a username ending in `bot`. BotFather replies with a **token** like `123456:ABC...`. Keep it private.
2. Open your new bot in Telegram and press **Start** (or send it any message).
3. In a browser, open `https://api.telegram.org/bot<TOKEN>/getUpdates`, replacing `<TOKEN>` with your token. Find `"chat":{"id":` and copy the number after it. That's your **chat id**.
4. In this repository, open Settings > Secrets and variables > Actions > New repository secret. Add `TELEGRAM_BOT_TOKEN` (the token) and `TELEGRAM_CHAT_ID` (the number). `FINNHUB_API_KEY` is already there from the S&P 500 setup.
5. Open the Actions tab, pick "Price alerts to Telegram", press "Run workflow" (leave "Send a test message" ticked). You should get a "StockHarz is connected" message.

Adding or changing alerts:
1. Create alerts on StockHarz's Alerts page as usual.
2. Press **Copy alerts for phone**, then **Open alerts file on GitHub**. Select everything in the file, paste, and press **Commit changes**.
3. GitHub checks the new list straight away. A "📱 Phone" tag shows next to each alert that's on the server.

Notes: messages can arrive up to about 15 minutes late (GitHub sometimes delays scheduled runs). The repository is public, so anyone can see which alerts you set, but not your keys.

## Shariah screen (estimate)

Each stock gets a Shariah status: Compliant, Doubtful or Not compliant. It follows the Securities Commission Malaysia two-tier method: a business activity screen (no conventional banking, insurance, gambling, alcohol, tobacco or pork) and financial ratio limits (cash and interest-bearing debt each below 33% of total assets; interest income below 5% of revenue). The status shows on the stock's Shariah tab, the header badge, the watchlist, Compare and the S&P 500 tiles (white dot = compliant, plus a "Shariah compliant" filter).

Free data doesn't split revenue by activity, so this is an estimate, not a fatwa or official certification. Check the Securities Commission's list or a certified screening service before investing.

## Limits of the free setup
- In-app alerts run only while a StockHarz tab is open. Telegram alerts run in the background but check every 15 minutes, during US market hours only.
- Insights come from fixed rules, not an AI model. Real AI summaries would need a paid AI API key.
- US-listed stocks only (Finnhub free plan). No dividend payment calendar or intraday history before the last trading day.
- The S&P 500 view updates once a day, so its prices are from the previous close.
- Not investment advice.

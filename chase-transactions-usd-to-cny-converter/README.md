# Chase Transactions - USD to CNY Converter

A Tampermonkey/Greasemonkey userscript that displays CNY equivalents for Alipay and WeChat Pay transactions on the Chase credit card transactions page.

## Features

- Automatically detects transactions starting with `ALP*` (Alipay) or `WEIXIN*` (WeChat Pay)
- Converts USD amounts to CNY and displays them inline next to the original amount
- **Uses historical exchange rates** from the actual transaction date (not just the current rate)
- Caches rates to minimize API calls
- Works with both pending and posted transactions
- Hover over the CNY amount to see the exact exchange rate used

## How It Works

1. The script monitors the Chase transactions page for new transaction rows
2. For each transaction matching the Alipay/WeChat pattern, it extracts the transaction date from the `data-values` attribute
3. Uses the [Frankfurter API](https://frankfurter.dev) to fetch historical USD/CNY exchange rates
4. Fetches rates in bulk using the time series endpoint for efficiency
5. Displays the converted CNY amount in parentheses next to the USD amount

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) (Chrome/Firefox/Edge) or [Greasemonkey](https://www.greasespot.net/) (Firefox)
2. Create a new userscript and paste the contents of `chase-transactions-usd-to-cny-converter.js`
3. Save and enable the script
4. Navigate to your Chase credit card transactions page

## API

This script uses the free [Frankfurter API](https://api.frankfurter.dev) for exchange rates:

- No API key required
- No usage limits
- Rates sourced from the European Central Bank
- Supports historical rates back to 1999

## Changelog

### v2.0.1 (2025-01-29)

- Fixed bug where historical rates were never fetched due to incorrect cache check logic

### v2.0 (2025-01-29)

- **Major update**: Now uses historical exchange rates from the transaction date instead of the current rate
- Added time series API support for efficient bulk rate fetching
- Added rate caching to minimize API calls
- Added tooltip showing the exact rate used for each conversion
- Handles weekends/holidays by using the nearest previous business day's rate
- Updated API endpoint from `api.frankfurter.app` to `api.frankfurter.dev`

### v1.2

- Initial version with latest rate conversion
- Basic Alipay and WeChat Pay detection

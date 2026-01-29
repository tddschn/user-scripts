# Frankfurter

`7e3ec18`

[Star](https://github.com/lineofflight/frankfurter)

Frankfurter is a free, open-source currency data API that tracks reference exchange rates published by institutional and non-commercial sources like the [European Central Bank](https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html).

No usage caps or API keys. Works great client-side in the browser or mobile apps. The public API is available at [api.frankfurter.dev](https://api.frankfurter.dev). If preferred, you can [self-host](https://hub.docker.com/r/lineofflight/frankfurter).

## Usage

Frankfurter provides endpoints to retrieve latest rates, historical data, or time series.

Latest Rates
:   Fetch the latest working day's rates, updated daily around 16:00 CET.
:   ``` /* curl -s https://api.frankfurter.dev/v1/latest */ { "base": "EUR", "date": "2024-11-25", "rates": { "AUD": 1.6111, "BGN": 1.9558, "BRL": 6.0941, "CAD": 1.4648, "...": "..." } } ```
:   Change the base currency using the `base` parameter. The default is EUR.
:   ``` /* curl -s https://api.frankfurter.dev/v1/latest?base=USD */ { "base": "USD", "date": "2024-11-25", "rates": { "AUD": 1.5351, "BGN": 1.8636, "BRL": 5.8067, "CAD": 1.3957, "...": "..." } } ```
:   Limit the response to specific target currencies.
:   ``` /* curl -s https://api.frankfurter.dev/v1/latest?symbols=CHF,GBP */ { "base": "EUR", "date": "2024-11-25", "rates": { "CHF": 0.9324, "GBP": 0.83465 } } ```

Historical Rates
:   Retrieve rates for a specific date.
:   ``` /* curl -s https://api.frankfurter.dev/v1/1999-01-04 */ { "base": "EUR", "date": "1999-01-04", "rates": { "AUD": 1.91, "CAD": 1.8004, "CHF": 1.6168, "CYP": 0.58231, "...": "..." } } ```
:   Change the base currency and filter target currencies.
:   ``` /* curl -s https://api.frankfurter.dev/v1/1999-01-04?base=USD&symbols=EUR */ { "base": "USD", "date": "1999-01-04", "rates": { "EUR": 0.84825 } } ```
:   **Note:** Frankfurter stores dates in UTC. If you use a different time zone, be aware that you may be querying with a different calendar date than intended. Also, data returned for today is not stable and will update if new rates are published.

Time Series Data
:   Fetch rates over a period.
:   ``` /* curl -s https://api.frankfurter.dev/v1/2000-01-01..2000-12-31 */ { "base": "EUR", "start_date": "1999-12-30", "end_date": "2000-12-29", "rates": { "1999-12-30": { "AUD": 1.5422, "CAD": 1.4608, "CHF": 1.6051, "CYP": 0.57667, "...": "..." }, "2000-01-03": { "AUD": 1.5346, "CAD": 1.4577, "CHF": 1.6043, "CYP": 0.5767, "...": "..." }, "2000-01-04": { "AUD": 1.5677, "CAD": 1.4936, "CHF": 1.6053, "CYP": 0.5775, "...": "..." }, "2000-01-05": { "AUD": 1.5773, "CAD": 1.5065, "CHF": 1.606, "CYP": 0.5778, "...": "..." }, "...": "..." } } ```
:   Fetch rates up to the present.
:   ``` /* curl -s https://api.frankfurter.dev/v1/2024-01-01.. */ { "base": "EUR", "start_date": "2023-12-29", "end_date": "2024-11-25", "rates": { "2023-12-29": { "AUD": 1.6263, "BGN": 1.9558, "BRL": 5.3618, "CAD": 1.4642, "...": "..." }, "2024-01-02": { "AUD": 1.6147, "BGN": 1.9558, "BRL": 5.3562, "CAD": 1.4565, "...": "..." }, "2024-01-03": { "AUD": 1.6236, "BGN": 1.9558, "BRL": 5.3859, "CAD": 1.4574, "...": "..." }, "2024-01-04": { "AUD": 1.628, "BGN": 1.9558, "BRL": 5.3761, "CAD": 1.4603, "...": "..." }, "...": "..." } } ```
:   **Tip**: Filter currencies to reduce response size and improve performance.
:   ``` /* curl -s https://api.frankfurter.dev/v1/2024-01-01..?symbols=USD */ { "base": "EUR", "start_date": "2023-12-29", "end_date": "2024-11-25", "rates": { "2023-12-29": { "USD": 1.105 }, "2024-01-02": { "USD": 1.0956 }, "2024-01-03": { "USD": 1.0919 }, "2024-01-04": { "USD": 1.0953 }, "...": "..." } } ```

Available currencies
:   Get supported currency symbols and their full names.
:   ``` /* curl -s https://api.frankfurter.dev/v1/currencies */ { "AUD": "Australian Dollar", "BGN": "Bulgarian Lev", "BRL": "Brazilian Real", "CAD": "Canadian Dollar", "...": "..." } ```

Currency Conversion
:   Perform currency conversion by fetching the exchange rate and calculating in your code.
:   ```
function convert(from, to, amount) {
fetch(`https://api.frankfurter.dev/v1/latest?base=${from}&symbols=${to}`)
.then((resp) => resp.json())
.then((data) => {
const convertedAmount = (amount * data.rates[to]).toFixed(2);
alert(`${amount} ${from} = ${convertedAmount} ${to}`);
});
}

    convert("EUR", "USD", 10);
    ```
:   *Click or tap above to execute the code.*

## Deployment

If you prefer not to use our hosted service, you can self-host with Docker.

```
# Run frankfurter on port 80
docker run -d -p 80:8080 lineofflight/frankfurter
```

## Quick answers

Is the API free for commercial use?
:   Yes, absolutely.

Does the API have any call limits?
:   There are no limits. However, for high-volume queries, it’s more efficient to query the European Central Bank data directly from your server than using our API.

Will the API work in the future?
:   We've been running for over a decade and have no plans to shut down. For critical applications, we recommend self-hosting for greater control.

What is the privacy policy of the API?
:   The API itself does not collect personal data. However, the public app runs behind Cloudflare for performance, and Cloudflare will collect some basic information for analytics. This does not apply if you run the API privately.

What should I do if a currency is missing?
:   If you notice a currency missing from our data, please [open an issue](https://github.com/lineofflight/frankfurter/issues) and include a suggested source with the missing data. We're looking for non-commercial sources that publish current and historical daily rates at the end of each working day.

[![Line of Flight](/images/lineofflight.jpg?v=1757050344)](https://lineofflig.ht)

// ==UserScript==
// @name         Chase Transactions - USD to CNY Converter
// @namespace    http://tampermonkey.net/
// @version      2.0.1
// @description  Displays CNY equivalent for transactions starting with ALP* or WEIXIN* on the Chase transactions page, using historical exchange rates from the transaction date.
// @author       Your Name
// @match        https://secure.chase.com/web/auth/dashboard*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=chase.com
// @grant        GM_xmlhttpRequest
// @connect      api.frankfurter.dev
// ==/UserScript==

(function () {
  "use strict";

  // --- Configuration ---
  const TARGET_CURRENCY = "CNY";
  const BASE_CURRENCY = "USD";
  const TRANSACTION_REGEX = /^(ALP|WEIXIN)(\*| )/;
  const PROCESSED_MARKER = "data-cny-converted";

  // Cache for historical rates: { 'YYYY-MM-DD': rate }
  const ratesCache = {};

  // Fallback rate (latest) in case historical rate is unavailable
  let fallbackRate = null;

  /**
   * Converts date from MM/DD/YYYY to YYYY-MM-DD format.
   * @param {string} dateStr - Date in MM/DD/YYYY format
   * @returns {string} Date in YYYY-MM-DD format
   */
  function convertDateFormat(dateStr) {
    const parts = dateStr.split("/");
    if (parts.length !== 3) return null;
    const [month, day, year] = parts;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  /**
   * Fetches the latest currency conversion rate as fallback.
   * @returns {Promise<number>} A promise that resolves with the conversion rate.
   */
  function getLatestRate() {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "GET",
        url: `https://api.frankfurter.dev/v1/latest?base=${BASE_CURRENCY}&symbols=${TARGET_CURRENCY}`,
        onload: function (response) {
          if (response.status === 200) {
            try {
              const data = JSON.parse(response.responseText);
              const rate = data.rates[TARGET_CURRENCY];
              if (rate) {
                console.log(
                  `[Chase CNY Converter] Fetched latest ${BASE_CURRENCY}/${TARGET_CURRENCY} rate: ${rate}`,
                );
                resolve(rate);
              } else {
                reject(`Could not find rate for ${TARGET_CURRENCY}`);
              }
            } catch (e) {
              reject("Failed to parse currency API response.");
            }
          } else {
            reject(
              `Currency API request failed with status: ${response.status}`,
            );
          }
        },
        onerror: function (error) {
          reject("Currency API request failed: " + error);
        },
      });
    });
  }

  /**
   * Fetches historical exchange rates for a date range.
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {Promise<Object>} A promise that resolves with rates by date
   */
  function getHistoricalRates(startDate, endDate) {
    return new Promise((resolve, reject) => {
      const url = `https://api.frankfurter.dev/v1/${startDate}..${endDate}?base=${BASE_CURRENCY}&symbols=${TARGET_CURRENCY}`;
      console.log(`[Chase CNY Converter] Fetching historical rates: ${url}`);

      GM_xmlhttpRequest({
        method: "GET",
        url: url,
        onload: function (response) {
          if (response.status === 200) {
            try {
              const data = JSON.parse(response.responseText);
              const rates = {};
              if (data.rates) {
                for (const [date, rateObj] of Object.entries(data.rates)) {
                  if (rateObj[TARGET_CURRENCY]) {
                    rates[date] = rateObj[TARGET_CURRENCY];
                  }
                }
              }
              console.log(
                `[Chase CNY Converter] Fetched ${Object.keys(rates).length} historical rates`,
              );
              resolve(rates);
            } catch (e) {
              reject("Failed to parse historical rates response.");
            }
          } else {
            reject(
              `Historical rates API request failed with status: ${response.status}`,
            );
          }
        },
        onerror: function (error) {
          reject("Historical rates API request failed: " + error);
        },
      });
    });
  }

  /**
   * Gets the exchange rate for a specific date, using cache or finding nearest available date.
   * @param {string} dateStr - Date in YYYY-MM-DD format
   * @returns {number|null} The exchange rate or null if unavailable
   */
  function getRateForDate(dateStr) {
    if (ratesCache[dateStr]) {
      return ratesCache[dateStr];
    }

    // Find the nearest previous date with a rate (for weekends/holidays)
    const sortedDates = Object.keys(ratesCache).sort();
    for (let i = sortedDates.length - 1; i >= 0; i--) {
      if (sortedDates[i] <= dateStr) {
        return ratesCache[sortedDates[i]];
      }
    }

    // If no previous date found, try the earliest available
    if (sortedDates.length > 0) {
      return ratesCache[sortedDates[0]];
    }

    return fallbackRate;
  }

  /**
   * Extracts transaction date from the row's data-values attribute.
   * @param {HTMLElement} row - The transaction row element
   * @returns {string|null} Date in YYYY-MM-DD format or null
   */
  function extractTransactionDate(row) {
    const dataValues = row.getAttribute("data-values");
    if (!dataValues) return null;

    // data-values format: "MM/DD/YYYY,Description,Amount,"
    const parts = dataValues.split(",");
    if (parts.length >= 1) {
      const dateMatch = parts[0].match(/^\d{1,2}\/\d{1,2}\/\d{4}$/);
      if (dateMatch) {
        return convertDateFormat(parts[0]);
      }
    }
    return null;
  }

  /**
   * Collects all unique transaction dates from unprocessed rows.
   * @returns {Array<string>} Array of dates in YYYY-MM-DD format
   */
  function collectTransactionDates() {
    const rows = document.querySelectorAll(
      `tr[id*="-dataTableId-row-"]:not([${PROCESSED_MARKER}])`,
    );
    const dates = new Set();

    rows.forEach((row) => {
      const date = extractTransactionDate(row);
      if (date) {
        dates.add(date);
      }
    });

    return Array.from(dates).sort();
  }

  /**
   * Finds transaction rows, calculates, and injects the CNY amount.
   */
  function processTransactions() {
    const rows = document.querySelectorAll(
      `tr[id*="-dataTableId-row-"]:not([${PROCESSED_MARKER}])`,
    );
    if (rows.length === 0) return;

    console.log(
      `[Chase CNY Converter] Found ${rows.length} new transaction rows to process.`,
    );

    rows.forEach((row) => {
      // Mark the row as processed immediately to prevent duplicate processing.
      row.setAttribute(PROCESSED_MARKER, "true");

      // Extract date from data-values
      const transactionDate = extractTransactionDate(row);
      const rate = transactionDate
        ? getRateForDate(transactionDate)
        : fallbackRate;

      if (!rate) {
        console.warn(
          `[Chase CNY Converter] No rate available for date: ${transactionDate}`,
        );
        return;
      }

      // The description is the first <td>. The amount column is different for pending vs. posted transactions.
      const isPending =
        row.closest(".pending__container") || row.id.includes("PENDING");
      const descriptionCell = row.querySelector("td:nth-of-type(1)");
      const amountCell = isPending
        ? row.querySelector("td:nth-of-type(2)") // Pending: Date(th), Desc(td1), Amount(td2)
        : row.querySelector("td:nth-of-type(3)"); // Posted:  Date(th), Desc(td1), Category(td2), Amount(td3)

      if (!descriptionCell || !amountCell) {
        return; // Skip if row structure is unexpected
      }

      const descriptionText = descriptionCell.textContent.trim();

      if (TRANSACTION_REGEX.test(descriptionText)) {
        const usdText = amountCell.textContent.trim();

        // Handle Unicode minus sign for negative amounts
        const cleanUsdText = usdText
          .replace("−", "-")
          .replace(/[^0-9.-]+/g, "");
        const usdValue = parseFloat(cleanUsdText);

        if (!isNaN(usdValue)) {
          const cnyValue = (usdValue * rate).toFixed(2);

          // Create the element to display the CNY amount
          const cnyElement = document.createElement("span");
          cnyElement.textContent = ` (¥${cnyValue})`;
          cnyElement.style.color = "#555";
          cnyElement.style.fontSize = "0.9em";
          cnyElement.style.marginLeft = "8px";
          cnyElement.style.whiteSpace = "nowrap";
          cnyElement.title = `Rate on ${transactionDate}: 1 USD = ${rate.toFixed(4)} CNY`;

          // Find the specific div/span that holds the text to append to
          const amountDisplayContainer = amountCell.querySelector(
            ".mds-activity-table__row-value--text",
          );
          if (amountDisplayContainer) {
            amountDisplayContainer.appendChild(cnyElement);
          } else {
            amountCell.appendChild(cnyElement);
          }
        }
      }
    });
  }

  /**
   * Fetches rates for new dates and processes transactions.
   */
  async function fetchRatesAndProcess() {
    const dates = collectTransactionDates();
    if (dates.length === 0) {
      processTransactions();
      return;
    }

    // Filter dates that we don't have a historical rate for (not in cache)
    const uncachedDates = dates.filter((d) => !ratesCache[d]);

    if (uncachedDates.length > 0) {
      const startDate = uncachedDates[0];
      const endDate = uncachedDates[uncachedDates.length - 1];

      try {
        const historicalRates = await getHistoricalRates(startDate, endDate);
        Object.assign(ratesCache, historicalRates);
      } catch (error) {
        console.warn(
          `[Chase CNY Converter] Failed to fetch historical rates: ${error}`,
        );
      }
    }

    processTransactions();
  }

  /**
   * Main function to start the script.
   */
  async function main() {
    console.log(
      "[Chase CNY Converter] Script started (v2.0 - Historical Rates).",
    );
    try {
      // Fetch latest rate as fallback
      fallbackRate = await getLatestRate();

      // Set up a MutationObserver to watch for when transactions are added to the page.
      const observer = new MutationObserver((mutationsList, observer) => {
        for (const mutation of mutationsList) {
          if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
            // A bit of a delay to ensure the table is fully rendered before processing
            setTimeout(() => fetchRatesAndProcess(), 500);
            return;
          }
        }
      });

      // Start observing the main content area for changes.
      const targetNode = document.getElementById("main-content");
      if (targetNode) {
        observer.observe(targetNode, { childList: true, subtree: true });
      } else {
        observer.observe(document.body, { childList: true, subtree: true });
      }

      // Initial run in case transactions are already present on page load.
      setTimeout(() => fetchRatesAndProcess(), 1000);
    } catch (error) {
      console.error("[Chase CNY Converter] Error:", error);
      const errorDiv = document.createElement("div");
      errorDiv.textContent = `[CNY Converter] Could not load rate: ${error}`;
      errorDiv.style.cssText =
        "position: fixed; bottom: 10px; right: 10px; background: #ffdddd; border: 1px solid red; padding: 10px; z-index: 9999;";
      document.body.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 10000);
    }
  }

  // Wait for the page to be reasonably loaded before starting
  window.addEventListener("load", main);
})();

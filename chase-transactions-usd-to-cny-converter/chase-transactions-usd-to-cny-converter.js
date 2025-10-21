// ==UserScript==
// @name         Chase Transactions - USD to CNY Converter
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Displays CNY equivalent for transactions starting with ALP* or WEIXIN* on the Chase transactions page.
// @author       Your Name
// @match        https://secure.chase.com/web/auth/dashboard*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=chase.com
// @grant        GM_xmlhttpRequest
// @connect      api.frankfurter.app
// ==/UserScript==

(function() {
    'use strict';

    // --- Configuration ---
    const TARGET_CURRENCY = 'CNY';
    const BASE_CURRENCY = 'USD';
    const TRANSACTION_REGEX = /^(ALP|WEIXIN)\*/;
    const PROCESSED_MARKER = 'data-cny-converted';

    /**
     * Fetches the currency conversion rate.
     * @returns {Promise<number>} A promise that resolves with the conversion rate.
     */
    function getConversionRate() {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: `https://api.frankfurter.app/latest?from=${BASE_CURRENCY}&to=${TARGET_CURRENCY}`,
                onload: function(response) {
                    if (response.status === 200) {
                        try {
                            const data = JSON.parse(response.responseText);
                            const rate = data.rates[TARGET_CURRENCY];
                            if (rate) {
                                console.log(`[Chase CNY Converter] Successfully fetched ${BASE_CURRENCY}/${TARGET_CURRENCY} rate: ${rate}`);
                                resolve(rate);
                            } else {
                                reject(`Could not find rate for ${TARGET_CURRENCY}`);
                            }
                        } catch (e) {
                            reject('Failed to parse currency API response.');
                        }
                    } else {
                        reject(`Currency API request failed with status: ${response.status}`);
                    }
                },
                onerror: function(error) {
                    reject('Currency API request failed: ' + error);
                }
            });
        });
    }

    /**
     * Finds transaction rows, calculates, and injects the CNY amount.
     * @param {number} rate - The USD to CNY conversion rate.
     */
    function processTransactions(rate) {
        // This selector finds all transaction rows that haven't been processed yet.
        const rows = document.querySelectorAll(`tr[id*="-dataTableId-row-"]:not([${PROCESSED_MARKER}])`);
        if (rows.length === 0) return;

        console.log(`[Chase CNY Converter] Found ${rows.length} new transaction rows to process.`);

        rows.forEach(row => {
            // Mark the row as processed immediately to prevent duplicate processing.
            row.setAttribute(PROCESSED_MARKER, 'true');

            // --- FIX 1: Correctly identify columns ---
            // The description is the first <td>. The amount column is different for pending vs. posted transactions.
            const isPending = row.closest('.pending__container');
            const descriptionCell = row.querySelector('td:nth-of-type(1)');
            const amountCell = isPending
                ? row.querySelector('td:nth-of-type(2)') // Pending: Date(th), Desc(td1), Amount(td2)
                : row.querySelector('td:nth-of-type(3)'); // Posted:  Date(th), Desc(td1), Category(td2), Amount(td3)

            if (!descriptionCell || !amountCell) {
                return; // Skip if row structure is unexpected
            }

            const descriptionText = descriptionCell.textContent.trim();

            if (TRANSACTION_REGEX.test(descriptionText)) {
                const usdText = amountCell.textContent.trim();

                // --- FIX 2: Handle Unicode minus sign for negative amounts ---
                const cleanUsdText = usdText.replace('−', '-').replace(/[^0-9.-]+/g, "");
                const usdValue = parseFloat(cleanUsdText);

                if (!isNaN(usdValue)) {
                    const cnyValue = (usdValue * rate).toFixed(2);

                    // Create the element to display the CNY amount
                    const cnyElement = document.createElement('span');
                    cnyElement.textContent = ` (¥${cnyValue})`;
                    cnyElement.style.color = '#555';       // Dark grey for readability
                    cnyElement.style.fontSize = '0.9em';    // Slightly smaller than the main text
                    cnyElement.style.marginLeft = '8px';    // Space it out a bit
                    cnyElement.style.whiteSpace = 'nowrap'; // Prevent wrapping

                    // Find the specific div/span that holds the text to append to
                    const amountDisplayContainer = amountCell.querySelector('.mds-activity-table__row-value--text');
                    if (amountDisplayContainer) {
                        amountDisplayContainer.appendChild(cnyElement);
                    } else {
                        // Fallback if the inner structure changes
                        amountCell.appendChild(cnyElement);
                    }
                }
            }
        });
    }

    /**
     * Main function to start the script.
     */
    async function main() {
        console.log('[Chase CNY Converter] Script started.');
        try {
            const rate = await getConversionRate();

            // Set up a MutationObserver to watch for when transactions are added to the page.
            const observer = new MutationObserver((mutationsList, observer) => {
                 for(const mutation of mutationsList) {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                       // A bit of a delay to ensure the table is fully rendered before processing
                       setTimeout(() => processTransactions(rate), 500);
                       return;
                    }
                }
            });

            // Start observing the main content area for changes.
            const targetNode = document.getElementById('main-content');
            if(targetNode) {
                observer.observe(targetNode, { childList: true, subtree: true });
            } else {
                // Fallback to body if main-content isn't ready yet.
                observer.observe(document.body, { childList: true, subtree: true });
            }


            // Initial run in case transactions are already present on page load.
            setTimeout(() => processTransactions(rate), 1000);

        } catch (error) {
            console.error('[Chase CNY Converter] Error:', error);
            // Display a visible error on the page for easier debugging.
            const errorDiv = document.createElement('div');
            errorDiv.textContent = `[CNY Converter] Could not load rate: ${error}`;
            errorDiv.style.cssText = 'position: fixed; bottom: 10px; right: 10px; background: #ffdddd; border: 1px solid red; padding: 10px; z-index: 9999;';
            document.body.appendChild(errorDiv);
            setTimeout(() => errorDiv.remove(), 10000);
        }
    }

    // Wait for the page to be reasonably loaded before starting
    window.addEventListener('load', main);

})();
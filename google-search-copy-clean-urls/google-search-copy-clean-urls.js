// ==UserScript==
// @name         Google Clean URL Copier
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Adds a button to copy the clean, direct URL from Google search results, bypassing the redirect.
// @author       Your Name
// @match        https://www.google.com/search*
// @match        https://www.google.co.uk/search*
// @match        https://www.google.de/search*
// @match        https://www.google.fr/search*
// @match        https://www.google.ca/search*
// @match        https://www.google.com.au/search*
// @grant        GM_setClipboard
// @grant        GM_addStyle
// @icon         https://www.google.com/s2/favicons?sz=64&domain=google.com
// ==/UserScript==

(function() {
    'use strict';

    // --- 1. Style the "Copy URL" button ---
    // GM_addStyle allows us to add CSS without cluttering the page.
    // It includes styles for both light and dark mode by checking for the '.srp' class on the body.
    GM_addStyle(`
        .copy-url-btn {
            background-color: #f1f3f4;
            border: 1px solid #dadce0;
            border-radius: 100px;
            color: #3c4043;
            cursor: pointer;
            font-size: 12px;
            font-family: arial, sans-serif;
            margin-left: 10px;
            padding: 5px 10px;
            display: inline-flex;
            align-items: center;
            vertical-align: middle;
            transition: background-color 0.2s, box-shadow 0.2s;
            white-space: nowrap;
        }
        .copy-url-btn:hover {
            background-color: #e8eaed;
            box-shadow: 0 1px 1px rgba(0,0,0,0.1);
        }
        .copy-url-btn:active {
            background-color: #d1d3d6;
        }

        /* Dark mode styles */
        body.srp {
             --copy-btn-bg: #303134;
             --copy-btn-hover-bg: #3c4043;
             --copy-btn-active-bg: #4f5155;
             --copy-btn-border: #5f6368;
             --copy-btn-text: #e8eaed;
        }
        body.srp .copy-url-btn {
            background-color: var(--copy-btn-bg);
            border: 1px solid var(--copy-btn-border);
            color: var(--copy-btn-text);
        }
        body.srp .copy-url-btn:hover {
            background-color: var(--copy-btn-hover-bg);
        }
        body.srp .copy-url-btn:active {
             background-color: var(--copy-btn-active-bg);
        }
    `);

    const PROCESSED_CLASS = 'url-button-added';

    /**
     * Finds the correct link, creates a button, and adds it to the result element.
     * @param {HTMLElement} resultElement - The container element of a single search result.
     */
    function addCopyButton(resultElement) {
        // Stop if we've already added a button or this isn't a main result block.
        if (resultElement.classList.contains(PROCESSED_CLASS) || resultElement.closest(`.${PROCESSED_CLASS}`)) {
            return;
        }

        // Find the main link element, which almost always contains an <h3> title.
        const titleH3 = resultElement.querySelector('h3');
        if (!titleH3) return;

        const linkElement = titleH3.closest('a');
        if (!linkElement || !linkElement.href) return;

        // Ignore internal Google links like "People also ask"
        if (linkElement.href.startsWith(window.location.origin + '/search')) {
            return;
        }

        resultElement.classList.add(PROCESSED_CLASS);
        const cleanUrl = linkElement.href;

        // Create the button
        const button = document.createElement('button');
        button.textContent = 'Copy URL';
        button.className = 'copy-url-btn';

        // Add the click event to copy the URL
        button.addEventListener('click', (e) => {
            e.preventDefault();  // Prevent navigation
            e.stopPropagation(); // Stop Google's click tracking

            GM_setClipboard(cleanUrl, 'text');

            // Visual feedback for the user
            button.textContent = 'Copied!';
            setTimeout(() => {
                button.textContent = 'Copy URL';
            }, 1500);
        });

        // Find the best place to insert the button. Usually next to the breadcrumb/URL.
        const container = resultElement.querySelector('.TbwUpd, .v03O1c'); // Classes for the area with the cite/breadcrumb
        if (container) {
             container.appendChild(button);
        } else {
             // Fallback: place it after the main link block if the specific container isn't found.
             const linkBlock = resultElement.querySelector('.yuRUbf');
             if(linkBlock) {
                 linkBlock.style.display = 'inline-flex';
                 linkBlock.style.alignItems = 'center';
                 linkBlock.style.flexWrap = 'wrap';
                 linkBlock.insertAdjacentElement('beforeend', button);
             }
        }
    }

    /**
     * Scans the page for search results and calls addCopyButton on each.
     */
    function processResults() {
        // Google uses various classes for result containers. `div.g` is a common one.
        // `div.MjjYud` and `div.tF2Cxc` were in the provided HTML example.
        // This selector combination covers standard results, video results, etc.
        document.querySelectorAll('div.g, div.MjjYud, div.tF2Cxc').forEach(addCopyButton);
    }

    // --- Main Execution ---

    // Run once on initial page load
    processResults();

    // Google dynamically loads results as you scroll.
    // A MutationObserver is the most reliable way to detect when new results are added.
    const observer = new MutationObserver((mutations) => {
        let hasNewNodes = false;
        for (const mutation of mutations) {
            if (mutation.addedNodes.length > 0) {
                hasNewNodes = true;
                break;
            }
        }
        if (hasNewNodes) {
            // A brief delay helps ensure the new elements are fully rendered before we process them.
            setTimeout(processResults, 300);
        }
    });

    // Start observing the main results container for changes.
    const targetNode = document.getElementById('rso') || document.body;
    observer.observe(targetNode, {
        childList: true,
        subtree: true
    });

})();
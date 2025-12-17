// ==UserScript==
// @name         Gemini Conversation Title Enhancer
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Appends the current conversation name to the page title on gemini.google.com and saves each change to history.
// @author       Your Name
// @match        https://gemini.google.com/app/*
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // This is the specific element that contains the conversation title.
    const TITLE_SELECTOR = '#app-root > main > top-bar-actions > div > div.center-section > div > conversation-actions > button > span';

    // A variable to store the last known text to prevent creating duplicate history entries.
    let lastKnownText = '';

    /**
     * Finds the conversation title element, updates the document title,
     * and pushes a new state to the browser history.
     */
    const updateTitleAndHistory = () => {
        const titleElement = document.querySelector(TITLE_SELECTOR);

        // Proceed only if the element is found.
        if (titleElement) {
            // Extract the text and trim whitespace from both ends.
            const newText = titleElement.textContent.trim();

            // Only update if the text is not empty and has changed since the last check.
            if (newText && newText !== lastKnownText) {
                console.log(`Detected new conversation title: "${newText}"`);
                lastKnownText = newText;

                // Construct the new title string. We use "Gemini" as the base.
                const newTitle = `Gemini | ${newText}`;

                // Update the page's visible title.
                document.title = newTitle;

                // Create a new, distinct entry in the browser's history for this title.
                // This makes each conversation title searchable in chrome://history.
                history.pushState(null, newTitle, window.location.href);
            }
        }
    };

    // Gemini is a single-page application (SPA), so we need to watch for
    // DOM changes to detect when a new conversation is loaded or renamed.
    // A MutationObserver is the most reliable way to do this.
    const observer = new MutationObserver(() => {
        // When any change is detected in the body, we run our function.
        // The function itself is smart enough to not do anything if the title hasn't changed.
        updateTitleAndHistory();
    });

    // Start observing the entire document body for additions/removals of nodes.
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Run the function once after a short delay on initial page load.
    // This gives the Gemini interface time to load its content.
    setTimeout(updateTitleAndHistory, 2000);

})();
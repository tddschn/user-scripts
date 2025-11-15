// ==UserScript==
// @name         AI Studio Title Enhancer (with History)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Appends the H1 content to the page title and saves each change to browser history.
// @author       Your Name
// @match        https://aistudio.google.com/app/prompts/*
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    let lastKnownH1Text = ''; // Variable to track the last known H1 text

    // Function to update the title and create a new history entry
    const updateTitleAndHistory = () => {
        const h1 = document.querySelector('h1');
        if (h1) {
            const h1Text = h1.textContent.trim();

            // Proceed only if the H1 text is not empty and has actually changed
            if (h1Text && h1Text !== lastKnownH1Text) {
                // Store the new text
                lastKnownH1Text = h1Text;

                // Form the new title
                const originalTitle = document.title.split(' | ')[0]; // Get the base title
                const newTitle = `${originalTitle} | ${h1Text}`;

                // Update the document title
                document.title = newTitle;

                // Create a new entry in the browser's session history.
                // The first argument is a state object (can be null).
                // The second argument is the new title.
                // The third argument is the URL (we keep it the same).
                history.pushState(null, newTitle, window.location.href);

                console.log(`Title updated and new history entry created: "${newTitle}"`);
            }
        }
    };

    // Use a MutationObserver to detect when the H1 changes.
    // This is essential for single-page applications like AI Studio.
    const observer = new MutationObserver((mutations) => {
        // A simple check for any h1 mutation is sufficient and efficient.
        for (const mutation of mutations) {
            if (mutation.target.nodeName === 'H1' || (mutation.target.querySelector && mutation.target.querySelector('h1'))) {
                updateTitleAndHistory();
                return; // No need to check other mutations
            }
        }
    });

    // Start observing the body for changes in child elements and the subtree.
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Run once on initial load after a brief delay for the page to settle.
    setTimeout(updateTitleAndHistory, 1500);

})();
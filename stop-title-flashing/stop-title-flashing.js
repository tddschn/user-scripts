// ==UserScript==
// @name         Stop Title Flashing (Instant)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Instantly stops websites from flashing or changing the page title.
// @author       Your Name
// @match        *://*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let initialTitle = '';
    let titleIsFrozen = false;

    // --- Part 1: Immediate Freeze ---
    // This part runs instantly thanks to '@run-at document-start'.
    // It captures the very first title available and locks it.
    Object.defineProperty(document, 'title', {
        enumerable: true,
        configurable: true,
        get: function() {
            return initialTitle;
        },
        set: function(newTitle) {
            if (!titleIsFrozen) {
                // Allow the very first title to be set by the browser.
                initialTitle = newTitle;
            }
            // Once the first title is captured, freeze it.
            titleIsFrozen = true;
        }
    });

    // --- Part 2: Mutation Observer Fallback ---
    // Some modern frameworks might bypass the above method by directly
    // manipulating the <title> tag in the DOM. This observer acts as a fallback.
    const titleElement = document.querySelector('head > title');

    if (titleElement) {
        const observer = new MutationObserver(function(mutations) {
            // If a change is detected, immediately revert it to our frozen title.
            if (document.title !== initialTitle) {
                document.title = initialTitle;
            }
        });

        observer.observe(titleElement, {
            childList: true // Watch for changes to the text inside the <title> tag.
        });
    }
})();
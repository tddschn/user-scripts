// ==UserScript==
// @name         Gemini Wider Conversation View
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Widens the conversation container and table blocks on Gemini
// @author       Your Name
// @match        https://gemini.google.com/app*
// @match        https://gemini.google.com/gem*
// @grant        none
// @run-at       document-idle
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    function applyStyles() {
        document.querySelectorAll('span.user-query-bubble-with-background').forEach(el => {
            el.style.maxWidth = '792px';
        });
        document.querySelectorAll('table-block > div').forEach(el => {
            el.style.maxWidth = '992px';
        });
        document.querySelectorAll('div.table-block').forEach(el => {
            el.style.maxWidth = '992px';
        });

        document.querySelectorAll('div.conversation-container').forEach(el => {
            el.style.maxWidth = '1060px';
        });
    }

    const observer = new MutationObserver(applyStyles);

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    applyStyles();
})();

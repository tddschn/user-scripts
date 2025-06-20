// ==UserScript==
// @name         UDN Blog Enable Copy & Right-Click
// @namespace    https://github.com/your-username/
// @version      1.0
// @description  Re-enables text selection, copying, and right-clicking on blog.udn.com by overriding blocking scripts and styles.
// @author       Your Name
// @match        https://blog.udn.com/*
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // --- Part 1: Defeat JavaScript Event Blockers ---
    // The site uses `return false` on `contextmenu` and `selectstart` events
    // to prevent right-clicking and text selection.
    //
    // By running this script at `@run-at document-start`, we can add our own
    // listeners before the page's scripts execute.
    // We listen during the "capture" phase, which runs before the default "bubble"
    // phase. `e.stopImmediatePropagation()` then prevents any other listeners
    // for the same event (including the site's blocking ones) from running.
    const eventsToAllow = ['contextmenu', 'selectstart'];

    eventsToAllow.forEach(eventName => {
        window.addEventListener(eventName, function(e) {
            e.stopImmediatePropagation();
        }, { capture: true });
    });

    // --- Part 2: Defeat CSS Blockers ---
    // As a fallback and for good measure, we inject CSS to override any
    // `user-select: none` styles, which also prevent text selection.
    // The `!important` flag ensures our rule takes precedence.
    GM_addStyle(`
        *, body, body * {
            -webkit-user-select: auto !important;
            -moz-user-select: auto !important;
            -ms-user-select: auto !important;
            user-select: auto !important;
        }
    `);
})();
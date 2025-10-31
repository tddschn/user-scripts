// ==UserScript==
// @name         docs.qq.com Automatic Redirect
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Automatically redirects from docs.qq.com's link forwarding page to the target URL before the page fully loads.
// @author       Gemini
// @match        https://docs.qq.com/scenario/link.html?url=*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // Create a URL object from the current window's location to easily parse it
    const currentUrl = new URL(window.location.href);

    // Get the value of the 'url' search parameter
    const targetUrl = currentUrl.searchParams.get('url');

    // If the target URL was found, redirect to it immediately
    if (targetUrl) {
        // Use replace() to ensure the redirect page doesn't get stored in session history,
        // so the browser's back button functions as expected.
        window.location.replace(targetUrl);
    }
})();
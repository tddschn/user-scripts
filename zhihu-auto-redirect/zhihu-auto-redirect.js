// ==UserScript==
// @name         Zhihu Auto Redirect
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Automatically redirects from the Zhihu link warning page (link.zhihu.com) to the target URL.
// @author       Gemini
// @match        https://link.zhihu.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // Use URLSearchParams to easily get the 'target' parameter from the URL.
    const params = new URLSearchParams(window.location.search);
    const targetUrl = params.get('target');

    // If a target URL is found, redirect the browser to it.
    // We use window.location.replace so the Zhihu redirect page doesn't stay in the browser history,
    // allowing the back button to work as expected.
    if (targetUrl) {
        window.location.replace(targetUrl);
    }
})();
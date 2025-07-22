// ==UserScript==
// @name         Redirect Google Mailto to Gmail
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Redirects Google's mailto redirect links to a pre-filled Gmail compose window.
// @author       You
// @match        https://www.google.com/url?sa=E&q=mailto%3A*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Get the current URL
    const url = new URL(window.location.href);

    // Get the 'q' parameter from the URL
    const q = url.searchParams.get('q');

    if (q && q.startsWith('mailto:')) {
        // Extract the email address
        const email = q.substring(7);

        // Construct the Gmail compose URL for user 0
        const gmailUrl = `https://mail.google.com/mail/u/0/?view=cm&fs=1&to=${encodeURIComponent(email)}`;

        // Redirect to the new URL
        window.location.href = gmailUrl;
    }
})();
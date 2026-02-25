// ==UserScript==
// @name         Google 'sa=E' Redirect Skipper
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automatically follows the destination link on Google's "Redirect Notice" pages (typically for enterprise search), skipping the intermediate page.
// @author       Your Name
// @match        https://www.google.com/url?sa=E&q=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=google.com
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
  "use strict";

  // This script targets the Google redirect notice page as seen in the provided HTML.
  // The key element on that page is a div with the class "fTk7vd".
  // Inside this div, the first <a> tag is the link to the actual destination.

  // We use document.querySelector to find the first <a> element
  // inside the element with the class '.fTk7vd'.
  const redirectLink = document.querySelector(".fTk7vd a");

  // As a safeguard, we check if the link was actually found.
  // This prevents errors if Google changes the page's HTML structure in the future.
  if (redirectLink) {
    console.log("Redirect link found, navigating to:", redirectLink.href);

    // Instead of simulating a click with .click(), which can sometimes be
    // intercepted or fail, we directly set the window's location to the link's href.
    // This is a more direct and reliable way to trigger the navigation.
    window.location.href = redirectLink.href;
  } else {
    // If the script runs but doesn't find the link, this message
    // will appear in the browser's developer console (F12).
    console.log(
      "Google Redirect Skipper: Could not find the redirect link on this page.",
    );
  }
})();

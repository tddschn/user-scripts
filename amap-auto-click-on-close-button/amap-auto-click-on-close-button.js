// ==UserScript==
// @name         Amap.com Auto Close Popup
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Waits patiently for the initial popup/dialog on amap.com and clicks its close button.
// @author       Your Name
// @match        *://*.amap.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
  "use strict";

  // The specific CSS selector for the close button element.
  // This targets the small 'x' div inside the baxia-dialog content.
  const closeButtonSelector =
    "body > div.baxia-dialog.auto > div.baxia-dialog-content > div";

  console.log(
    "[Amap Auto-Closer] Script initialized. Waiting for page to load...",
  );

  /**
   * This function looks for the target element and clicks it.
   * It's designed to be called repeatedly by the MutationObserver.
   * @param {MutationObserver} observer - The observer instance, to disconnect it after success.
   * @returns {boolean} - True if the element was found and clicked, otherwise false.
   */
  const findAndClick = (observer) => {
    const closeButton = document.querySelector(closeButtonSelector);

    // If the button exists and is visible...
    if (closeButton) {
      console.log("[Amap Auto-Closer] Popup found. Clicking it.", closeButton);
      closeButton.click();

      // Once we've clicked the button, we don't need to watch for more changes.
      // Disconnecting the observer is good practice and saves resources.
      if (observer) {
        observer.disconnect();
        console.log("[Amap Auto-Closer] Observer disconnected.");
      }
      return true;
    }
    // Return false if the button wasn't found yet.
    return false;
  };

  // We need to wait until the <body> element exists before we can observe it.
  // A MutationObserver is perfect for this as well, especially with @run-at document-start.
  const bodyObserver = new MutationObserver((mutations, obs) => {
    if (document.body) {
      // The body now exists, so we can stop this initial observer.
      obs.disconnect();

      console.log(
        "[Amap Auto-Closer] Page body found. Checking for initial popup...",
      );

      // --- Main Logic ---

      // First, try to find the element immediately. It might already be there
      // when the script runs, especially on a fast connection.
      if (findAndClick(null)) {
        // If we found it, our job is done.
        return;
      }

      // If the popup wasn't there, it will be added by JavaScript later.
      // We'll create a new MutationObserver to watch for when it gets added.
      const popupObserver = new MutationObserver((mutationList, observer) => {
        // We don't need to inspect the mutations themselves.
        // Any change is a good time to check if our element has appeared.
        findAndClick(observer);
      });

      // Start observing the entire document body for added/removed child elements.
      // 'subtree: true' is essential because the popup is added deep inside the body.
      popupObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });

      console.log(
        "[Amap Auto-Closer] Popup not found yet. Started main observer to wait for it.",
      );
    }
  });

  // Start the initial observer to wait for the <body> tag.
  bodyObserver.observe(document.documentElement, {
    childList: true,
  });
})();

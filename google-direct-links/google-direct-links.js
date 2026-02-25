// ==UserScript==
// @name         Google Direct Links
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Rewrites Google redirect links to point directly to the destination URL on all Google domains and subdomains.
// @author       Gemini
// @match        *://*.google.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  /**
   * Finds and cleans Google redirect links within a given DOM node.
   * @param {Node} node - The parent node to search within for links.
   */
  const cleanLinksInNode = (node) => {
    // Ensure the node is an element that can be queried.
    if (typeof node.querySelectorAll !== "function") {
      return;
    }

    // Select only the anchor tags that are Google redirect links.
    const links = node.querySelectorAll('a[href*="/url?"]');

    links.forEach((link) => {
      // The link's href might be a relative URL, so we create a full URL object.
      const url = new URL(link.href);
      // The actual destination is stored in the 'q' parameter.
      const destinationUrl = url.searchParams.get("q");

      if (destinationUrl) {
        // Rewrite the link's href to the direct URL.
        link.href = destinationUrl;

        // For good measure, remove the 'ping' attribute which is used for tracking.
        link.removeAttribute("ping");
      }
    });
  };

  // --- Main Execution ---

  // 1. Initial Scan: Clean any links that are already on the page when it loads.
  cleanLinksInNode(document.body);

  // 2. Dynamic Monitoring: Create an observer to watch for new content being added to the page.
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        // When a new element is added, run the cleanup function on it.
        cleanLinksInNode(node);
      });
    });
  });

  // Start observing the entire document body for changes.
  observer.observe(document.body, {
    childList: true, // Watch for nodes being added or removed.
    subtree: true, // Watch for changes in all descendants as well.
  });
})();

// ==UserScript==
// @name         Zhihu Feed Ad Remover
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Removes ad cards from the Zhihu feed by identifying the prominent "举报" (Report) button.
// @author       Your Name
// @match        https://www.zhihu.com/
// @match        https://www.zhihu.com/follow
// @match        https://www.zhihu.com/hot
// @icon         https://static.zhihu.com/heifetz/favicon.ico
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  /**
   * Finds and removes ad cards from the feed.
   * Ads are identified by the presence of a "举报" (Report) button
   * directly in their action bar.
   */
  function removeAds() {
    // Select all buttons within the action bars of feed items.
    const actionButtons = document.querySelectorAll(
      ".TopstoryItem .ContentItem-actions button",
    );

    actionButtons.forEach((button) => {
      // If the button's text content includes "举报", it's an ad.
      if (button.textContent.includes("举报")) {
        // Find the parent container of the entire feed item card.
        const adCard = button.closest(".TopstoryItem");
        if (adCard) {
          // Log the title for debugging/confirmation and then remove the card.
          const titleElement = adCard.querySelector("h2 a");
          const title = titleElement
            ? titleElement.textContent.trim()
            : "Ad Article";
          console.log(`[Zhihu Ad Remover] Removed ad: "${title}"`);

          // Hide the card immediately to prevent flickering, then remove it from the DOM.
          adCard.style.display = "none";
          adCard.remove();
        }
      }
    });
  }

  /**
   * Sets up a MutationObserver to watch for new content being loaded
   * via infinite scrolling and runs the ad remover on new content.
   */
  function observeFeed() {
    const feedContainer = document.getElementById("TopstoryContent");

    if (!feedContainer) {
      // The feed container might not be on the page yet. Retry in 500ms.
      setTimeout(observeFeed, 500);
      return;
    }

    // Create an observer to watch for changes in the feed container.
    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        // If new nodes (posts) have been added, run the ad removal function.
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          removeAds();
          return; // No need to check other mutations in this batch.
        }
      }
    });

    // Start observing the feed container for additions of new elements.
    observer.observe(feedContainer, { childList: true, subtree: true });

    // Run the function once on initial page load to clean up any ads already present.
    console.log("[Zhihu Ad Remover] Script loaded. Watching the feed for ads.");
    removeAds();
  }

  // Start the process.
  observeFeed();
})();

// ==UserScript==
// @name         Bilibili - Remove Right Column Ads
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Removes promotional cards (live streams, shows, etc.) from the rightmost column on the bilibili.com homepage feed.
// @author       You
// @match        https://www.bilibili.com/*
// @icon         https://www.bilibili.com/favicon.ico
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
  "use strict";

  // This function finds and removes the ad cards.
  function removeRightColumnAds() {
    const feedContainer = document.querySelector(".feed2");
    if (!feedContainer) return;

    // 1. Determine the number of columns in the grid dynamically.
    // This makes the script work even if Bilibili changes its layout.
    let maxCol = 0;
    const allCards = feedContainer.querySelectorAll(
      "[data-feed-card-row-col], [data-floor-card-row-col]",
    );
    if (allCards.length === 0) return; // No cards loaded yet.

    allCards.forEach((card) => {
      const rowCol =
        card.dataset.feedCardRowCol || card.dataset.floorCardRowCol;
      if (rowCol) {
        const col = parseInt(rowCol.split("-")[1], 10);
        if (col > maxCol) {
          maxCol = col;
        }
      }
    });

    if (maxCol === 0) return; // Could not determine layout.

    // 2. Select and remove the promotional cards in the rightmost column.
    // These cards have a unique class `floor-single-card` compared to regular video cards.
    const adCardSelector = `.floor-single-card[data-floor-card-row-col$="-${maxCol}"]`;
    const adsToRemove = feedContainer.querySelectorAll(adCardSelector);

    if (adsToRemove.length > 0) {
      console.log(
        `[Bilibili Ad Remover] Found and removed ${adsToRemove.length} ad cards in column ${maxCol}.`,
      );
      adsToRemove.forEach((ad) => {
        ad.remove();
      });
    }
  }

  // The homepage feed loads content dynamically as you scroll.
  // We need to watch for these changes to remove new ads as they appear.
  const observer = new MutationObserver((mutations) => {
    let nodesAdded = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        nodesAdded = true;
        break;
      }
    }
    // If new cards were added, run the removal function.
    if (nodesAdded) {
      // Use a short delay (debounce) to avoid running the function too frequently.
      clearTimeout(observer.debounceTimer);
      observer.debounceTimer = setTimeout(removeRightColumnAds, 200);
    }
  });

  // Bilibili's feed container might not exist when the script first runs.
  // We wait for it to appear before starting the observer.
  const waitForFeed = setInterval(() => {
    const feedContainer = document.querySelector(".feed2");
    if (feedContainer) {
      clearInterval(waitForFeed);
      // Run the function once initially.
      removeRightColumnAds();
      // Start observing for new content.
      observer.observe(feedContainer, { childList: true, subtree: true });
    }
  }, 500);
})();

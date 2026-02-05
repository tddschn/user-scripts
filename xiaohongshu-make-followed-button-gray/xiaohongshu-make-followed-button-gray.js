// ==UserScript==
// @name         Xiaohongshu Make Followed Button Gray
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Make followed buttons (已关注) gray on Xiaohongshu, with dynamic retraction
// @author       You
// @match        https://www.xiaohongshu.com/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const FOLLOWED_TEXT = "已关注";
  const GRAY_BG_STYLE = "background-color: #999 !important; background-image: none !important;";
  const PROCESSED_MARK = "gray-processed";

  function applyGrayStyle(button) {
    button.style.cssText += GRAY_BG_STYLE;
    button.dataset[PROCESSED_MARK] = "true";
  }

  function removeGrayStyle(button) {
    // Remove the inline styles we added - reset to let CSS classes take over
    button.style.backgroundColor = "";
    button.style.backgroundImage = "";
    delete button.dataset[PROCESSED_MARK];
  }

  function processButton(button) {
    // Check for the text span - this handles the standard structure:
    // <span class="reds-button-new-box">...<span class="reds-button-new-text"><!--[-->已关注<!--]--></span></span>
    const textSpan = button.querySelector("span.reds-button-new-text");

    let isFollowed = false;

    if (textSpan) {
      // Use textContent which strips HTML comment markers (<!--[-->, <!--]-->)
      const textContent = textSpan.textContent.trim();
      isFollowed = textContent === FOLLOWED_TEXT || textContent.includes(FOLLOWED_TEXT);
    }

    const hasStyle = button.dataset[PROCESSED_MARK] === "true";

    if (isFollowed && !hasStyle) {
      // Should be gray but isn't - apply style
      applyGrayStyle(button);
    } else if (!isFollowed && hasStyle) {
      // Should NOT be gray but has our style - remove it
      removeGrayStyle(button);
    }
  }

  function findAndProcessButtons() {
    const buttons = document.querySelectorAll("button.follow-button");
    buttons.forEach(processButton);
  }

  const observer = new MutationObserver((mutations) => {
    // Process all existing buttons on any DOM change
    findAndProcessButtons();
  });

  // Initial run
  findAndProcessButtons();

  // Observe for dynamic changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['class'],
  });
})();

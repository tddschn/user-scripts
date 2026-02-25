// ==UserScript==
// @name         Xiaohongshu Make Followed Button Gray
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Make followed buttons (已关注) gray and mutual follow buttons (互相关注) pink on Xiaohongshu, robust against Vue updates
// @author       You
// @match        https://www.xiaohongshu.com/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const FOLLOWED_TEXT = "已关注";
  const MUTUAL_FOLLOW_TEXT = "互相关注";

  // Use specific color checks to verify if our styles are active
  const GRAY_COLOR = "rgb(153, 153, 153)"; // #999 computes to this in most browsers
  const PINK_COLOR = "rgb(255, 192, 203)"; // "pink" computes to this

  function processButton(button) {
    // 1. Find the text span
    const textSpan = button.querySelector("span.reds-button-new-text");
    if (!textSpan) return;

    // 2. Check text content
    // .textContent AUTOMATICALLY strips Vue comment markers (), so we just trim whitespace.
    const textContent = textSpan.textContent.trim();
    const isFollowed =
      textContent === FOLLOWED_TEXT || textContent.includes(FOLLOWED_TEXT);
    const isMutualFollow =
      textContent === MUTUAL_FOLLOW_TEXT ||
      textContent.includes(MUTUAL_FOLLOW_TEXT);

    // 3. Apply or Remove Logic
    // We check the ACTUAL computed style or inline style, not just a dataset flag,
    // because Vue might wipe the style while leaving the dataset flag.
    if (isMutualFollow) {
      // Apply pink color for mutual follow
      if (button.style.backgroundColor !== PINK_COLOR) {
        button.style.setProperty("background-color", "pink", "important");
        button.style.setProperty("background-image", "none", "important");
        button.style.setProperty("color", "#000", "important"); // Black text for readability on pink
        button.style.setProperty("border-color", "transparent", "important");
      }
    } else if (isFollowed) {
      // Only apply if it's not already gray (prevents infinite loop/flicker)
      if (button.style.backgroundColor !== GRAY_COLOR) {
        button.style.setProperty("background-color", "#999", "important");
        button.style.setProperty("background-image", "none", "important");
        button.style.setProperty("color", "#fff", "important"); // Optional: ensure text is readable
        button.style.setProperty("border-color", "transparent", "important");
      }
    } else {
      // If it's NOT followed (e.g. user unfollowed), clean up
      const currentBg = button.style.backgroundColor;
      if (currentBg === GRAY_COLOR || currentBg === PINK_COLOR) {
        button.style.removeProperty("background-color");
        button.style.removeProperty("background-image");
        button.style.removeProperty("color");
        button.style.removeProperty("border-color");
      }
    }
  }

  function findAndProcessButtons() {
    const buttons = document.querySelectorAll("button.follow-button");
    buttons.forEach(processButton);
  }

  // 4. MutationObserver
  // We observe 'style' attributes specifically to fight back if Vue clears them
  const observer = new MutationObserver((mutations) => {
    findAndProcessButtons();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "style"], // Watch for style changes too
    characterData: true,
  });

  // Initial run
  findAndProcessButtons();
})();

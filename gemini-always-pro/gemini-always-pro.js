// ==UserScript==
// @name         Gemini Always Pro (Auto Model Upgrader)
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Automatically selects the most capable Gemini model available (Pro > Thinking > Fast)
// @author       Your Name
// @match        *://gemini.google.com/*
// @grant        none
// @run-at       document-idle
// @license      MIT
// ==/UserScript==

(function () {
  "use strict";

  const SCRIPT_VERSION = "1.4";

  // Model priority: highest to lowest capability
  const MODEL_PRIORITY = [
    {
      key: "pro",
      patterns: [/^\s*pro\b/i, /\bpro\b/i, /gemini\s+advanced/i],
      name: "Pro",
    },
    {
      key: "thinking",
      patterns: [
        /^\s*thinking\b/i,
        /thinking-modus/i,
        /thinking\s+mode/i,
        /\bthinking\b/i,
      ],
      name: "Thinking",
    },
    {
      key: "fast",
      patterns: [/^\s*fast\b/i, /^\s*schnell\b/i, /\bfast\b/i, /\bschnell\b/i],
      name: "Fast",
    },
  ];

  const MODE_PICKER_ARIA_PATTERNS = [
    "open mode picker",
    "mode picker",
    "modusauswahl",
    "modus",
  ];

  const ALL_MODEL_KEYWORDS = [
    "pro",
    "thinking",
    "fast",
    "schnell",
    "gemini advanced",
    "thinking mode",
    "thinking-modus",
  ];

  let isProcessing = false;
  let lastUrl = "";
  let hasAutoSwitchedForCurrentUrl = false;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let debounceTimer = null;

  /** @param {string | null | undefined} text */
  function normalizeText(text) {
    return (text || "").trim().toLowerCase();
  }

  /** @param {string | null | undefined} modelText */
  function getModelRank(modelText) {
    const normalized = normalizeText(modelText);

    if (/^pro\b/.test(normalized)) return 0;
    if (/^thinking\b/.test(normalized) || /^thinking-modus\b/.test(normalized))
      return 1;
    if (/^fast\b/.test(normalized) || /^schnell\b/.test(normalized)) return 2;

    for (let i = 0; i < MODEL_PRIORITY.length; i++) {
      if (
        MODEL_PRIORITY[i].patterns.some((pattern) => pattern.test(normalized))
      ) {
        return i;
      }
    }

    return -1;
  }

  function getModePickerButton() {
    const buttons = Array.from(document.querySelectorAll("button"));
    return (
      buttons.find((button) => {
        const ariaLabel = normalizeText(button.getAttribute("aria-label"));
        if (
          MODE_PICKER_ARIA_PATTERNS.some((pattern) =>
            ariaLabel.includes(pattern),
          )
        ) {
          return true;
        }

        const text = normalizeText(button.textContent);
        return (
          button.getAttribute("aria-haspopup") === "menu" &&
          getModelRank(text) !== -1
        );
      }) || null
    );
  }

  function getMenuItems() {
    return Array.from(
      document.querySelectorAll('[role="menuitemradio"], [role="menuitem"]'),
    );
  }

  function focusTextarea() {
    const textarea = document.querySelector(
      "rich-textarea > div.ql-editor.ql-blank.textarea.new-input-ui",
    );
    if (textarea && document.activeElement !== textarea) {
      if (textarea instanceof HTMLElement) {
        textarea.focus();
        console.log(`Gemini Always Pro v${SCRIPT_VERSION}: Focused textarea`);
      }
    }
  }

  /**
   * @param {Element[]} menuItems
   * @param {HTMLButtonElement} modePickerButton
   * @param {number} currentRank
   * @param {string} currentModelText
   */
  function processMenu(
    menuItems,
    modePickerButton,
    currentRank,
    currentModelText,
  ) {
    // Find the best available enabled model in the open menu
    let bestItem = null;
    let bestRank = Infinity;

    for (const item of menuItems) {
      const itemText = (item.textContent || "").trim();
      const rank = getModelRank(itemText);
      const isDisabled =
        item.getAttribute("aria-disabled") === "true" ||
        (item instanceof HTMLButtonElement && item.disabled);

      if (rank !== -1 && !isDisabled && rank < bestRank) {
        bestRank = rank;
        bestItem = item;
      }
    }

    console.log(
      `Gemini Always Pro v${SCRIPT_VERSION}: currentRank=${currentRank}, bestRank=${bestRank}, bestItemText=${bestItem ? (bestItem.textContent || "").trim() : "none"}`,
    );

    // If we found a better model than current, switch to it
    if (bestItem && bestRank < currentRank) {
      if (bestItem instanceof HTMLElement) {
        bestItem.click();
      }
      console.log(
        `Gemini Always Pro v${SCRIPT_VERSION}: Upgraded from ${currentModelText} to ${(bestItem.textContent || "").trim()}`,
      );
      hasAutoSwitchedForCurrentUrl = bestRank === 0;
      if (!hasAutoSwitchedForCurrentUrl) {
        setTimeout(autopilot, 500);
      } else {
        setTimeout(focusTextarea, 500);
      }
    } else {
      modePickerButton.click(); // close the menu
      if (bestItem) {
        console.log(
          `Gemini Always Pro v${SCRIPT_VERSION}: Already on best available model (${currentModelText})`,
        );
        hasAutoSwitchedForCurrentUrl = true;
      }
      setTimeout(focusTextarea, 300);
    }

    setTimeout(() => {
      isProcessing = false;
    }, 1000);
  }

  function autopilot() {
    const currentURL = window.location.href;

    // Reset auto-switch flag when URL changes
    if (currentURL !== lastUrl) {
      lastUrl = currentURL;
      hasAutoSwitchedForCurrentUrl = false;
    }

    // Skip if already processing or already switched for this URL
    if (hasAutoSwitchedForCurrentUrl || isProcessing) return;

    // Find the mode picker button (the true current active model control)
    const modePickerButton = getModePickerButton();

    if (!modePickerButton) return;

    const currentModelText = (modePickerButton.textContent || "").trim();
    const currentRank = getModelRank(currentModelText);

    if (currentRank === -1) return;

    // If we're already on the highest priority model (Pro), no need to switch
    if (currentRank === 0) {
      hasAutoSwitchedForCurrentUrl = true;
      return;
    }

    // Check if menu is already open
    let menuItems = getMenuItems();
    if (menuItems.length === 0) {
      isProcessing = true;
      modePickerButton.click();

      setTimeout(() => {
        menuItems = getMenuItems();
        processMenu(menuItems, modePickerButton, currentRank, currentModelText);
      }, 1000);
    } else {
      isProcessing = true;
      processMenu(menuItems, modePickerButton, currentRank, currentModelText);
    }
  }

  // Use MutationObserver to watch for DOM changes
  const observer = new MutationObserver((mutations) => {
    // Check if any mutation involves model-related elements
    const hasRelevantChange = mutations.some((mutation) => {
      // Check added nodes
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) {
          // ELEMENT_NODE
          const text = node.textContent;
          if (
            text &&
            ALL_MODEL_KEYWORDS.some((keyword) =>
              text.toLowerCase().includes(keyword),
            )
          ) {
            return true;
          }
        }
      }
      // Check if text content changed on spans
      if (mutation.type === "characterData" || mutation.type === "childList") {
        const target = mutation.target;
        if (
          target.nodeName === "SPAN" ||
          target.parentElement?.nodeName === "SPAN"
        ) {
          return true;
        }
      }
      return false;
    });

    if (hasRelevantChange) {
      // Debounce: wait a bit before running autopilot
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(autopilot, 100);
    }
  });

  // Start observing the document body for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  // Run autopilot on URL changes (navigation)
  const urlObserver = new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      hasAutoSwitchedForCurrentUrl = false;
      setTimeout(autopilot, 300);
    }
  });

  // Watch for URL changes via history API
  const titleNode = document.querySelector("title") || document.documentElement;
  urlObserver.observe(titleNode, {
    childList: true,
    subtree: true,
  });

  // Also handle popstate events
  window.addEventListener("popstate", () => {
    hasAutoSwitchedForCurrentUrl = false;
    setTimeout(autopilot, 300);
  });

  console.log(`Gemini Always Pro v${SCRIPT_VERSION}: Loaded`);

  // Run initial autopilot
  setTimeout(autopilot, 1000);
})();

// ==UserScript==
// @name         MOE Taiwanese Hokkien Dictionary Audio Downloader
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Adds download buttons for audio files on the Ministry of Education's Taiwanese Hokkien Dictionary website.
// @author       snomiao (feat. AI)
// @match        https://sutian.moe.edu.tw/*
// @icon         https://sutian.moe.edu.tw/static/image/favicon/favicon-32x32.png
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
  "use strict";

  const BASE_URL = "https://sutian.moe.edu.tw/";

  /**
   * Creates and adds a download button next to a given audio play button.
   * @param {HTMLElement} playButton - The original button for playing audio.
   */
  function addDownloadButton(playButton) {
    // 1. Check if a download button already exists to prevent duplication.
    if (
      playButton.nextElementSibling &&
      playButton.nextElementSibling.classList.contains("audio-download-button")
    ) {
      return;
    }

    // 2. Get the audio source URL from the data-src attribute.
    const srcAttr = playButton.dataset.src;
    if (!srcAttr) {
      return;
    }

    // 3. Parse the source attribute, which can be a plain string or a JSON array string.
    let audioUrls = [];
    try {
      if (srcAttr.startsWith("[")) {
        audioUrls = JSON.parse(srcAttr);
      } else {
        audioUrls.push(srcAttr);
      }
    } catch (e) {
      console.error(
        "MOE Audio Downloader: Failed to parse audio source:",
        srcAttr,
        e,
      );
      return;
    }

    if (audioUrls.length === 0) {
      return;
    }

    // 4. Use the first URL. In practice, there's usually only one.
    const relativeUrl = audioUrls[0];
    const fullUrl = new URL(relativeUrl, BASE_URL).href;

    // 5. Generate a descriptive filename from the button's accessible label.
    let filename = "";
    const hiddenSpan = playButton.querySelector(".visually-hidden");
    if (hiddenSpan) {
      const labelText = hiddenSpan.textContent;
      // Extract text following "播放...", e.g., "播放主音讀siūnn-beh" -> "siūnn-beh"
      const match = labelText.match(/播放(?:主音讀|例句|音讀)(.*)/);
      if (match && match[1]) {
        filename = match[1]
          .trim()
          .replace(/\s+/g, "-") // Replace spaces with hyphens for cleaner names
          .replace(/[/\\?%*:|"<>.]/g, "_"); // Sanitize characters illegal in filenames
        // Remove any leading/trailing hyphens or underscores
        filename = filename.replace(/^[_-]+|[_-]+$/g, "");
      }
    }

    // Fallback to the original filename from the URL if the label method fails.
    if (!filename) {
      filename = relativeUrl
        .split("/")
        .pop()
        .replace(/\.mp3$/, "");
    }
    filename += ".mp3";

    // 6. Create the download link (<a> tag).
    const downloadLink = document.createElement("a");
    downloadLink.href = fullUrl;
    downloadLink.download = filename;
    downloadLink.title = `下載 ${filename}`;
    // Apply similar Bootstrap classes for visual consistency, but use 'secondary' color.
    downloadLink.className =
      "btn btn-outline-secondary border-0 p-0 ms-1 lh-normal audio-download-button";
    downloadLink.style.textDecoration = "none";
    downloadLink.setAttribute("aria-label", `下載音檔： ${filename}`);
    downloadLink.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="currentColor" style="vertical-align: text-bottom;" class="bi bi-download" viewBox="0 0 16 16">
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
            </svg>
        `;

    // 7. Insert the download button into the DOM right after the play button.
    playButton.insertAdjacentElement("afterend", downloadLink);
  }

  /**
   * Processes all audio buttons currently in the document.
   */
  function processAllButtons() {
    document.querySelectorAll(".imtong-liua").forEach(addDownloadButton);
  }

  // 8. Use a MutationObserver to handle dynamically loaded content.
  const observer = new MutationObserver((mutations) => {
    let hasAddedNodes = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length) {
        hasAddedNodes = true;
        break;
      }
    }
    if (hasAddedNodes) {
      // Re-scan the document if new elements were added.
      // The check inside addDownloadButton prevents duplicates.
      processAllButtons();
    }
  });

  // 9. Initial run on page load.
  processAllButtons();

  // 10. Start observing for changes in the entire document body.
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
})();

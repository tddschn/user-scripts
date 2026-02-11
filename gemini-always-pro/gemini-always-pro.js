// ==UserScript==
// @name         Gemini Always Pro (Auto Model Upgrader)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automatically selects the most capable Gemini model available (Pro > Thinking > Fast)
// @author       Your Name
// @match        *://gemini.google.com/*
// @grant        none
// @run-at       document-idle
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // Model priority: highest to lowest capability
    const MODEL_PRIORITY = [
        { labels: ['Pro', 'Gemini Advanced'], name: 'Pro' },
        { labels: ['Thinking-Modus', 'Thinking', 'Thinking mode'], name: 'Thinking' },
        { labels: ['Fast', 'Schnell'], name: 'Fast' }
    ];

    // Flatten all possible model labels for detection
    const ALL_MODEL_LABELS = MODEL_PRIORITY.flatMap(m => m.labels);

    let isProcessing = false;
    let lastUrl = "";
    let hasAutoSwitchedForCurrentUrl = false;

    function getModelRank(modelText) {
        for (let i = 0; i < MODEL_PRIORITY.length; i++) {
            if (MODEL_PRIORITY[i].labels.includes(modelText)) {
                return i;
            }
        }
        return -1;
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

        // Find the current model button
        const allSpans = Array.from(document.querySelectorAll('span'));
        const currentModelSpan = allSpans.find(s =>
            ALL_MODEL_LABELS.includes(s.textContent.trim())
        );

        if (!currentModelSpan) return;

        const currentModelText = currentModelSpan.textContent.trim();
        const currentRank = getModelRank(currentModelText);

        // If we're already on the highest priority model (Pro), no need to switch
        if (currentRank === 0) {
            hasAutoSwitchedForCurrentUrl = true;
            return;
        }

        // Open the model dropdown to check available options
        const btn = currentModelSpan.closest('button');
        if (btn) {
            isProcessing = true;
            btn.click();

            setTimeout(() => {
                const menuOptions = Array.from(document.querySelectorAll('span'));

                // Find the best available model (lowest rank number = highest priority)
                let bestOption = null;
                let bestRank = Infinity;

                for (const option of menuOptions) {
                    const optionText = option.textContent.trim();
                    const rank = getModelRank(optionText);

                    if (rank !== -1 && rank < bestRank) {
                        bestRank = rank;
                        bestOption = option;
                    }
                }

                // If we found a better model than current, switch to it
                if (bestOption && bestRank < currentRank) {
                    const clickable = bestOption.closest('div[role="menuitem"]') || bestOption.parentElement;
                    clickable.click();
                    console.log(`Gemini Always Pro: Upgraded from ${currentModelText} to ${bestOption.textContent.trim()}`);
                } else {
                    // Close the dropdown if we're not switching
                    btn.click();
                    console.log(`Gemini Always Pro: Already on best available model (${currentModelText})`);
                }

                hasAutoSwitchedForCurrentUrl = true;
                setTimeout(() => { isProcessing = false; }, 1000);
            }, 300);
        }
    }

    // Run autopilot every 500ms to catch model changes
    setInterval(autopilot, 500);

    // Also run on navigation changes
    window.addEventListener('popstate', autopilot);
})();

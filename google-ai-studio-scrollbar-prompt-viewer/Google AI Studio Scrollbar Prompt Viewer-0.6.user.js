// ==UserScript==
// @name         Google AI Studio Scrollbar Prompt Viewer
// @namespace    http://tampermonkey.net/
// @version      0.6
// @description  Displays clickable, high-contrast prompt labels next to the scrollbar in Google's AI Studio.
// @author       Your Name
// @match        https://aistudio.google.com/app/prompts/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const SCRIPT_PREFIX = 'AIPSV:';
    let labelContainer = null; // A global reference to our container
    let debounceTimer = null; // A timer to prevent the script from running too often

    // The main function that draws/updates everything
    function updateLabels() {
        const scrollbar = document.querySelector('ms-prompt-scrollbar[role="toolbar"]');

        // If scrollbar disappears (e.g., navigating away), hide the labels and stop.
        if (!scrollbar) {
            if (labelContainer) labelContainer.style.display = 'none';
            return;
        }

        // --- Crucial Visibility Check ---
        // Get the scrollbar's position and size.
        const scrollbarRect = scrollbar.getBoundingClientRect();
        // If the scrollbar has no size, it's hidden or not rendered yet. Wait for the next check.
        if (scrollbarRect.width === 0 || scrollbarRect.height === 0) {
            return;
        }

        // If the container doesn't exist yet, create it.
        if (!labelContainer) {
            labelContainer = document.createElement('div');
            labelContainer.id = 'prompt-viewer-container';
            document.body.appendChild(labelContainer);
        }

        // --- Positioning and Layering ---
        // Always update position in case of window resize.
        labelContainer.style.position = 'fixed';
        labelContainer.style.top = `${scrollbarRect.top}px`;
        labelContainer.style.left = `${scrollbarRect.right + 8}px`; // 8px gap
        labelContainer.style.height = `${scrollbarRect.height}px`;
        labelContainer.style.zIndex = '99999';
        labelContainer.style.pointerEvents = 'none'; // Container is click-through
        labelContainer.style.display = 'block'; // Ensure it's visible

        // --- Update Labels ---
        const promptButtons = scrollbar.querySelectorAll('button[aria-label]');
        const existingLabels = new Map(Array.from(labelContainer.children).map(node => [node.dataset.key, node]));
        const activeKeys = new Set();

        promptButtons.forEach((button, index) => {
            const promptText = button.getAttribute('aria-label');
            // Use index as a simple, reliable key
            const key = `prompt-label-${index}`;
            activeKeys.add(key);

            const parentItem = button.parentElement;
            const relativeTop = parentItem.offsetTop; // Use offsetTop relative to the scrollbar itself

            let label = existingLabels.get(key);

            if (!label) {
                label = document.createElement('div');
                label.dataset.key = key;
                label.textContent = promptText;
                label.style.pointerEvents = 'auto'; // Labels are clickable
                label.style.cursor = 'pointer';

                // Add click listener when the label is created
                label.addEventListener('click', () => button.click());
                labelContainer.appendChild(label);
            }

            // --- Styling (always applied) ---
            label.style.position = 'absolute';
            label.style.top = `${relativeTop}px`;
            label.style.whiteSpace = 'nowrap';
            label.style.overflow = 'hidden';
            label.style.textOverflow = 'ellipsis';
            label.style.maxWidth = '350px';
            label.style.padding = '3px 7px';
            label.style.borderRadius = '4px';
            label.style.fontSize = '12px';
            label.style.fontFamily = 'Roboto, Arial, sans-serif';
            label.style.transition = 'all 0.15s ease-out';

            // High-Contrast Colors
            if (button.classList.contains('ms-button-active')) {
                label.style.fontWeight = 'bold';
                label.style.backgroundColor = 'rgba(138, 180, 248, 1.0)'; // Bright Blue
                label.style.color = '#202124';
                label.style.transform = 'translateX(5px)';
            } else {
                label.style.fontWeight = 'normal';
                label.style.backgroundColor = 'rgba(0, 77, 64, 0.95)'; // Dark Teal
                label.style.color = '#FFFFFF';
                label.style.transform = 'translateX(0px)';
            }
        });

        // Clean up old labels that are no longer on the scrollbar
        existingLabels.forEach((label, key) => {
            if (!activeKeys.has(key)) {
                label.remove();
            }
        });
    }

    // A simple function to prevent the update logic from running too often
    function debouncedUpdate() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(updateLabels, 100);
    }

    // --- Initialization Logic ---
    function init() {
        console.log(SCRIPT_PREFIX, "Waiting for the UI to be ready...");

        // Set up the MutationObserver to watch for all future changes
        const observer = new MutationObserver(debouncedUpdate);
        observer.observe(document.body, { childList: true, subtree: true, attributes: true });

        // Also run on window resize
        window.addEventListener('resize', debouncedUpdate);

        // Run the update function once to get started
        debouncedUpdate();
    }

    // Start the whole process
    init();

})();
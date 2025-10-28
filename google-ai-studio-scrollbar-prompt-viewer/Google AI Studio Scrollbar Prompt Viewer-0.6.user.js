// ==UserScript==
// @name         Google AI Studio Scrollbar Prompt Viewer
// @namespace    http://tampermonkey.net/
// @version      0.7
// @description  Displays clickable, high-contrast prompt labels next to the scrollbar and adds C-j/C-k navigation.
// @author       Your Name
// @match        https://aistudio.google.com/app/prompts/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const SCRIPT_PREFIX = 'AIPSV:';
    let labelContainer = null;
    let debounceTimer = null;

    // The main function that draws/updates the visual labels
    function updateLabels() {
        const scrollbar = document.querySelector('ms-prompt-scrollbar[role="toolbar"]');
        if (!scrollbar) {
            if (labelContainer) labelContainer.style.display = 'none';
            return;
        }

        const scrollbarRect = scrollbar.getBoundingClientRect();
        if (scrollbarRect.width === 0 || scrollbarRect.height === 0) {
            return;
        }

        if (!labelContainer) {
            labelContainer = document.createElement('div');
            labelContainer.id = 'prompt-viewer-container';
            document.body.appendChild(labelContainer);
        }

        labelContainer.style.position = 'fixed';
        labelContainer.style.top = `${scrollbarRect.top}px`;
        labelContainer.style.left = `${scrollbarRect.right + 8}px`;
        labelContainer.style.height = `${scrollbarRect.height}px`;
        labelContainer.style.zIndex = '99999';
        labelContainer.style.pointerEvents = 'none';
        labelContainer.style.display = 'block';

        const promptButtons = scrollbar.querySelectorAll('button[aria-label]');
        const existingLabels = new Map(Array.from(labelContainer.children).map(node => [node.dataset.key, node]));
        const activeKeys = new Set();

        promptButtons.forEach((button, index) => {
            const promptText = button.getAttribute('aria-label');
            const key = `prompt-label-${index}`;
            activeKeys.add(key);

            const parentItem = button.parentElement;
            const relativeTop = parentItem.offsetTop;

            let label = existingLabels.get(key);

            if (!label) {
                label = document.createElement('div');
                label.dataset.key = key;
                label.textContent = promptText;
                label.style.pointerEvents = 'auto';
                label.style.cursor = 'pointer';
                label.addEventListener('click', () => button.click());
                labelContainer.appendChild(label);
            }

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

            if (button.classList.contains('ms-button-active')) {
                label.style.fontWeight = 'bold';
                label.style.backgroundColor = 'rgba(138, 180, 248, 1.0)';
                label.style.color = '#202124';
                label.style.transform = 'translateX(5px)';
            } else {
                label.style.fontWeight = 'normal';
                label.style.backgroundColor = 'rgba(0, 77, 64, 0.95)';
                label.style.color = '#FFFFFF';
                label.style.transform = 'translateX(0px)';
            }
        });

        existingLabels.forEach((label, key) => {
            if (!activeKeys.has(key)) {
                label.remove();
            }
        });
    }

    // --- NEW: Function to handle keyboard shortcuts ---
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Ignore if Ctrl is not pressed or if the key is not 'j' or 'k'
            if (!event.ctrlKey || (event.key !== 'j' && event.key !== 'k')) {
                return;
            }

            // Prevent the browser's default action (e.g., opening downloads)
            event.preventDefault();

            const scrollbar = document.querySelector('ms-prompt-scrollbar[role="toolbar"]');
            if (!scrollbar) return;

            // Get all prompt buttons as an array
            const buttons = Array.from(scrollbar.querySelectorAll('button[aria-label]'));
            if (buttons.length <= 1) return; // No need to navigate if there's only one item

            // Find the index of the currently active button
            const currentIndex = buttons.findIndex(btn => btn.classList.contains('ms-button-active'));

            let nextIndex;

            if (event.key === 'j') { // Go to NEXT prompt
                // If nothing is active, the first one becomes the target. Otherwise, calculate the next.
                nextIndex = (currentIndex === -1) ? 0 : (currentIndex + 1) % buttons.length;
            } else { // Go to PREVIOUS prompt (event.key === 'k')
                // If nothing is active, the last one becomes the target. Otherwise, calculate the previous.
                nextIndex = (currentIndex === -1) ? buttons.length - 1 : (currentIndex - 1 + buttons.length) % buttons.length;
            }

            // Simulate a click on the target button
            if (buttons[nextIndex]) {
                buttons[nextIndex].click();
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
        console.log(SCRIPT_PREFIX, "Prompt Viewer & Shortcuts Initialized.");

        // Set up the keyboard listener once.
        setupKeyboardShortcuts();

        const observer = new MutationObserver(debouncedUpdate);
        observer.observe(document.body, { childList: true, subtree: true, attributes: true });

        window.addEventListener('resize', debouncedUpdate);

        debouncedUpdate();
    }

    init();

})();
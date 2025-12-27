// ==UserScript==
// @name         VS Marketplace - Install in Antigravity
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Add an "Install in Antigravity" button to VS Code Marketplace extension pages.
// @author       You
// @match        https://marketplace.visualstudio.com/items?*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // The URL scheme for Google Antigravity IDE
    const SCHEME = 'antigravity';

    function addButton() {
        // Find the existing install button container
        const container = document.querySelector('.installButtonContainer .ms-Fabric');
        if (!container) return;

        // Find the existing install link to clone
        const existingLinkWrapper = container.querySelector('.ux-oneclick-install-button-container');
        const existingLink = existingLinkWrapper ? existingLinkWrapper.querySelector('a.install') : null;

        if (!existingLink || container.querySelector('.antigravity-install-button')) return;

        // Extract the extension ID from the existing href (vscode:extension/publisher.name)
        // or from the current URL query parameter
        const currentHref = existingLink.getAttribute('href');
        let extensionId = '';

        if (currentHref && currentHref.startsWith('vscode:extension/')) {
            extensionId = currentHref.split('vscode:extension/')[1];
        } else {
            const urlParams = new URLSearchParams(window.location.search);
            extensionId = urlParams.get('itemName');
        }

        if (!extensionId) return;

        // Clone the wrapper to preserve layout/styling
        const newLinkWrapper = existingLinkWrapper.cloneNode(true);
        const newLink = newLinkWrapper.querySelector('a');

        // Update the href to use the Antigravity scheme
        newLink.href = `${SCHEME}:extension/${extensionId}`;

        // Update the label text
        const label = newLink.querySelector('.ms-Button-label');
        if (label) {
            label.textContent = 'Install in Antigravity';
        }

        // Add a custom class to identify our button and add some spacing
        newLinkWrapper.classList.add('antigravity-install-button');
        newLinkWrapper.style.marginLeft = '10px';

        // Change the button color to distinguish it (optional - e.g., a Google-ish blue or just keep default)
        // newLink.style.backgroundColor = '#4285F4'; // Google Blue
        // newLink.style.borderColor = '#4285F4';

        // Insert the new button after the existing one
        container.insertBefore(newLinkWrapper, container.querySelector('.installHelpInfo'));
    }

    // Run the function
    addButton();

    // Observe DOM changes in case the page content loads dynamically (SPA behavior)
    const observer = new MutationObserver((mutations) => {
        addButton();
    });

    observer.observe(document.body, { childList: true, subtree: true });

})();
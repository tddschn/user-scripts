// ==UserScript==
// @name         ChatGPT Reference URL Cleaner
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  Removes ?utm_source=chatgpt.com and &utm_source=chatgpt.com from all <a> tag hrefs on ChatGPT chat pages
// @author       Your Name
// @match        https://chatgpt.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const utmParam = 'utm_source';
    const utmValue = 'chatgpt.com';

    function cleanUrl(href) {
        if (!href || typeof href !== 'string') {
            return href;
        }

        try {
            // Use URL constructor for robust parsing and modification
            // It needs a base if the href is relative, so we provide document.location.href
            const url = new URL(href, document.location.href);

            if (url.searchParams.get(utmParam) === utmValue) {
                url.searchParams.delete(utmParam);
                // Return the modified URL.
                return url.toString();
            }
        } catch (e) {
            // If URL parsing fails (e.g., mailto:, tel:, or malformed URL),
            // try a simpler string replacement as a fallback for this specific case.
            if (href.includes(`${utmParam}=${utmValue}`)) {
                let newHref = href.replace(`?${utmParam}=${utmValue}&`, '?'); // param in middle
                newHref = newHref.replace(`&${utmParam}=${utmValue}&`, '&'); // param in middle
                newHref = newHref.replace(`?${utmParam}=${utmValue}`, '');   // param is last (or only) with ?
                newHref = newHref.replace(`&${utmParam}=${utmValue}`, '');   // param is last with &

                // If the URL now ends with '?', remove it
                if (newHref.endsWith('?')) {
                    newHref = newHref.slice(0, -1);
                }
                return newHref;
            }
            // console.warn(`[ChatGPT Ref Cleaner] Could not parse URL: ${href}`, e);
        }
        return href; // Return original if no changes or error
    }

    function processNode(node) {
        // Check if the node itself is an <a> tag with the UTM parameter
        if (node.tagName === 'A' && node.href && node.href.includes(`${utmParam}=${utmValue}`)) {
            const originalHref = node.getAttribute('href'); // Get the raw attribute value
            const cleanedHref = cleanUrl(node.href); // Clean the resolved href

            // Only update if it actually changed, and compare with resolved href
            if (cleanedHref !== node.href) {
                node.href = cleanedHref;
                // console.log(`[ChatGPT Ref Cleaner] Cleaned direct: ${originalHref} -> ${node.href}`);
            }
        }

        // Check for <a> tags within the node that have the UTM parameter
        // Using querySelectorAll on the node limits the scope
        if (typeof node.querySelectorAll === 'function') {
            const links = node.querySelectorAll(`a[href*="${utmParam}=${utmValue}"]`);
            links.forEach(link => {
                const originalHref = link.getAttribute('href');
                const cleanedHref = cleanUrl(link.href);

                if (cleanedHref !== link.href) {
                    link.href = cleanedHref;
                    // console.log(`[ChatGPT Ref Cleaner] Cleaned descendant: ${originalHref} -> ${link.href}`);
                }
            });
        }
    }

    // Initial run: Process all links currently in the document body
    // console.log('[ChatGPT Ref Cleaner] Initializing on ChatGPT page...');
    processNode(document.body);

    // Observe for future DOM changes (nodes added)
    const observer = new MutationObserver(mutationsList => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    // We only care about element nodes
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        processNode(node);
                    }
                });
            }
        }
    });

    // Start observing the document body and its descendants for additions
    observer.observe(document.documentElement, { childList: true, subtree: true });

    // Optional: Clean up observer when the window is about to be unloaded
    window.addEventListener('beforeunload', () => {
        observer.disconnect();
        // console.log('[ChatGPT Ref Cleaner] Observer disconnected.');
    });

})();
// ==UserScript==
// @name         USGS EarthExplorer Google Maps Buttons
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Adds a "View on Google Maps" button next to each coordinate entry on USGS EarthExplorer.
// @author       Gemini
// @match        https://earthexplorer.usgs.gov/*
// @grant        none
// @icon         https://www.google.com/s2/favicons?sz=64&domain=usgs.gov
// ==/UserScript==

(function() {
    'use strict';

    /**
     * Creates and adds a Google Maps link to a given coordinate list item.
     * It checks if a link already exists to prevent duplicates.
     * @param {HTMLElement} coordLiElement - The <li> element containing the coordinate.
     */
    const addGoogleMapsButton = (coordLiElement) => {
        // Prevent adding duplicate buttons
        if (coordLiElement.querySelector('.google-maps-link')) {
            return;
        }

        // Find the container for decimal coordinates, as it's the most reliable format
        const decimalContainer = coordLiElement.querySelector('.format_dd');
        if (!decimalContainer) {
            return;
        }

        // Extract latitude and longitude text content
        const lat = decimalContainer.querySelector('.latitude')?.textContent?.trim();
        const lon = decimalContainer.querySelector('.longitude')?.textContent?.trim();

        // Proceed only if both lat and lon are found
        if (lat && lon) {
            // Find the container where the edit/delete buttons are located
            const operationsContainer = coordLiElement.querySelector('.coordinateElementOperations');
            if (operationsContainer) {
                // Create the link element
                const gmapsLink = document.createElement('a');
                gmapsLink.href = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
                gmapsLink.target = '_blank'; // Open in a new tab
                gmapsLink.rel = 'noopener noreferrer';
                gmapsLink.title = 'View on Google Maps';

                // Add classes to mimic the style of existing buttons
                gmapsLink.className = 'iconLink google-maps-link';

                // Create a visual element for the button (map emoji icon)
                const iconSpan = document.createElement('span');
                iconSpan.textContent = '🗺️'; // Using a map emoji as a universal icon
                iconSpan.style.verticalAlign = 'middle';
                iconSpan.style.paddingLeft = '3px';
                iconSpan.style.fontSize = '14px';


                gmapsLink.appendChild(iconSpan);

                // Append the new link to the operations container
                operationsContainer.appendChild(gmapsLink);
            }
        }
    };

    /**
     * Finds all coordinate entries on the page and attempts to add a button to each.
     */
    const processAllCoordinates = () => {
        const coordEntries = document.querySelectorAll('ul#coordEntryArea li[id^="coordinate_"]');
        coordEntries.forEach(addGoogleMapsButton);
    };

    // The coordinate list is loaded dynamically, so we must wait for it to appear.
    // A MutationObserver is the most reliable way to detect when the list is populated or changed.
    const observer = new MutationObserver((mutationsList, observer) => {
        // When any change happens in the observed element, re-run the process.
        // The check inside addGoogleMapsButton prevents creating duplicates.
        processAllCoordinates();
    });

    // Start a timer to find the target container, as it may not exist on initial script execution
    const interval = setInterval(() => {
        const targetNode = document.getElementById('coordEntryArea');
        if (targetNode) {
            clearInterval(interval); // Stop the timer once the element is found

            // Run once initially to catch any coordinates that are already loaded
            processAllCoordinates();

            // Configure the observer to watch for additions/removals of children
            const config = {
                childList: true,
                subtree: true
            };

            // Start observing the coordinate list for changes
            observer.observe(targetNode, config);
        }
    }, 500); // Check for the element every 500ms

})();
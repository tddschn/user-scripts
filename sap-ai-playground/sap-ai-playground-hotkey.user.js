// ==UserScript==
// @name         SAP AI Playground | Trigger Button Click on Cmd/Ctrl-Enter
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Click the button with ID btnChat when the user presses Cmd-Enter or Ctrl-Enter
// @author       ChatGPT, tddschn
// @match        https://ai-playground.cfapps.sap.hana.ondemand.com/index.html
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function triggerButtonClick(e) {
        // Check if the pressed key is Enter and either Cmd or Ctrl is also pressed
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            const button = document.getElementById("btnChat");
            if (button) {
                button.click();
            }
        }
    }

    // Add the event listener to the document
    document.addEventListener('keydown', triggerButtonClick);
})();

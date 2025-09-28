// ==UserScript==
// @name         Enable Paste on Sprintax
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Enables pasting on websites that block it.
// @author       Your Name
// @match        https://taxprep.sprintax.com/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const allowPaste = function (e) {
    e.stopImmediatePropagation();
    return true;
  };

  document.addEventListener("paste", allowPaste, true);

  const inputs = document.getElementsByTagName("input");
  for (let i = 0; i < inputs.length; i++) {
    inputs[i].onpaste = null;
  }

  const textareas = document.getElementsByTagName("textarea");
  for (let i = 0; i < textareas.length; i++) {
    textareas[i].onpaste = null;
  }
})();

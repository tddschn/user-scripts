// ==UserScript==
// @name        Stop Copy Hijacking on vocus.cc
// @namespace   Violentmonkey Scripts
// @match       https://vocus.cc/*
// @grant       none
// @version     1.0
// @author      -
// @description Prevents vocus.cc from adding extra text when you copy.
// @run-at      document-start
// ==/UserScript==

(function() {
    'use strict';

    document.addEventListener('copy', function(e) {
        e.stopImmediatePropagation();
    }, true);
})();
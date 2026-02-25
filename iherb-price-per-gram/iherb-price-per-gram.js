// ==UserScript==
// @name         iHerb Price Per Gram Calculator
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Calculates the price per gram (or mg/kg/oz) for products on iHerb search results and displays it below the price.
// @author       You
// @match        https://www.iherb.com/search*
// @match        https://cn.iherb.com/search*
// @match        https://*.iherb.com/c/*
// @match        https://*.iherb.com/pr/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
  "use strict";

  // Configuration for visual style
  const STYLE_CONFIG = {
    color: "#2e7d32", // iHerb Green
    fontSize: "13px",
    fontWeight: "bold",
    marginTop: "5px",
  };

  // Helper to format currency
  const formatCurrency = (amount, currencySymbol) => {
    return currencySymbol + amount.toFixed(amount < 0.1 ? 4 : 2);
  };

  /**
   * Extracts weight in grams from the product title.
   * iHerb usually formats weights like: "16 oz (454 g)" or "100 g".
   */
  function parseWeight(title) {
    if (!title) return null;

    // Pattern 1: Look for "(XXX g)" or "(XXX mg)" or "(XXX kg)" (Standard iHerb formatting for imperial conversion)
    const parenMatch = title.match(/\(([\d,.]+)\s*(g|mg|kg|oz|lb)\)/i);
    if (parenMatch) {
      return normalizeToGrams(
        parseFloat(parenMatch[1].replace(/,/g, "")),
        parenMatch[2],
      );
    }

    // Pattern 2: Look for direct metric ending: "500 g", "1 kg"
    const metricMatch = title.match(/([\d,.]+)\s*(g|mg|kg)(?!\w)/i);
    if (metricMatch) {
      return normalizeToGrams(
        parseFloat(metricMatch[1].replace(/,/g, "")),
        metricMatch[2],
      );
    }

    // Pattern 3: Look for Imperial units if metric is missing: "16 oz", "1 lb"
    const imperialMatch = title.match(/([\d,.]+)\s*(oz|lb)(?!\w)/i);
    if (imperialMatch) {
      return normalizeToGrams(
        parseFloat(imperialMatch[1].replace(/,/g, "")),
        imperialMatch[2],
      );
    }

    return null;
  }

  /**
   * Converts various units to Grams
   */
  function normalizeToGrams(value, unit) {
    unit = unit.toLowerCase();
    switch (unit) {
      case "mg":
        return value / 1000;
      case "kg":
        return value * 1000;
      case "oz":
        return value * 28.3495;
      case "lb":
        return value * 453.592;
      case "g":
      default:
        return value;
    }
  }

  /**
   * Process a specific product listing element
   */
  function processProduct(productEl) {
    // Prevent double processing
    if (productEl.dataset.ppgCalculated) return;
    productEl.dataset.ppgCalculated = "true";

    // 1. Get Price
    // iHerb usually puts a meta tag with the raw price value inside the product card
    const priceMeta = productEl.querySelector('meta[itemprop="price"]');
    const currencyMeta = productEl.querySelector(
      'meta[itemprop="priceCurrency"]',
    ); // Usually hidden elsewhere, defaulting to symbol detection
    let price = 0;
    let currencySymbol = "$"; // Default

    if (priceMeta) {
      price = parseFloat(priceMeta.content);
    } else {
      // Fallback: Scrape visible text
      const priceTextEl = productEl.querySelector(".price, .discount-red");
      if (priceTextEl) {
        const rawText = priceTextEl.textContent.trim();
        // Attempt to find currency symbol
        const symbolMatch = rawText.match(/^[^\d]+/);
        if (symbolMatch) currencySymbol = symbolMatch[0].trim();
        price = parseFloat(rawText.replace(/[^0-9.]/g, ""));
      }
    }

    if (!price || isNaN(price)) return;

    // 2. Get Title for Weight Extraction
    const titleEl = productEl.querySelector(".product-title");
    if (!titleEl) return;
    const title = titleEl.textContent.trim();

    // 3. Calculate
    const weightInGrams = parseWeight(title);

    if (weightInGrams > 0) {
      const pricePerGram = price / weightInGrams;

      // 4. Create UI Element
      const infoDiv = document.createElement("div");
      infoDiv.className = "ppg-info";
      infoDiv.style.color = STYLE_CONFIG.color;
      infoDiv.style.fontSize = STYLE_CONFIG.fontSize;
      infoDiv.style.fontWeight = STYLE_CONFIG.fontWeight;
      infoDiv.style.marginTop = STYLE_CONFIG.marginTop;

      // Smart formatting: if price per gram is high, show per gram. If low, show per 100g (common for food)
      if (pricePerGram < 0.01) {
        infoDiv.textContent = `${formatCurrency(pricePerGram * 1000, currencySymbol)} / kg`;
      } else if (pricePerGram < 0.1) {
        infoDiv.textContent = `${formatCurrency(pricePerGram * 100, currencySymbol)} / 100g`;
      } else {
        infoDiv.textContent = `${formatCurrency(pricePerGram, currencySymbol)} / g`;
      }

      // 5. Inject
      const priceWrapper = productEl.querySelector(".product-price");
      if (priceWrapper) {
        priceWrapper.appendChild(infoDiv);
      }
    }
  }

  /**
   * Main scanner
   */
  function runScan() {
    // Selector for product cards in search results
    const productCards = document.querySelectorAll(
      ".product-cell-container, .product-inner",
    );
    productCards.forEach(processProduct);
  }

  // Run initially
  runScan();

  // Set up MutationObserver to handle infinite scroll / pagination / filter changes
  const observer = new MutationObserver((mutations) => {
    let shouldScan = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldScan = true;
        break;
      }
    }
    if (shouldScan) {
      runScan();
    }
  });

  // Observe the body or the specific product container if known
  const targetNode =
    document.getElementById("FilteredProducts") || document.body;
  observer.observe(targetNode, { childList: true, subtree: true });
})();

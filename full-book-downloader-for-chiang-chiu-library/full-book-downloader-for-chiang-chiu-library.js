// ==UserScript==
// @name         Full Book Downloader for (漳州市图书馆) Chiang-Chiu library
// @namespace    http://tampermonkey.net/
// @version      3.2
// @description  Navigates through a specified number of pages from a custom start page to download and merge PDFs into one file.
// @author       You
// @match        *://61.136.101.125/bookview*
// @require      https://unpkg.com/pdf-lib/dist/pdf-lib.min.js
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // --- 1. CREATE THE USER INTERFACE ---
    function createControlPanel() {
        const panel = document.createElement('div');
        panel.id = 'gm-control-panel';

        // Get current page to set as default start page
        const currentPage = document.getElementById('page-sp1')?.innerText || '1';

        panel.innerHTML = `
            <h3>Book Downloader</h3>
            <div class="gm-input-group">
                <label for="gm-start-page-input">Start from page:</label>
                <input type="number" id="gm-start-page-input" min="1" value="${currentPage}">
            </div>
            <div class="gm-input-group">
                <label for="gm-page-count-input">Pages to download:</label>
                <input type="number" id="gm-page-count-input" placeholder="All from start" min="1" title="Leave blank to download all pages from the start page">
            </div>
            <button id="gm-start-download" class="gm-button">Start Download</button>
            <div id="gm-status" style="margin-top: 10px; font-weight: bold;"></div>
            <div id="gm-final-links" style="display:none; margin-top: 10px;"></div>
        `;
        document.body.appendChild(panel);

        GM_addStyle(`
            #gm-control-panel {
                position: fixed; bottom: 20px; right: 20px; z-index: 10000;
                background-color: #f8f9fa; border: 1px solid #ccc; border-radius: 8px;
                padding: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.2); font-family: sans-serif;
                width: 300px; line-height: 1.5;
            }
            #gm-control-panel h3 { margin-top: 0; color: #333; }
            .gm-input-group {
                margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;
            }
            .gm-input-group label { color: #555; font-size: 14px; }
            .gm-input-group input {
                width: 90px; padding: 5px; border: 1px solid #ccc; border-radius: 3px; font-size: 14px;
            }
            .gm-button {
                background-color: #007bff; color: white; border: none; border-radius: 5px;
                padding: 10px 15px; font-size: 16px; cursor: pointer; width: 100%;
            }
            .gm-button:hover { background-color: #0056b3; }
            .gm-button:disabled { background-color: #555; cursor: not-allowed; }
            .gm-download-link {
                display: block; margin-top: 8px; background-color: #28a745;
                padding: 10px; text-align: center; border-radius: 5px; color: white;
                text-decoration: none; font-weight: bold;
            }
            .gm-download-link:hover { background-color: #218838; }
        `);

        document.getElementById('gm-start-download').addEventListener('click', startFullDownload);
    }

    // --- 2. AUTOMATION AND SCRAPING LOGIC ---
    async function startFullDownload() {
        const startButton = document.getElementById('gm-start-download');
        const statusDiv = document.getElementById('gm-status');
        const finalLinksDiv = document.getElementById('gm-final-links');

        startButton.disabled = true;
        startButton.innerText = 'Working...';
        finalLinksDiv.style.display = 'none';
        finalLinksDiv.innerHTML = '';

        const pdfBuffers = [];

        // --- Get and validate user inputs ---
        const totalPages = parseInt(document.getElementById('page-sp2').innerText, 10);
        let startPage = parseInt(document.getElementById('gm-start-page-input').value, 10);
        let pagesToDownload = parseInt(document.getElementById('gm-page-count-input').value, 10);

        if (isNaN(startPage) || startPage < 1) startPage = 1;
        if (startPage > totalPages) startPage = totalPages;

        if (isNaN(pagesToDownload) || pagesToDownload <= 0) {
            pagesToDownload = totalPages - startPage + 1; // Default to all remaining pages
        }
        
        const endPage = Math.min(startPage + pagesToDownload - 1, totalPages);
        const actualPagesToDownload = endPage - startPage + 1;

        // --- Navigate to the specified start page ---
        statusDiv.innerText = `Navigating to start page ${startPage}...`;
        const startPageLink = document.querySelector(`#pic-ul .nav-item:nth-child(${startPage}) .nav-link`);
        if (!startPageLink) {
             statusDiv.innerText = `Error: Could not find link for page ${startPage}.`;
             startButton.disabled = false;
             startButton.innerText = 'Start Download';
             return;
        }
        startPageLink.click();
        await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for page to load

        // --- Main processing loop ---
        let pagesProcessed = 0;
        for (let currentPageNum = startPage; currentPageNum <= endPage; currentPageNum++) {
            pagesProcessed++;
            statusDiv.innerText = `Processing page ${currentPageNum} (${pagesProcessed} of ${actualPagesToDownload})...`;

            await waitForIframeLoad();
            const iframe = document.querySelector('iframe[src*="viewer.html?file=blob:"]');
            if (!iframe) {
                statusDiv.innerText = `Error on page ${currentPageNum}: Could not find PDF iframe.`;
                break;
            }

            const pdfBlobUrl = extractBlobUrl(iframe.src);
            if (pdfBlobUrl) {
                try {
                    const response = await fetch(pdfBlobUrl);
                    const buffer = await response.arrayBuffer();
                    pdfBuffers.push(buffer);
                } catch (e) { console.error(`Failed to fetch PDF for page ${currentPageNum}:`, e); }
            }

            // Navigate to the next page if not the last one
            if (currentPageNum < endPage) {
                document.getElementById('pdf-down').click();
                await waitForAttributeChange(iframe, 'src', 10000);
            }
        }

        if (pdfBuffers.length > 0) {
            statusDiv.innerText = `Collected ${pdfBuffers.length} pages. Merging PDF...`;
            await mergeAndOfferDownload(pdfBuffers, startPage, endPage);
            statusDiv.innerText = 'Done! Your PDF is ready below.';
        } else {
            statusDiv.innerText = 'Failed to collect any PDF data.';
        }
        startButton.disabled = false;
        startButton.innerText = 'Start Download';
    }

    // --- 3. MERGING AND FINALIZATION ---
    async function mergeAndOfferDownload(pdfBuffers, startPage, endPage) {
        const finalLinksDiv = document.getElementById('gm-final-links');
        const documentTitle = document.querySelector('h1.navbar-brand').innerText.trim() || 'document';
        const pageRange = startPage === endPage ? `page ${startPage}` : `pages ${startPage}-${endPage}`;
        const finalFilename = `${documentTitle} (${pageRange}).pdf`;

        const mergedPdf = await window.PDFLib.PDFDocument.create();
        for (const buffer of pdfBuffers) {
            try {
                const donorPdf = await window.PDFLib.PDFDocument.load(buffer);
                const [donorPage] = await mergedPdf.copyPages(donorPdf, [0]);
                mergedPdf.addPage(donorPage);
            } catch(e) { console.error("Could not process a page, it might be corrupted. Skipping.", e); }
        }
        const mergedPdfBytes = await mergedPdf.save();
        createDownloadLink(mergedPdfBytes, finalFilename, 'application/pdf', 'Download Merged PDF');
        
        finalLinksDiv.style.display = 'block';
    }

    // --- 4. HELPER UTILITIES ---
    function extractBlobUrl(src) {
        const i = src.indexOf('blob:');
        if (i===-1) return null;
        const sub = src.substring(i);
        const end = sub.indexOf('&');
        return end === -1 ? sub : sub.substring(0, end);
    }

    function createDownloadLink(data, filename, mime, text) {
        const blob = new Blob([data], {type: mime});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.innerText = text;
        a.className = 'gm-download-link';
        document.getElementById('gm-final-links').appendChild(a);
    }
    
    function waitForIframeLoad() {
        return new Promise(res => setTimeout(res, 500));
    }

    function waitForAttributeChange(element, attr, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const initialValue = element.getAttribute(attr);
            const observer = new MutationObserver(mutations => {
                if (element.getAttribute(attr) !== initialValue) {
                    observer.disconnect();
                    resolve();
                }
            });
            observer.observe(element, { attributes: true, attributeFilter: [attr] });
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Timeout waiting for attribute '${attr}' to change.`));
            }, timeout);
        });
    }

    // --- 5. INITIALIZE THE SCRIPT ---
    createControlPanel();
})();
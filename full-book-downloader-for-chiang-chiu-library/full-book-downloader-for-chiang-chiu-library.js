// ==UserScript==
// @name         Full Book Downloader for 61.136.101.125 (漳州市图书馆) Chiang-Chiu library
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Navigates through all pages to download and merge all PDFs into one file, and compiles all extracted text.
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
        panel.innerHTML = `
            <h3>Full Book Downloader</h3>
            <p>This will navigate through all pages to collect the PDF and text data.</p>
            <button id="gm-start-download" class="gm-button">Start Full Download</button>
            <div id="gm-status" style="margin-top: 10px; font-weight: bold;"></div>
            <div id="gm-final-links" style="display:none; margin-top: 10px;"></div>
        `;
        document.body.appendChild(panel);

        GM_addStyle(`
            #gm-control-panel {
                position: fixed; bottom: 20px; right: 20px; z-index: 10000;
                background-color: #f0f0f0; border: 1px solid #ccc; border-radius: 8px;
                padding: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.2); font-family: sans-serif;
                width: 300px;
            }
            #gm-control-panel h3 { margin-top: 0; }
            .gm-button {
                background-color: #007bff; color: white; border: none; border-radius: 5px;
                padding: 10px 15px; font-size: 16px; cursor: pointer; width: 100%;
            }
            .gm-button:hover { background-color: #0056b3; }
            .gm-button:disabled { background-color: #555; cursor: not-allowed; }
            .gm-download-link {
                display: block; margin-top: 8px; background-color: #28a745;
                padding: 10px; text-align: center; border-radius: 5px; color: white;
                text-decoration: none;
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
        const textFragments = [];

        // Find total pages
        const totalPages = parseInt(document.getElementById('page-sp2').innerText, 10);
        if (isNaN(totalPages) || totalPages <= 0) {
            statusDiv.innerText = 'Error: Could not determine total pages.';
            startButton.disabled = false;
            return;
        }

        // Navigate to the first page to ensure we start correctly
        statusDiv.innerText = 'Navigating to first page...';
        document.querySelector('#pic-ul .nav-item:first-child .nav-link').click();
        await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for page 1 to load

        for (let i = 1; i <= totalPages; i++) {
            statusDiv.innerText = `Processing page ${i} of ${totalPages}...`;

            // Wait for the iframe to be ready
            await waitForIframeLoad();

            const iframe = document.querySelector('iframe[src*="viewer.html?file=blob:"]');
            if (!iframe) {
                statusDiv.innerText = `Error on page ${i}: Could not find PDF iframe.`;
                break;
            }

            // A. Scrape the PDF blob for the current page
            const pdfBlobUrl = extractBlobUrl(iframe.src);
            if (pdfBlobUrl) {
                try {
                    const response = await fetch(pdfBlobUrl);
                    const buffer = await response.arrayBuffer();
                    pdfBuffers.push(buffer);
                } catch (e) {
                    console.error(`Failed to fetch PDF for page ${i}:`, e);
                }
            }

            // B. Scrape the text for the current page
            const textContentDiv = document.getElementById('content-div');
            const pageTitleElement = textContentDiv.querySelector('p[style*="font-weight: bold"]');
            const pageTitle = pageTitleElement ? pageTitleElement.innerText.trim() : `Page ${i}`;
            const pageText = textContentDiv.innerText;

            textFragments.push(`--- Page ${i}: ${pageTitle} ---\n\n${pageText}`);

            // C. Navigate to the next page if not the last one
            if (i < totalPages) {
                document.getElementById('pdf-down').click();
                await waitForAttributeChange(iframe, 'src', 10000); // Wait for src to change
            }
        }

        if (pdfBuffers.length > 0 || textFragments.length > 0) {
            statusDiv.innerText = 'All pages processed. Merging files...';
            await mergeAndOfferDownloads(pdfBuffers, textFragments);
            statusDiv.innerText = 'Done! Your files are ready below.';
        } else {
            statusDiv.innerText = 'Failed to collect any data.';
        }
        startButton.disabled = false;
        startButton.innerText = 'Start Full Download';
    }


    // --- 3. MERGING AND FINALIZATION ---
    async function mergeAndOfferDownloads(pdfBuffers, textFragments) {
        const finalLinksDiv = document.getElementById('gm-final-links');
        const documentTitle = document.querySelector('h1.navbar-brand').innerText.trim() || 'document';

        // A. Merge PDFs using pdf-lib
        if (pdfBuffers.length > 0) {
            const mergedPdf = await window.PDFLib.PDFDocument.create();
            for (const buffer of pdfBuffers) {
                const donorPdf = await window.PDFLib.PDFDocument.load(buffer);
                const [donorPage] = await mergedPdf.copyPages(donorPdf, [0]);
                mergedPdf.addPage(donorPage);
            }
            const mergedPdfBytes = await mergedPdf.save();
            createDownloadLink(mergedPdfBytes, `${documentTitle}.pdf`, 'application/pdf', 'Download Merged PDF');
        }

        // B. Compile Text
        if (textFragments.length > 0) {
            const fullText = textFragments.join('\n\n====================\n\n');
            createDownloadLink(fullText, `${documentTitle}.txt`, 'text/plain', 'Download Extracted Text');
        }

        finalLinksDiv.style.display = 'block';
    }

    // --- 4. HELPER UTILITIES ---

    // Extracts the pure blob: URL from the iframe src parameter
    function extractBlobUrl(srcString) {
        const blobUrlIndex = srcString.indexOf('blob:');
        if (blobUrlIndex === -1) return null;
        const potentialUrl = srcString.substring(blobUrlIndex);
        const endOfUrl = potentialUrl.indexOf('&'); // Clean extra params
        return endOfUrl === -1 ? potentialUrl : potentialUrl.substring(0, endOfUrl);
    }

    // Creates a final download link and adds it to the UI
    function createDownloadLink(data, filename, mimeType, linkText) {
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.innerText = linkText;
        a.className = 'gm-download-link';
        document.getElementById('gm-final-links').appendChild(a);
    }

    // Waits for the iframe to finish loading its content
    function waitForIframeLoad() {
        return new Promise(resolve => {
            const iframe = document.querySelector('iframe[src*="viewer.html?file=blob:"]');
            if (iframe && iframe.contentWindow && iframe.contentWindow.document.readyState === 'complete') {
                 resolve();
            } else {
                 // Fallback with a timeout if readyState is tricky
                 setTimeout(resolve, 500);
            }
        });
    }

    // A promise-based utility to wait for an element's attribute to change
    function waitForAttributeChange(element, attributeName, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const initialValue = element.getAttribute(attributeName);
            const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.type === 'attributes' && mutation.attributeName === attributeName) {
                        if (element.getAttribute(attributeName) !== initialValue) {
                            observer.disconnect();
                            resolve();
                            return;
                        }
                    }
                }
            });
            observer.observe(element, { attributes: true });
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Timeout waiting for attribute '${attributeName}' to change.`));
            }, timeout);
        });
    }

    // --- 5. INITIALIZE THE SCRIPT ---
    createControlPanel();

})();
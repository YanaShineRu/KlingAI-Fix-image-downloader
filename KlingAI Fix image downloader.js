// ==UserScript==
// @name         KlingAI Fix Image Downloader
// @namespace    https://github.com/YanaShineRu/KlingAI-Fix-image-downloader
// @version      0.0.1
// @icon         https://vifo.ru/icons/icon.ico
// @description  Принудительная загрузка изображений по кнопке download
// @author       YanaShine
// @match        https://app.klingai.com/*
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// @connect      klingai.com
// @require      https://greasyfork.org/scripts/12228/code/setMutationHandler.js
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // Function to handle image download
    function downloadImage(url) {
        const filename = url.split('/').pop().split('?')[0];
        GM_download({
            url: url,
            name: filename,
            onload: function() {
                console.log('Image downloaded:', filename);
            },
            onerror: function(e) {
                console.error('Download failed:', e);
                // Fallback method if GM_download fails
                fallbackDownload(url, filename);
            }
        });
    }

    // Fallback download method using FileSaver.js
    function fallbackDownload(url, filename) {
        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            responseType: "blob",
            onload: function(response) {
                const blob = new Blob([response.response], {type: response.response.type});
                saveAs(blob, filename);
            },
            onerror: function(e) {
                console.error('Fallback download failed:', e);
                // Final fallback - open in new tab
                window.open(url, '_blank');
            }
        });
    }

    // Function to modify download buttons
    function modifyDownloadButtons() {
        // Find all download buttons
        const downloadButtons = document.querySelectorAll('[xlink\\:href="#icon-download"], [href="#icon-download"]');

        downloadButtons.forEach(button => {
            // Check if we've already modified this button
            if (button.getAttribute('data-modified') === 'true') return;

            // Find the closest image associated with this button
            let container = button.closest('[style*="position: relative"]');
            if (!container) return;

            const img = container.querySelector('img.content');
            if (!img || !img.src) return;

            // Add click handler
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                downloadImage(img.src);
            });

            // Mark as modified
            button.setAttribute('data-modified', 'true');
        });
    }

    // Function to modify image click behavior
    function modifyImageClickBehavior() {
        const images = document.querySelectorAll('img.content[src^="https://s"]');
        images.forEach(img => {
            // Check if we've already modified this image
            if (img.getAttribute('data-click-modified') === 'true') return;

            img.addEventListener('click', function(e) {
                // Check if the click was on the image itself (not a child element)
                if (e.target === img) {
                    e.preventDefault();
                    e.stopPropagation();
                    downloadImage(img.src);
                }
            });

            // Mark as modified
            img.setAttribute('data-click-modified', 'true');
        });
    }

    // Run the functions initially
    modifyDownloadButtons();
    modifyImageClickBehavior();

    // Use MutationObserver to handle dynamically loaded content
    const observer = new MutationObserver(function(mutations) {
        modifyDownloadButtons();
        modifyImageClickBehavior();
    });

    // Start observing the document with the configured parameters
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
    });

    // Also run periodically as a fallback
    setInterval(() => {
        modifyDownloadButtons();
        modifyImageClickBehavior();
    }, 2000);
})();

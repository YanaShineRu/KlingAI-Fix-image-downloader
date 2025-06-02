// ==UserScript==
// @name         KlingAI Fix image downloader
// @namespace    https://github.com/YanaShineRu/KlingAI-Fix-image-downloader
// @version      0.0.1
// @icon         https://vifo.ru/icons/icon.ico
// @description  Автоматическая загрузка изображений вместо открытия в окне
// @author       YanaShine
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const observer = new MutationObserver(() => {
        const downloadIcons = document.querySelectorAll('use[xlink\\:href="#icon-download"]');
        downloadIcons.forEach(use => {
            const button = use.closest('button');
            if (button && !button.classList.contains('auto-download-attached')) {
                button.classList.add('auto-download-attached');
                button.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    let root = button.closest('[class*="card"], [class*="item"], [class*="content"]');
                    if (!root) root = button.closest('div');

                    const img = root?.querySelector('img[src]');

                    if (img && img.src) {
                        const link = document.createElement('a');
                        link.href = img.src;

                        const extension = img.src.split('.').pop().split(/\#|\?/)[0] || 'jpg';
                        const filename = `image-${Date.now()}.${extension}`;

                        link.download = filename;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    } else {
                        console.warn('⛔ Изображение не найдено.');
                    }
                });
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();

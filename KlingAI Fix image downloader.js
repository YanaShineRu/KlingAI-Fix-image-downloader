// ==UserScript==
// @name         KlingAI Fix image downloader
// @namespace    https://github.com/YanaShineRu/KlingAI-Fix-image-downloader
// @version      0.0.1
// @icon         https://vifo.ru/icons/icon.ico
// @description  KlingAI Fix image downloader
// @author       YanaShine
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const handleDownload = async (button) => {
        const timeout = 2000;
        const interval = 100;
        let waited = 0;
        let image = null;

        while (waited < timeout) {
            const images = Array.from(document.querySelectorAll('img[src]')).filter(img =>
                img.offsetWidth > 50 &&
                img.offsetHeight > 50 &&
                isVisible(img) &&
                !img.closest('.top-right-actions')
            );

            if (images.length > 0) {
                image = images[0];
                break;
            }

            await new Promise(r => setTimeout(r, interval));
            waited += interval;
        }

        if (image) {
            const a = document.createElement('a');
            a.href = image.src;
            const ext = image.src.split('.').pop().split(/\#|\?/)[0] || 'jpg';
            a.download = `image-${Date.now()}.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else {
            console.warn('❌ Не удалось найти изображение.');
        }
    };

    const isVisible = (el) => {
        const style = window.getComputedStyle(el);
        return el.offsetWidth > 0 && el.offsetHeight > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };

    const processButtons = () => {
        const uses = document.querySelectorAll('use[xlink\\:href="#icon-download"]');
        uses.forEach(use => {
            const btn = use.closest('button');
            if (btn && !btn.classList.contains('fix-download-attached')) {
                btn.classList.add('fix-download-attached');
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    setTimeout(() => handleDownload(btn), 200); // небольшой отложенный запуск
                });
            }
        });
    };

    const observer = new MutationObserver(() => {
        processButtons();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    processButtons();
})();

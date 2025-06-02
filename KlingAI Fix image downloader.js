// ==UserScript==
// @name         KlingAI Fix image downloader
// @namespace    https://github.com/YanaShineRu/KlingAI-Fix-image-downloader
// @version      0.0.1
// @icon         https://vifo.ru/icons/icon.ico
// @description  Автоматическая загрузка изображений вместо открытия в окне (включая динамически загружаемые)
// @author       YanaShine
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Функция скачивания изображения по URL
    function downloadImage(url) {
        const a = document.createElement('a');
        a.href = url;
        const fileName = decodeURIComponent(url.split('/').pop().split('?')[0]) || `image-${Date.now()}.png`;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // Функция поиска ближайшего изображения относительно элемента (кнопки)
    function findClosestImageSrc(element) {
        let container = element;
        for (let i = 0; i < 5; i++) {
            if (!container) break;
            const img = container.querySelector('img');
            if (img && img.src) return img.src;
            container = container.parentElement;
        }
        const imgs = document.querySelectorAll('img[class^="stream-reference-image-target"]');
        if (imgs.length) return imgs[0].src;
        return null;
    }

    // Перехват клика по кнопкам скачивания
    document.body.addEventListener('click', function(e) {
        let el = e.target;
        while (el && el !== document.body) {
            if (el.tagName === 'BUTTON') {
                const useElem = el.querySelector('use[xlink\\:href="#icon-download"]');
                if (useElem) {
                    e.preventDefault();
                    e.stopPropagation();
                    const src = findClosestImageSrc(el);
                    if (src) {
                        downloadImage(src);
                    } else {
                        console.warn('Картинка для скачивания не найдена');
                    }
                    return;
                }
            }
            el = el.parentElement;
        }
    }, true);

})();

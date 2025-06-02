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

    // Функция загрузки изображения с помощью GM_download
    function downloadImage(url) {
        try {
            const filename = url.split('/').pop().split('?')[0] || 'image.jpg';
            GM_download({
                url: url,
                name: filename,
                onload: () => console.log('Image downloaded:', filename),
                onerror: (err) => {
                    console.error('GM_download failed:', err);
                    fallbackDownload(url, filename);
                }
            });
        } catch (err) {
            console.error('downloadImage error:', err);
            // Если GM_download не доступен
            fallbackDownload(url, 'image.jpg');
        }
    }

    // Фоллбэк загрузка через GM_xmlhttpRequest и FileSaver.js (если saveAs доступен)
    function fallbackDownload(url, filename) {
        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            responseType: "blob",
            onload: function(response) {
                try {
                    const blob = new Blob([response.response], {type: response.response.type || 'image/jpeg'});
                    if (typeof saveAs === 'function') {
                        saveAs(blob, filename);
                    } else {
                        // Если saveAs не доступен, создать ссылку и кликнуть по ней
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = filename;
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                        URL.revokeObjectURL(link.href);
                    }
                } catch(e) {
                    console.error('Fallback download failed:', e);
                    // Последний фоллбэк - открыть картинку в новой вкладке с уникальным именем окна
                    const winName = 'download_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
                    window.open(url, winName);
                }
            },
            onerror: function(e) {
                console.error('GM_xmlhttpRequest error:', e);
                const winName = 'download_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
                window.open(url, winName);
            }
        });
    }

    // Модификация кнопок загрузки
    function modifyDownloadButtons() {
        // Поиск кнопок с иконкой загрузки (xlink:href или href)
        const downloadButtons = document.querySelectorAll('[xlink\\:href="#icon-download"], [href="#icon-download"]');
        downloadButtons.forEach(button => {
            if (button.getAttribute('data-modified') === 'true') return;

            // Ищем контейнер с относительным позиционированием
            const container = button.closest('[style*="position: relative"]');
            if (!container) return;

            // Ищем картинку с классом content
            const img = container.querySelector('img.content');
            if (!img || !img.src) return;

            button.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                downloadImage(img.src);
            });

            button.setAttribute('data-modified', 'true');
        });
    }

    // Модификация клика по изображениям для загрузки
    function modifyImageClickBehavior() {
        const images = document.querySelectorAll('img.content[src^="https://s"]');
        images.forEach(img => {
            if (img.getAttribute('data-click-modified') === 'true') return;

            img.addEventListener('click', e => {
                if (e.target === img) {
                    e.preventDefault();
                    e.stopPropagation();
                    downloadImage(img.src);
                }
            });

            img.setAttribute('data-click-modified', 'true');
        });
    }

    // Инициализация
    function init() {
        modifyDownloadButtons();
        modifyImageClickBehavior();
    }

    // Запускаем при загрузке
    init();

    // Наблюдатель за динамическими изменениями DOM
    const observer = new MutationObserver(() => {
        init();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    // Резервный интервал на случай пропуска мутаций
    setInterval(init, 2000);

})();

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
// @updateURL    https://raw.githubusercontent.com/YanaShineRu/KlingAI-Fix-image-downloader/main/KlingAI%20Fix%20image%20downloader.js
// @downloadURL  https://raw.githubusercontent.com/YanaShineRu/KlingAI-Fix-image-downloader/main/KlingAI%20Fix%20image%20downloader.js
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // Конфигурация
    const CONFIG = {
        downloadDelay: 800,       // Задержка между загрузками (мс)
        maxParallelDownloads: 1,  // Максимум одновременных загрузок
        retryCount: 3,            // Количество попыток при ошибке
        retryDelay: 1000          // Задержка между попытками
    };

    // Очередь загрузок и текущие активные загрузки
    let downloadQueue = [];
    let activeDownloads = 0;

    // Функция для добавления в очередь
    function enqueueDownload(url, filename, retries = 0) {
        downloadQueue.push({ url, filename, retries });
        processQueue();
    }

    // Обработка очереди
    function processQueue() {
        if (activeDownloads >= CONFIG.maxParallelDownloads || downloadQueue.length === 0) {
            return;
        }

        activeDownloads++;
        const { url, filename, retries } = downloadQueue.shift();

        downloadWithRetry(url, filename, retries)
            .finally(() => {
                activeDownloads--;
                setTimeout(processQueue, CONFIG.downloadDelay);
            });
    }

    // Загрузка с повторными попытками
    function downloadWithRetry(url, filename, retries) {
        return new Promise((resolve) => {
            attemptDownload(url, filename)
                .then(() => resolve())
                .catch((error) => {
                    console.error(`Download failed (${retries + 1}/${CONFIG.retryCount}):`, error);
                    if (retries < CONFIG.retryCount - 1) {
                        setTimeout(() => {
                            enqueueDownload(url, filename, retries + 1);
                            resolve();
                        }, CONFIG.retryDelay);
                    } else {
                        console.error('All download attempts failed, opening in new tab');
                        window.open(url, '_blank');
                        resolve();
                    }
                });
        });
    }

    // Основная функция загрузки
    function attemptDownload(url, filename) {
        return new Promise((resolve, reject) => {
            try {
                GM_download({
                    url: url,
                    name: filename,
                    onload: () => {
                        console.log('Image downloaded:', filename);
                        resolve();
                    },
                    onerror: (err) => {
                        console.error('GM_download failed:', err);
                        fallbackDownload(url, filename)
                            .then(resolve)
                            .catch(reject);
                    }
                });
            } catch (err) {
                console.error('GM_download not available:', err);
                fallbackDownload(url, filename)
                    .then(resolve)
                    .catch(reject);
            }
        });
    }

    // Фоллбэк загрузка
    function fallbackDownload(url, filename) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                responseType: "blob",
                onload: function(response) {
                    try {
                        const blob = new Blob([response.response], {
                            type: response.response.type || 'image/jpeg'
                        });

                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = filename;
                        link.style.display = 'none';
                        document.body.appendChild(link);
                        link.click();

                        setTimeout(() => {
                            document.body.removeChild(link);
                            URL.revokeObjectURL(link.href);
                            resolve();
                        }, 100);
                    } catch(e) {
                        reject(e);
                    }
                },
                onerror: function(e) {
                    reject(e);
                }
            });
        });
    }

    // Генерация имени файла
    function generateFilename(url) {
        const base = url.split('/').pop().split('?')[0] || 'image';
        const cleanName = base.replace(/[^a-z0-9.-]/gi, '_');
        return `kling_${Date.now()}_${cleanName}`.substring(0, 80);
    }

    // Обработчик кликов для кнопок
    function handleDownloadClick(imgSrc, e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }

        const filename = generateFilename(imgSrc);
        enqueueDownload(imgSrc, filename);
    }

    // Модификация кнопок загрузки
    function modifyDownloadButtons() {
        const downloadButtons = document.querySelectorAll(
            '[xlink\\:href="#icon-download"], [href="#icon-download"], [class*="download"]'
        );

        downloadButtons.forEach(button => {
            if (button._klingModified) return;
            button._klingModified = true;

            const container = button.closest('[style*="position: relative"], [data-v-]');
            if (!container) return;

            const img = container.querySelector('img.content[src^="http"]');
            if (!img || !img.src) return;

            button.addEventListener('click', (e) => handleDownloadClick(img.src, e), true);
        });
    }

    // Модификация кликов по изображениям
    function modifyImageClickBehavior() {
        const images = document.querySelectorAll('img.content[src^="http"]');

        images.forEach(img => {
            if (img._klingModified) return;
            img._klingModified = true;

            img.addEventListener('click', (e) => {
                if (e.target === img) {
                    handleDownloadClick(img.src, e);
                }
            }, true);
        });
    }

    // Инициализация и наблюдение за DOM
    function init() {
        modifyDownloadButtons();
        modifyImageClickBehavior();
    }

    // Запуск при загрузке
    document.addEventListener('DOMContentLoaded', init);

    // Наблюдатель за изменениями DOM
    const observer = new MutationObserver((mutations) => {
        let needsCheck = false;

        mutations.forEach(mutation => {
            if (mutation.addedNodes.length > 0) {
                needsCheck = true;
            }
        });

        if (needsCheck) {
            setTimeout(init, 500);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Периодическая проверка
    setInterval(init, 3000);

    // Уведомление о запуске
    GM_notification({
        title: 'KlingAI Downloader Activated',
        text: 'Image downloader is ready to use',
        silent: true
    });
})();

// ==UserScript==
// @name         KlingAI Fix image downloader
// @namespace    https://github.com/YanaShineRu/KlingAI-Fix-image-downloader
// @version      0.0.1
// @icon         https://vifo.ru/icons/icon.ico
// @description  Автоматическая загрузка изображений по кнопке с иконкой download (в т.ч. с динамическими src)
// @author       YanaShine
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    document.addEventListener('click', async function (e) {
        const button = e.target.closest('button');
        if (!button) return;

        const icon = button.querySelector('use[href="#icon-download"]');
        if (!icon) return;

        e.preventDefault();
        e.stopPropagation();

        // Находим ближайшее изображение в DOM
        const container = button.closest('[data-v-102c185f]');
        if (!container) return;

        const img = container.querySelector('img.content');
        if (!img || !img.src) return;

        try {
            let url = img.src.split('?')[0];

            const fileName = url.split('/').pop().split(':')[0]; // удаляем все после ":" (если есть)

            const response = await fetch(url, {
                headers: {
                    'Referer': location.href
                }
            });

            if (!response.ok) throw new Error(`Ошибка загрузки: ${response.status}`);

            const blob = await response.blob();

            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = fileName || 'image.webp';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(a.href);
        } catch (err) {
            console.error('[Kling Downloader] Ошибка:', err);
            alert('Не удалось скачать изображение. См. консоль (F12).');
        }
    }, true);
})();

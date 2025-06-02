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

    document.addEventListener('click', async function(e) {
        const button = e.target.closest('button');
        if (!button) return;

        if (!button.querySelector('use[href="#icon-download"]')) return;

        e.preventDefault();
        e.stopPropagation();

        let container = button.closest('div');

        while(container && !container.querySelector('img.content')) {
            container = container.parentElement;
        }
        if (!container) {
            alert('Не удалось найти изображение рядом с кнопкой');
            return;
        }

        const img = container.querySelector('img.content');
        if (!img || !img.src) {
            alert('Изображение не найдено');
            return;
        }

        try {
            let url = img.src.split('?')[0];

            let fileName = url.split('/').pop().split(':')[0] || 'image.webp';

            const response = await fetch(url, { headers: { 'Referer': location.href } });
            if (!response.ok) throw new Error(`Ошибка загрузки: ${response.status}`);

            const blob = await response.blob();

            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(a.href);
        } catch(err) {
            console.error(err);
            alert('Ошибка при скачивании изображения, см. консоль');
        }
    }, true);
})();

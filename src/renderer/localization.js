const fs = require('fs');
const path = require('path');

let translations = {};
let currentLanguage = 'en';

export function setLanguage(language) {
    currentLanguage = language;
    loadTranslations(language);
}

export function getLanguage() {
    return currentLanguage;
}

export function translate(key) {
    return translations[key] || key; // Fallback to key if translation is missing
}

export function loadTranslations(lang = 'en') {
    const filePath = path.join(__dirname, `../assets/lang/${lang}.json`);
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        translations = JSON.parse(data);
        applyTranslations();
    } catch (err) {
        console.error(`Error loading translations for ${lang}:`, err);
    }
}

export function applyTranslations() {
    document.querySelectorAll('[data-lang]').forEach(element => {
        const key = element.getAttribute('data-lang');
        if (translations[key]) {
            element.textContent = translations[key];
        }
    });
}
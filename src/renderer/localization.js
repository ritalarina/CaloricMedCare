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

/**
 * Generic translation function with support for nested keys and parameters
 * @param {string} key - Translation key, e.g., "menu.home" or "units.kcal".
 * @param {object} [params={}] - Optional parameters for dynamic strings.
 * @returns {string} Translated text or the key if not found.
 */
export function translate(key, params = {}) {
    const translation = key.split('.').reduce((obj, k) => (obj && obj[k] !== undefined) ? obj[k] : null, translations);
    if (!translation) return key; // Fallback to key if not found

    // Replace placeholders in the translation string
    return Object.keys(params).reduce(
        (text, param) => text.replace(`{${param}}`, params[param]),
        translation
    );
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
        if (key) {
            element.textContent = translate(key);
        }
    });
}
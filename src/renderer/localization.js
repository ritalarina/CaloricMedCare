let translations = {};
let currentLanguage = 'en';

export async function setLanguage(language) {
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

export async function loadTranslations(language = 'en') {
    try {
        translations = await window.api.getTranslations(language);
        applyTranslations(document);
    } catch (err) {
        console.error(`Error loading translations for ${language}:`, err);
    }
}

/**
 * Translation function for a specific element or the whole document.
 * @param {string} [container] - Element to translate. Document by default.
 * @returns {void}
 */
export function applyTranslations(container = document) {
    if (!(container instanceof Element || container === document)) {
        console.warn('Invalid container passed to applyTranslations:', container);
        return;
    }
    container.querySelectorAll('[data-lang]').forEach(element => {
        const key = element.getAttribute('data-lang');
        if (key) {
            element.textContent = translate(key);
        }
    });
}
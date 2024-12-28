const { contextBridge, ipcRenderer } = require('electron');
const GLPK = require('glpk.js');
const glpk = GLPK();

// Expose specific APIs to the renderer process
contextBridge.exposeInMainWorld('api', {
    getGlpkInstance: () => glpk,
    getTranslations: async (language) => {
        cachedTranslations = await ipcRenderer.invoke('get-translations', language);
        return cachedTranslations;
    },
    translate: (key) => {
        return key.split('.').reduce((obj, k) => (obj && obj[k] !== undefined) ? obj[k] : null, cachedTranslations);
    },
    getNutritionData: () => ipcRenderer.invoke('get-nutrition-data'),
    getIllnessesData: () => ipcRenderer.invoke('get-illnesses-data'),
    on: (channel, callback) => {
        const validChannels = ['nutrition-data', 'load-modal']; // Whitelist valid channels
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => callback(...args));
        }
    }
});
const { contextBridge, ipcRenderer } = require('electron');
const GLPK = require('glpk.js');
const glpk = GLPK();

// Expose specific APIs to the renderer process
contextBridge.exposeInMainWorld('api', {
    getGlpkInstance: () => glpk,
    getTranslations: (language) => ipcRenderer.invoke('get-translations', language),
    getNutritionData: () => ipcRenderer.invoke('get-nutrition-data'),
    on: (channel, callback) => {
        const validChannels = ['nutrition-data', 'load-modal']; // Whitelist valid channels
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => callback(...args));
        }
    },
});
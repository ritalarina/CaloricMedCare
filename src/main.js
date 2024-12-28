import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Define __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1450,
        height: 1050,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'renderer/preload.cjs')
        },
        icon: path.join(__dirname, 'assets/icons/nutrient.ico')
    });

    mainWindow.loadFile('src/renderer/index.html');

    const template = [
        {
            label: "File",
            submenu: [
                {
                    label: "Settings",
                    click: () => {
                        mainWindow.webContents.send('load-modal', 'modals/settings-modal.html');
                    }
                },
                { role: "quit" }
            ]
        },
        {
            label: "View",
            submenu: [
                { role: "reload" },
                { role: "forceReload" },
                {
                    label: "Toggle Developer Tools",
                    accelerator: "Ctrl+Shift+I", // Shortcut key
                    click: () => {
                        mainWindow.webContents.toggleDevTools();
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    
    mainWindow.webContents.on('did-finish-load', () => {
        const nutritionData = loadNutritionData();
        mainWindow.webContents.send('nutrition-data', nutritionData);
    });
}

// Handle data requests from renderer
ipcMain.handle('get-nutrition-data', () => loadNutritionData());

ipcMain.handle('get-translations', (event, language) => {
    const filePath = path.join(__dirname, `assets/lang/${language}.json`);
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Error reading translation file for ${language}:`, err);
        return {}; // Return an empty object if there's an error
    }
});

app.on('ready', createWindow);

// Function to load nutrition data
function loadNutritionData() {
    const nutritionFilePath = path.join(__dirname, 'assets/data/nutrition.xml');
    try {
        return fs.readFileSync(nutritionFilePath, 'utf8');
    } catch (err) {
        console.error("Error reading nutrition.xml file", err);
        return null;
    }
}
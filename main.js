const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 950,
        height: 1000,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // Allow access to Node.js APIs in renderer
        },
		icon: path.join(__dirname, 'assets/icons/nutrient.ico')
    });

    mainWindow.loadFile('index.html');

    // Load the nutrition.xml file when the window is ready
    mainWindow.webContents.on('did-finish-load', () => {
        const nutritionFilePath = path.join(__dirname, 'assets/nutrition.xml');
        fs.readFile(nutritionFilePath, 'utf8', (err, data) => {
            if (err) {
                console.error("Error reading nutrition.xml file", err);
                return;
            }
            // Send the XML data to renderer process
            mainWindow.webContents.send('nutrition-data', data);
        });
    });
}

app.on('ready', createWindow);

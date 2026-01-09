import { app, BrowserWindow, screen } from "electron";
import serve from "electron-serve";
import path from "path";

const loadURL = serve({ directory: "out" });

let mainWindow: BrowserWindow | null;

function createWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    // Fix icon path resolution (app.getAppPath points to project root in dev)
    const iconPath = path.join(app.getAppPath(), "public", "davus-logo.ico");

    mainWindow = new BrowserWindow({
        width,
        height,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: iconPath,
    });

    mainWindow.setMenu(null);

    const isDev = !app.isPackaged;

    if (isDev) {
        mainWindow.loadURL("http://localhost:3000");
        mainWindow.webContents.openDevTools();
    } else {
        loadURL(mainWindow);
    }

    mainWindow.on("closed", () => {
        mainWindow = null;
    });
}

app.on("ready", () => {
    // Set App User Model ID for Windows Taskbar grouping
    if (process.platform === 'win32') {
        app.setAppUserModelId('com.sisdavus.app');
    }
    createWindow();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (mainWindow === null) {
        createWindow();
    }
});

import { app, BrowserWindow, screen, Tray, Menu, nativeImage, ipcMain, globalShortcut, nativeTheme, Notification, dialog, protocol, powerMonitor } from "electron";
import { autoUpdater } from "electron-updater";
import serve from "electron-serve";
import path from "path";
import fs from "fs";
import { ScaleService } from "./services/scale";
import { setupCacheProtocol } from "./services/cache-protocol";
import { ScannerService } from "./services/scanner";


const loadURL = serve({ directory: "out" });

let mainWindow: BrowserWindow | null;
let splashWindow: BrowserWindow | null;
let tray: Tray | null = null;
let isQuitting = false;

// Register Privileged Schemes
protocol.registerSchemesAsPrivileged([
    { scheme: 'media-cache', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }
]);

// Deep Linking Protocol
const PROTOCOL = 'sisdavus';
if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
    }
} else {
    app.setAsDefaultProtocolClient(PROTOCOL);
}

// Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();

            // Handle Deep Link on Windows
            const url = commandLine.find(arg => arg.startsWith(`${PROTOCOL}://`));
            if (url) {
                mainWindow.webContents.send('deep-link', url);
            }
        }
    });
}

// Simple state persistence helper
const statePath = path.join(app.getPath("userData"), "window-state.json");

function loadState() {
    try {
        if (!fs.existsSync(statePath)) return { width: undefined, height: undefined, x: undefined, y: undefined, isMaximized: false };
        return JSON.parse(fs.readFileSync(statePath, "utf8"));
    } catch {
        return { width: undefined, height: undefined, x: undefined, y: undefined, isMaximized: false };
    }
}

function saveState() {
    if (!mainWindow) return;
    try {
        const bounds = mainWindow.getBounds();
        const isMaximized = mainWindow.isMaximized();
        fs.writeFileSync(statePath, JSON.stringify({ ...bounds, isMaximized }));
    } catch (e) {
        console.error("Failed to save window state", e);
    }
}

// IPC Handlers for hardware/native features
ipcMain.handle("get-printers", async () => {
    return mainWindow?.webContents.getPrintersAsync() || [];
});

ipcMain.handle("print-silent", async (_event, { content, printerName }) => {
    const printWindow = new BrowserWindow({
        show: false,
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    try {
        await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(content)}`);

        const options = {
            silent: true,
            deviceName: printerName,
            printBackground: true,
            color: false,
            margins: { marginType: 'none' }, // 0 for custom margins, 'none' often works best for labels
        };

        // @ts-ignore - Electron types sometimes strict on print options
        await printWindow.webContents.print(options);

        printWindow.close();
        return { success: true };
    } catch (error) {
        console.error("Print failed:", error);
        printWindow.close();
        // @ts-ignore
        return { success: false, error: error.message };
    }
});

ipcMain.on("set-progress-bar", (_event, value) => {
    if (mainWindow) {
        mainWindow.setProgressBar(value); // -1 to remove, 0-1 for progress
    }
});

// Multi-Window Manager
ipcMain.handle("open-child-window", (_event, { route, title, width, height }) => {
    const child = new BrowserWindow({
        width: width || 800,
        height: height || 600,
        parent: mainWindow || undefined,
        modal: false,
        show: false,
        icon: path.join(app.getAppPath(), "public", "davus-logo.ico"),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, "preload.js")
        }
    });

    child.setMenu(null);

    // Determine Base URL
    const isDev = !app.isPackaged;
    const baseUrl = isDev ? "http://localhost:3000" : `app://./index.html`; // serve-electron usually serves index.html at root
    // For serve-electron, we usually use loadURL(mainWindow).
    // If we want a specific route, we might need to handle hash routing or clean history.
    // Next.js with export usually uses .html files or hash. 
    // Let's assume hash for simplicity if formatted that way, OR constructed URL.

    // If dev: http://localhost:3000/route
    // If prod: app://./route (if 'electron-serve' handles it) or app://./index.html#route

    const targetUrl = isDev
        ? `${baseUrl}${route}`
        : `${baseUrl}${route}`; // electron-serve usually handles extensionless paths if configured right, or we use memory router.

    // Let's rely on the main loadURL strategy but with different path
    if (isDev) {
        child.loadURL(targetUrl);
    } else {
        // In prod with Next.js export, usually strict paths
        // e.g. /out/route.html
        // We'll try loading the 'app' protocol
        loadURL(child);
        // Then navigate?
        // Actually, electron-serve's 'loadURL' helper is for the main window index.
        // It's safer to just load the index and inject a script to navigate, 
        // OR if using HashRouter it's easy. 
        // Assuming Next.js App Router, maybe difficult.
        // Quick fix: Add a query param and handle it in layout?
        // Or just try loading the URL.
        child.loadURL(`${baseUrl}/${route}`);
    }

    child.once("ready-to-show", () => {
        child.show();
        if (title) child.setTitle(title);
    });

    return { success: true };
});

// Native Notification Handler
ipcMain.on("show-notification", (_event, { title, body, silent }) => {
    const notification = new Notification({
        title,
        body,
        silent: silent || false,
        icon: path.join(app.getAppPath(), "public", "davus-logo.ico"),
    });

    notification.show();

    notification.on("click", () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
        }
    });
});

// Auto-Launch Handler
ipcMain.handle("set-auto-launch", (_event, enable: boolean) => {
    app.setLoginItemSettings({
        openAtLogin: enable,
        path: process.execPath,
        args: [
            '--process-start-args', `"--hidden"`
        ]
    });
    return app.getLoginItemSettings().openAtLogin;
});

ipcMain.handle("get-auto-launch", () => {
    return app.getLoginItemSettings().openAtLogin;
});

// File System Handlers (Direct Export)
ipcMain.handle("save-file", async (_event, { content, fileName, mimeType }) => {
    try {
        const { filePath } = await dialog.showSaveDialog(mainWindow!, {
            defaultPath: fileName,
            filters: [{ name: 'Arquivos', extensions: [mimeType ? mimeType.split('/')[1] : '*'] }]
        });

        if (filePath) {
            let fileContent: Buffer | string = content;
            // Handle Base64 content if needed (naive check)
            if (typeof content === 'string' && content.startsWith('data:')) {
                fileContent = Buffer.from(content.split(',')[1], 'base64');
            }

            fs.writeFileSync(filePath, fileContent);
            return { success: true, path: filePath };
        }
        return { success: false, error: 'User cancelled' };
    } catch (error) {
        console.error("Save file error:", error);
        // @ts-ignore
        return { success: false, error: error.message };
    }
});

// Shell Handlers
ipcMain.on("open-external", (_event, url) => {
    require("electron").shell.openExternal(url);
});

// Theme Listener
nativeTheme.on("updated", () => {
    if (mainWindow) {
        mainWindow.webContents.send("theme-changed", nativeTheme.shouldUseDarkColors ? "dark" : "light");
    }
});

function createTray() {
    const iconPath = path.join(app.getAppPath(), "public", "davus-logo.ico");
    const icon = nativeImage.createFromPath(iconPath);

    tray = new Tray(icon);
    tray.setToolTip('SisDavus');

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Abrir SisDavus',
            click: () => {
                mainWindow?.show();
            }
        },
        { type: 'separator' },
        {
            label: 'Sair',
            click: () => {
                isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        if (mainWindow?.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow?.show();
        }
    });
}

function createSplashWindow() {
    splashWindow = new BrowserWindow({
        width: 400,
        height: 480,
        transparent: false,
        frame: false,
        alwaysOnTop: true,
        resizable: false,
        center: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: path.join(app.getAppPath(), "public", "davus-logo.ico"),
    });

    const splashPath = path.join(app.getAppPath(), "public", "splash.html");
    splashWindow.loadFile(splashPath);
    splashWindow.center();
}

function createWindow() {
    const state = loadState();
    const { width: defaultWidth, height: defaultHeight } = screen.getPrimaryDisplay().workAreaSize;

    // Fix icon path resolution (app.getAppPath points to project root in dev)
    const iconPath = path.join(app.getAppPath(), "public", "davus-logo.ico");

    mainWindow = new BrowserWindow({
        width: state.width || defaultWidth,
        height: state.height || defaultHeight,
        x: state.x,
        y: state.y,
        show: false, // Start hidden, show after splash
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
            backgroundThrottling: false // Keep sync running when minimized
        },
        icon: iconPath,
    });

    if (state.isMaximized) {
        mainWindow.maximize();
    }

    mainWindow.setMenu(null);

    const isDev = !app.isPackaged;

    if (isDev) {
        mainWindow.loadURL("http://localhost:3000");
    } else {
        loadURL(mainWindow);
    }

    // Wait for the window to be ready before showing it and closing splash
    mainWindow.once("ready-to-show", () => {
        // Sync initial theme
        mainWindow?.webContents.send("theme-changed", nativeTheme.shouldUseDarkColors ? "dark" : "light");

        // Initialize Scale Service
        new ScaleService(mainWindow!);

        setTimeout(() => {
            splashWindow?.destroy();
            splashWindow = null;
            mainWindow?.show();
            if (isDev) mainWindow?.webContents.openDevTools();
        }, 2000); // 2 seconds minimum splash for branding effect
    });

    mainWindow.on("close", (event) => {
        saveState(); // Save state on close
        if (!isQuitting) {
            event.preventDefault();
            mainWindow?.hide();
            return false;
        }
    });

    mainWindow.on("closed", () => {
        mainWindow = null;
    });
}

// Handle macOS deep links
app.on('open-url', (event, url) => {
    event.preventDefault();
    if (mainWindow) {
        mainWindow.show();
        mainWindow.webContents.send('deep-link', url);
    }
});

app.on("before-quit", () => {
    isQuitting = true;
});

app.on("ready", () => {
    if (!gotTheLock) return; // Stop if second instance

    // Suppress security warnings in dev
    if (!app.isPackaged) {
        process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";
    } else {
        // Auto-Update Logic
        autoUpdater.checkForUpdatesAndNotify();
    }

    // Set App User Model ID for Windows Taskbar grouping
    if (process.platform === 'win32') {
        app.setAppUserModelId('com.sisdavus.app');
    }

    createSplashWindow();
    createWindow();
    createTray();

    // Register Global Shortcut
    globalShortcut.register('CommandOrControl+Shift+Space', () => {
        if (mainWindow) {
            if (mainWindow.isVisible() && mainWindow.isFocused()) {
                mainWindow.hide();
            } else {
                mainWindow.show();
                mainWindow.focus();
            }
        }
    });
    // JumpList (Windows Actions)
    if (process.platform === 'win32') {
        app.setUserTasks([
            {
                program: process.execPath,
                arguments: '--process-start-args "--new-order"',
                iconPath: process.execPath,
                iconIndex: 0,
                title: 'Novo Pedido',
                description: 'Criar um novo pedido de venda'
            },
            {
                program: process.execPath,
                arguments: '--process-start-args "--search"',
                iconPath: process.execPath,
                iconIndex: 0,
                title: 'Consultar Produtos',
                description: 'Pesquisar no catálogo'
            }
        ]);
    }

    // Setup Media Cache
    setupCacheProtocol();

    // Security: Lock Screen Monitoring
    powerMonitor.on('lock-screen', () => {
        mainWindow?.webContents.send('app-lock');
    });

    // Scanner
    new ScannerService();

    // Optional: Check for system idle (e.g., 5 minutes)
    setInterval(() => {
        const idleTime = powerMonitor.getSystemIdleTime(); // in seconds
        if (idleTime > 300) { // 5 minutes
            mainWindow?.webContents.send('app-lock');
        }
    }, 10000); // Check every 10 seconds
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        // Do not quit here because we want the app to stay alive in the tray
        // app.quit();
    }
});

app.on("activate", () => {
    if (mainWindow === null) {
        createWindow();
    } else {
        mainWindow.show();
    }
});

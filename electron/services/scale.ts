import { SerialPort } from 'serialport';
import { ipcMain, BrowserWindow, IpcMainInvokeEvent } from 'electron';
import { ReadlineParser } from '@serialport/parser-readline';

export class ScaleService {
    private port: SerialPort | null = null;
    private parser: ReadlineParser | null = null;
    private mainWindow: BrowserWindow | null = null;

    constructor(mainWindow: BrowserWindow) {
        this.mainWindow = mainWindow;
        this.registerHandlers();
    }

    private registerHandlers() {
        ipcMain.handle('scale-get-ports', async () => {
            try {
                const ports = await SerialPort.list();
                console.log("Ports found:", ports);
                return ports.map(p => ({
                    path: p.path,
                    manufacturer: p.manufacturer || 'Unknown',
                    pnpId: p.pnpId || ''
                }));
            } catch (error) {
                console.error("Error listing ports:", error);
                return [];
            }
        });

        ipcMain.handle('scale-connect', async (_event: IpcMainInvokeEvent, path: string, baudRate: number = 9600) => {
            return this.connect(path, baudRate);
        });

        ipcMain.handle('scale-disconnect', async () => {
            return this.disconnect();
        });
    }

    private connect(path: string, baudRate: number): Promise<{ success: boolean; error?: string }> {
        return new Promise((resolve) => {
            if (this.port && this.port.isOpen) {
                this.disconnect();
            }

            this.port = new SerialPort({ path, baudRate, autoOpen: false });

            this.port.open((err) => {
                if (err) {
                    console.error('Error opening port:', err.message);
                    resolve({ success: false, error: err.message });
                    return;
                }

                // Setup Parser - Common scales use CR or LF as delimiter
                this.parser = this.port!.pipe(new ReadlineParser({ delimiter: '\r' })); // Often \r or \n

                this.parser.on('data', (data: string) => {
                    if (this.mainWindow) {
                        // Clean the data string - remove non-numeric chars except dot/comma
                        // Scale protocols vary wildly (Toledo, Filizola, Label).
                        // We will emit the raw string and let frontend clean it OR 
                        // try to parse a generic float here. 
                        // For now, raw data is safer.
                        const cleanData = data.trim();
                        if (cleanData) {
                            this.mainWindow.webContents.send('scale-data', cleanData);
                        }
                    }
                });

                this.port!.on('close', () => {
                    if (this.mainWindow) {
                        this.mainWindow.webContents.send('scale-disconnected');
                    }
                });

                this.port!.on('error', (err) => {
                    if (this.mainWindow) {
                        this.mainWindow.webContents.send('scale-error', err.message);
                    }
                });

                resolve({ success: true });
            });
        });
    }

    private disconnect(): Promise<boolean> {
        return new Promise((resolve) => {
            if (this.port && this.port.isOpen) {
                this.port.close(() => {
                    this.port = null;
                    this.parser = null;
                    resolve(true);
                });
            } else {
                resolve(true);
            }
        });
    }
}

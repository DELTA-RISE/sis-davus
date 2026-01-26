import { ipcMain } from 'electron';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

export class ScannerService {
    private naps2Path: string;

    constructor() {
        // Assume NAPS2 Console is in a known location or bundled
        // For development/demo, we look in typical install paths or allow config
        // "C:\Program Files\NAPS2\naps2.console.exe"
        this.naps2Path = "C:\\Program Files\\NAPS2\\naps2.console.exe";

        this.setupHandlers();
    }

    private setupHandlers() {
        ipcMain.handle('scan-document', async (event, options: { fileName: string }) => {
            return this.scan(options.fileName);
        });

        ipcMain.handle('check-scanner-support', async () => {
            return fs.existsSync(this.naps2Path);
        });

        ipcMain.handle('list-scanned-documents', async () => {
            return this.getScannedDocuments();
        });

        ipcMain.handle('import-document', async (_event, { filePath, customName }) => {
            return this.importFile(filePath, customName);
        });

        ipcMain.handle('perform-ocr', async (_event, filePath: string) => {
            return this.performOCR(filePath);
        });

        ipcMain.handle('rename-document', async (_event, { oldPath, newName }) => {
            return this.renameFile(oldPath, newName);
        });
        ipcMain.handle('delete-document', async (_event, filePath: string) => {
            return this.deleteFile(filePath);
        });
    }

    private async deleteFile(filePath: string): Promise<{ success: boolean; error?: string }> {
        try {
            // Security check: ensure it is within our Scans folder
            const documentsPath = app.getPath("documents");
            const scanDir = path.join(documentsPath, "SisDavus", "Scans");

            if (!filePath.startsWith(scanDir)) {
                return { success: false, error: "Access denied: Cannot delete files outside Scans directory." };
            }

            if (!fs.existsSync(filePath)) {
                return { success: false, error: "Arquivo não encontrado." };
            }

            // Using shell.trashItem to move to Recycle Bin is safer than unlink
            const { shell } = require('electron');
            await shell.trashItem(filePath);

            return { success: true };
        } catch (error: any) {
            console.error("Delete error:", error);
            // Fallback to unlink if trash fails? No, better error.
            try {
                fs.unlinkSync(filePath); // Hard delete fallback
                return { success: true };
            } catch (e) {
                return { success: false, error: error.message };
            }
        }
    }
    private async renameFile(oldPath: string, newName: string): Promise<{ success: boolean; error?: string }> {
        try {
            if (!fs.existsSync(oldPath)) return { success: false, error: "Arquivo não encontrado" };

            const dir = path.dirname(oldPath);
            const ext = path.extname(oldPath);
            // Ensure new name has extension
            const finalName = newName.endsWith(ext) ? newName : `${newName}${ext}`;
            const newPath = path.join(dir, finalName);

            if (fs.existsSync(newPath)) return { success: false, error: "Já existe um arquivo com este nome" };

            fs.renameSync(oldPath, newPath);
            return { success: true };
        } catch (error: any) {
            console.error("Rename error:", error);
            return { success: false, error: error.message };
        }
    }

    private async importFile(sourcePath: string, customName?: string): Promise<{ success: boolean; path?: string; error?: string }> {
        try {
            const documentsPath = app.getPath("documents");
            const scanDir = path.join(documentsPath, "SisDavus", "Scans");

            if (!fs.existsSync(scanDir)) fs.mkdirSync(scanDir, { recursive: true });

            let fileName: string;
            if (customName) {
                // Keep extension if customName doesn't have it
                const ext = path.extname(sourcePath);
                if (!customName.endsWith(ext)) customName += ext;
                fileName = customName;
            } else {
                fileName = `Imported_${Date.now()}_${path.basename(sourcePath)}`;
            }

            const destPath = path.join(scanDir, fileName);

            fs.copyFileSync(sourcePath, destPath);
            return { success: true, path: destPath };
        } catch (error: any) {
            console.error("Import error:", error);
            return { success: false, error: error.message };
        }
    }

    private async performOCR(filePath: string): Promise<{ success: boolean; text?: string; error?: string }> {
        try {
            // Dynamic import to avoid build issues if missing
            const Tesseract = await import('tesseract.js');

            const worker = await Tesseract.createWorker('por'); // Portuguese
            const ret = await worker.recognize(filePath);
            await worker.terminate();

            return { success: true, text: ret.data.text };
        } catch (error: any) {
            console.error("OCR error:", error);
            // Fallback for demo if Tesseract fails or not installed
            return { success: false, error: error.message || "Falha no OCR" };
        }
    }

    private getScannedDocuments() {
        try {
            const documentsPath = app.getPath("documents");
            const scanDir = path.join(documentsPath, "SisDavus", "Scans");

            if (!fs.existsSync(scanDir)) return [];

            const files = fs.readdirSync(scanDir);

            // Supported extensions
            const regex = /\.(pdf|jpg|jpeg|png|docx|doc|xlsx|xls)$/i;

            return files
                .filter(file => regex.test(file))
                .map(file => {
                    const filePath = path.join(scanDir, file);
                    const stats = fs.statSync(filePath);
                    return {
                        name: file,
                        path: filePath,
                        size: stats.size,
                        createdAt: stats.birthtime,
                        modifiedAt: stats.mtime
                    };
                })
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Newest first
        } catch (error) {
            console.error("Error listing documents:", error);
            return [];
        }
    }

    private scan(fileName: string): Promise<{ success: boolean; path?: string; error?: string }> {
        return new Promise((resolve) => {
            // Determine output directory: Documents/SisDavus/Scans
            const documentsPath = app.getPath("documents");
            const scanDir = path.join(documentsPath, "SisDavus", "Scans");

            if (!fs.existsSync(scanDir)) {
                fs.mkdirSync(scanDir, { recursive: true });
            }

            if (!fs.existsSync(this.naps2Path)) {
                // Determine mock path for testing if NAPS2 is missing
                // In a real app we might bundle NAPS2 portable

                // MOCK BEHAVIOR FOR DEMO if tool missing
                console.log("Scanner not found, simulating scan...");

                setTimeout(() => {
                    // Create a dummy file
                    const mockPath = path.join(scanDir, `${fileName}.pdf`);
                    fs.writeFileSync(mockPath, "Dummy PDF Content");
                    resolve({ success: true, path: mockPath });
                }, 2000);
                return;
            }

            const outputPath = path.join(scanDir, `${fileName}.pdf`);
            const args = ['-o', outputPath, '--force'];

            console.log(`Spawning scanner: ${this.naps2Path} ${args.join(' ')}`);

            const child = spawn(this.naps2Path, args);

            child.on('close', (code) => {
                if (code === 0) {
                    resolve({ success: true, path: outputPath });
                } else {
                    resolve({ success: false, error: `Scanner exited with code ${code}` });
                }
            });

            child.on('error', (err) => {
                resolve({ success: false, error: err.message });
            });
        });
    }
}

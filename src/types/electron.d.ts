export interface PrinterInfo {
    name: string;
    displayName: string;
    description: string;
    status: number;
    isDefault: boolean;
    options: any;
}

export interface ElectronAPI {
    print: (content: string, printerName?: string) => Promise<{ success: boolean; error?: string }>;
    getPrinters: () => Promise<PrinterInfo[]>;
    setProgressBar: (value: number) => void;
    onDeepLink: (callback: (url: string) => void) => void;
}

declare global {
    interface Window {
        electron?: ElectronAPI;
    }
}

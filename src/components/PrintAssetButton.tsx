"use client";

import { Asset } from "@/lib/store";
import { Button } from "@/components/ui/button";
// import { useElectron } from "@/hooks/use-electron";
import { Printer } from "lucide-react";
import { toast } from "sonner";
import { renderToStaticMarkup } from "react-dom/server";
import { QRCodeSVG } from "qrcode.react";
import { getAssetQrValue } from "@/lib/asset-qr";


// Inline styled component for printing - Optimized for 300x150px Label (Standard)
// Using inline styles avoids dependency on Tailwind in the print window
const PrintableAssetLabel = ({ asset }: { asset: Asset }) => (
    <div style={{
        width: '300px',
        height: '150px',
        border: '2px solid black',
        padding: '12px',
        display: 'flex',
        gap: '16px',
        backgroundColor: 'white',
        boxSizing: 'border-box',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        position: 'relative',
        overflow: 'hidden'
    }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', minWidth: 0, overflow: 'hidden' }}>
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    {/* SVG Icon for Building/Logo */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                        <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
                        <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
                        <path d="M10 6h4" />
                        <path d="M10 10h4" />
                        <path d="M10 14h4" />
                        <path d="M10 18h4" />
                    </svg>
                    <span style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'black' }}>DAVUS</span>
                </div>
                <h2 style={{ fontSize: '14px', fontWeight: 'bold', lineHeight: '1.2', color: 'black', margin: '0 0 4px 0', maxHeight: '4.8em', overflow: 'hidden' }}>{asset.name}</h2>
                <p style={{ fontSize: '10px', color: '#4b5563', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{asset.category}</p>
            </div>

            <div>
                <p style={{ fontSize: '8px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 2px 0' }}>Patrimônio</p>
                <p style={{ fontSize: '20px', fontFamily: 'monospace', fontWeight: '900', color: 'black', margin: 0, letterSpacing: '-0.025em' }}>{asset.code}</p>
            </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <QRCodeSVG
                value={getAssetQrValue(asset)}
                size={110}
                level={"H"}
                includeMargin={false}
            />
        </div>
    </div>
);

interface PrintAssetButtonProps {
    asset: Asset;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
}

export function PrintAssetButton({ asset, variant = "outline", size = "sm", className }: PrintAssetButtonProps) {
    // const { isElectron, print } = useElectron();
    const isElectron = false;
    const print = async (_html: string, _printer: string) => ({ success: false, error: "Unavailable" });

    const handlePrint = async () => {
        if (!isElectron) {
            toast.warning("Impressão direta disponível apenas no App Desktop.");
            // Could open a print window here for web using standard window.print()
            // but without specific styling it might simply correspond to Ctrl+P
            return;
        }

        const printerName = localStorage.getItem("sisdavus_printer_labels");
        if (!printerName) {
            toast.error("Nenhuma impressora configurada. Acesse Configurações.");
            return;
        }

        const htmlContent = renderToStaticMarkup(<PrintableAssetLabel asset={asset} />);
        const toastId = toast.loading("Enviando para impressora...");

        /* Wrap in a centering body for the page (paper) */
        const fullHtml = `
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; display: flex; align-items: flex-start; justify-content: flex-start;">
            ${htmlContent}
        </body>
        </html>
    `;

        try {
            const result = await print(fullHtml, printerName);
            if (result.success) {
                toast.success("Etiqueta impressa", { id: toastId });
            } else {
                toast.error("Erro na impressão: " + result.error, { id: toastId });
            }
        } catch {
            toast.error("Erro de comunicação", { id: toastId });
        }
    };

    return (
        <Button variant={variant} size={size} onClick={handlePrint} className={className} title="Imprimir Etiqueta">
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
        </Button>
    );
}

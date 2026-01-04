import { QRCodeCanvas } from "qrcode.react";
import { Asset } from "@/lib/store";
import { Building2 } from "lucide-react";

export type AssetLabelLayout = 'standard' | 'compact';

interface AssetLabelProps {
    asset: Asset;
    layout?: AssetLabelLayout;
}

export function AssetLabel({ asset, layout = 'standard' }: AssetLabelProps) {
    if (layout === 'compact') {
        return (
            <div className="w-[200px] h-[100px] border-2 border-black p-2 flex gap-2 bg-white print:border-black print:flex print:break-inside-avoid overflow-hidden relative items-center box-border">
                <div className="flex items-center justify-center shrink-0">
                    <QRCodeCanvas
                        value={asset.code}
                        size={80}
                        level={"H"}
                        includeMargin={false}
                    />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                    <div className="flex items-center gap-1 mb-0.5">
                        <Building2 className="w-3 h-3 text-black" />
                        <span className="text-[8px] font-bold uppercase tracking-widest text-black">Davus</span>
                    </div>
                    <p className="text-[8px] text-gray-600 truncate mb-0.5">{asset.category}</p>
                    <p className="text-sm font-black text-black leading-none truncate">{asset.code}</p>
                </div>
            </div>
        );
    }

    // Standard Layout
    return (
        <div className="w-[300px] h-[150px] border-2 border-black p-3 flex gap-4 bg-white print:border-black print:flex print:break-inside-avoid overflow-hidden relative box-border">
            <div className="flex-1 flex flex-col justify-between h-full min-w-0">
                <div>
                    <div className="flex items-center gap-1.5 mb-1">
                        <Building2 className="w-3.5 h-3.5 text-black" />
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-black">Davus</span>
                    </div>
                    <h2 className="text-sm font-bold leading-tight text-black line-clamp-3 mb-1">{asset.name}</h2>
                    <p className="text-[10px] text-gray-600 truncate">{asset.category}</p>
                </div>

                <div>
                    <p className="text-[8px] text-gray-500 uppercase tracking-wider mb-0.5">Patrimônio</p>
                    <p className="text-xl font-mono font-black text-black tracking-tight">{asset.code}</p>
                </div>
            </div>

            <div className="flex items-center justify-center shrink-0">
                <QRCodeCanvas
                    value={asset.code}
                    size={110}
                    level={"H"}
                    includeMargin={false}
                />
            </div>
        </div>
    );
}

export function PrintLayout({ assets }: { assets: Asset[] }) {
    return (
        <div className="hidden print:grid print:grid-cols-2 print:gap-4 p-8 bg-white">
            {assets.map(asset => (
                <AssetLabel key={asset.id} asset={asset} />
            ))}
            <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            size: auto;
            margin: 0mm;
          }
        }
      `}</style>
        </div>
    );
}

"use client";

import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

mermaid.initialize({
    startOnLoad: false,
    theme: "dark",
    securityLevel: "loose",
    fontFamily: "Sora, sans-serif",
});

interface MDXMermaidProps {
    chart: string;
}

export const MDXMermaid: React.FC<MDXMermaidProps> = ({ chart }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = useState<string>("");
    const [id] = useState(() => `mermaid-${Math.random().toString(36).substr(2, 9)}`);

    useEffect(() => {
        if (chart && ref.current) {
            mermaid.render(id, chart).then(({ svg }) => {
                setSvg(svg);
            }).catch((error) => {
                console.error("Mermaid failed to render", error);
                setSvg(`<div class="text-red-500 bg-red-500/10 p-4 rounded">Erro ao renderizar diagrama: ${error.message}</div>`);
            });
        }
    }, [chart, id]);

    return (
        <div className="my-8 border border-white/10 rounded-xl bg-[#0a0a0a] overflow-hidden relative group">
            <TransformWrapper
                initialScale={1}
                minScale={0.5}
                maxScale={4}
                centerOnInit
                wheel={{ step: 0.1 }}
            >
                {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                        <div className="absolute top-4 right-4 z-10 flex gap-2 bg-[#111] p-1.5 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-xl">
                            <button
                                onClick={() => zoomIn()}
                                className="p-2 hover:bg-white/10 rounded-md text-neutral-400 hover:text-white transition-colors"
                                title="Zoom In"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
                            </button>
                            <button
                                onClick={() => zoomOut()}
                                className="p-2 hover:bg-white/10 rounded-md text-neutral-400 hover:text-white transition-colors"
                                title="Zoom Out"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
                            </button>
                            <button
                                onClick={() => resetTransform()}
                                className="p-2 hover:bg-white/10 rounded-md text-neutral-400 hover:text-white transition-colors"
                                title="Reset"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                            </button>
                        </div>

                        <TransformComponent
                            wrapperClass="!w-full !h-full cursor-grab active:cursor-grabbing"
                            contentClass="!w-full !h-full flex items-center justify-center p-8"
                        >
                            <div
                                ref={ref}
                                className="min-h-[300px] flex items-center justify-center"
                                dangerouslySetInnerHTML={{ __html: svg }}
                                style={{
                                    backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
                                    backgroundSize: '20px 20px'
                                }}
                            />
                        </TransformComponent>
                    </>
                )}
            </TransformWrapper>
        </div>
    );
};

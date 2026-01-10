"use client";

import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

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
        <div
            ref={ref}
            className="my-8 flex justify-center bg-white/5 p-6 rounded-xl border border-white/10 overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
};

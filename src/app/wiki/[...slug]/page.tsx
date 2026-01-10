import { getDocBySlug, getAllDocs } from "@/lib/docs";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import Link from 'next/link';
import { MDXMermaid } from "@/components/MDXMermaid";
import remarkGfm from "remark-gfm";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Configuração para renderizar tabelas e código com estilo
const components = {
    h1: ({ node, ...props }: any) => (
        <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-8 bg-gradient-to-br from-white via-white/90 to-white/50 bg-clip-text text-transparent" {...props} />
    ),
    h2: ({ node, ...props }: any) => (
        <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight mt-12 mb-6 text-white border-l-4 border-primary pl-4" {...props} />
    ),
    h3: ({ node, ...props }: any) => (
        <h3 className="text-xl lg:text-2xl font-medium tracking-tight mt-8 mb-4 text-neutral-200" {...props} />
    ),
    p: ({ node, ...props }: any) => (
        <p className="text-neutral-400 leading-relaxed mb-6 text-lg" {...props} />
    ),
    ul: ({ node, ...props }: any) => (
        <ul className="list-none space-y-2 mb-6" {...props} />
    ),
    li: ({ node, ...props }: any) => (
        <li className="relative pl-5 mb-2 text-neutral-400 before:content-['•'] before:text-primary before:font-bold before:absolute before:left-0 before:top-0" {...props} />
    ),
    blockquote: ({ node, ...props }: any) => (
        <blockquote className="border-l-4 border-primary/50 bg-primary/5 p-6 rounded-r-xl my-8 italic text-neutral-300" {...props} />
    ),
    a: ({ node, href, ...props }: any) => {
        let finalHref = href;
        if (href && href.startsWith('./') && href.endsWith('.md')) {
            // Transform ./03-Use-Cases.md to /wiki/Use-Cases (stripping number)
            const cleanLink = href.replace('./', '').replace('.md', '').replace(/^\d+-/, '');
            finalHref = `/wiki/${cleanLink}`;
        }

        return (
            <Link
                href={finalHref}
                className="text-primary hover:text-orange-400 transition-colors border-b border-primary/30 hover:border-primary cursor-pointer"
                {...props}
            />
        );
    },
    pre: ({ node, children, ...props }: any) => {
        return <div className="relative group my-4" {...props}>{children}</div>
    },
    code: ({ node, inline, className, children, ...props }: any) => {
        const match = /language-(\w+)/.exec(className || '');
        const isMermaid = match && match[1] === 'mermaid';

        if (!inline && isMermaid) {
            return <MDXMermaid chart={String(children).replace(/\n$/, '')} />;
        }

        if (inline) {
            return (
                <code className="inline-block bg-white/10 px-1.5 py-0.5 rounded text-primary/80 font-mono text-sm align-middle" {...props}>
                    {children}
                </code>
            );
        }

        return (
            <pre className="inline-block bg-[#111] border border-white/5 px-3 py-1.5 rounded-md overflow-x-auto text-sm text-neutral-300 font-mono w-fit max-w-full align-middle">
                <code className={className} {...props}>
                    {children}
                </code>
            </pre>
        );
    },
    table: ({ node, ...props }: any) => (
        <div className="overflow-x-auto my-8 border border-white/10 rounded-xl bg-white/5">
            <table className="w-full text-left border-collapse" {...props} />
        </div>
    ),
    thead: ({ node, ...props }: any) => (
        <thead className="bg-white/5 text-neutral-200" {...props} />
    ),
    th: ({ node, ...props }: any) => (
        <th className="p-4 font-semibold border-b border-white/10" {...props} />
    ),
    td: ({ node, ...props }: any) => (
        <td className="p-4 border-b border-white/5 text-neutral-400" {...props} />
    ),
};

export async function generateStaticParams() {
    const docs = getAllDocs();
    return docs.flatMap((doc) => [
        { slug: doc.slug },
        { slug: doc.originalSlug }
    ]);
}

export default async function WikiPage({
    params,
}: {
    params: Promise<{ slug: string[] }>;
}) {
    const resolvedParams = await params;
    const doc = getDocBySlug(resolvedParams.slug);

    if (!doc) {
        notFound();
    }

    const docs = getAllDocs();
    const currentIndex = docs.findIndex(d => d.slug[0] === doc.slug[0]);
    const prevDoc = currentIndex > 0 ? docs[currentIndex - 1] : null;
    const nextDoc = currentIndex < docs.length - 1 ? docs[currentIndex + 1] : null;

    return (
        <div className="max-w-4xl mx-auto px-6 py-12 lg:py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Breadcrumb simplificado */}
            <div className="flex items-center gap-2 text-sm text-neutral-500 mb-8 uppercase tracking-wider font-medium">
                <Link href="/wiki" className="hover:text-primary transition-colors">Docs</Link>
                <span className="text-neutral-700">/</span>
                <span className="text-primary">{doc.slug[0]}</span>
            </div>

            <article className="prose prose-invert max-w-none prose-li:marker:text-primary prose-ul:my-4 prose-a:no-underline">
                <ReactMarkdown
                    components={components}
                    remarkPlugins={[remarkGfm]}
                >
                    {doc.content}
                </ReactMarkdown>
            </article>

            {/* Navigation Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-16 pt-8 border-t border-white/5">
                {prevDoc ? (
                    <Link
                        href={`/wiki/${prevDoc.slug[0]}`}
                        className="group flex flex-col p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-primary/30 transition-all duration-300"
                    >
                        <span className="flex items-center gap-2 text-sm text-neutral-500 group-hover:text-primary mb-1">
                            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            Anterior
                        </span>
                        <span className="font-medium text-neutral-200 group-hover:text-white break-words leading-tight">
                            {prevDoc.title}
                        </span>
                    </Link>
                ) : <div />}

                {nextDoc ? (
                    <Link
                        href={`/wiki/${nextDoc.slug[0]}`}
                        className="group flex flex-col items-end p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-primary/30 transition-all duration-300 text-right"
                    >
                        <span className="flex items-center gap-2 text-sm text-neutral-500 group-hover:text-primary mb-1">
                            Próximo
                            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </span>
                        <span className="font-medium text-neutral-200 group-hover:text-white text-right break-words leading-tight">
                            {nextDoc.title}
                        </span>
                    </Link>
                ) : <div />}
            </div>

            <div className="mt-20 pt-10 border-t border-white/5 flex justify-between text-neutral-500 text-sm">
                <p>© 2026 SisDavus Engineering Team</p>
                <p>Atualizado recentemente</p>
            </div>
        </div>
    );
}

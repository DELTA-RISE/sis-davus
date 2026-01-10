import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const contentDirectory = path.join(process.cwd(), 'docs/wiki');

export interface DocPost {
    slug: string[];
    title: string;
    content: string;
    order: number;
    originalSlug: string[];
}

export function getAllDocs(): DocPost[] {
    const fileNames = fs.readdirSync(contentDirectory);

    // Configurar ordem manual baseado nos prefixos "01-", "02-", etc.
    const allDocs = fileNames
        .filter(fileName => fileName.endsWith('.md'))
        .map(fileName => {
            const fullPath = path.join(contentDirectory, fileName);
            const fileContents = fs.readFileSync(fullPath, 'utf8');
            const { data, content } = matter(fileContents);

            // Remove a extensão .md e o prefixo numérico para criar um slug limpo
            const fileNameWithoutExt = fileName.replace(/\.md$/, '');
            const cleanSlug = fileNameWithoutExt.replace(/^\d+-/, '');
            const slug = [cleanSlug];
            const originalSlug = [fileNameWithoutExt];

            // Tenta extrair título do primeiro Heading H1 se não houver no frontmatter
            let title = data.title;
            if (!title) {
                const h1Match = content.match(/^#\s+(.*)/m);
                if (h1Match) {
                    title = h1Match[1];
                } else {
                    title = cleanSlug.replace(/-/g, ' ');
                }
            }

            // Tenta extrair ordem do prefixo numérico (ex: 01-Introduction -> 1)
            let order = 999;
            const prefixMatch = fileName.match(/^(\d+)-/);
            if (prefixMatch) {
                order = parseInt(prefixMatch[1], 10);
            }

            return {
                slug,
                title,
                content,
                order,
                originalSlug
            };
        });

    // Ordena por ordem numérica primeiro, e depois alfabeticamente pelo título
    return allDocs.sort((a, b) => {
        if (a.order !== b.order) {
            return a.order - b.order;
        }
        return a.title.localeCompare(b.title);
    });
}

export function getDocBySlug(slugArray: string[]): DocPost | null {
    const slugString = slugArray[0]; // Assumindo estrutura flat por enquanto
    const allDocs = getAllDocs();
    const doc = allDocs.find(d => d.slug[0] === slugString || d.originalSlug[0] === slugString);
    return doc || null;
}

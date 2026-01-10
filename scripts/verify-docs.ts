
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const contentDirectory = path.join(process.cwd(), 'docs/wiki');

export function getAllDocs() {
    if (!fs.existsSync(contentDirectory)) {
        console.error("Directory does not exist!");
        return [];
    }
    const fileNames = fs.readdirSync(contentDirectory);

    const allDocs = fileNames
        .filter(fileName => fileName.endsWith('.md'))
        .map(fileName => {
            const cleanSlug = fileName.replace(/\.md$/, '').replace(/^\d+-/, '');
            const slug = [cleanSlug];

            let order = 999;
            const prefixMatch = fileName.match(/^(\d+)-/);
            if (prefixMatch) {
                order = parseInt(prefixMatch[1], 10);
            }

            return {
                slug,
                order,
                fileName
            };
        });

    return allDocs;
}

try {
    const docs = getAllDocs();
    console.log("Total docs parsed:", docs.length);

    const byOrder: Record<number, string[]> = {};
    docs.forEach(doc => {
        if (!byOrder[doc.order]) {
            byOrder[doc.order] = [];
        }
        byOrder[doc.order].push(doc.fileName);
    });

    let foundDuplicates = false;
    Object.entries(byOrder).forEach(([order, files]) => {
        if (files.length > 1) {
            console.log(`Duplicate Order ${order}:`, files);
            foundDuplicates = true;
        }
    });

    if (!foundDuplicates) {
        console.log("No duplicate orders found.");
    }

} catch (e) {
    console.error("Error executing:", e);
}

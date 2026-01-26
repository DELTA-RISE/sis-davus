import { protocol, net } from 'electron';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { app } from 'electron';

export function setupCacheProtocol() {
    const cacheDir = path.join(app.getPath('userData'), 'media-cache');

    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
    }

    protocol.handle('media-cache', async (request) => {
        const url = request.url.replace('media-cache://', '');

        // Decode URL if it was encoded
        let remoteUrl: string;
        try {
            remoteUrl = decodeURIComponent(url);
        } catch {
            remoteUrl = url;
        }

        // Basic validation
        if (!remoteUrl.startsWith('http')) {
            return new Response('Invalid URL', { status: 400 });
        }

        // Generate filename from hash
        const hash = crypto.createHash('md5').update(remoteUrl).digest('hex');
        const ext = path.extname(remoteUrl.split('?')[0]) || '.bin';
        const filePath = path.join(cacheDir, `${hash}${ext}`);

        // Check if exists
        if (fs.existsSync(filePath)) {
            // Serve local file
            // We use net.fetch to serve file:// because Response(fs.createReadStream) is node-specific and might fail in some electron versions in protocol.handle
            // Actually, protocol.handle expects a Response.
            // Simplest way in Electron 25+ is:
            return net.fetch(`file:///${filePath.replace(/\\/g, '/')}`);
        }

        try {
            // Fetch remote
            const response = await net.fetch(remoteUrl);
            if (!response.ok) {
                return response;
            }

            // We need to clone the response to read it and return it? 
            // Or simple: read arrayBuffer, write to disk, return new Response.
            const buffer = await response.arrayBuffer();
            fs.writeFileSync(filePath, Buffer.from(buffer));

            return new Response(buffer, {
                headers: response.headers
            });

        } catch (error) {
            console.error('Cache fetch error:', error);
            return new Response('Error fetching media', { status: 500 });
        }
    });

    console.log("Media Cache Protocol 'media-cache://' registered.");
}


import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { PDFDocument, StandardFonts, rgb } from 'https://cdn.skypack.dev/pdf-lib'

console.log("Hello from Functions!")

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            }
        });
    }

    try {
        const { title, content, type } = await req.json()

        // Create a new PDFDocument
        const pdfDoc = await PDFDocument.create()

        // Embed the Times Roman font
        const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)

        // Add a blank page to the document
        const page = pdfDoc.addPage()

        // Get the width and height of the page
        const { width, height } = page.getSize()

        // Draw a string of text toward the top of the page
        const fontSize = 30
        page.drawText(title || 'Relatório SisDavus', {
            x: 50,
            y: height - 4 * fontSize,
            size: fontSize,
            font: timesRomanFont,
            color: rgb(0, 0.53, 0.71),
        })

        const contentText = Array.isArray(content) ? content.join('\n') : (content || 'Sem conteúdo');

        page.drawText(contentText, {
            x: 50,
            y: height - 6 * fontSize,
            size: 12,
            font: timesRomanFont,
            color: rgb(0, 0, 0),
            maxWidth: width - 100,
            lineHeight: 15,
        });

        // Serialize the PDFDocument to bytes (a Uint8Array)
        const pdfBytes = await pdfDoc.save()

        return new Response(
            pdfBytes,
            {
                headers: {
                    "Content-Type": "application/pdf",
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
                }
            },
        )
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 400,
        })
    }
})

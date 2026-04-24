import { PDFParse } from 'pdf-parse';
import Tesseract from 'tesseract.js';

/**
 * Renders a PDF page to PNG and runs Tesseract. Uses dynamic import for `canvas`
 * because native `canvas` often fails on serverless (e.g. Vercel) — we must not
 * crash the whole extract pipeline when OCR-by-raster is unavailable.
 */
/** pdf.js page proxy */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ocrPageRaster(page: any, pageNum: number): Promise<string> {
  try {
    const { createCanvas } = await import('canvas');
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const context = canvas.getContext('2d');

    await page
      .render({
        canvasContext: context as unknown as CanvasRenderingContext2D,
        viewport,
        canvas: canvas as unknown as HTMLCanvasElement,
      })
      .promise;

    const imageData = canvas.toBuffer('image/png');
    const {
      data: { text },
    } = await Tesseract.recognize(imageData, 'eng+spa', {
      logger: () => {},
    });
    return text;
  } catch (err) {
    console.warn(`[pdf-extractor] Raster OCR skipped for page ${pageNum} (canvas/serverless):`, err);
    return '';
  }
}

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const parser = new PDFParse({ data: buffer });
    const data = await parser.getText();
    await parser.destroy();
    const text = data.text.trim();

    if (text && text.length > 200) {
      return text;
    }

    console.log('PDF appears to be image-based, attempting extended extraction...');
    return await extractTextWithPdfJs(buffer);
  } catch (error) {
    console.error('PDF parsing error, falling back to pdf.js path:', error);
    return await extractTextWithPdfJs(buffer);
  }
}

async function extractTextWithPdfJs(buffer: Buffer): Promise<string> {
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
    const numPages = pdfDoc.numPages;
    let fullText = '';

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);

      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => {
          if (item && typeof item === 'object' && 'str' in item && typeof (item as { str: unknown }).str === 'string') {
            return (item as { str: string }).str;
          }
          return '';
        })
        .join(' ');

      if (pageText.trim().length > 50) {
        fullText += pageText + '\n';
      } else {
        const ocrText = await ocrPageRaster(page, pageNum);
        if (ocrText.trim()) {
          fullText += ocrText + '\n';
        }
      }
    }

    await pdfDoc.destroy();
    return fullText.trim();
  } catch (error) {
    throw new Error(`Failed to extract text from PDF: ${error}`);
  }
}

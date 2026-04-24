import { PDFParse } from 'pdf-parse';
import Tesseract from 'tesseract.js';
import { createCanvas } from 'canvas';

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const parser = new PDFParse({ data: buffer });
    const data = await parser.getText();
    await parser.destroy();
    const text = data.text.trim();

    if (text && text.length > 200) {
      return text;
    }

    console.log('PDF appears to be image-based, attempting OCR...');
    return await extractTextWithOCR(buffer);
  } catch (error) {
    console.error('PDF parsing error, falling back to OCR:', error);
    return await extractTextWithOCR(buffer);
  }
}

async function extractTextWithOCR(buffer: Buffer): Promise<string> {
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
        fullText += text + '\n';
      }
    }

    await pdfDoc.destroy();
    return fullText.trim();
  } catch (error) {
    throw new Error(`Failed to extract text from PDF: ${error}`);
  }
}

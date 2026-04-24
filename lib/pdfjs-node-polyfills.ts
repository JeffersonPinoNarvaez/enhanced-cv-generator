/**
 * pdf.js expects browser globals (e.g. DOMMatrix). Node / Vercel do not provide them.
 * Install once before importing pdf-parse or pdfjs-dist.
 */
let installed = false;

export async function installPdfJsNodePolyfills(): Promise<void> {
  if (installed) return;
  if (typeof globalThis.DOMMatrix !== 'undefined') {
    installed = true;
    return;
  }

  const mod = await import('dommatrix');
  const Poly = mod.default as unknown as new (...args: unknown[]) => unknown;
  (globalThis as Record<string, unknown>).DOMMatrix = Poly;
  installed = true;
}

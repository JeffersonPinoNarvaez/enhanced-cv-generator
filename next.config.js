/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'pdfjs-dist', 'canvas', 'tesseract.js'],
  },
};

module.exports = nextConfig;

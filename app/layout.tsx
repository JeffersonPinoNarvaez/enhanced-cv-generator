import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import { cn } from '@/lib/utils';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CV Craft ATS — Job-Aligned Resume Generator',
  description: 'Generate an ATS-optimized CV aligned with any job offer using AI',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(poppins.variable)}>
      <body className={`${poppins.className} font-sans text-base antialiased`}>{children}</body>
    </html>
  );
}

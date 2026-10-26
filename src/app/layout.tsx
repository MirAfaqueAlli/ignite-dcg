import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ICETICT-2027 — International Conference Portal Inauguration | DRIEMS University',
  description:
    'Official Portal Inauguration for the 2nd International Conference on Emerging Trends in Intelligent Computing Techniques (ICETICT-2027) at DRIEMS University.',
  keywords: ['ICETICT-2027', 'IEEE', 'Scopus', 'conference', 'DRIEMS University', 'intelligent computing'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}

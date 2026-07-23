import type { Metadata } from 'next';
import { Bebas_Neue, Source_Sans_3 } from 'next/font/google';
import './globals.css';

const bebas = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
});

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-source',
});

export const metadata: Metadata = {
  title: 'Subscribe · Stu & Laurie',
  description:
    'Create your membership profile, then complete payment on the official checkout.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bebas.variable} ${sourceSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}

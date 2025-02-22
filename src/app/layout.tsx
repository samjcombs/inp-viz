import type { Metadata } from "next";
import { Lato } from "next/font/google";
import "./globals.css";

const lato = Lato({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-lato',
});

export const metadata: Metadata = {
  title: {
    template: '%s | INP Survey Results',
    default: 'INP Survey Results',
  },
  description: "Survey results visualization for Institute for Nonprofit Practice",
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${lato.variable} font-lato antialiased bg-white`}>
        {children}
      </body>
    </html>
  );
}

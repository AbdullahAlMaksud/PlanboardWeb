import type { Metadata } from 'next';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined) ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export const metadata: Metadata = {
  title: 'Planboard — AI-powered Personal Project Canvas',
  description: 'A beautiful freeform canvas for managing personal projects and tasks, enhanced with Gemini AI.',
  metadataBase: new URL(siteUrl),
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'Planboard — AI-powered Personal Project Canvas',
    description: 'A beautiful freeform canvas for managing personal projects and tasks, enhanced with Gemini AI.',
    url: siteUrl,
    siteName: 'Planboard',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Planboard — AI-powered Personal Project Canvas',
    description: 'A beautiful freeform canvas for managing personal projects and tasks, enhanced with Gemini AI.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className="h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}

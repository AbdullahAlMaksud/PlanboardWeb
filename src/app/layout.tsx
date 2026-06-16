import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Planboard — Personal Project Canvas',
  description: 'A beautiful freeform canvas for managing personal projects and tasks.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
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

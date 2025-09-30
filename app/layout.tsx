// app/layout.tsx
import type { ReactNode } from 'react';
// If you don't have a globals.css, delete the next line.
import './globals.css';

export const metadata = {
  title: 'Quirk AI',
  description: 'Quirk AI demos',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


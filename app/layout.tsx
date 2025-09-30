// app/layout.tsx
import type { ReactNode } from 'react';
import './styles/globals.css'; // <-- note styles/

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

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: {
    template: '%s | RentEase',
    default: 'RentEase – Tenant Management',
  },
  description: 'Personal tenant management with hybrid billing for landlords.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}

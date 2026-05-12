import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: {
    template: '%s | RentsEasy',
    default: 'RentsEasy – Tenant Management',
  },
  description: 'Personal tenant management with hybrid billing for landlords.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* PWA manifest – required for iOS push notifications */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
        {/* iOS PWA meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="RentsEasy" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var supportDark = window.matchMedia('(prefers-color-scheme: dark)').matches === true;
                  if (!theme && supportDark) theme = 'dark';
                  if (!theme) theme = 'light';
                  document.documentElement.classList.add(theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="h-full antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}

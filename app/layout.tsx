import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'SYNTH — AI Rich Data Training Lab & Platform',
  description:
    'A local-first AI data and evaluation lab for logging model interactions, reviewing outputs, and replaying experiment packets.',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FDFCFB' },
    { media: '(prefers-color-scheme: dark)', color: '#141312' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased selection:bg-[#C4956A]/20 selection:text-[#C4956A]">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          themes={['light', 'dark']}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

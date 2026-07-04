import type { Metadata } from 'next';
import { IBM_Plex_Mono, Space_Grotesk } from 'next/font/google';
import './globals.css';

import { Toaster } from '@/components/ui/sonner';
import { Providers } from '@/components/query-provider';
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from '@clerk/nextjs';

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-mono',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'THE_ARCHIVE [v.1.0]',
  description: 'Intake Protocol Interface',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${ibmPlexMono.variable} ${spaceGrotesk.variable} font-mono antialiased`}>
        <ClerkProvider>
          <Providers>
            {children}
            {/* Sonner Toaster for notifications */}
            <Toaster position="bottom-right" richColors closeButton />
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../contexts/auth-provider";
import { Providers } from "./providers";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://gocontentai.com'),
  title: {
    default: 'Content AI | Dashboard',
    template: 'Content AI | %s',
  },
  description:
    'Say goodbye to social media overwhelm. Content AI helps you create, schedule, and manage posts that match your brand voice. Boost your growth with data-driven insights.',
  keywords: [
    'social media manager',
    'ai social media',
    'content creation ai',
    'brand voice consistency',
    'affordable social media management',
    'data-driven social media',
    'automate posts',
    'schedule posts',
    'small business social media',
    'content ai',
  ],
  authors: [{ name: 'Content AI', url: 'https://gocontentai.com' }],
  creator: 'Content AI',
  publisher: 'Content AI',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US', // or "es_ES" for Spanish
    url: 'https://gocontentai.com',
    title: 'Content AI | Your AI-Powered Social Media Manager',
    description:
      'Say goodbye to social media overwhelm. Content AI helps you create, schedule, and manage posts that match your brand voice. Boost your growth with data-driven insights.',
    images: [
      {
        url: '/hero-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Content AI Dashboard',
      },
    ],
    siteName: 'Content AI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Content AI | Your AI-Powered Social Media Manager',
    description:
      'Say goodbye to social media overwhelm. Content AI helps you create, schedule, and manage posts that match your brand voice. Boost your growth with data-driven insights.',
    images: ['/hero-image.jpg'],
  },
  alternates: {
    canonical: 'https://gocontentai.com',
  },
  other: {
    'theme-color': '#000000',
    'msapplication-TileColor': '#000000',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <meta name="apple-mobile-web-app-title" content="Content AI" />
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <Providers>
            <Toaster />
            {children}
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}

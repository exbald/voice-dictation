import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { STTProviderProvider } from "@/contexts/stt-provider-context";
import type { Metadata } from "next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  title: {
    default: "Voice Dictation",
    template: "%s | Voice Dictation",
  },
  description:
    "Push-to-talk voice dictation. Hold Ctrl to record, release to copy clean transcript.",
  keywords: [
    "voice dictation",
    "speech to text",
    "transcription",
    "Deepgram",
    "ElevenLabs",
    "real-time",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Voice Dictation",
    title: "Voice Dictation - Push-to-Talk Transcription",
    description:
      "Push-to-talk voice dictation. Hold Ctrl to record, release to copy clean transcript.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Voice Dictation - Push-to-talk transcription with Deepgram and ElevenLabs",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Voice Dictation - Push-to-Talk Transcription",
    description:
      "Push-to-talk voice dictation. Hold Ctrl to record, release to copy clean transcript.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Voice Dictation - Push-to-talk transcription with Deepgram and ElevenLabs",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    "theme-color": "#0a0a0a",
    "msapplication-TileColor": "#0a0a0a",
  },
  appleWebApp: {
    title: "Voice Dictation",
    statusBarStyle: "black-translucent",
    capable: true,
  },
};

// JSON-LD structured data for SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Voice Dictation",
  description:
    "Push-to-talk voice dictation. Hold Ctrl to record, release to copy clean transcript.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <STTProviderProvider>
            <SiteHeader />
            <main id="main-content">{children}</main>
            <SiteFooter />
            <Toaster richColors position="top-right" />
          </STTProviderProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

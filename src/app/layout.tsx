import { JetBrains_Mono, Playfair_Display, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { STTProviderProvider } from "@/contexts/stt-provider-context";
import type { Metadata } from "next";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  title: {
    default: "Vox",
    template: "%s | Vox",
  },
  description:
    "Editorial dictation studio. Hold Ctrl to record, release to copy.",
  keywords: [
    "vox",
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
    siteName: "Vox",
    title: "Vox - Editorial Dictation Studio",
    description:
      "Editorial dictation studio. Hold Ctrl to record, release to copy.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Vox editorial dictation studio",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vox - Editorial Dictation Studio",
    description:
      "Editorial dictation studio. Hold Ctrl to record, release to copy.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Vox editorial dictation studio",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    "theme-color": "#f6f1e8",
    "msapplication-TileColor": "#f6f1e8",
  },
  appleWebApp: {
    title: "Vox",
    statusBarStyle: "black-translucent",
    capable: true,
  },
  icons: {
    icon: [
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/icons/icon-32.png"],
  },
};

// JSON-LD structured data for SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Vox",
  description:
    "Editorial dictation studio. Hold Ctrl to record, release to copy.",
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
        className={`${sourceSans.variable} ${playfair.variable} ${jetbrainsMono.variable} antialiased`}
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

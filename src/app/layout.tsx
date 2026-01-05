import type { Metadata, Viewport } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import { VisualEditsMessenger } from "orchids-visual-edits";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import { CustomCursor } from "@/components/CustomCursor";

import { SyncProvider } from "@/components/SyncProvider";
import { SoundProvider } from "@/components/SoundProvider";
import { Analytics } from "@/components/Analytics";
import { JsonLd } from "@/components/JsonLd";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SIS DAVUS - Controle de Estoque e Patrimônio",
  description: "Otimize a gestão do seu patrimônio e estoque com o SIS DAVUS. Controle total, do físico ao digital.",
  metadataBase: new URL("https://sis-davus.netlify.app"), // Using a probable default or placeholder
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://sis-davus.netlify.app/",
    title: "SIS DAVUS - Controle de Estoque e Patrimônio",
    description: "Otimize a gestão do seu patrimônio e estoque com o SIS DAVUS. Controle total, do físico ao digital.",
    siteName: "SIS DAVUS",
  },
  twitter: {
    card: "summary_large_image",
    title: "SIS DAVUS - Controle de Estoque e Patrimônio",
    description: "Otimize a gestão do seu patrimônio e estoque com o SIS DAVUS. Controle total, do físico ao digital.",
    creator: "@deltarise",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/davus-logo.svg",
    apple: "/davus-logo.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SIS DAVUS",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ff5d38",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${sora.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <SoundProvider>
            <CustomCursor />
            <SyncProvider>
              <LayoutWrapper>{children}</LayoutWrapper>

              <Analytics />
              <JsonLd />
            </SyncProvider>
          </SoundProvider>
          <Toaster richColors position="top-right" />
        </ThemeProvider>


        <VisualEditsMessenger />
      </body>
    </html>
  );
}
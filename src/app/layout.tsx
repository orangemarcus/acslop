import type { Metadata, Viewport } from "next";
import Providers from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Academic Slop Translator",
  description: "Turn pretentious academic prose into plain English. Score texts on a pretension index and extract core claims.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ACSLOP",
  },
  openGraph: {
    title: "Academic Slop Translator",
    description: "Turn pretentious academic prose into plain English. Get a Slop Index score and hallucination check.",
    type: "website",
    siteName: "ACSLOP",
  },
};

export const viewport: Viewport = {
  themeColor: "#C96442",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

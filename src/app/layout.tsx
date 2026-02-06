import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Academic Slop Translator",
  description: "Turn pretentious academic prose into plain English. Score texts on a pretension index and extract core claims.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

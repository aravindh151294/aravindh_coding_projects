import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { AIInsightsWrapper } from "@/components/AIInsightsWrapper";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FinDash - Loan & FD Calculator",
  description: "Progressive Web App for loan analysis and fixed deposit calculations with real-time updates, comparison tools, and AI-powered insights.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FinDash",
  },
  keywords: ["loan calculator", "FD calculator", "EMI", "prepayment", "fixed deposit", "financial planning"],
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <Navigation />
        <main className="pt-4 pb-24 md:pt-20 md:pb-8 px-4 min-h-screen">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        <AIInsightsWrapper />
      </body>
    </html>
  );
}

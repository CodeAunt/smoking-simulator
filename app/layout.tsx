import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smoking Simulator - Virtual Cigarette Experience",
  description: "A realistic smoking simulator that lets you experience virtual cigarette burning with accelerating effects. Press any key, click, or touch to smoke. Watch the cigarette burn down with realistic smoke animation.",
  keywords: [
    "smoking simulator",
    "virtual cigarette",
    "smoking animation",
    "cigarette burning",
    "smoke effects",
    "interactive simulation",
    "quit smoking",
    "smoking cessation",
    "virtual smoking experience",
    "realistic cigarette",
    "burning animation",
    "smoke simulator"
  ],
  authors: [{ name: "Smoking Simulator" }],
  creator: "Smoking Simulator",
  publisher: "Smoking Simulator",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://smokingsimulator.app",
    title: "Smoking Simulator - Virtual Cigarette Experience",
    description: "Experience realistic virtual smoking with accelerating burn effects and smoke animation. Interactive cigarette simulator with realistic burning mechanics.",
    siteName: "Smoking Simulator",
  },
  twitter: {
    card: "summary_large_image",
    title: "Smoking Simulator - Virtual Cigarette Experience",
    description: "Experience realistic virtual smoking with accelerating burn effects and smoke animation",
    creator: "@zeepp",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: "#000000",
  colorScheme: "dark",
  category: "entertainment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <GoogleAnalytics gaId="G-18101TFPEP" />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader, Inter } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  // No weight specified → loads as variable font (supports 100–900 incl. 450)
});

export const metadata: Metadata = {
  metadataBase: new URL("https://yournightstand.com"),
  title: {
    default: "Nightstand - Your Reading Pile, But It Actually Works",
    template: "%s | Nightstand",
  },
  description:
    "Save articles you discover into a quiet weekly reading list for the weekend. A reading list that gives you weekly recap of things to read.",
  keywords: [
    "reading list",
    "bookmarks",
    "articles",
    "weekly reading",
    "save articles",
    "reading app",
  ],
  authors: [{ name: "Harshvardhan Agarwal", url: "https://x.com/harshii04" }],
  creator: "Harshvardhan Agarwal",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://yournightstand.com",
    siteName: "Nightstand",
    title: "Nightstand - Your Reading Pile, But It Actually Works",
    description:
      "Save articles you discover into a quiet weekly reading list for the weekend.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nightstand - Your Reading Pile, But It Actually Works",
    description:
      "Save articles you discover into a quiet weekly reading list for the weekend.",
    creator: "@harshii04",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} ${inter.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

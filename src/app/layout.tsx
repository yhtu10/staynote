import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Noto_Serif_TC } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const notoSerifTC = Noto_Serif_TC({
  variable: "--font-noto-serif-tc",
  subsets: ["latin"],
  weight: ["300", "400"],
});

export const metadata: Metadata = {
  title: "StayNote — 有旅人說過才值得訂",
  description: "來自真實旅人的第一手飯店評論，結構化、有觀點、附訂房連結。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" className={`${geistSans.variable} ${notoSerifTC.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-neutral-900">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}

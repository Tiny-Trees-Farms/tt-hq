import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthInit from "@/components/auth/AuthInit";
import GlobalLoading from "@/components/ui/GlobalLoading";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tiny HQ",
  description: "Tiny Trees HQ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}
      >
        <AuthInit />
        <GlobalLoading />
        {children}
        <Analytics />
        <Toaster />
      </body>
    </html>
  );
}

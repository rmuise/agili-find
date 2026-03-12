import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/supabase/auth-context";
import { SavedTrialsProvider } from "@/lib/hooks/saved-trials-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgiliFind — Dog Agility Trial Search",
  description:
    "Search upcoming dog agility trials across AKC, USDAA, CPE, NADAC, UKI, CKC, and AAC in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <SavedTrialsProvider>{children}</SavedTrialsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/supabase/auth-context";
import { SavedTrialsProvider } from "@/lib/hooks/saved-trials-context";
import { ToastProvider } from "@/components/ui/toast";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
  title: {
    default: "AgiliFind — Dog Agility Trial Search",
    template: "%s | AgiliFind",
  },
  description:
    "Search upcoming dog agility trials across AKC, USDAA, CPE, NADAC, UKI, CKC, AAC, and TDAA in one place. Find seminars, training spaces, and plan your season.",
  keywords: [
    "dog agility",
    "agility trials",
    "AKC agility",
    "USDAA",
    "CPE",
    "UKI",
    "NADAC",
    "CKC",
    "TDAA",
    "dog agility trial search",
    "agility seminar",
    "agility training",
  ],
  openGraph: {
    title: "AgiliFind — Dog Agility Trial Search",
    description:
      "Search upcoming dog agility trials across AKC, USDAA, CPE, UKI, CKC, AAC, and TDAA. Find seminars and training spaces near you.",
    type: "website",
    locale: "en_US",
    siteName: "AgiliFind",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgiliFind — Dog Agility Trial Search",
    description:
      "Search upcoming dog agility trials across AKC, USDAA, CPE, UKI, CKC, AAC, and TDAA in one place.",
  },
  robots: {
    index: true,
    follow: true,
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <ToastProvider>
            <AuthProvider>
              <SavedTrialsProvider>{children}</SavedTrialsProvider>
            </AuthProvider>
          </ToastProvider>
        </ErrorBoundary>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

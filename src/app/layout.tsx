import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import { AuthProvider } from "@/lib/supabase/auth-context";
import { SavedTrialsProvider } from "@/lib/hooks/saved-trials-context";
import { ToastProvider } from "@/components/ui/toast";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ThemeProvider } from "@/lib/theme-context";
import { PreferencesProvider } from "@/lib/preferences-context";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const dmSans = DM_Sans({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('agili-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}})();`,
          }}
        />
      </head>
      <body
        className={`${bebasNeue.variable} ${dmSans.variable} antialiased`}
      >
        <ThemeProvider>
          <PreferencesProvider>
            <ErrorBoundary>
              <ToastProvider>
                <AuthProvider>
                  <SavedTrialsProvider>{children}</SavedTrialsProvider>
                </AuthProvider>
              </ToastProvider>
            </ErrorBoundary>
          </PreferencesProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

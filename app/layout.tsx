import type { Metadata } from "next";
import { Manrope, Geist_Mono } from "next/font/google";
import { ViewTransitions } from "next-view-transitions";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { Topbar } from "@/components/nav/Topbar";
import { siteConfig } from "@/lib/site-config";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = new URL(siteConfig.url);

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    template: `%s — ${siteUrl.host}`,
    default: siteConfig.title,
  },
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ViewTransitions>
      <html
        lang="en"
        className={`${manrope.variable} ${geistMono.variable}`}
        suppressHydrationWarning
      >
        {/*
          Anti-FOUC: restore the saved theme before the first paint.
          Runs synchronously so there is zero flash between SSR and hydration.
          The ThemeToggle reads data-theme on mount and will already be in sync.
        */}
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`,
            }}
          />
        </head>
        <body>
          <SmoothScroll>
            <Topbar />
            {children}
          </SmoothScroll>
        </body>
      </html>
    </ViewTransitions>
  );
}

import type { Metadata } from "next";
import Script from "next/script";
import { Manrope, Geist_Mono } from "next/font/google";
import { ViewTransitions } from "next-view-transitions";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { Topbar } from "@/components/nav/Topbar"; //cSpell:ignore Topbar
import { SiteFooter } from "@/components/nav/SiteFooter";
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
    template: `%s — ${siteConfig.host}`,
    default: siteConfig.title,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    type: "website",
    images: [siteConfig.ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: siteConfig.name,
  url: siteConfig.url,
  email: siteConfig.email,
  jobTitle: "Senior UX Designer & Front-End Developer",
  sameAs: [siteConfig.links.github, siteConfig.links.linkedin],
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
          Anti-FOUC: restore the saved theme + motion preference before the
          first paint. Runs synchronously so there is zero flash between SSR
          and hydration. ThemeToggle/MotionToggle read these attributes on
          mount and will already be in sync.
        */}
        <head>
          <Script id="theme-init" strategy="beforeInteractive">
            {`(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}var m=localStorage.getItem('motion');if(m==='on'||m==='off'){document.documentElement.setAttribute('data-motion',m);}}catch(e){}})();`}
          </Script>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
          />
        </head>
        <body>
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          <SmoothScroll>
            <Topbar />
            {children}
            <SiteFooter />
          </SmoothScroll>
        </body>
      </html>
    </ViewTransitions>
  );
}

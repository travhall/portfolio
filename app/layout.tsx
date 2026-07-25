import type { Metadata } from "next";
import { Manrope, Geist_Mono } from "next/font/google";
import { ViewTransitions } from "next-view-transitions";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { Topbar } from "@/components/nav/Topbar"; //cSpell:ignore Topbar
import { SiteFooter } from "@/components/nav/SiteFooter";
import { siteConfig } from "@/lib/site-config";
import { getCaseStudies } from "@/lib/case-studies";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const caseStudies = await getCaseStudies();
  return (
    <ViewTransitions>
      <html
        lang="en"
        className={`${manrope.variable} ${geistMono.variable}`}
        suppressHydrationWarning
      >
        {/*
          Anti-FOUC: restore the saved theme + motion preference before the
          first paint. A plain inline <script>, not next/script's Script
          component — Script's beforeInteractive strategy only serializes
          into the RSC payload here (Next 16 + Turbopack) and isn't present
          as a literal tag in the raw server HTML, so it executes during
          hydration, well after first paint, defeating its whole purpose
          (confirmed by curling the page: no literal <script id="theme-init">
          in the response). A plain dangerouslySetInnerHTML <script>, like
          the JSON-LD one right below, IS literal in the HTML and blocks
          parsing synchronously, which is what actually prevents the flash.
        */}
        <head>
          <script
            id="theme-init"
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}var m=localStorage.getItem('motion');if(m==='on'||m==='off'){document.documentElement.setAttribute('data-motion',m);}}catch(e){}})();`,
            }}
          />
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
            <SiteFooter caseStudies={caseStudies} />
          </SmoothScroll>
        </body>
      </html>
    </ViewTransitions>
  );
}

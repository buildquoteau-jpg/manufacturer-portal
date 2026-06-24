import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { GlobalNav } from "./components/GlobalNav";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "BuildQuote South West Product Directory",
    template: "%s | BuildQuote",
  },
  description: "Browse building product systems and manufacturers across the South West of Western Australia. Find local suppliers in Busselton, Dunsborough, Margaret River and Bunbury.",
  openGraph: {
    title: "BuildQuote South West Product Directory",
    description: "Browse building product systems and manufacturers across the South West of Western Australia.",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://search.buildquote.com.au",
    siteName: "BuildQuote",
    locale: "en_AU",
    type: "website",
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
        className={`${barlow.variable} ${barlowCondensed.variable} antialiased`}
        suppressHydrationWarning
      >
        <GlobalNav />
        {children}
        <div id="bq-testing-banner" style={{
          background: '#fffbeb',
          borderTop: '3px solid #f59e0b',
          color: '#78350f',
          padding: '18px 24px',
          fontSize: '13px',
          lineHeight: 1.7,
          textAlign: 'center',
        }}>
          <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px', color: '#92400e' }}>
            Private Testing — This platform is not open to the public.
          </div>
          This site is in pre-launch test mode only. The presence of any company name, brand, or product does not imply partnership, endorsement, or affiliation.
          All product data has been sourced from publicly available materials.
          All demo content will be replaced with verified manufacturer data prior to launch.
        </div>
      </body>
    </html>
  );
}

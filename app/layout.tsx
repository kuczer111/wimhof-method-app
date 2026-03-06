import type { Metadata, Viewport } from "next";
import { strings } from "@/lib/i18n";
import ErrorTracker from "@/components/ErrorTracker";
import "./globals.css";

export const metadata: Metadata = {
  title: strings.app.title,
  description: strings.app.description,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: strings.app.shortTitle,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0ea5e9" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("whm_theme")||"system";var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme:dark)").matches);if(d)document.documentElement.classList.add("dark")}catch(e){}})()`,
          }}
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="antialiased">
        <ErrorTracker />
        {children}
      </body>
    </html>
  );
}

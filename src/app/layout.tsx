import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dream Look - Salon Management System",
  description: "Elegant salon management system for booking appointments, managing staff, tracking revenue, and commission settlements. Built with Next.js, TypeScript, and Tailwind CSS.",
  keywords: ["Dream Look", "salon", "management", "appointments", "booking", "commission", "React"],
  authors: [{ name: "Dream Look" }],
  openGraph: {
    title: "Dream Look - Salon Management System",
    description: "Elegant salon management system for booking, staff management, and revenue tracking.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dream Look - Salon Management System",
    description: "Elegant salon management system",
  },
};

const APP_VERSION = "2026052604";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Self-healing cache buster — runs before React loads */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  try {
    var v="${APP_VERSION}";
    var sv=localStorage.getItem("dl_app_ver");
    if(sv&&sv!==v){
      localStorage.clear();
      sessionStorage.clear();
      if("caches"in window){caches.keys().then(function(k){k.forEach(function(n){caches.delete(n)})})}
      localStorage.setItem("dl_app_ver",v);
      window.location.replace(window.location.pathname);
      throw new Error("CACHE_BUST");
    }
    localStorage.setItem("dl_app_ver",v);
  } catch(e){if(e.message!=="CACHE_BUST"){}}
})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}

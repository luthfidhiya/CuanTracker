import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const outfit = Outfit({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#020617",
};

export const metadata: Metadata = {
  title: "CuanTracker — Personal Finance Monitor",
  description:
    "Track your income, expenses and transfers across multiple wallets. Powered by Google Sheets.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CuanTracker",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={cn(outfit.className, "bg-slate-950 text-white antialiased")}
      >
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

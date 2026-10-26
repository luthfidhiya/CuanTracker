import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#0c0e11",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "CuanTracker",
  description: "Catat pemasukan, pengeluaran, dan transfer antar dompet. Data tersimpan di Google Sheets.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CuanTracker",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={`${outfit.className} antialiased`}>
        {children}
        <Toaster
          theme="dark"
          position="top-center"
          toastOptions={{
            style: {
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              color: "var(--color-fg)",
            },
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js'); }); }`,
          }}
        />
      </body>
    </html>
  );
}

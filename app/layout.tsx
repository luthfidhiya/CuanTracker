import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CuanTracker — Personal Finance Monitor",
  description:
    "Track your income, expenses and transfers across multiple wallets. Powered by Google Sheets.",
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
      </body>
    </html>
  );
}

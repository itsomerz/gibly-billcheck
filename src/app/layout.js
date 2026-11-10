import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ProvinceProvider } from "@/lib/ProvinceContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "BillZap",
  description: "Compare your energy rate against real offers and see how much you could save.",
  verification: {
    google: "Eh_HcLxZjM8BIoX6IVUfOp7nwml8mp5MJBmj42cT19w",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ProvinceProvider>{children}</ProvinceProvider>
        <Analytics />
      </body>
    </html>
  );
}

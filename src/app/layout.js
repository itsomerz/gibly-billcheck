import { Geist, Geist_Mono } from "next/font/google";
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
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ProvinceProvider>{children}</ProvinceProvider>
      </body>
    </html>
  );
}

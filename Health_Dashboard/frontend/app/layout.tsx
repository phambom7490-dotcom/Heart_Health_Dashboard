import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PCHD - Health Dashboard",
  description: "Personal Cardiovascular Health Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* Sử dụng class bg-pchd-gradient đã định nghĩa trong tailwind.config.ts */}
      <body style={{ background: "linear-gradient(135deg, #fcedea, #de3e26)" }} className="min-h-screen">
  {children}
</body>
    </html>
  );
}

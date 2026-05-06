import type { Metadata } from "next";
import { Suspense } from "react";
import { Kanit, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { UserProvider } from "./context/UserContext";
import OnboardingGuard from "./components/OnboardingGuard";
import RouteWarmup from "./components/RouteWarmup";
import SwalThemeInit from "./components/SwalThemeInit";
import QueuedToast from "./components/QueuedToast";

const noto = Noto_Sans_Thai({
  subsets: ["latin", "thai"],
  variable: "--font-noto",
  weight: ["400", "500", "600", "700"],
});

const kanit = Kanit({
  subsets: ["latin", "thai"],
  variable: "--font-kanit",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Pramool.in.th — ประมูลง่าย ได้ของชัวร์",
  description:
    "แพลตฟอร์มประมูลออนไลน์ ของดี ราคาดี เริ่มต้นเพียง 1 บาท ปลอดภัย โปร่งใส",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${noto.variable} ${kanit.variable} min-h-screen bg-surface-page font-sans text-slate-800 antialiased`}
      >
        <UserProvider>
          <SwalThemeInit />
          <QueuedToast />
          <RouteWarmup />
          <OnboardingGuard />
          <Suspense
            fallback={
              <header
                className="h-16 w-full border-b border-violet-100 bg-white/90"
                aria-hidden
              />
            }
          >
            <Navbar />
          </Suspense>
          {children}
        </UserProvider>
        <Footer />
      </body>
    </html>
  );
}

import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import BackendKeepalive from "@/components/BackendKeepalive";
import Navbar from "@/components/UI/Nav/Navbar";
import MobileBottomNav from "@/components/UI/Nav/MobileBottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Cookbook",
  description: "Welcome to my Cookbook. Built with Next.js & Django.",
};

export const viewport = {
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <BackendKeepalive />
          <div className="flex h-dvh max-h-dvh min-h-0 w-screen flex-col overflow-hidden bg-neutral-800">
            <Suspense
              fallback={
                <div className="h-14 w-full shrink-0 bg-neutral-800/40 backdrop-blur-xs" />
              }
            >
              <Navbar />
            </Suspense>
            <div className="min-h-0 flex-1 overflow-hidden lg:pt-14">
              {children}
            </div>
            <Suspense fallback={null}>
              <MobileBottomNav />
            </Suspense>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

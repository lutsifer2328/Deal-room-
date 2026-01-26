import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/authContext";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import RoleSwitcher from "@/components/debug/RoleSwitcher";
import { DataProvider } from "@/lib/store";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agenzia Deal Room",
  description: "Secure Real Estate Transaction Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-midnight`}
      >
        <AuthProvider>
          <DataProvider>
            <div className="flex h-screen overflow-hidden">
              <Sidebar />

              <div className="flex-1 flex flex-col ml-64 h-full relative z-0">
                <Navbar />
                <main className="flex-1 overflow-y-auto p-8">
                  {children}
                </main>
              </div>

              <RoleSwitcher />
            </div>
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

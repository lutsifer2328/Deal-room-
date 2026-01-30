import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/authContext";
import { DataProvider } from "@/lib/store";
import { LanguageProvider } from "@/lib/LanguageContext";
import ClientLayout from "@/components/layout/ClientLayout";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
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
        className={`${playfair.variable} ${dmSans.variable} antialiased text-text-main`}
      >
        <AuthProvider>
          <LanguageProvider>
            <DataProvider>
              <ClientLayout>
                {children}
              </ClientLayout>
            </DataProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

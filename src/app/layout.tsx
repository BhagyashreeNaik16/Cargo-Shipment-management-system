import type { Metadata } from 'next';
import './globals.css';
// Removed Leaflet CSS import
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Toaster } from "@/components/ui/toaster"


export const metadata: Metadata = {
  title: 'PICK PACK SERVICES',
  description: 'Manage and track your shipments efficiently with PICK PACK SERVICES.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Apply gradient background to the body */}
      <body className={`antialiased flex flex-col min-h-screen bg-gradient-to-br from-purple-200 via-purple-50 to-background dark:bg-gradient-to-br dark:from-purple-900 dark:via-purple-950 dark:to-background`}>
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}

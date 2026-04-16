import type { Metadata } from "next";
import "./globals.css";
import { RealtimeDashboardProvider } from '@/components/dashboard/shared/RealtimeDashboardProvider';

export const metadata: Metadata = {
  title: "Learno",
  description:
    "Learno - AI-supported smart classroom platform",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <RealtimeDashboardProvider>{children}</RealtimeDashboardProvider>
      </body>
    </html>
  );
}

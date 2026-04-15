import type { Metadata } from "next";
import "./globals.css";
import { RealtimeDashboardProvider } from '@/components/dashboard/shared/RealtimeDashboardProvider';

export const metadata: Metadata = {
  title: "Learno Teacher Dashboard",
  description:
    "Learno Teacher Portal - monitor student engagement, analytics, and classroom environment.",
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

"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Toaster } from "sonner";
import { StudentDashboardProvider } from "./StudentContext";
import { FloatingActionButton } from "./FloatingActionButton";
import { FloatingParticles } from "./FloatingParticles";
import { Sidebar } from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isLessonDetailRoute =
    pathname.startsWith("/student/lessons/") && pathname !== "/student/lessons";

  return (
    <StudentDashboardProvider>
      <div
        className="student-themed relative flex min-h-screen overflow-hidden"
        style={{
          "--student-sidebar-width": isLessonDetailRoute
            ? "0px"
            : undefined,
          background:
            "radial-gradient(circle at 10% 8%, rgba(var(--student-accent-rgb, 111 168 220), var(--student-accent-soft-opacity, 0.14)), transparent 42%), radial-gradient(circle at 92% 4%, rgba(var(--student-primary-rgb, 44 62 80), 0.12), transparent 34%), radial-gradient(circle at 50% 100%, rgba(var(--student-accent-rgb, 111 168 220), 0.05), transparent 40%), var(--color-bg)",
          color: "var(--color-text)",
          fontFamily: "var(--student-font-family, Inter, sans-serif)",
          transition:
            "background-color var(--student-motion-duration, 320ms) var(--student-motion-curve, ease), color var(--student-motion-duration, 320ms) var(--student-motion-curve, ease)",
        }}
      >
        <FloatingParticles />
        {!isLessonDetailRoute ? (
          <Sidebar
            mobileOpen={mobileSidebarOpen}
            onMobileClose={() => setMobileSidebarOpen(false)}
          />
        ) : null}

        {!isLessonDetailRoute ? (
          <div className="hidden md:block" style={{ width: "var(--student-sidebar-width, 240px)" }} />
        ) : null}

        <main
          className="relative z-10 flex-1 min-w-0"
          style={{
            filter: "var(--student-dashboard-filter, none)",
            fontSize: "calc(1rem * var(--student-font-scale, 1))",
            transition:
              "filter var(--student-motion-duration, 320ms) var(--student-motion-curve, ease), font-size var(--student-motion-duration, 320ms) var(--student-motion-curve, ease)",
          }}
        >
          {!isLessonDetailRoute ? (
            <header
              className="sticky top-0 z-20 flex items-center gap-3 border-b px-4 py-3 md:hidden"
              style={{
                background: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(10px)",
                borderColor: "var(--color-border)",
              }}
            >
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg"
                style={{
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                  color: "var(--color-primary)",
                }}
                aria-label="Open navigation menu"
              >
                <Menu size={18} />
              </button>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                Learno
              </p>
            </header>
          ) : null}

          {!isLessonDetailRoute ? (
            <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
          ) : (
            <div className="min-h-screen">{children}</div>
          )}
        </main>

        {!isLessonDetailRoute ? <FloatingActionButton /> : null}

        <Toaster
          richColors
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: "0.75rem",
              fontFamily: "var(--student-font-family, Inter, sans-serif)",
              fontWeight: 600,
            },
          }}
        />
      </div>
    </StudentDashboardProvider>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Brain,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Settings,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import { authApi } from "@/lib/api";
import { useStudentDashboardContext } from "./StudentContext";

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const streakDays = ["M", "T", "W", "T", "F", "S", "S"];

const navItems = [
  { href: "/student", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/student/lessons", icon: BookOpen, label: "My Lessons", exact: false },
  { href: "/student/progress", icon: TrendingUp, label: "Progress", exact: false },
  { href: "/student/neuro-tests", icon: Brain, label: "Neuro Tests", exact: false },
];

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { xp } = useStudentDashboardContext();

  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--student-sidebar-width",
      collapsed ? "70px" : "240px",
    );

    return () => {
      document.documentElement.style.removeProperty("--student-sidebar-width");
    };
  }, [collapsed]);

  const currentStreak = Math.max(0, xp.currentStreak ?? 0);
  const currentLevel = Math.max(1, xp.currentLevel ?? 1);
  const currentXP = Math.max(0, xp.totalXP ?? 0);
  const xpToNext = Math.max(0, xp.xpToNextLevel ?? 120);
  const levelStep = Math.max(1, Math.round((currentXP + xpToNext) / currentLevel));
  const xpIntoLevel = Math.max(0, currentXP - levelStep * (currentLevel - 1));

  const xpProgress = useMemo(() => {
    if (levelStep <= 0) {
      return 0;
    }

    return Math.max(0, Math.min(100, Math.round((xpIntoLevel / levelStep) * 100)));
  }, [levelStep, xpIntoLevel]);

  const isActive = (href: string, exact: boolean) => {
    if (exact) {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore API error and continue logout navigation
    }

    closeMobileSidebar();
    router.push("/login");
  };

  const closeMobileSidebar = () => {
    onMobileClose?.();
  };

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          onClick={closeMobileSidebar}
          className="fixed inset-0 z-30 bg-black/35 md:hidden"
          aria-label="Close menu overlay"
        />
      ) : null}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen shrink-0 flex-col transition-all duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:z-30 md:flex md:translate-x-0`}
        style={{
          width: collapsed ? 70 : 240,
          background: "var(--color-surface)",
          borderRight: "var(--student-card-border-width, 1px) solid var(--color-border)",
          boxShadow: "var(--student-card-shadow)",
          transition:
            "width var(--student-motion-duration, 320ms) var(--student-motion-curve, ease), background var(--student-motion-duration, 320ms) var(--student-motion-curve, ease)",
        }}
      >
      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full shadow-md transition-all"
        style={{
          background: "var(--color-surface)",
          border: "var(--student-card-border-width, 1px) solid var(--color-border)",
          color: "var(--color-primary)",
          transition:
            "transform var(--student-motion-duration, 320ms) var(--student-motion-curve, ease), background var(--student-motion-duration, 320ms) var(--student-motion-curve, ease)",
        }}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      <div
        className="flex items-center gap-3 px-4 py-5"
        style={{ borderBottom: "var(--student-card-border-width, 1px) solid var(--color-border)" }}
      >
        <div className="relative h-9 w-9 shrink-0">
          <Image
            src="/logo/logo.png"
            alt="Learno Logo"
            fill
            className="object-contain"
            unoptimized
          />
        </div>

        {!collapsed ? (
          <div className="flex min-w-0 flex-col">
            <span className="text-lg font-bold tracking-tight" style={{ color: "var(--color-text)" }}>
              Learno
            </span>
          </div>
        ) : null}
      </div>

      <nav className="mt-2 flex flex-1 flex-col gap-1 p-3">
        {navItems.map(({ href, icon: Icon, label, exact }) => {
          const active = isActive(href, exact);

          return (
              <Link
                key={href}
                href={href}
                onClick={closeMobileSidebar}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
                  active ? "shadow-sm" : "hover:opacity-80"
                }`}
              style={{
                background: active
                  ? "rgba(var(--student-accent-rgb, 111 168 220), var(--student-accent-soft-opacity, 0.12))"
                  : "transparent",
                color: active ? "var(--color-primary)" : "var(--color-text)",
                fontWeight: active ? 600 : 400,
                borderRadius: "var(--student-card-radius, 16px)",
                transition:
                  "background var(--student-motion-duration, 320ms) var(--student-motion-curve, ease), color var(--student-motion-duration, 320ms) var(--student-motion-curve, ease)",
              }}
            >
              <Icon size={18} className="shrink-0" style={{ color: active ? "var(--color-primary)" : "var(--color-text-muted)" }} />
              {!collapsed ? <span className="text-sm">{label}</span> : null}
            </Link>
          );
        })}
      </nav>

      {!collapsed ? (
        <div className="px-3 pb-3">
          <div
            className="rounded-xl p-4"
            style={{
              background:
                "linear-gradient(155deg, var(--student-card-gradient-a, rgba(59,130,246,0.1)) 0%, var(--student-card-gradient-b, rgba(30,58,138,0.06)) 100%), var(--color-surface)",
              border: "var(--student-card-border-width, 1px) solid var(--color-border)",
              borderRadius: "var(--student-card-radius, 16px)",
            }}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="text-base">🔥</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  {currentStreak}-day streak!
                </p>
                <p className="text-xs" style={{ color: "var(--color-accent)" }}>
                  Keep it up 🚀
                </p>
              </div>
            </div>

            <div className="flex gap-1">
              {streakDays.map((day, index) => (
                <div key={day + index} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="h-1.5 w-full rounded-full"
                    style={{
                      background:
                        index < currentStreak
                          ? "var(--color-accent)"
                          : "rgba(var(--student-primary-rgb, 44 62 80), 0.12)",
                    }}
                  />
                  <span
                    className="text-[9px] font-medium"
                    style={{
                      color:
                        index < currentStreak
                          ? "var(--color-accent)"
                          : "rgba(var(--student-primary-rgb, 44 62 80), 0.4)",
                    }}
                  >
                    {day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="mt-2 rounded-xl p-4"
            style={{
              background:
                "linear-gradient(155deg, var(--student-card-gradient-a, rgba(59,130,246,0.1)) 0%, var(--student-card-gradient-b, rgba(30,58,138,0.06)) 100%), var(--color-surface)",
              border: "var(--student-card-border-width, 1px) solid var(--color-border)",
              borderRadius: "var(--student-card-radius, 16px)",
            }}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Zap size={14} style={{ color: "var(--color-accent)" }} />
                <span className="text-xs font-semibold" style={{ color: "var(--color-text)" }}>
                  Level {currentLevel}
                </span>
              </div>
              <span className="text-xs" style={{ color: "var(--color-accent)" }}>
                {xpIntoLevel} / {levelStep} XP
              </span>
            </div>

            <div
              className="h-2 w-full rounded-full"
              style={{ background: "rgba(var(--student-primary-rgb, 44 62 80), 0.12)" }}
            >
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${xpProgress}%`,
                  background: "linear-gradient(90deg, var(--color-accent), var(--color-primary))",
                }}
              />
            </div>
          </div>
        </div>
      ) : null}

      <div
        className="flex flex-col gap-1 p-3"
        style={{ borderTop: "var(--student-card-border-width, 1px) solid var(--color-border)" }}
      >
        <Link
          href="/student/settings"
          onClick={closeMobileSidebar}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 transition-opacity ${
            pathname.startsWith("/student/settings") ? "shadow-sm" : "hover:opacity-80"
          }`}
          style={{
            background: pathname.startsWith("/student/settings")
              ? "var(--color-surface)"
              : "transparent",
            color: pathname.startsWith("/student/settings")
              ? "var(--color-accent)"
              : "var(--color-text)",
            fontWeight: pathname.startsWith("/student/settings") ? 600 : 400,
            borderRadius: "var(--student-card-radius, 16px)",
          }}
        >
          <Settings size={18} className="shrink-0" />
          {!collapsed ? <span className="text-sm">Settings</span> : null}
        </Link>

        <button
          type="button"
          onClick={() => void handleLogout()}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-opacity hover:opacity-70"
          style={{
            color: "var(--color-text)",
            borderRadius: "var(--student-card-radius, 16px)",
          }}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed ? <span className="text-sm">Log out</span> : null}
        </button>
      </div>
    </aside>
    </>
  );
}

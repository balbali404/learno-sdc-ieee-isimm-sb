"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Brain, Plus, Settings, Target, X } from "lucide-react";

const actions = [
  { href: "/student/lessons", label: "My Lessons", icon: BookOpen },
  { href: "/student/quizzes", label: "Brain Challenge", icon: Brain },
  { href: "/student/progress", label: "Progress", icon: Target },
  { href: "/student/settings", label: "Settings", icon: Settings },
];

export function FloatingActionButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname.startsWith("/student/focus")) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {open ? (
        <div className="mb-1 flex flex-col items-end gap-2">
          {actions.map(({ href, label, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-lg transition-transform hover:scale-105"
              style={{
                background: "var(--color-surface)",
                color: "var(--color-text)",
                border: "1px solid var(--color-border)",
              }}
            >
              <Icon size={15} style={{ color: "var(--color-accent)" }} />
              {label}
            </Link>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-[52px] w-[52px] items-center justify-center rounded-full shadow-xl transition-transform hover:scale-105"
        style={{
          background:
            "linear-gradient(135deg, var(--color-accent), var(--color-highlight))",
        }}
      >
        {open ? <X size={20} color="white" /> : <Plus size={22} color="white" />}
      </button>
    </div>
  );
}

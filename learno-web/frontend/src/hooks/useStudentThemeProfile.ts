"use client";

import { useMemo } from "react";
import { useStudentCondition } from "@/hooks/useStudentCondition";
import { getStudentThemeProfile } from "@/lib/studentThemeProfile";

export function useStudentThemeProfile() {
  const condition = useStudentCondition();

  const profile = useMemo(() => {
    return getStudentThemeProfile(condition);
  }, [condition]);

  return { condition, profile };
}

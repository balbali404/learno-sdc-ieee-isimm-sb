"use client";

import { useEffect, useState } from "react";
import type { Condition } from "@/lib/themes";

const isCondition = (value: string): value is Condition => {
  return (
    value === "default" ||
    value === "adhd" ||
    value === "asd" ||
    value === "dyslexia" ||
    value === "dyscalculia" ||
    value === "anxiety" ||
    value === "depression"
  );
};

const readStudentCondition = (): Condition => {
  if (typeof document === "undefined") {
    return "default";
  }

  const raw = document.documentElement.getAttribute("data-student-condition") ?? "default";
  return isCondition(raw) ? raw : "default";
};

export function useStudentCondition(): Condition {
  const [condition, setCondition] = useState<Condition>(readStudentCondition);

  useEffect(() => {
    const updateCondition = () => {
      setCondition(readStudentCondition());
    };

    updateCondition();

    const observer = new MutationObserver(updateCondition);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-student-condition"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return condition;
}

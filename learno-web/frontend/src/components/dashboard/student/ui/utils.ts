import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const NUMBER_FORMATTER = new Intl.NumberFormat("en-US");

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number) {
  return NUMBER_FORMATTER.format(value);
}

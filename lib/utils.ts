import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function formatWithCommas(value: string | number) {
  if (value === undefined || value === null || value === "") return ""
  const num = typeof value === "string" ? value.replace(/,/g, "") : value.toString()
  if (isNaN(Number(num))) return value.toString()

  const parts = num.split(".")
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return parts.join(".")
}

export function parseCommas(value: string) {
  return value.replace(/,/g, "")
}

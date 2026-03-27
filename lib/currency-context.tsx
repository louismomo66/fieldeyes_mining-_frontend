"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

type CurrencyCode = "UGX" | "USD" | "EUR" | "GBP" | "KES" | "TZS" | "RWF"

interface CurrencyContextType {
  currency: CurrencyCode
  setCurrency: (code: CurrencyCode) => void
  formatCurrency: (amount: number) => string
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

const CURRENCY_CONFIG: Record<CurrencyCode, { locale: string; symbol: string; name: string }> = {
  UGX: { locale: "en-UG", symbol: "UGX", name: "Ugandan Shilling" },
  USD: { locale: "en-US", symbol: "$", name: "US Dollar" },
  EUR: { locale: "de-DE", symbol: "€", name: "Euro" },
  GBP: { locale: "en-GB", symbol: "£", name: "British Pound" },
  KES: { locale: "en-KE", symbol: "KSh", name: "Kenyan Shilling" },
  TZS: { locale: "en-TZ", symbol: "TSh", name: "Tanzanian Shilling" },
  RWF: { locale: "en-RW", symbol: "RF", name: "Rwandan Franc" },
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("UGX")

  // Load from localStorage on mount
  useEffect(() => {
    const savedCurrency = localStorage.getItem("app_currency") as CurrencyCode
    if (savedCurrency && CURRENCY_CONFIG[savedCurrency]) {
      setCurrencyState(savedCurrency)
    }
  }, [])

  const setCurrency = useCallback((code: CurrencyCode) => {
    setCurrencyState(code)
    localStorage.setItem("app_currency", code)
  }, [])

  const formatCurrency = useCallback(
    (amount: number) => {
      const config = CURRENCY_CONFIG[currency]
      return new Intl.NumberFormat(config.locale, {
        style: "currency",
        currency: currency,
        minimumFractionDigits: currency === "UGX" ? 0 : 2,
        maximumFractionDigits: currency === "UGX" ? 0 : 2,
      }).format(amount)
    },
    [currency]
  )

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider")
  }
  return context
}

export const SUPPORTED_CURRENCIES = Object.entries(CURRENCY_CONFIG).map(([code, config]) => ({
  code: code as CurrencyCode,
  name: config.name,
  symbol: config.symbol,
}))

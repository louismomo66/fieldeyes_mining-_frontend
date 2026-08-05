import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: "Mine Manager",
  description: "Comprehensive management for mining operations",
  generator: "v0.app",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
}

import { SyncIndicator } from "@/components/sync-indicator"
import { CurrencyProvider } from "@/lib/currency-context"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <AuthProvider>
          <CurrencyProvider>
            {children}
            {/* Two toast systems are in use: the Radix one via use-toast (dialogs,
                reports) and sonner (the compliance, lots, inventory, income,
                expenses, mine-info and traceability pages). Both have to be
                mounted or one set of messages silently never renders. */}
            <Toaster />
            <SonnerToaster position="top-right" richColors closeButton />
            <SyncIndicator />
          </CurrencyProvider>
        </AuthProvider>
        {/* Vercel Analytics only serves /_vercel/insights/script.js on Vercel.
            On the CapRover deployment it 404s on every page load, so only mount
            it when the build actually happened on Vercel. */}
        {process.env.VERCEL ? <Analytics /> : null}
      </body>
    </html>
  )
}

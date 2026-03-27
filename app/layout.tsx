import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

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
            <Toaster />
            <SyncIndicator />
          </CurrencyProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}

"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Receipt,
  Package,
  BarChart3,
  FileText,
  Settings,
  Menu,
  LogOut,
  Shield,
  MapPin,
  Eye,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
}

const getNavigation = (isAdmin: boolean) => {
  if (isAdmin) {
    // Admin navigation - different from regular users
    return [
      { name: "Admin Dashboard", href: "/admin", icon: Eye },
      { name: "User Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Sales", href: "/income", icon: TrendingUp },
      { name: "Expenses", href: "/expenses", icon: TrendingDown },
      { name: "Production", href: "/inventory", icon: Package },
      { name: "Reports", href: "/reports", icon: FileText },
      { name: "Mine Site Info", href: "/mine-info", icon: MapPin },
      { name: "Settings", href: "/settings", icon: Settings },
    ]
  }
  // Regular user navigation
  return [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Sales", href: "/income", icon: TrendingUp },
    { name: "Expenses", href: "/expenses", icon: TrendingDown },
    { name: "Production", href: "/inventory", icon: Package },
    { name: "Reports", href: "/reports", icon: FileText },
    { name: "Mine Site Info", href: "/mine-info", icon: MapPin },
    { name: "Settings", href: "/settings", icon: Settings },
  ]
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Prefetch common routes to speed up navigation
  useEffect(() => {
    router.prefetch('/dashboard')
    router.prefetch('/income')
    router.prefetch('/inventory')
    router.prefetch('/reports')
    router.prefetch('/mine-info')
  }, [router])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-emerald-50/20 overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-white border-r border-stone-200 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-stone-200 px-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8">
                <Image
                  src="/logo.png"
                  alt="Mine Manager Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-xl font-bold text-stone-900">
                Mine Manager
              </h1>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden text-stone-700"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {getNavigation(user?.role === "admin")
              .map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    title={item.name}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md"
                        : "text-stone-700 hover:bg-stone-100"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
          </nav>

          {/* Footer */}
          <div className="border-t border-stone-200 p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start px-2 h-auto py-2 text-stone-700 hover:bg-stone-100">
                  <Avatar className="h-9 w-9 mr-3">
                    <AvatarFallback className="bg-gradient-to-br from-amber-600 to-amber-700 text-white text-sm">
                      {user ? getInitials(user.name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-stone-900">{user?.name}</p>
                    <p className="text-xs text-stone-600 flex items-center gap-1">
                      {user?.role === "admin" && <Shield className="h-3 w-3" />}
                      {user?.role === "admin" ? "Administrator" : "Standard User"}
                    </p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-stone-600 cursor-default">{user?.email}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex w-full items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center border-b border-stone-200 bg-white px-6">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="mr-4 lg:hidden"
          >
            <Menu className="h-6 w-6 text-stone-700" />
          </button>
          <h2 className="text-lg font-semibold text-stone-900">
            {getNavigation(user?.role === "admin").find((item) => item.href === pathname)?.name || "Dashboard"}
          </h2>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

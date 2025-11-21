"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { dataService } from "@/lib/data-service"

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Sales", href: "/income", icon: TrendingUp },
  { name: "Expenses", href: "/expenses", icon: TrendingDown },
  { name: "Production", href: "/inventory", icon: Package },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Mine Site Info", href: "/mine-info", icon: MapPin },
]

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMineInfoComplete, setIsMineInfoComplete] = useState<boolean | null>(null)
  const lastRedirectSourceRef = useRef<string | null>(null)
  const mineInfoWarning =
    "Please complete your mine site information before accessing the rest of the application."
  const checkMineInfoCompletion = useCallback(async () => {
    if (!user) {
      setIsMineInfoComplete(null)
      return
    }

    try {
      const info = await dataService.getMineSiteInfo()
      const isComplete = Boolean(info && info.owner && info.location)
      setIsMineInfoComplete(isComplete)
    } catch (error) {
      console.error("Failed to verify mine site information completion status:", error)
      setIsMineInfoComplete(false)
    }
  }, [user])

  // Prefetch common routes to speed up navigation
  useEffect(() => {
    router.prefetch('/dashboard')
    router.prefetch('/income')
    router.prefetch('/inventory')
    router.prefetch('/reports')
    router.prefetch('/mine-info')
  }, [router])

  useEffect(() => {
    if (user) {
      checkMineInfoCompletion()
    } else {
      setIsMineInfoComplete(null)
    }
  }, [user, pathname, checkMineInfoCompletion])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const handleMineInfoUpdated = () => {
      if (user) {
        checkMineInfoCompletion()
      }
    }

    window.addEventListener("mineInfoUpdated", handleMineInfoUpdated)
    return () => {
      window.removeEventListener("mineInfoUpdated", handleMineInfoUpdated)
    }
  }, [checkMineInfoCompletion, user])

  useEffect(() => {
    if (!user || isMineInfoComplete !== false) {
      lastRedirectSourceRef.current = null
      return
    }

    if (pathname !== "/mine-info" && lastRedirectSourceRef.current !== pathname) {
      lastRedirectSourceRef.current = pathname
      toast.warning(mineInfoWarning)
      router.replace("/mine-info")
    }
  }, [isMineInfoComplete, pathname, router, user, mineInfoWarning])

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

  const isNavigationRestricted = isMineInfoComplete === false

  const handleNavClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    isRestricted: boolean,
  ) => {
    if (isRestricted) {
      event.preventDefault()
      toast.warning(mineInfoWarning)
      router.push("/mine-info")
      setMobileMenuOpen(false)
      return
    }

    setMobileMenuOpen(false)
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
              <div className="w-10 h-10">
                <Image
                  src="/logo.png"
                  alt="Mine Manager Logo"
                  width={40}
                  height={40}
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
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const isRestricted = isNavigationRestricted && item.href !== "/mine-info"
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(event) => handleNavClick(event, item.href, isRestricted)}
                  title={isRestricted ? `${item.name} (locked until mine site info is complete)` : item.name}
                  aria-disabled={isRestricted}
                  tabIndex={isRestricted ? -1 : 0}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md"
                      : "text-stone-700 hover:bg-stone-100",
                    isRestricted && !isActive && "cursor-not-allowed opacity-60",
                    isRestricted && isActive && "cursor-not-allowed"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="flex-1">{item.name}</span>
                  {isNavigationRestricted && item.href === "/mine-info" && (
                    <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      Required
                    </span>
                  )}
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
                <DropdownMenuItem className="text-stone-600">{user?.email}</DropdownMenuItem>
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
            {navigation.find((item) => item.href === pathname)?.name || "Dashboard"}
          </h2>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {isNavigationRestricted && pathname !== "/mine-info" && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
              {mineInfoWarning}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}

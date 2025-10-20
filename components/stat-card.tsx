import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: string
    isPositive: boolean
  }
  variant?: "default" | "success" | "warning" | "danger"
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, variant = "default" }: StatCardProps) {
  const variantStyles = {
    default: "from-stone-600 to-stone-700",
    success: "from-emerald-600 to-emerald-700",
    warning: "from-amber-600 to-amber-700",
    danger: "from-red-600 to-red-700",
  }

  return (
    <Card className="border-stone-200 hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-stone-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-stone-900 mb-1">{value}</p>
            {subtitle && <p className="text-sm text-stone-600">{subtitle}</p>}
            {trend && (
              <div className="mt-2 flex items-center gap-1">
                <span className={cn("text-xs font-medium", trend.isPositive ? "text-emerald-600" : "text-red-600")}>
                  {trend.isPositive ? "↑" : "↓"} {trend.value}
                </span>
                <span className="text-xs text-stone-500">vs last month</span>
              </div>
            )}
          </div>
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-md",
              variantStyles[variant],
            )}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

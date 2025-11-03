"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Package } from "lucide-react"
import { dataService } from "@/lib/data-service"
import type { FinancialSummary, Income, Expense, InventoryItem } from "@/lib/types"

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null)
  const [incomes, setIncomes] = useState<Income[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const loadDashboardData = async () => {
      if (user) {
        try {
          setLoading(true)
          const [summary, incomesData, expensesData, inventoryData] = await Promise.all([
            dataService.getFinancialSummary(),
            dataService.getIncomes(),
            dataService.getExpenses(),
            dataService.getInventory()
          ])
          console.log("Dashboard - Financial Summary from backend:", summary)
          console.log("Dashboard - Incomes data:", incomesData)
          console.log("Dashboard - Expenses data:", expensesData)
          console.log("Dashboard - Inventory data:", inventoryData)
          setFinancialSummary(summary)
          setIncomes(incomesData)
          setExpenses(expensesData)
          setInventory(inventoryData)
        } catch (error) {
          console.error("Error loading dashboard data:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    loadDashboardData()
    
    // Refresh data when page becomes visible or when sales are updated
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        loadDashboardData()
      }
    }
    
    const handleSalesUpdate = () => {
      if (user) {
        loadDashboardData()
      }
    }

    const handleExpensesUpdate = () => {
      if (user) {
        loadDashboardData()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('salesUpdated', handleSalesUpdate)
    window.addEventListener('expensesUpdated', handleExpensesUpdate)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('salesUpdated', handleSalesUpdate)
      window.removeEventListener('expensesUpdated', handleExpensesUpdate)
    }
  }, [user])

  if (isLoading || !user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  // Use financial summary from API or default values
  const totalIncome = financialSummary?.totalIncome || 0
  const totalExpenses = financialSummary?.totalExpenses || 0
  const netProfit = financialSummary?.netProfit || 0
  const totalReceivables = financialSummary?.totalReceivables || 0
  const totalPayables = financialSummary?.totalPayables || 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Calculate stats from data
  const productionVolume = incomes.reduce((sum, inc) => sum + inc.quantity, 0)
  // Count unique active pits from production/inventory data
  const activePits = new Set(
    inventory
      .filter(item => item.from === "mine" && item.pitNumber)
      .map(item => item.pitNumber)
      .filter(Boolean)
  ).size || 0

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Dashboard</h1>
          <p className="text-stone-600">
            Overview of your mining operations - Your central hub for monitoring performance
          </p>
        </div>

        {/* Quick Actions */}
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <TrendingUp className="h-5 w-5 text-amber-700" />
              Quick Actions - Start Here
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <Link href="/income" className="group">
                <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white p-4 transition-all hover:border-amber-500 hover:shadow-md">
                  <DollarSign className="h-8 w-8 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-stone-900 group-hover:text-amber-700">Record a Sale</p>
                    <p className="text-xs text-stone-600">Track mineral sales and buyers</p>
                  </div>
                </div>
              </Link>
              <Link href="/inventory" className="group">
                <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white p-4 transition-all hover:border-amber-500 hover:shadow-md">
                  <Package className="h-8 w-8 text-amber-600" />
                  <div>
                    <p className="font-semibold text-stone-900 group-hover:text-amber-700">Add Production</p>
                    <p className="text-xs text-stone-600">Log output, pits, and processing</p>
                  </div>
                </div>
              </Link>
              <Link href="/expenses" className="group">
                <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white p-4 transition-all hover:border-amber-500 hover:shadow-md">
                  <TrendingDown className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="font-semibold text-stone-900 group-hover:text-amber-700">Record an Expense</p>
                    <p className="text-xs text-stone-600">Capture labour, fuel, and other costs</p>
                  </div>
                </div>
              </Link>
              <Link href="/reports" className="group">
                <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white p-4 transition-all hover:border-amber-500 hover:shadow-md">
                  <TrendingUp className="h-8 w-8 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-stone-900 group-hover:text-amber-700">View Reports</p>
                    <p className="text-xs text-stone-600">Generate financial reports</p>
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          <Card className="border-stone-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-stone-600">Total Sales</CardTitle>
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-stone-900">
                {formatCurrency(totalIncome)}
              </div>
              <p className="text-xs text-emerald-700 mt-1">
                +12.5% from last month
              </p>
            </CardContent>
          </Card>
          <Card className="border-stone-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-stone-600">Total Expenses</CardTitle>
              <TrendingDown className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-stone-900">
                {formatCurrency(totalExpenses)}
              </div>
              <p className="text-xs text-red-600 mt-1">
                Includes labor, fuel, maintenance, and other costs
              </p>
            </CardContent>
          </Card>
          <Card className="border-stone-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-stone-600">Net Profit</CardTitle>
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-stone-900">
                {formatCurrency(netProfit)}
              </div>
              <p className="text-xs text-emerald-700 mt-1">
                {netProfit > 0 ? "+" : ""}{((netProfit / (totalIncome || 1)) * 100).toFixed(1)}% margin
              </p>
            </CardContent>
          </Card>
          <Card className="border-stone-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-stone-600">Production Volume</CardTitle>
              <Package className="h-5 w-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-stone-900">
                {productionVolume.toLocaleString()} kg
              </div>
              <p className="text-xs text-emerald-700 mt-1">
                +8.2% from last month
              </p>
            </CardContent>
          </Card>
          <Card className="border-stone-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-stone-600">Active Pits</CardTitle>
              <TrendingUp className="h-5 w-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-stone-900">
                {activePits}
              </div>
              <p className="text-xs text-emerald-700 mt-1">
                +2 this month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle>Recent Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {incomes.slice(0, 3).map((income, i) => (
                  <div
                    key={income.id || i}
                    className="flex items-center justify-between border-b border-stone-200 pb-3 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-stone-900">{income.itemName || income.mineralType || "Mineral Sale"}</p>
                      <p className="text-sm text-stone-600">Pit {i + 1}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-stone-900">{formatCurrency(income.totalAmount)}</p>
                      <p className="text-sm text-stone-600">{income.quantity} {income.unit}</p>
                    </div>
                  </div>
                ))}
                {incomes.length === 0 && (
                  <p className="text-center text-stone-500 py-4">No sales records yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle>Production Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from(new Set(incomes.map(i => i.mineralType))).slice(0, 3).map((mineral, i) => {
                  const mineralIncomes = incomes.filter(inc => inc.mineralType === mineral)
                  const totalQty = mineralIncomes.reduce((sum, inc) => sum + inc.quantity, 0)
                  return (
                    <div
                      key={mineral}
                      className="flex items-center justify-between border-b border-stone-200 pb-3 last:border-0"
                    >
                      <div>
                        <p className="font-medium text-stone-900">{mineral.charAt(0).toUpperCase() + mineral.slice(1)}</p>
                        <p className="text-sm text-stone-600">This month</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-stone-900">
                          {totalQty.toLocaleString()} kg
                        </p>
                        <p className="text-sm text-emerald-700">
                          +{Math.floor(Math.random() * 20 + 5)}%
                        </p>
                      </div>
                    </div>
                  )
                })}
                {incomes.length === 0 && (
                  <p className="text-center text-stone-500 py-4">No production data yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

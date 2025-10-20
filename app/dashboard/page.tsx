"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StatCard } from "@/components/stat-card"
import { RecentTransactions } from "@/components/recent-transactions"
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from "lucide-react"
import { dataService } from "@/lib/data-service"
import type { FinancialSummary, Income, Expense } from "@/lib/types"

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null)
  const [incomes, setIncomes] = useState<Income[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
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
          const [summary, incomesData, expensesData] = await Promise.all([
            dataService.getFinancialSummary(),
            dataService.getIncomes(),
            dataService.getExpenses()
          ])
          console.log("Dashboard - Financial Summary from backend:", summary)
          console.log("Dashboard - Incomes data:", incomesData)
          console.log("Dashboard - Expenses data:", expensesData)
          setFinancialSummary(summary)
          setIncomes(incomesData)
          setExpenses(expensesData)
        } catch (error) {
          console.error("Error loading dashboard data:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    loadDashboardData()
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Dashboard</h1>
          <p className="text-stone-600">Welcome back, {user.name}. Here's your financial overview.</p>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Total Income"
            value={formatCurrency(totalIncome)}
            subtitle="Money received"
            icon={TrendingUp}
            variant="success"
            trend={{ value: "12.5%", isPositive: true }}
          />
          <StatCard
            title="Total Expenses"
            value={formatCurrency(totalExpenses)}
            subtitle="Money spent"
            icon={TrendingDown}
            variant="danger"
            trend={{ value: "8.2%", isPositive: false }}
          />
          <StatCard
            title="Net Profit"
            value={formatCurrency(netProfit)}
            subtitle="Income - Expenses"
            icon={DollarSign}
            variant="default"
            trend={{ value: "18.7%", isPositive: true }}
          />
        </div>

        {/* Updated grid to show only Receivables and Payables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StatCard
            title="Receivables"
            value={formatCurrency(totalReceivables)}
            subtitle="Amount to collect"
            icon={AlertCircle}
            variant="warning"
          />
          <StatCard
            title="Payables"
            value={formatCurrency(totalPayables)}
            subtitle="Amount to pay"
            icon={AlertCircle}
            variant="warning"
          />
        </div>

        {/* Recent Transactions */}
        <RecentTransactions incomes={incomes} expenses={expenses} />
      </div>
    </DashboardLayout>
  )
}

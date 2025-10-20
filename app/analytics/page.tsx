"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { dataService } from "@/lib/data-service"
import { TrendingUp, TrendingDown, DollarSign, PieChart } from "lucide-react"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart as RePieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export default function AnalyticsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Calculate totals (using empty arrays for now - will be replaced with real data)
  const totalIncome = 0 // mockIncomes.reduce((sum, income) => sum + income.totalAmount, 0)
  const totalExpenses = 0 // mockExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const netProfit = totalIncome - totalExpenses
  const profitMargin = ((netProfit / totalIncome) * 100).toFixed(1)

  // Income by mineral type (using empty array for now)
  const incomeByMineral: { name: string; value: number }[] = []

  // Expenses by category (using empty array for now)
  const expensesByCategory: { name: string; value: number }[] = []

  // Payment status breakdown (using empty data for now)
  const paymentStatusData = [
    {
      name: "Paid",
      income: 0,
      expenses: 0,
    },
    {
      name: "Partial",
      income: 0,
      expenses: 0,
    },
    {
      name: "Unpaid",
      income: 0,
      expenses: 0,
    },
  ]

  const COLORS = ["#059669", "#d97706", "#dc2626", "#0891b2", "#7c3aed"]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Analytics Dashboard</h1>
          <p className="text-stone-600">Financial insights and performance metrics</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-stone-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-stone-600">Total Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-700">{formatCurrency(totalIncome)}</div>
            </CardContent>
          </Card>

          <Card className="border-stone-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-stone-600">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">{formatCurrency(totalExpenses)}</div>
            </CardContent>
          </Card>

          <Card className="border-stone-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-stone-600">Net Profit</CardTitle>
              <DollarSign className="h-4 w-4 text-stone-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-stone-900">{formatCurrency(netProfit)}</div>
            </CardContent>
          </Card>

          <Card className="border-stone-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-stone-600">Profit Margin</CardTitle>
              <PieChart className="h-4 w-4 text-stone-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-stone-900">{profitMargin}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trends */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle>Monthly Financial Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                income: {
                  label: "Income",
                  color: "hsl(var(--chart-1))",
                },
                expenses: {
                  label: "Expenses",
                  color: "hsl(var(--chart-3))",
                },
                profit: {
                  label: "Profit",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[400px] w-full min-w-0"
            >
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={400}>
                <LineChart data={[]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="month" stroke="#78716c" />
                  <YAxis stroke="#78716c" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#059669" strokeWidth={2} name="Income" />
                  <Line type="monotone" dataKey="expenses" stroke="#dc2626" strokeWidth={2} name="Expenses" />
                  <Line type="monotone" dataKey="profit" stroke="#d97706" strokeWidth={2} name="Profit" />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Income and Expense Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income by Mineral */}
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle>Income by Mineral Type</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  value: {
                    label: "Amount",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px] w-full min-w-0"
              >
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
                  <RePieChart>
                    <Pie
                      data={incomeByMineral}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {incomeByMineral.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <div className="grid grid-cols-2 gap-2">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  {payload[0].name}
                                </span>
                                <span className="font-bold text-right">
                                  {formatCurrency(payload[0].value as number)}
                                </span>
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Expenses by Category */}
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle>Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  value: {
                    label: "Amount",
                    color: "hsl(var(--chart-3))",
                  },
                }}
                className="h-[300px] w-full min-w-0"
              >
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
                  <BarChart data={expensesByCategory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                    <XAxis dataKey="name" stroke="#78716c" />
                    <YAxis stroke="#78716c" tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <div className="grid grid-cols-2 gap-2">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  {payload[0].payload.name}
                                </span>
                                <span className="font-bold text-right">
                                  {formatCurrency(payload[0].value as number)}
                                </span>
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar dataKey="value" fill="#dc2626" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Payment Status Analysis */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle>Payment Status Analysis</CardTitle>
          </CardHeader>
          <CardContent>
              <ChartContainer
                config={{
                  income: {
                    label: "Income",
                    color: "hsl(var(--chart-1))",
                  },
                  expenses: {
                    label: "Expenses",
                    color: "hsl(var(--chart-3))",
                  },
                }}
                className="h-[300px] w-full min-w-0"
              >
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
                <BarChart data={paymentStatusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="name" stroke="#78716c" />
                  <YAxis stroke="#78716c" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="income" fill="#059669" radius={[8, 8, 0, 0]} name="Income" />
                  <Bar dataKey="expenses" fill="#dc2626" radius={[8, 8, 0, 0]} name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-stone-200 bg-emerald-50">
            <CardHeader>
              <CardTitle className="text-sm text-emerald-900">Top Revenue Source</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-700 capitalize">
                {incomeByMineral.sort((a, b) => b.value - a.value)[0]?.name || "N/A"}
              </p>
              <p className="text-sm text-emerald-700 mt-1">
                {formatCurrency(incomeByMineral.sort((a, b) => b.value - a.value)[0]?.value || 0)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-stone-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-sm text-red-900">Highest Expense</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-700 capitalize">
                {expensesByCategory.sort((a, b) => b.value - a.value)[0]?.name || "N/A"}
              </p>
              <p className="text-sm text-red-700 mt-1">
                {formatCurrency(expensesByCategory.sort((a, b) => b.value - a.value)[0]?.value || 0)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-stone-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-sm text-amber-900">Outstanding Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-700">
                0
              </p>
              <p className="text-sm text-amber-700 mt-1">Transactions pending</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

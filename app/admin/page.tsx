"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Users, Shield, TrendingUp, TrendingDown, BarChart3, Eye, FileText, Activity, DollarSign } from "lucide-react"
import { dataService } from "@/lib/data-service"
import { useToast } from "@/hooks/use-toast"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface UserCategory {
  user: {
    id: number
    email: string
    name: string
    phone?: string
    role: string
    created_at: string
  }
  category: string
  serial_number: string
}

interface SystemStats {
  total_users: number
  total_miners: number
  total_buyers: number
  total_sellers: number
  total_income: number
  total_expenses: number
  total_profit: number
  total_production: number
  total_receivables: number
  total_payables: number
  active_users: number
}

interface MonthlyTrend {
  month: string
  income: number
  expenses: number
  profit: number
  users: number
  production: number
}

interface CategoryBreakdown {
  category: string
  amount: number
  count: number
  percentage: number
}

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4']

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserCategory[]>([])
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [trends, setTrends] = useState<MonthlyTrend[]>([])
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedUser, setSelectedUser] = useState<UserCategory | null>(null)
  const [userDetailsOpen, setUserDetailsOpen] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
      return
    }

    if (!authLoading && user && user.role !== "admin") {
      router.push("/dashboard")
      toast({
        title: "Access Denied",
        description: "Admin access required",
        variant: "destructive",
      })
      return
    }

    if (user && user.role === "admin") {
      loadAllData()
    }
  }, [user, authLoading, router, toast, selectedYear])

  const loadAllData = async () => {
    try {
      setLoading(true)
      const [usersData, stats, trendsData, breakdown] = await Promise.all([
        dataService.getAllUsers(),
        dataService.getSystemStats(),
        dataService.getSystemTrends(selectedYear),
        dataService.getSystemCategoryBreakdown(),
      ])
      setUsers(usersData)
      setSystemStats(stats)
      setTrends(trendsData)
      setCategoryBreakdown(breakdown)
    } catch (error) {
      console.error("Error loading admin data:", error)
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    )
  }

  if (!user || user.role !== "admin") {
    return null
  }

  const miners = users.filter(u => u.category === "miner")
  const buyers = users.filter(u => u.category === "buyer")
  const sellers = users.filter(u => u.category === "seller")
  const unknown = users.filter(u => u.category === "unknown")

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "miner":
        return "bg-amber-100 text-amber-700 border-amber-200"
      case "buyer":
        return "bg-emerald-100 text-emerald-700 border-emerald-200"
      case "seller":
        return "bg-blue-100 text-blue-700 border-blue-200"
      default:
        return "bg-stone-100 text-stone-700 border-stone-200"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Prepare chart data
  const trendsChartData = trends.map(t => ({
    month: new Date(t.month + "-01").toLocaleDateString("en-US", { month: "short" }),
    Income: t.income,
    Expenses: t.expenses,
    Profit: t.profit,
    Users: t.users,
    Production: t.production,
  }))

  const categoryChartData = categoryBreakdown.map(c => ({
    name: c.category.charAt(0).toUpperCase() + c.category.slice(1),
    value: c.amount,
    count: c.count,
    percentage: c.percentage,
  }))

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-lg border-l-4 border-purple-600 bg-gradient-to-r from-purple-50 to-indigo-50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Eye className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-stone-900">Admin Dashboard</h1>
                <p className="text-stone-600 mt-1">
                  System overview and control
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200 px-4 py-2">
              <Shield className="h-4 w-4 mr-2" />
              Administrator
            </Badge>
          </div>
        </div>

        {/* System Stats Cards */}
        {systemStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-stone-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-stone-600 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  Total Income
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-emerald-700">{formatCurrency(systemStats.total_income)}</p>
                <p className="text-xs text-stone-600 mt-1">Across all users</p>
              </CardContent>
            </Card>
            <Card className="border-stone-200 bg-gradient-to-br from-red-50 to-red-100/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-stone-600 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  Total Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-700">{formatCurrency(systemStats.total_expenses)}</p>
                <p className="text-xs text-stone-600 mt-1">Across all users</p>
              </CardContent>
            </Card>
            <Card className="border-stone-200 bg-gradient-to-br from-blue-50 to-blue-100/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-stone-600 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  Net Profit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-700">{formatCurrency(systemStats.total_profit)}</p>
                <p className="text-xs text-stone-600 mt-1">
                  {systemStats.total_income > 0
                    ? `${((systemStats.total_profit / systemStats.total_income) * 100).toFixed(1)}% margin`
                    : "0% margin"}
                </p>
              </CardContent>
            </Card>
            <Card className="border-stone-200 bg-gradient-to-br from-amber-50 to-amber-100/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-stone-600 flex items-center gap-2">
                  <Users className="h-4 w-4 text-amber-600" />
                  Active Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-700">{systemStats.active_users}</p>
                <p className="text-xs text-stone-600 mt-1">of {systemStats.total_users} total</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Trends
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-stone-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-stone-600">User Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-stone-600">Miners</span>
                      <Badge className="bg-amber-100 text-amber-700">{miners.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-stone-600">Buyers</span>
                      <Badge className="bg-emerald-100 text-emerald-700">{buyers.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-stone-600">Sellers</span>
                      <Badge className="bg-blue-100 text-blue-700">{sellers.length}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {systemStats && (
                <>
                  <Card className="border-stone-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-stone-600">Financial Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-stone-600">Receivables</span>
                          <span className="font-semibold text-amber-700">{formatCurrency(systemStats.total_receivables)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-stone-600">Payables</span>
                          <span className="font-semibold text-red-700">{formatCurrency(systemStats.total_payables)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-stone-600">Production</span>
                          <span className="font-semibold text-blue-700">{systemStats.total_production.toLocaleString()} units</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-stone-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-stone-600">System Health</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-stone-600">Total Users</span>
                          <span className="font-semibold">{systemStats.total_users}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-stone-600">Active Users</span>
                          <span className="font-semibold text-emerald-700">{systemStats.active_users}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-stone-600">Engagement</span>
                          <span className="font-semibold">
                            {systemStats.total_users > 0
                              ? `${((systemStats.active_users / systemStats.total_users) * 100).toFixed(1)}%`
                              : "0%"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="border-stone-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  All Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <p className="text-center text-stone-500 py-8">No users found</p>
                ) : (
                  <div className="rounded-md border border-stone-200 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-stone-200 bg-stone-50">
                          <th className="p-3 text-left font-medium text-stone-900">Serial Number</th>
                          <th className="p-3 text-left font-medium text-stone-900">Name</th>
                          <th className="p-3 text-left font-medium text-stone-900">Email</th>
                          <th className="p-3 text-left font-medium text-stone-900">Phone</th>
                          <th className="p-3 text-left font-medium text-stone-900">Category</th>
                          <th className="p-3 text-left font-medium text-stone-900">Role</th>
                          <th className="p-3 text-left font-medium text-stone-900">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((userCategory, index) => (
                          <tr
                            key={`user-${userCategory.user.id}-${index}`}
                            className="border-b border-stone-200 last:border-0 cursor-pointer hover:bg-stone-100 transition-colors"
                            onClick={() => {
                              setSelectedUser(userCategory)
                              setUserDetailsOpen(true)
                            }}
                          >
                            <td className="p-3 text-stone-700 font-mono font-semibold whitespace-nowrap">{userCategory.serial_number || "-"}</td>
                            <td className="p-3 text-stone-700 font-medium whitespace-nowrap">{userCategory.user.name}</td>
                            <td className="p-3 text-stone-700 whitespace-nowrap">{userCategory.user.email}</td>
                            <td className="p-3 text-stone-700 whitespace-nowrap">{userCategory.user.phone || "-"}</td>
                            <td className="p-3 whitespace-nowrap">
                              <Badge variant="outline" className={getCategoryColor(userCategory.category)}>
                                {userCategory.category}
                              </Badge>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <Badge variant="outline" className={userCategory.user.role === "admin" ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-stone-100 text-stone-700 border-stone-200"}>
                                {userCategory.user.role}
                              </Badge>
                            </td>
                            <td className="p-3 text-stone-600 text-xs whitespace-nowrap">
                              {new Date(userCategory.user.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Breakdown Bar Chart */}
              <Card className="border-stone-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Expense Category Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {categoryChartData.length > 0 ? (
                    <ChartContainer
                      config={{
                        amount: { label: "Amount (UGX)", color: "hsl(var(--chart-1))" },
                      }}
                      className="h-[300px]"
                    >
                      <BarChart data={categoryChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <p className="text-center text-stone-500 py-8">No data available</p>
                  )}
                </CardContent>
              </Card>

              {/* Category Pie Chart */}
              <Card className="border-stone-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Expense Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {categoryChartData.length > 0 ? (
                    <ChartContainer
                      config={categoryChartData.reduce((acc, item, index) => {
                        acc[item.name.toLowerCase()] = {
                          label: item.name,
                          color: COLORS[index % COLORS.length],
                        }
                        return acc
                      }, {} as Record<string, { label: string; color: string }>)}
                      className="h-[300px]"
                    >
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(props: any) => {
                            const name = props.name || ''
                            const percent = props.percent || 0
                            return `${name}: ${(percent * 100).toFixed(1)}%`
                          }}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip />
                      </PieChart>
                    </ChartContainer>
                  ) : (
                    <p className="text-center text-stone-500 py-8">No data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <Card className="border-stone-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Financial Trends
                  </CardTitle>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number.parseInt(e.target.value))}
                    className="px-3 py-1 border border-stone-300 rounded-md text-sm"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                {trendsChartData.length > 0 ? (
                  <ChartContainer
                    config={{
                      income: { label: "Income", color: "hsl(var(--chart-1))" },
                      expenses: { label: "Expenses", color: "hsl(var(--chart-2))" },
                      profit: { label: "Profit", color: "hsl(var(--chart-3))" },
                    }}
                    className="h-[400px]"
                  >
                    <LineChart data={trendsChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line type="monotone" dataKey="Income" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                      <Line type="monotone" dataKey="Expenses" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                      <Line type="monotone" dataKey="Profit" stroke="hsl(var(--chart-3))" strokeWidth={2} />
                    </LineChart>
                  </ChartContainer>
                ) : (
                  <p className="text-center text-stone-500 py-8">No trend data available</p>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Activity Trend */}
              <Card className="border-stone-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Activity Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {trendsChartData.length > 0 ? (
                    <ChartContainer
                      config={{
                        users: { label: "Active Users", color: "hsl(var(--chart-4))" },
                      }}
                      className="h-[300px]"
                    >
                      <BarChart data={trendsChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="Users" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <p className="text-center text-stone-500 py-8">No data available</p>
                  )}
                </CardContent>
              </Card>

              {/* Production Trend */}
              <Card className="border-stone-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Production Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {trendsChartData.length > 0 ? (
                    <ChartContainer
                      config={{
                        production: { label: "Production", color: "hsl(var(--chart-5))" },
                      }}
                      className="h-[300px]"
                    >
                      <LineChart data={trendsChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="Production" stroke="hsl(var(--chart-5))" strokeWidth={2} />
                      </LineChart>
                    </ChartContainer>
                  ) : (
                    <p className="text-center text-stone-500 py-8">No data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card className="border-stone-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  System Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border border-stone-200 rounded-lg">
                    <h3 className="font-semibold text-stone-900 mb-2">System Summary Report</h3>
                    {systemStats && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-stone-600">Total Income</p>
                          <p className="font-semibold text-emerald-700">{formatCurrency(systemStats.total_income)}</p>
                        </div>
                        <div>
                          <p className="text-stone-600">Total Expenses</p>
                          <p className="font-semibold text-red-700">{formatCurrency(systemStats.total_expenses)}</p>
                        </div>
                        <div>
                          <p className="text-stone-600">Net Profit</p>
                          <p className="font-semibold text-blue-700">{formatCurrency(systemStats.total_profit)}</p>
                        </div>
                        <div>
                          <p className="text-stone-600">Total Production</p>
                          <p className="font-semibold text-amber-700">{systemStats.total_production.toLocaleString()} units</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-4 border border-stone-200 rounded-lg">
                    <h3 className="font-semibold text-stone-900 mb-2">User Distribution</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-stone-600">Miners</p>
                        <p className="font-semibold text-amber-700">{miners.length}</p>
                      </div>
                      <div>
                        <p className="text-stone-600">Buyers</p>
                        <p className="font-semibold text-emerald-700">{buyers.length}</p>
                      </div>
                      <div>
                        <p className="text-stone-600">Sellers</p>
                        <p className="font-semibold text-blue-700">{sellers.length}</p>
                      </div>
                      <div>
                        <p className="text-stone-600">Unknown</p>
                        <p className="font-semibold text-stone-700">{unknown.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* User Details Dialog */}
        <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Details
              </DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-6">
                {/* Profile Info */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-stone-900 border-b border-stone-200 pb-2">Profile Information</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-stone-500">Name</p>
                      <p className="font-medium text-stone-900">{selectedUser.user.name}</p>
                    </div>
                    <div>
                      <p className="text-stone-500">Email</p>
                      <p className="font-medium text-stone-900">{selectedUser.user.email}</p>
                    </div>
                    <div>
                      <p className="text-stone-500">Phone</p>
                      <p className="font-medium text-stone-900">{selectedUser.user.phone || "-"}</p>
                    </div>
                    <div>
                      <p className="text-stone-500">Serial Number</p>
                      <p className="font-medium font-mono text-stone-900">{selectedUser.serial_number || "-"}</p>
                    </div>
                    <div>
                      <p className="text-stone-500">Category</p>
                      <Badge variant="outline" className={getCategoryColor(selectedUser.category)}>
                        {selectedUser.category}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-stone-500">Role</p>
                      <Badge variant="outline" className={selectedUser.user.role === "admin" ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-stone-100 text-stone-700 border-stone-200"}>
                        {selectedUser.user.role}
                      </Badge>
                    </div>
                    <div className="col-span-2">
                      <p className="text-stone-500">Joined</p>
                      <p className="font-medium text-stone-900">{new Date(selectedUser.user.created_at).toLocaleDateString('en-US', { dateStyle: 'long' })}</p>
                    </div>
                  </div>
                </div>

                {/* Activity Summary */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-stone-900 border-b border-stone-200 pb-2">Activity Summary</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border-stone-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="h-4 w-4 text-emerald-600" />
                          <span className="text-xs text-stone-600">Income Activity</span>
                        </div>
                        <p className="text-lg font-bold text-emerald-700">Active</p>
                      </CardContent>
                    </Card>
                    <Card className="border-stone-200 bg-gradient-to-br from-red-50 to-red-100/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingDown className="h-4 w-4 text-red-600" />
                          <span className="text-xs text-stone-600">Expense Records</span>
                        </div>
                        <p className="text-lg font-bold text-red-700">Active</p>
                      </CardContent>
                    </Card>
                  </div>
                  <p className="text-xs text-stone-500 mt-2">
                    User transaction details are available in the respective income and expense reports.
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}


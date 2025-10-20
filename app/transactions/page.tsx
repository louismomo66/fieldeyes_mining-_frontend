"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { dataService } from "@/lib/data-service"
import { TrendingUp, TrendingDown, Search, Filter, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Transaction } from "@/lib/types"

export default function TransactionsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid" | "partial">("all")
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all")
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return
      
      try {
        setLoading(true)
        const [incomes, expenses] = await Promise.all([
          dataService.getIncomes(),
          dataService.getExpenses()
        ])

        // Combine all transactions
        const allTransactions: Transaction[] = [
          ...incomes.map((income) => ({
            ...income,
            id: `income-${income.id}`, // Prefix with type to ensure uniqueness
            type: "income" as const,
            description: `${income.mineralType} - ${income.customerName}`,
          })),
          ...expenses.map((expense) => ({
            ...expense,
            id: `expense-${expense.id}`, // Prefix with type to ensure uniqueness
            type: "expense" as const,
            description: `${expense.category} - ${expense.description}`,
            totalAmount: expense.amount,
          })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        setTransactions(allTransactions)
      } catch (error) {
        console.error("Failed to fetch transactions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [user])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  // Apply filters
  const filteredTransactions = transactions.filter((transaction) => {
    // Type filter
    if (typeFilter !== "all" && transaction.type !== typeFilter) return false

    // Status filter
    if (statusFilter !== "all" && transaction.paymentStatus !== statusFilter) return false

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date()
      const transactionDate = new Date(transaction.date)
      const diffTime = Math.abs(now.getTime() - transactionDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (dateFilter === "today" && diffDays > 1) return false
      if (dateFilter === "week" && diffDays > 7) return false
      if (dateFilter === "month" && diffDays > 30) return false
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return transaction.description.toLowerCase().includes(searchLower)
    }

    return true
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-emerald-100 text-emerald-700 border-emerald-200"
      case "unpaid":
        return "bg-red-100 text-red-700 border-red-200"
      case "partial":
        return "bg-amber-100 text-amber-700 border-amber-200"
      default:
        return "bg-stone-100 text-stone-700 border-stone-200"
    }
  }

  const totalIncome = filteredTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.totalAmount, 0)

  const totalExpenses = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.totalAmount, 0)

  const netAmount = totalIncome - totalExpenses

  const handleExport = () => {
    // Simple CSV export
    const headers = ["Date", "Type", "Description", "Amount", "Status", "Amount Paid", "Amount Due"]
    const rows = filteredTransactions.map((t) => [
      formatDate(t.date),
      t.type,
      t.description,
      t.totalAmount,
      t.paymentStatus,
      t.amountPaid,
      t.amountDue,
    ])

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-stone-900 mb-2">All Transactions</h1>
            <p className="text-stone-600">View and filter all income and expense transactions</p>
          </div>
          <Button
            onClick={handleExport}
            variant="outline"
            className="border-stone-300 hover:bg-stone-100 bg-transparent"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-stone-600">Total Income</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalIncome)}</p>
            </CardContent>
          </Card>
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-stone-600">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-700">{formatCurrency(totalExpenses)}</p>
            </CardContent>
          </Card>
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-stone-600">Net Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={cn("text-2xl font-bold", netAmount >= 0 ? "text-emerald-700" : "text-red-700")}>
                {formatCurrency(netAmount)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-stone-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-stone-600" />
              <CardTitle>Filters</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-400" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Transaction Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income Only</SelectItem>
                  <SelectItem value="expense">Expenses Only</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(typeFilter !== "all" || statusFilter !== "all" || dateFilter !== "all" || searchTerm) && (
              <div className="mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTypeFilter("all")
                    setStatusFilter("all")
                    setDateFilter("all")
                    setSearchTerm("")
                  }}
                  className="text-stone-600 hover:text-stone-900"
                >
                  Clear all filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle>Transactions ({filteredTransactions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredTransactions.length === 0 ? (
                <p className="text-center text-stone-500 py-8">No transactions found</p>
              ) : (
                filteredTransactions.map((transaction, index) => (
                  <div
                    key={transaction.id || `transaction-${transaction.type}-${index}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-stone-50 border border-stone-200 gap-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                          transaction.type === "income" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700",
                        )}
                      >
                        {transaction.type === "income" ? (
                          <TrendingUp className="h-5 w-5" />
                        ) : (
                          <TrendingDown className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-stone-900 truncate">{transaction.description}</h3>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              transaction.type === "income"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-red-50 text-red-700 border-red-200",
                            )}
                          >
                            {transaction.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-stone-600">
                          <span>{formatDate(transaction.date)}</span>
                          <Badge variant="outline" className={cn("text-xs", getStatusColor(transaction.paymentStatus))}>
                            {transaction.paymentStatus}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={cn(
                          "text-lg font-bold",
                          transaction.type === "income" ? "text-emerald-700" : "text-red-700",
                        )}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {formatCurrency(transaction.totalAmount)}
                      </p>
                      <div className="text-xs text-stone-600 space-y-0.5">
                        <p>Paid: {formatCurrency(transaction.amountPaid)}</p>
                        {transaction.amountDue > 0 && (
                          <p className="text-amber-700 font-medium">Due: {formatCurrency(transaction.amountDue)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

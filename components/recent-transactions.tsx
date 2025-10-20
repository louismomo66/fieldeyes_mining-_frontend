"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Income, Expense } from "@/lib/types"

interface RecentTransactionsProps {
  incomes: Income[]
  expenses: Expense[]
}

export function RecentTransactions({ incomes, expenses }: RecentTransactionsProps) {
  // Combine and sort transactions by date
  const allTransactions = [
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
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

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

  return (
    <Card className="border-stone-200">
      <CardHeader>
        <CardTitle className="text-stone-900">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {allTransactions.map((transaction, index) => (
            <div
              key={transaction.id || `recent-transaction-${transaction.type}-${index}`}
              className="flex items-center justify-between p-4 rounded-lg bg-stone-50 border border-stone-200"
            >
              <div className="flex items-center gap-4 flex-1">
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
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
                  <p className="text-sm font-medium text-stone-900 truncate">{transaction.description}</p>
                  <p className="text-xs text-stone-600">{formatDate(transaction.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={cn("text-xs", getStatusColor(transaction.paymentStatus))}>
                  {transaction.paymentStatus}
                </Badge>
                <p
                  className={cn(
                    "text-sm font-bold min-w-[100px] text-right",
                    transaction.type === "income" ? "text-emerald-700" : "text-red-700",
                  )}
                >
                  {transaction.type === "income" ? "+" : "-"}
                  {formatCurrency(transaction.totalAmount)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

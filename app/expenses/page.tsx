"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ExpenseFormDialog } from "@/components/expense-form-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { dataService } from "@/lib/data-service"
import { Edit, Trash2, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Expense } from "@/lib/types"

export default function ExpensesPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const loadExpenses = async () => {
      if (user) {
        try {
          const data = await dataService.getExpenses()
          setExpenses(data)
        } catch (error) {
          console.error("Error loading expenses:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    loadExpenses()
  }, [user])

  if (isLoading || !user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  const handleSave = async (expenseData: Partial<Expense>) => {
    try {
      if (expenseData.id) {
        // Update existing
        const updatedExpense = await dataService.updateExpense(expenseData.id, expenseData as Omit<Expense, "id" | "createdAt">)
        if (updatedExpense) {
          setExpenses(expenses.map((exp) => (exp.id === expenseData.id ? updatedExpense : exp)))
        }
      } else {
        // Add new
        const newExpense = await dataService.createExpense(expenseData as Omit<Expense, "id" | "createdAt">)
        if (newExpense) {
          setExpenses([newExpense, ...expenses])
        }
      }
    } catch (error) {
      console.error("Error saving expense:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this expense record?")) {
      try {
        const success = await dataService.deleteExpense(id)
        if (success) {
          setExpenses(expenses.filter((exp) => exp.id !== id))
        }
      } catch (error) {
        console.error("Error deleting expense:", error)
      }
    }
  }

  const filteredExpenses = expenses.filter(
    (expense) =>
      expense.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const totalPayables = filteredExpenses.reduce((sum, expense) => sum + expense.amountDue, 0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-stone-900 mb-2">Expense Management</h1>
            <p className="text-stone-600">Track and manage mining operation costs</p>
          </div>
          <ExpenseFormDialog onSave={handleSave} />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <CardTitle className="text-sm font-medium text-stone-600">Total Payables</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-700">{formatCurrency(totalPayables)}</p>
            </CardContent>
          </Card>
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-stone-600">Total Records</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-stone-900">{filteredExpenses.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            placeholder="Search by supplier, category, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Expense List */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle>Expense Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredExpenses.length === 0 ? (
                <p className="text-center text-stone-500 py-8">No expense records found</p>
              ) : (
                filteredExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-stone-50 border border-stone-200 gap-4"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-stone-900">{expense.supplierName}</h3>
                        <Badge variant="outline" className="bg-stone-100 text-stone-700 border-stone-200">
                          {expense.category}
                        </Badge>
                        <Badge variant="outline" className={cn("text-xs", getStatusColor(expense.paymentStatus))}>
                          {expense.paymentStatus}
                        </Badge>
                      </div>
                      <div className="text-sm text-stone-600 space-y-1">
                        <p>{expense.description}</p>
                        <p>Date: {formatDate(expense.date)}</p>
                        {expense.amountDue > 0 && (
                          <p className="text-amber-700 font-medium">Due: {formatCurrency(expense.amountDue)}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-700">{formatCurrency(expense.amount)}</p>
                        <p className="text-xs text-stone-600">Paid: {formatCurrency(expense.amountPaid)}</p>
                      </div>
                      <div className="flex gap-2">
                        <ExpenseFormDialog
                          expense={expense}
                          onSave={handleSave}
                          trigger={
                            <Button variant="outline" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <Button variant="outline" size="icon" onClick={() => handleDelete(expense.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
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

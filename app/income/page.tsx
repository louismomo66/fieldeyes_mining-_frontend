"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { IncomeFormDialog } from "@/components/income-form-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { dataService } from "@/lib/data-service"
import { Edit, Trash2, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Income } from "@/lib/types"

export default function IncomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [incomes, setIncomes] = useState<Income[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const loadIncomes = async () => {
      if (user) {
        try {
          const data = await dataService.getIncomes()
          console.log("Income Page - Incomes data from backend:", data)
          console.log("Income Page - Total incomes count:", data.length)
          console.log("Income Page - Total income amount:", data.reduce((sum, income) => sum + income.totalAmount, 0))
          console.log("Income Page - Total receivables:", data.reduce((sum, income) => sum + income.amountDue, 0))
          setIncomes(data)
        } catch (error) {
          console.error("Error loading incomes:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    loadIncomes()
  }, [user])

  if (isLoading || !user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  const handleSave = async (incomeData: Partial<Income>) => {
    try {
      if (incomeData.id) {
        // Update existing
        const updatedIncome = await dataService.updateIncome(incomeData.id, incomeData as Omit<Income, "id" | "createdAt">)
        if (updatedIncome) {
          setIncomes(incomes.map((inc) => (inc.id === incomeData.id ? updatedIncome : inc)))
        }
      } else {
        // Add new
        const newIncome = await dataService.createIncome(incomeData as Omit<Income, "id" | "createdAt">)
        if (newIncome) {
          setIncomes([newIncome, ...incomes])
        }
      }
    } catch (error) {
      console.error("Error saving income:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this income record?")) {
      try {
        const success = await dataService.deleteIncome(id)
        if (success) {
          setIncomes(incomes.filter((inc) => inc.id !== id))
        }
      } catch (error) {
        console.error("Error deleting income:", error)
      }
    }
  }

  const filteredIncomes = incomes.filter(
    (income) =>
      income.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      income.mineralType.toLowerCase().includes(searchTerm.toLowerCase()),
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

  const totalIncome = filteredIncomes.reduce((sum, income) => sum + income.totalAmount, 0)
  const totalReceivables = filteredIncomes.reduce((sum, income) => sum + income.amountDue, 0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-stone-900 mb-2">Income Management</h1>
            <p className="text-stone-600">Track and manage mineral sales and revenue</p>
          </div>
          <IncomeFormDialog onSave={handleSave} />
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
              <CardTitle className="text-sm font-medium text-stone-600">Total Receivables</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-700">{formatCurrency(totalReceivables)}</p>
            </CardContent>
          </Card>
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-stone-600">Total Records</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-stone-900">{filteredIncomes.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            placeholder="Search by customer or mineral type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Income List */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle>Income Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredIncomes.length === 0 ? (
                <p className="text-center text-stone-500 py-8">No income records found</p>
              ) : (
                filteredIncomes.map((income, index) => (
                  <div
                    key={income.id || `income-${index}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-stone-50 border border-stone-200 gap-4"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-stone-900">{income.customerName}</h3>
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          {income.mineralType}
                        </Badge>
                        <Badge variant="outline" className={cn("text-xs", getStatusColor(income.paymentStatus))}>
                          {income.paymentStatus}
                        </Badge>
                      </div>
                      <div className="text-sm text-stone-600 space-y-1">
                        <p>
                          {income.quantity} {income.unit} @ {formatCurrency(income.pricePerUnit)}/{income.unit}
                        </p>
                        <p>Date: {formatDate(income.date)}</p>
                        {income.amountDue > 0 && (
                          <p className="text-amber-700 font-medium">Due: {formatCurrency(income.amountDue)}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-bold text-emerald-700">{formatCurrency(income.totalAmount)}</p>
                        <p className="text-xs text-stone-600">Paid: {formatCurrency(income.amountPaid)}</p>
                      </div>
                      <div className="flex gap-2">
                        <IncomeFormDialog
                          income={income}
                          onSave={handleSave}
                          trigger={
                            <Button variant="outline" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <Button variant="outline" size="icon" onClick={() => handleDelete(income.id)}>
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

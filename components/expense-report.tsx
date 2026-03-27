"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Loader2 } from "lucide-react"
import { dataService } from "@/lib/data-service"
import { useToast } from "@/hooks/use-toast"
import { useCurrency } from "@/lib/currency-context"
import { exportToCSV, exportToPDF, generateUserSerialNumber } from "@/lib/export-utils"
import type { Expense, CategoryBreakdown } from "@/lib/types"

interface ExpenseReportProps {
  selectedYear: number
}

export function ExpenseReport({ selectedYear }: ExpenseReportProps) {
  const { toast } = useToast()
  const { formatCurrency } = useCurrency()
  const [loading, setLoading] = useState(true)
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv")
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [breakdown, setBreakdown] = useState<CategoryBreakdown[]>([])
  const [summary, setSummary] = useState({
    totalExpenses: 0,
    totalPaid: 0,
    totalUnpaid: 0,
    totalPartial: 0,
  })

  useEffect(() => {
    const loadExpenses = async () => {
      try {
        setLoading(true)
        const [expensesData, breakdownData] = await Promise.all([
          dataService.getExpenses(),
          dataService.getExpenseBreakdown(),
        ])
        
        // Filter by year and exclude fuel expenses
        const yearExpenses = expensesData.filter(expense => {
          const expenseYear = new Date(expense.date).getFullYear()
          return expenseYear === selectedYear && expense.category !== "fuel"
        })

        setExpenses(yearExpenses)
        setBreakdown(breakdownData || [])

        // Calculate summary
        const totalExpenses = yearExpenses.reduce((sum, e) => sum + e.amount, 0)
        const totalPaid = yearExpenses.filter(e => e.paymentStatus === "paid").reduce((sum, e) => sum + e.amount, 0)
        const totalUnpaid = yearExpenses.filter(e => e.paymentStatus === "unpaid").reduce((sum, e) => sum + e.amount, 0)
        const totalPartial = yearExpenses.filter(e => e.paymentStatus === "partial").reduce((sum, e) => sum + e.amount, 0)

        setSummary({ totalExpenses, totalPaid, totalUnpaid, totalPartial })
      } catch (error) {
        console.error("Error loading expense report:", error)
        toast({
          title: "Error",
          description: "Failed to load expense data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadExpenses()
  }, [selectedYear, toast])

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  const handleExport = async () => {
    const headers = ["Date", "Category", "Description", "Amount", "Supplier", "Payment Status", "Amount Paid", "Amount Due"]
    const rows = expenses.map(e => [
      formatDate(e.date),
      e.category,
      e.description,
      e.amount.toFixed(2),
      e.supplierName,
      e.paymentStatus,
      e.amountPaid.toFixed(2),
      e.amountDue.toFixed(2),
    ])

    if (exportFormat === "csv") {
      exportToCSV([headers, ...rows], `expense-report-${selectedYear}.csv`)
      toast({
        title: "Export successful",
        description: "Expense report exported as CSV",
      })
    } else {
      try {
        const serialNumber = await generateUserSerialNumber()
        exportToPDF(headers, rows, `Expense Report - ${selectedYear}`, `expense-report-${selectedYear}.pdf`, serialNumber)
      } catch (error) {
        console.error("Error generating serial number:", error)
        exportToPDF(headers, rows, `Expense Report - ${selectedYear}`, `expense-report-${selectedYear}.pdf`, "00000000000")
      }
      toast({
        title: "Export successful",
        description: "Expense report opened for PDF printing",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-stone-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Expense Report - {selectedYear}</CardTitle>
              <p className="text-sm text-stone-600 mt-1">
                Generated on {new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Select value={exportFormat} onValueChange={(value: "csv" | "pdf") => setExportFormat(value)}>
                <SelectTrigger className="w-[120px] border-stone-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleExport}
                className="gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-stone-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-stone-600">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-stone-900">{formatCurrency(summary.totalExpenses)}</p>
              </CardContent>
            </Card>
            <Card className="border-stone-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-stone-600">Paid</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-emerald-700">{formatCurrency(summary.totalPaid)}</p>
              </CardContent>
            </Card>
            <Card className="border-stone-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-stone-600">Unpaid</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-red-700">{formatCurrency(summary.totalUnpaid)}</p>
              </CardContent>
            </Card>
            <Card className="border-stone-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-stone-600">Partial</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-amber-700">{formatCurrency(summary.totalPartial)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Expense Breakdown by Category */}
          {breakdown.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-stone-900 mb-4">Expenses by Category</h3>
              <div className="space-y-3">
                {breakdown.map((cat) => (
                  <div key={cat.category} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg border border-stone-200">
                    <div>
                      <p className="font-medium text-stone-900 capitalize">{cat.category}</p>
                      <p className="text-sm text-stone-600">{cat.percentage.toFixed(1)}% of total</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-stone-900">{formatCurrency(cat.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Expenses Table */}
          <div>
            <h3 className="text-lg font-semibold text-stone-900 mb-4">Detailed Expense Transactions</h3>
            <div className="rounded-md border border-stone-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50">
                    <th className="p-3 text-left font-medium text-stone-900">Date</th>
                    <th className="p-3 text-left font-medium text-stone-900">Category</th>
                    <th className="p-3 text-left font-medium text-stone-900">Description</th>
                    <th className="p-3 text-left font-medium text-stone-900">Supplier</th>
                    <th className="p-3 text-right font-medium text-stone-900">Amount</th>
                    <th className="p-3 text-right font-medium text-stone-900">Paid</th>
                    <th className="p-3 text-right font-medium text-stone-900">Due</th>
                    <th className="p-3 text-center font-medium text-stone-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-stone-500">
                        No expense records found for {selectedYear}
                      </td>
                    </tr>
                  ) : (
                    expenses
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((expense) => (
                        <tr key={expense.id} className="border-b border-stone-200 last:border-0">
                          <td className="p-3 text-stone-700">{formatDate(expense.date)}</td>
                          <td className="p-3">
                            <Badge variant="outline" className="bg-stone-50 text-stone-700 border-stone-200 capitalize">
                              {expense.category}
                            </Badge>
                          </td>
                          <td className="p-3 text-stone-700">{expense.description}</td>
                          <td className="p-3 text-stone-700">{expense.supplierName}</td>
                          <td className="p-3 text-right font-medium text-stone-900">{formatCurrency(expense.amount)}</td>
                          <td className="p-3 text-right text-stone-700">{formatCurrency(expense.amountPaid)}</td>
                          <td className="p-3 text-right text-stone-700">{formatCurrency(expense.amountDue)}</td>
                          <td className="p-3 text-center">
                            <Badge 
                              variant="outline" 
                              className={
                                expense.paymentStatus === "paid" 
                                  ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                  : expense.paymentStatus === "unpaid"
                                  ? "bg-red-100 text-red-700 border-red-200"
                                  : "bg-amber-100 text-amber-700 border-amber-200"
                              }
                            >
                              {expense.paymentStatus}
                            </Badge>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


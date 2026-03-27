"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Loader2 } from "lucide-react"
import { dataService } from "@/lib/data-service"
import { useToast } from "@/hooks/use-toast"
import { useCurrency } from "@/lib/currency-context"
import { exportToCSV, exportToPDF, generateUserSerialNumber } from "@/lib/export-utils"
import type { FinancialSummary, MonthlyData } from "@/lib/types"

interface FinancialSummaryReportProps {
  selectedYear: number
}

export function FinancialSummaryReport({ selectedYear }: FinancialSummaryReportProps) {
  const { toast } = useToast()
  const { formatCurrency } = useCurrency()
  const [loading, setLoading] = useState(true)
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv")
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])

  useEffect(() => {
    const loadFinancialData = async () => {
      try {
        setLoading(true)
        const [summaryData, monthly] = await Promise.all([
          dataService.getFinancialSummary(),
          dataService.getMonthlyData(selectedYear),
        ])
        setSummary(summaryData)
        // Filter monthly data by year
        const filteredMonthly = (monthly || []).filter(m => {
          const monthYear = parseInt(m.month.split('-')[0])
          return monthYear === selectedYear
        })
        setMonthlyData(filteredMonthly)
      } catch (error) {
        console.error("Error loading financial summary:", error)
        toast({
          title: "Error",
          description: "Failed to load financial data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadFinancialData()
  }, [selectedYear, toast])

  const handleExport = async () => {
    if (!summary) return

    const summaryRows = [
      ["Financial Summary", "", ""],
      ["Total Income", formatCurrency(summary.totalIncome), ""],
      ["Total Expenses", formatCurrency(summary.totalExpenses), ""],
      ["Net Profit", formatCurrency(summary.netProfit), ""],
      ["Profit Margin", `${summary.profitMargin.toFixed(2)}%`, ""],
      ["Total Receivables", formatCurrency(summary.totalReceivables), ""],
      ["Total Payables", formatCurrency(summary.totalPayables), ""],
      ["", "", ""],
      ["Monthly Data", "", ""],
      ["Month", "Income", "Expenses", "Profit"],
      ...monthlyData.map(m => [m.month, formatCurrency(m.income), formatCurrency(m.expenses), formatCurrency(m.profit)])
    ]

    if (exportFormat === "csv") {
      exportToCSV(summaryRows, `financial-summary-${selectedYear}.csv`)
      toast({
        title: "Export successful",
        description: "Financial summary exported as CSV",
      })
    } else {
      // For PDF, use a simplified format with headers
      const headers = ["Item", "Value", ""]
      const rows = [
        ["Total Income", formatCurrency(summary.totalIncome), ""],
        ["Total Expenses", formatCurrency(summary.totalExpenses), ""],
        ["Net Profit", formatCurrency(summary.netProfit), ""],
        ["Profit Margin", `${summary.profitMargin.toFixed(2)}%`, ""],
        ["Total Receivables", formatCurrency(summary.totalReceivables), ""],
        ["Total Payables", formatCurrency(summary.totalPayables), ""],
        ["", "", ""],
        ["Month", "Income", "Expenses", "Profit"],
        ...monthlyData.map(m => [m.month, formatCurrency(m.income), formatCurrency(m.expenses), formatCurrency(m.profit)])
      ]
      try {
        const serialNumber = await generateUserSerialNumber()
        exportToPDF(headers, rows, `Financial Summary - ${selectedYear}`, `financial-summary-${selectedYear}.pdf`, serialNumber)
      } catch (error) {
        console.error("Error generating serial number:", error)
        exportToPDF(headers, rows, `Financial Summary - ${selectedYear}`, `financial-summary-${selectedYear}.pdf`, "00000000000")
      }
      toast({
        title: "Export successful",
        description: "Financial summary opened for PDF printing",
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

  if (!summary) {
    return (
      <Card className="border-stone-200">
        <CardContent className="py-12">
          <p className="text-center text-stone-500">No financial data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-stone-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Financial Summary</CardTitle>
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="border-stone-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-stone-600">Total Income</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-emerald-700">{formatCurrency(summary.totalIncome)}</p>
              </CardContent>
            </Card>
            <Card className="border-stone-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-stone-600">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-red-700">{formatCurrency(summary.totalExpenses)}</p>
              </CardContent>
            </Card>
            <Card className="border-stone-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-stone-600">Net Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-stone-900">{formatCurrency(summary.netProfit)}</p>
              </CardContent>
            </Card>
            <Card className="border-stone-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-stone-600">Profit Margin</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-stone-900">{summary.profitMargin.toFixed(2)}%</p>
              </CardContent>
            </Card>
            <Card className="border-stone-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-stone-600">Receivables</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-amber-700">{formatCurrency(summary.totalReceivables)}</p>
              </CardContent>
            </Card>
            <Card className="border-stone-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-stone-600">Payables</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-amber-700">{formatCurrency(summary.totalPayables)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Breakdown */}
          {monthlyData.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-stone-900 mb-4">Monthly Performance</h3>
              <div className="rounded-md border border-stone-200 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50">
                      <th className="p-3 text-left font-medium text-stone-900">Month</th>
                      <th className="p-3 text-right font-medium text-stone-900">Income</th>
                      <th className="p-3 text-right font-medium text-stone-900">Expenses</th>
                      <th className="p-3 text-right font-medium text-stone-900">Profit</th>
                      <th className="p-3 text-right font-medium text-stone-900">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map((month, index) => {
                      const margin = month.income > 0 ? ((month.profit / month.income) * 100) : 0
                      return (
                        <tr key={index} className="border-b border-stone-200 last:border-0">
                          <td className="p-3 text-stone-700 font-medium">{month.month}</td>
                          <td className="p-3 text-right text-stone-700">{formatCurrency(month.income)}</td>
                          <td className="p-3 text-right text-stone-700">{formatCurrency(month.expenses)}</td>
                          <td className={`p-3 text-right font-medium ${month.profit >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                            {formatCurrency(month.profit)}
                          </td>
                          <td className={`p-3 text-right ${margin >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                            {margin.toFixed(1)}%
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-stone-200 bg-stone-50">
              <CardHeader>
                <CardTitle className="text-base">Income Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-stone-600">Total Income:</span>
                  <span className="font-semibold text-stone-900">{formatCurrency(summary.totalIncome)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Outstanding Receivables:</span>
                  <span className="font-semibold text-amber-700">{formatCurrency(summary.totalReceivables)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Collection Rate:</span>
                  <span className="font-semibold text-stone-900">
                    {summary.totalIncome > 0
                      ? (((summary.totalIncome - summary.totalReceivables) / summary.totalIncome) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-stone-200 bg-stone-50">
              <CardHeader>
                <CardTitle className="text-base">Expense Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-stone-600">Total Expenses:</span>
                  <span className="font-semibold text-stone-900">{formatCurrency(summary.totalExpenses)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Outstanding Payables:</span>
                  <span className="font-semibold text-amber-700">{formatCurrency(summary.totalPayables)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Payment Rate:</span>
                  <span className="font-semibold text-stone-900">
                    {summary.totalExpenses > 0
                      ? (((summary.totalExpenses - summary.totalPayables) / summary.totalExpenses) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


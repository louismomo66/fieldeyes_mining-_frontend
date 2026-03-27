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
import type { Income } from "@/lib/types"

interface SalesReportProps {
  selectedYear: number
}

export function SalesReport({ selectedYear }: SalesReportProps) {
  const { toast } = useToast()
  const { formatCurrency } = useCurrency()
  const [loading, setLoading] = useState(true)
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv")
  const [sales, setSales] = useState<Income[]>([])
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalQuantity: 0,
    paidSales: 0,
    unpaidSales: 0,
    partialSales: 0,
  })

  useEffect(() => {
    const loadSales = async () => {
      try {
        setLoading(true)
        const incomes = await dataService.getIncomes()
        
        // Filter by year
        const yearSales = incomes.filter(income => {
          const incomeYear = new Date(income.date).getFullYear()
          return incomeYear === selectedYear
        })

        setSales(yearSales)

        // Calculate summary
        const totalSales = yearSales.reduce((sum, s) => sum + s.totalAmount, 0)
        const totalQuantity = yearSales.reduce((sum, s) => sum + s.quantity, 0)
        const paidSales = yearSales.filter(s => s.paymentStatus === "paid").reduce((sum, s) => sum + s.totalAmount, 0)
        const unpaidSales = yearSales.filter(s => s.paymentStatus === "unpaid").reduce((sum, s) => sum + s.totalAmount, 0)
        const partialSales = yearSales.filter(s => s.paymentStatus === "partial").reduce((sum, s) => sum + s.totalAmount, 0)

        setSummary({ totalSales, totalQuantity, paidSales, unpaidSales, partialSales })
      } catch (error) {
        console.error("Error loading sales report:", error)
        toast({
          title: "Error",
          description: "Failed to load sales data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadSales()
  }, [selectedYear, toast])

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  const handleExport = async () => {
    const headers = ["Date", "Item Name", "Mineral Type", "Quantity", "Unit", "Price per Unit", "Total Amount", "Customer", "Payment Status", "Amount Paid", "Amount Due"]
    const rows = sales.map(s => [
      formatDate(s.date),
      s.itemName || "",
      s.mineralType,
      s.quantity.toString(),
      s.unit,
      s.pricePerUnit.toFixed(2),
      s.totalAmount.toFixed(2),
      s.customerName,
      s.paymentStatus,
      s.amountPaid.toFixed(2),
      s.amountDue.toFixed(2),
    ])

    if (exportFormat === "csv") {
      exportToCSV([headers, ...rows], `sales-report-${selectedYear}.csv`)
      toast({
        title: "Export successful",
        description: "Sales report exported as CSV",
      })
    } else {
      try {
        const serialNumber = await generateUserSerialNumber()
        exportToPDF(headers, rows, `Sales Report - ${selectedYear}`, `sales-report-${selectedYear}.pdf`, serialNumber)
        toast({
          title: "Export successful",
          description: "Sales report opened for PDF printing",
        })
      } catch (error) {
        console.error("Error generating serial number:", error)
        exportToPDF(headers, rows, `Sales Report - ${selectedYear}`, `sales-report-${selectedYear}.pdf`, "00000000000")
        toast({
          title: "Export successful",
          description: "Sales report opened for PDF printing",
        })
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    )
  }

  // Group by mineral type
  const byMineral = sales.reduce((acc, sale) => {
    const type = sale.mineralType.charAt(0).toUpperCase() + sale.mineralType.slice(1).replace(/_/g, ' ')
    if (!acc[type]) acc[type] = []
    acc[type].push(sale)
    return acc
  }, {} as Record<string, Income[]>)

  return (
    <div className="space-y-6">
      <Card className="border-stone-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sales Report - {selectedYear}</CardTitle>
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="border-stone-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-stone-600">Total Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-stone-900">{formatCurrency(summary.totalSales)}</p>
              </CardContent>
            </Card>
            <Card className="border-stone-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-stone-600">Total Quantity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-stone-900">{summary.totalQuantity.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-stone-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-stone-600">Paid</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-emerald-700">{formatCurrency(summary.paidSales)}</p>
              </CardContent>
            </Card>
            <Card className="border-stone-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-stone-600">Unpaid</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-red-700">{formatCurrency(summary.unpaidSales)}</p>
              </CardContent>
            </Card>
            <Card className="border-stone-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-stone-600">Partial</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-amber-700">{formatCurrency(summary.partialSales)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Sales by Mineral Type */}
          <div>
            <h3 className="text-lg font-semibold text-stone-900 mb-4">Sales by Mineral Type</h3>
            <div className="space-y-3">
              {Object.entries(byMineral).map(([mineral, mineralSales]) => {
                const total = mineralSales.reduce((sum, s) => sum + s.totalAmount, 0)
                const qty = mineralSales.reduce((sum, s) => sum + s.quantity, 0)
                return (
                  <div key={mineral} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg border border-stone-200">
                    <div>
                      <p className="font-medium text-stone-900">{mineral}</p>
                      <p className="text-sm text-stone-600">{mineralSales.length} transactions</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-stone-900">{formatCurrency(total)}</p>
                      <p className="text-sm text-stone-600">{qty.toLocaleString()} {mineralSales[0]?.unit || "units"}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Detailed Sales Table */}
          <div>
            <h3 className="text-lg font-semibold text-stone-900 mb-4">Detailed Sales Transactions</h3>
            <div className="rounded-md border border-stone-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50">
                    <th className="p-3 text-left font-medium text-stone-900">Date</th>
                    <th className="p-3 text-left font-medium text-stone-900">Item</th>
                    <th className="p-3 text-left font-medium text-stone-900">Customer</th>
                    <th className="p-3 text-right font-medium text-stone-900">Quantity</th>
                    <th className="p-3 text-right font-medium text-stone-900">Price/Unit</th>
                    <th className="p-3 text-right font-medium text-stone-900">Total</th>
                    <th className="p-3 text-center font-medium text-stone-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-stone-500">
                        No sales records found for {selectedYear}
                      </td>
                    </tr>
                  ) : (
                    sales
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((sale) => (
                        <tr key={sale.id} className="border-b border-stone-200 last:border-0">
                          <td className="p-3 text-stone-700">{formatDate(sale.date)}</td>
                          <td className="p-3 text-stone-700">{sale.itemName || sale.mineralType}</td>
                          <td className="p-3 text-stone-700">{sale.customerName}</td>
                          <td className="p-3 text-right text-stone-700">{sale.quantity} {sale.unit}</td>
                          <td className="p-3 text-right text-stone-700">{formatCurrency(sale.pricePerUnit)}</td>
                          <td className="p-3 text-right font-medium text-stone-900">{formatCurrency(sale.totalAmount)}</td>
                          <td className="p-3 text-center">
                            <Badge 
                              variant="outline" 
                              className={
                                sale.paymentStatus === "paid" 
                                  ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                  : sale.paymentStatus === "unpaid"
                                  ? "bg-red-100 text-red-700 border-red-200"
                                  : "bg-amber-100 text-amber-700 border-amber-200"
                              }
                            >
                              {sale.paymentStatus}
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


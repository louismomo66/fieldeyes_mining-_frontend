"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Loader2 } from "lucide-react"
import { dataService } from "@/lib/data-service"
import { useToast } from "@/hooks/use-toast"
import type { InventoryItem } from "@/lib/types"

interface ProductionReportProps {
  selectedYear: number
}

export function ProductionReport({ selectedYear }: ProductionReportProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [production, setProduction] = useState<InventoryItem[]>([])
  const [summary, setSummary] = useState({
    totalQuantity: 0,
    totalValue: 0,
    minerals: 0,
    supplies: 0,
    fromMine: 0,
    fromProcessing: 0,
  })

  useEffect(() => {
    const loadProduction = async () => {
      try {
        setLoading(true)
        const items = await dataService.getInventory()
        
        // Filter items updated in the selected year
        const yearItems = items.filter(item => {
          const itemYear = new Date(item.lastUpdated).getFullYear()
          return itemYear === selectedYear
        })

        setProduction(yearItems)

        // Calculate summary
        const totalQuantity = yearItems.reduce((sum, item) => sum + item.quantity, 0)
        const totalValue = yearItems.reduce((sum, item) => sum + item.currentValue, 0)
        const minerals = yearItems.filter(item => item.type === "mineral").length
        const supplies = yearItems.filter(item => item.type === "supply").length
        const fromMine = yearItems.filter(item => item.from === "mine").length
        const fromProcessing = yearItems.filter(item => item.from === "processing").length

        setSummary({ totalQuantity, totalValue, minerals, supplies, fromMine, fromProcessing })
      } catch (error) {
        console.error("Error loading production report:", error)
        toast({
          title: "Error",
          description: "Failed to load production data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadProduction()
  }, [selectedYear, toast])

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

  const handleExport = () => {
    const csvContent = [
      ["Item Name", "Type", "Source", "Pit Number", "Miner Name", "Batch Number", "Processing Method", "Quantity", "Unit", "Current Value", "Last Updated"],
      ...production.map(item => [
        item.name,
        item.type,
        item.from || "",
        item.pitNumber || "",
        item.minerName || "",
        item.batchNumber || "",
        item.processingMethod || "",
        item.quantity.toString(),
        item.unit,
        item.currentValue.toFixed(2),
        formatDate(item.lastUpdated),
      ])
    ].map(row => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `production-report-${selectedYear}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: "Export successful",
      description: "Production report exported as CSV",
    })
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
              <CardTitle>Production Report - {selectedYear}</CardTitle>
              <p className="text-sm text-stone-600 mt-1">
                Generated on {new Date().toLocaleDateString()}
              </p>
            </div>
            <Button 
              onClick={handleExport}
              className="gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white"
            >
              <Download className="h-4 w-4" />
              Export Production Report
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
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
                <CardTitle className="text-xs font-medium text-stone-600">Total Value</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-stone-900">{formatCurrency(summary.totalValue)}</p>
              </CardContent>
            </Card>
            <Card className="border-stone-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-stone-600">Minerals</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-amber-700">{summary.minerals}</p>
              </CardContent>
            </Card>
            <Card className="border-stone-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-stone-600">Supplies</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-stone-700">{summary.supplies}</p>
              </CardContent>
            </Card>
            <Card className="border-stone-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-stone-600">From Mine</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-emerald-700">{summary.fromMine}</p>
              </CardContent>
            </Card>
            <Card className="border-stone-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-stone-600">From Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-blue-700">{summary.fromProcessing}</p>
              </CardContent>
            </Card>
          </div>

          {/* Production Items Table */}
          <div>
            <h3 className="text-lg font-semibold text-stone-900 mb-4">Production Items</h3>
            <div className="rounded-md border border-stone-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50">
                    <th className="p-3 text-left font-medium text-stone-900">Item Name</th>
                    <th className="p-3 text-left font-medium text-stone-900">Type</th>
                    <th className="p-3 text-left font-medium text-stone-900">Source</th>
                    <th className="p-3 text-left font-medium text-stone-900">Pit/Miner</th>
                    <th className="p-3 text-left font-medium text-stone-900">Batch #</th>
                    <th className="p-3 text-right font-medium text-stone-900">Quantity</th>
                    <th className="p-3 text-right font-medium text-stone-900">Value</th>
                    <th className="p-3 text-left font-medium text-stone-900">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {production.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-stone-500">
                        No production records found for {selectedYear}
                      </td>
                    </tr>
                  ) : (
                    production
                      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
                      .map((item) => (
                        <tr key={item.id} className="border-b border-stone-200 last:border-0">
                          <td className="p-3 text-stone-700 font-medium">{item.name}</td>
                          <td className="p-3">
                            <Badge 
                              variant="outline"
                              className={
                                item.type === "mineral"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-stone-100 text-stone-700 border-stone-200"
                              }
                            >
                              {item.type}
                            </Badge>
                          </td>
                          <td className="p-3 text-stone-700">
                            {item.from === "mine" ? "Mine" : item.from === "processing" ? "Processing" : "-"}
                          </td>
                          <td className="p-3 text-stone-700">
                            {item.pitNumber || item.minerName || "-"}
                          </td>
                          <td className="p-3 text-stone-700">{item.batchNumber || "-"}</td>
                          <td className="p-3 text-right text-stone-700">
                            {item.quantity.toLocaleString()} {item.unit}
                          </td>
                          <td className="p-3 text-right font-medium text-stone-900">
                            {formatCurrency(item.currentValue)}
                          </td>
                          <td className="p-3 text-stone-600 text-xs">{formatDate(item.lastUpdated)}</td>
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


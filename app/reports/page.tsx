"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Download, DollarSign, TrendingUp, BarChart3 } from "lucide-react"
import { TrialBalance } from "@/components/trial-balance"
import { SalesReport } from "@/components/sales-report"
import { ProductionReport } from "@/components/production-report"
import { ExpenseReport } from "@/components/expense-report"
import { FinancialSummaryReport } from "@/components/financial-summary-report"

export default function ReportsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [reportPeriod, setReportPeriod] = useState<"month" | "quarter" | "year">("month")
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

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

  // Generate year options (current year and 4 previous years)
  const yearOptions = []
  const currentYear = new Date().getFullYear()
  for (let i = 0; i < 5; i++) {
    yearOptions.push(currentYear - i)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Instructions */}
        <div className="rounded-lg border-l-4 border-amber-600 bg-amber-50/50 p-4">
          <div className="flex items-start justify-between">
          <div>
              <h1 className="text-3xl font-bold text-stone-900 flex items-center gap-2">
                <FileText className="h-8 w-8 text-amber-600" />
                Reports & Financial Statements
              </h1>
              <p className="text-stone-600 mt-1">
                📊 <strong>What to do here:</strong> Generate and export financial reports, trial balance, and operational summaries
              </p>
              <p className="text-sm text-stone-600 mt-2">
                💡 Select a report type from the tabs below, then click the Export button to download
              </p>
          </div>
          <div className="flex gap-2">
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-[120px] border-stone-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            </div>
          </div>
        </div>

        <Tabs defaultValue="trial-balance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 gap-2">
            <TabsTrigger value="trial-balance" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Trial Balance</span>
              <span className="sm:hidden">Trial</span>
            </TabsTrigger>
            <TabsTrigger value="sales" className="gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Sales Report</span>
              <span className="sm:hidden">Sales</span>
            </TabsTrigger>
            <TabsTrigger value="production" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Production</span>
              <span className="sm:hidden">Prod</span>
            </TabsTrigger>
            <TabsTrigger value="expenses" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Expenses</span>
              <span className="sm:hidden">Exp</span>
            </TabsTrigger>
            <TabsTrigger value="financial" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Financial</span>
              <span className="sm:hidden">Fin</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trial-balance">
            <TrialBalance selectedYear={selectedYear} />
          </TabsContent>

          <TabsContent value="sales">
            <SalesReport selectedYear={selectedYear} />
          </TabsContent>

          <TabsContent value="production">
            <ProductionReport selectedYear={selectedYear} />
          </TabsContent>

          <TabsContent value="expenses">
            <ExpenseReport selectedYear={selectedYear} />
          </TabsContent>

          <TabsContent value="financial">
            <FinancialSummaryReport selectedYear={selectedYear} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

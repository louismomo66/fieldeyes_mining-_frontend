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

interface TrialBalanceProps {
  selectedYear: number
}

export function TrialBalance({ selectedYear }: TrialBalanceProps) {
  const { toast } = useToast()
  const { currency, formatCurrency } = useCurrency()
  const [loading, setLoading] = useState(true)
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv")
  const [accounts, setAccounts] = useState<Array<{ name: string; debit: number; credit: number }>>([])

  useEffect(() => {
    const loadTrialBalance = async () => {
      try {
        setLoading(true)
        const [summary, incomes, expenses, inventory] = await Promise.all([
          dataService.getFinancialSummary(),
          dataService.getIncomes(),
          dataService.getExpenses(),
          dataService.getInventory(),
        ])

        if (summary) {
          // Filter data by year
          const yearIncomes = incomes.filter(inc => {
            const incomeYear = new Date(inc.date).getFullYear()
            return incomeYear === selectedYear
          })
          
          const yearExpenses = expenses.filter(exp => {
            const expenseYear = new Date(exp.date).getFullYear()
            return expenseYear === selectedYear && exp.category !== "fuel"
          })
          
          const yearInventory = inventory.filter(inv => {
            const invYear = new Date(inv.lastUpdated).getFullYear()
            return invYear === selectedYear
          })

          // Calculate year-specific totals
          const yearTotalIncome = yearIncomes.reduce((sum, inc) => sum + inc.totalAmount, 0)
          const yearTotalExpenses = yearExpenses.reduce((sum, exp) => sum + exp.amount, 0)
          const yearTotalReceivables = yearIncomes.reduce((sum, inc) => sum + inc.amountDue, 0)
          const yearTotalPayables = yearExpenses.reduce((sum, exp) => sum + exp.amountDue, 0)
          
          const cashReceived = yearIncomes.reduce((sum, inc) => sum + inc.amountPaid, 0)
          const cashPaid = yearExpenses.reduce((sum, exp) => sum + exp.amountPaid, 0)
          const rawCashBalance = cashReceived - cashPaid

          const inventoryValue = yearInventory.reduce((sum, item) => sum + item.currentValue, 0)

          const debitEntries: Array<{ name: string; amount: number }> = []
          const creditEntries: Array<{ name: string; amount: number }> = []

          if (rawCashBalance >= 0) {
            if (rawCashBalance > 0) {
              debitEntries.push({ name: "Cash at Bank", amount: rawCashBalance })
            }
          } else {
            creditEntries.push({ name: "Bank Overdraft", amount: Math.abs(rawCashBalance) })
          }

          if (yearTotalReceivables > 0) {
            debitEntries.push({ name: "Accounts Receivable", amount: yearTotalReceivables })
          }

          if (inventoryValue > 0) {
            debitEntries.push({ name: "Inventory / Production", amount: inventoryValue })
          }

          const expenseCategories: Array<{ label: string; filter: (exp: typeof yearExpenses[number]) => boolean }> = [
            { label: "Labor Costs", filter: exp => exp.category === "labor" },
            { label: "Equipment & Maintenance", filter: exp => exp.category === "equipment" || exp.category === "maintenance" },
            { label: "Chemicals & Supplies", filter: exp => exp.category === "chemicals" },
            { label: "Transport Costs", filter: exp => exp.category === "transport" },
            { label: "Other Expenses", filter: exp => exp.category === "other" },
          ]

          expenseCategories.forEach(({ label, filter }) => {
            const total = yearExpenses.filter(filter).reduce((sum, exp) => sum + exp.amount, 0)
            if (total > 0) {
              debitEntries.push({ name: label, amount: total })
            }
          })

          if (yearTotalIncome > 0) {
            creditEntries.push({ name: "Sales Revenue", amount: yearTotalIncome })
          }

          if (yearTotalPayables > 0) {
            creditEntries.push({ name: "Accounts Payable", amount: yearTotalPayables })
          }

          const positiveCash = Math.max(rawCashBalance, 0)
          const overdraft = Math.max(-rawCashBalance, 0)

          const totalAssets = positiveCash + yearTotalReceivables + inventoryValue
          const totalLiabilities = yearTotalPayables + overdraft

          const calculatedEquity = totalAssets + yearTotalExpenses - totalLiabilities - yearTotalIncome

          if (calculatedEquity > 0) {
            creditEntries.push({ name: "Owner's Equity", amount: calculatedEquity })
          } else if (calculatedEquity < 0) {
            debitEntries.push({ name: "Owner's Drawings", amount: Math.abs(calculatedEquity) })
          }

          const combinedAccounts = [
            ...debitEntries.map(({ name, amount }) => ({ name, debit: amount, credit: 0 })),
            ...creditEntries.map(({ name, amount }) => ({ name, debit: 0, credit: amount })),
          ].filter(acc => acc.debit > 0 || acc.credit > 0)

          setAccounts(combinedAccounts)
        }
      } catch (error) {
        console.error("Error loading trial balance:", error)
        toast({
          title: "Error",
          description: "Failed to load trial balance data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadTrialBalance()
  }, [selectedYear, toast])

  const totalDebit = accounts.reduce((sum, acc) => sum + acc.debit, 0)
  const totalCredit = accounts.reduce((sum, acc) => sum + acc.credit, 0)

  const handleExport = async () => {
    const headers = ["Account Name", `Debit (${currency})`, `Credit (${currency})`]
    const rows = [
      ...accounts.map(acc => [acc.name, acc.debit.toFixed(2), acc.credit.toFixed(2)]),
      ["Total", totalDebit.toFixed(2), totalCredit.toFixed(2)]
    ]

    if (exportFormat === "csv") {
      exportToCSV([headers, ...rows], `trial-balance-${selectedYear}.csv`)
      toast({
        title: "Export successful",
        description: "Trial balance exported as CSV",
      })
    } else {
      try {
        const serialNumber = await generateUserSerialNumber()
        exportToPDF(headers, rows, `Trial Balance - ${selectedYear}`, `trial-balance-${selectedYear}.pdf`, serialNumber)
      } catch (error) {
        console.error("Error generating serial number:", error)
        exportToPDF(headers, rows, `Trial Balance - ${selectedYear}`, `trial-balance-${selectedYear}.pdf`, "00000000000")
      }
      toast({
        title: "Export successful",
        description: "Trial balance opened for PDF printing",
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-stone-900">Trial Balance</h2>
          <p className="text-stone-600">Financial overview as of {new Date().toLocaleDateString()}</p>
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

      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle>Account Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-stone-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50">
                  <th className="p-3 text-left font-medium text-stone-900">Account Name</th>
                  <th className="p-3 text-right font-medium text-stone-900">Debit ({currency})</th>
                  <th className="p-3 text-right font-medium text-stone-900">Credit ({currency})</th>
                </tr>
              </thead>
              <tbody>
                {accounts.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-stone-500">
                      No account data available
                    </td>
                  </tr>
                ) : (
                  <>
                    {accounts.map((account, index) => (
                      <tr key={index} className="border-b border-stone-200 last:border-0">
                        <td className="p-3 text-stone-700">{account.name}</td>
                        <td className="p-3 text-right text-stone-700">
                          {account.debit > 0 ? formatCurrency(account.debit) : "-"}
                        </td>
                        <td className="p-3 text-right text-stone-700">
                          {account.credit > 0 ? formatCurrency(account.credit) : "-"}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-amber-600 bg-stone-100 font-bold">
                      <td className="p-3 text-stone-900">Total</td>
                      <td className="p-3 text-right text-stone-900">{formatCurrency(totalDebit)}</td>
                      <td className="p-3 text-right text-stone-900">{formatCurrency(totalCredit)}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-lg bg-stone-50 p-4">
            <span className="font-medium text-stone-700">Balance Check:</span>
            <span className={totalDebit === totalCredit ? "text-emerald-700 font-bold" : "text-red-700 font-bold"}>
              {totalDebit === totalCredit ? "✓ Balanced" : `✗ Unbalanced (Difference: ${formatCurrency(Math.abs(totalDebit - totalCredit))})`}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="text-sm text-stone-600">Total Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-stone-900">
              {formatCurrency(accounts.filter(a => [
                "Cash at Bank",
                "Accounts Receivable",
                "Inventory / Production",
                "Owner's Drawings",
              ].includes(a.name)).reduce((sum, a) => sum + a.debit, 0))}
            </p>
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="text-sm text-stone-600">Total Liabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-stone-900">
              {formatCurrency(accounts.filter(a => [
                "Accounts Payable",
                "Bank Overdraft",
              ].includes(a.name)).reduce((sum, a) => sum + a.credit, 0))}
            </p>
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="text-sm text-stone-600">Net Income</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-700">
              {formatCurrency(
                (accounts.find(a => a.name === "Owner's Equity")?.credit || 0) -
                (accounts.find(a => a.name === "Owner's Drawings")?.debit || 0)
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useCurrency } from "@/lib/currency-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { dataService } from "@/lib/data-service"
import { Edit, Trash2, Search, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Expense, ExpenseCategory, PaymentStatus } from "@/lib/types"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export default function ExpensesPage() {
  const { user, isLoading } = useAuth()
  const { currency, formatCurrency } = useCurrency()
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    category: "labor" as ExpenseCategory,
    description: "",
    quantity: "",
    unit: "",
    amount: "",
    supplierName: "",
    supplierContact: "",
    paymentStatus: "unpaid" as PaymentStatus,
    amountPaid: "0",
    unitCost: "",
    notes: "",
  })

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
          console.log("Expenses Page - Expenses data from backend:", data)
          console.log("Expenses Page - Total expenses count:", data.length)
          console.log("Expenses Page - Total expenses amount:", data.reduce((sum, expense) => sum + expense.amount, 0))
          console.log("Expenses Page - Total payables:", data.reduce((sum, expense) => sum + expense.amountDue || 0, 0))
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

  // Auto-calculate total amount based on quantity and unit cost
  useEffect(() => {
    if (formData.quantity && formData.unitCost) {
      const q = Number.parseFloat(formData.quantity)
      const u = Number.parseFloat(formData.unitCost)
      if (!Number.isNaN(q) && !Number.isNaN(u)) {
        const total = q * u
        setFormData(prev => ({
          ...prev,
          amount: total.toFixed(2),
          // Also set amountPaid to the total by default if it's currently 0 or empty (for convenience)
          amountPaid: prev.amountPaid === "0" || prev.amountPaid === "" ? total.toFixed(2) : prev.amountPaid
        }))
      }
    }
  }, [formData.quantity, formData.unitCost])

  if (isLoading || !user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      category: "labor",
      description: "",
      quantity: "",
      unit: "",
      amount: "",
      supplierName: "",
      supplierContact: "",
      paymentStatus: "unpaid",
      amountPaid: "0",
      unitCost: "",
      notes: "",
    })
    setEditingExpense(null)
  }

  const saveExpense = async (expenseData: Partial<Expense>) => {
    try {
      if (expenseData.id) {
        // Update existing
        const updatedExpense = await dataService.updateExpense(expenseData.id, expenseData as Omit<Expense, "id" | "createdAt">)
        if (updatedExpense) {
          setExpenses(expenses.map((exp) => (exp.id === expenseData.id ? updatedExpense : exp)))
          window.dispatchEvent(new CustomEvent('expensesUpdated', { detail: { id: expenseData.id } }))
          toast.success("Expense record updated successfully!")
        }
      } else {
        // Add new
        const newExpense = await dataService.createExpense(expenseData as Omit<Expense, "id" | "createdAt">)
        if (newExpense) {
          setExpenses([newExpense, ...expenses])
          window.dispatchEvent(new CustomEvent('expensesUpdated', { detail: { id: newExpense.id } }))
          toast.success("Expense record added successfully!")
        }
      }
    } catch (error) {
      console.error("Error saving expense:", error)
      toast.error("Failed to save expense record")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const amount = Number.parseFloat(formData.amount)
    const amountPaid = Number.parseFloat(formData.amountPaid)

    if (Number.isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (Number.isNaN(amountPaid) || amountPaid < 0) {
      toast.error("Please enter a valid amount paid")
      return
    }

    const amountDue = Math.max(0, amount - amountPaid)

    const payload: Partial<Expense> = {
      id: editingExpense?.id,
      date: new Date(formData.date),
      category: formData.category,
      description: formData.description,
      quantity: formData.quantity ? Number.parseFloat(formData.quantity) : undefined,
      unit: formData.unit || undefined,
      amount,
      supplierName: formData.supplierName,
      supplierContact: formData.supplierContact || undefined,
      paymentStatus: formData.paymentStatus,
      amountPaid,
      amountDue,
      notes: formData.notes || undefined,
    }

    await saveExpense(payload)
    resetForm()
    setShowForm(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this expense record?")) {
      try {
        const success = await dataService.deleteExpense(id)
        if (success) {
          setExpenses(expenses.filter((exp) => exp.id !== id))
          window.dispatchEvent(new CustomEvent('expensesUpdated', { detail: { id } }))
          toast.success("Expense record deleted")
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
  const computedAmountDue = (() => {
    const amount = Number.parseFloat(formData.amount)
    const amountPaid = Number.parseFloat(formData.amountPaid)
    if (Number.isNaN(amount) || Number.isNaN(amountPaid)) return ""
    return Math.max(0, amount - amountPaid).toString()
  })()

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setShowForm(true)
    setFormData({
      date: new Date(expense.date).toISOString().split("T")[0],
      category: expense.category,
      description: expense.description,
      quantity: expense.quantity?.toString() || "",
      unit: expense.unit || "",
      amount: expense.amount.toString(),
      supplierName: expense.supplierName,
      supplierContact: expense.supplierContact || "",
      paymentStatus: expense.paymentStatus,
      amountPaid: expense.amountPaid.toString(),
      unitCost: expense.quantity && expense.quantity > 0 ? (expense.amount / expense.quantity).toFixed(2) : "",
      notes: expense.notes || "",
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-stone-900 mb-2">Expense Management</h1>
            <p className="text-stone-600">Track and manage mining operation costs across labour, maintenance, and more</p>
            <p className="text-sm text-stone-600 mt-1">💡 To capture wages previously recorded in production, add them here under the <strong>Labor</strong> category.</p>
          </div>
          <Button
            onClick={() => {
              if (showForm) {
                setShowForm(false)
                resetForm()
              } else {
                setShowForm(true)
              }
            }}
            className="gap-2 shadow-md bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
            size="lg"
          >
            <Plus className="h-5 w-5" />
            {showForm ? "Close Form" : "Add Expense"}
          </Button>
        </div>

        {showForm && (
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle>{editingExpense ? "Edit Expense" : "Add New Expense"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value as ExpenseCategory })}
                    >
                      <SelectTrigger className="border-stone-300">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="labor">Labor</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="transport">Transport</SelectItem>
                        <SelectItem value="trips">Trips</SelectItem>
                        <SelectItem value="chemicals">Chemicals</SelectItem>
                        <SelectItem value="fuel">Fuel</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of the expense"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity (Optional)</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.01"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      placeholder="Enter quantity"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit of Measurement (Optional)</Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(value) => setFormData({ ...formData, unit: value })}
                    >
                      <SelectTrigger className="border-stone-300">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="piece">Piece</SelectItem>
                        <SelectItem value="dozen">Dozen</SelectItem>
                        <SelectItem value="pair">Pair</SelectItem>
                        <SelectItem value="roll">Roll</SelectItem>
                        <SelectItem value="meters">Meters</SelectItem>
                        <SelectItem value="inch">Inch</SelectItem>
                        <SelectItem value="feet">Feet</SelectItem>
                        <SelectItem value="liter">Liter</SelectItem>
                        <SelectItem value="gram">Gram</SelectItem>
                        <SelectItem value="kilogram">Kilogram</SelectItem>
                        <SelectItem value="tonnes">Tonnes</SelectItem>
                        <SelectItem value="day">Day</SelectItem>
                        <SelectItem value="week">Week</SelectItem>
                        <SelectItem value="month">Month</SelectItem>
                        <SelectItem value="others">Others</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unitCost">Unit Cost ({currency})</Label>
                    <Input
                      id="unitCost"
                      type="number"
                      step="0.01"
                      value={formData.unitCost}
                      onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                      placeholder="Enter unit cost"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount ({currency})</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amountPaid">Amount Paid ({currency})</Label>
                    <Input
                      id="amountPaid"
                      type="number"
                      step="0.01"
                      value={formData.amountPaid}
                      onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentStatus">Payment Status</Label>
                    <Select
                      value={formData.paymentStatus}
                      onValueChange={(value) => setFormData({ ...formData, paymentStatus: value as PaymentStatus })}
                    >
                      <SelectTrigger className="border-stone-300">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amountDue">Amount Due ({currency})</Label>
                    <Input
                      id="amountDue"
                      type="number"
                      value={computedAmountDue}
                      readOnly
                      className="bg-stone-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supplierName">Supplier Name / Recipient</Label>
                    <Input
                      id="supplierName"
                      value={formData.supplierName}
                      onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                      placeholder="e.g., Labour Team Alpha"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supplierContact">Contact Information (Optional)</Label>
                    <Input
                      id="supplierContact"
                      value={formData.supplierContact}
                      onChange={(e) => setFormData({ ...formData, supplierContact: e.target.value })}
                      placeholder="Phone or Email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional information about this expense"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetForm()
                      setShowForm(false)
                    }}
                    className="border-stone-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                  >
                    {editingExpense ? "Update Expense" : "Add Expense"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

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
                filteredExpenses.map((expense, index) => (
                  <div
                    key={expense.id || `expense-${index}`}
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
                        <Button variant="outline" size="icon" onClick={() => handleEdit(expense)}>
                          <Edit className="h-4 w-4" />
                        </Button>
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

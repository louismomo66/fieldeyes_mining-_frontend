"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useCurrency } from "@/lib/currency-context"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus } from "lucide-react"
import type { Expense, ExpenseCategory, PaymentStatus } from "@/lib/types"
import { formatWithCommas, parseCommas } from "@/lib/utils"

interface ExpenseFormDialogProps {
  expense?: Expense
  onSave: (expense: Partial<Expense>) => void
  trigger?: React.ReactNode
}

export function ExpenseFormDialog({ expense, onSave, trigger }: ExpenseFormDialogProps) {
  const [open, setOpen] = useState(false)
  const { currency } = useCurrency()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    date: expense?.date ? new Date(expense.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    category: expense?.category || ("labor" as ExpenseCategory),
    description: expense?.description || "",
    amount: expense?.amount ? formatWithCommas(expense.amount) : "",
    supplierName: expense?.supplierName || "",
    supplierContact: expense?.supplierContact || "",
    paymentStatus: expense?.paymentStatus || ("unpaid" as PaymentStatus),
    amountPaid: expense?.amountPaid ? formatWithCommas(expense.amountPaid) : "0",
    quantity: expense?.quantity?.toString() || "",
    unit: expense?.unit || "",
    unitCost: expense?.quantity && expense.quantity > 0 && expense.amount ? (expense.amount / expense.quantity).toFixed(2) : "",
    notes: expense?.notes || "",
  })

  // Auto-calculate amount based on quantity and unit cost
  useEffect(() => {
    if (formData.quantity && formData.unitCost) {
      const q = Number.parseFloat(formData.quantity)
      const u = Number.parseFloat(formData.unitCost)
      if (!Number.isNaN(q) && !Number.isNaN(u)) {
        const total = q * u
        setFormData(prev => ({
          ...prev,
          amount: total.toFixed(2),
          // Also default amountPaid to the total if not set
          amountPaid: prev.amountPaid === "0" || prev.amountPaid === "" ? total.toFixed(2) : prev.amountPaid
        }))
      }
    }
  }, [formData.quantity, formData.unitCost])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const amount = Number.parseFloat(parseCommas(formData.amount))
    const amountPaid = Number.parseFloat(parseCommas(formData.amountPaid))
    const amountDue = amount - amountPaid

    const expenseData: Partial<Expense> = {
      ...expense,
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

    onSave(expenseData)
    setOpen(false)
    toast({
      title: expense ? "Expense updated" : "Expense added",
      description: `Successfully ${expense ? "updated" : "added"} expense record.`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{expense ? "Edit Expense" : "Add New Expense"}</DialogTitle>
          <DialogDescription>
            {expense ? "Update the expense record details below." : "Fill in the details to add a new expense record."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <SelectTrigger>
                  <SelectValue />
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
                <SelectTrigger>
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
                type="text"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: formatWithCommas(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierName">Supplier Name</Label>
              <Input
                id="supplierName"
                value={formData.supplierName}
                onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierContact">Supplier Contact (Optional)</Label>
              <Input
                id="supplierContact"
                value={formData.supplierContact}
                onChange={(e) => setFormData({ ...formData, supplierContact: e.target.value })}
                placeholder="+260 XXX XXX XXX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentStatus">Payment Status</Label>
              <Select
                value={formData.paymentStatus}
                onValueChange={(value) => setFormData({ ...formData, paymentStatus: value as PaymentStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amountPaid">Amount Paid ({currency})</Label>
              <Input
                id="amountPaid"
                type="text"
                value={formData.amountPaid}
                onChange={(e) => setFormData({ ...formData, amountPaid: formatWithCommas(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this expense..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
            >
              {expense ? "Update Expense" : "Add Expense"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

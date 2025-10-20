"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus } from "lucide-react"
import type { Expense, ExpenseCategory, PaymentStatus } from "@/lib/types"

interface ExpenseFormDialogProps {
  expense?: Expense
  onSave: (expense: Partial<Expense>) => void
  trigger?: React.ReactNode
}

export function ExpenseFormDialog({ expense, onSave, trigger }: ExpenseFormDialogProps) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    date: expense?.date ? new Date(expense.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    category: expense?.category || ("equipment" as ExpenseCategory),
    description: expense?.description || "",
    amount: expense?.amount?.toString() || "",
    supplierName: expense?.supplierName || "",
    supplierContact: expense?.supplierContact || "",
    paymentStatus: expense?.paymentStatus || ("unpaid" as PaymentStatus),
    amountPaid: expense?.amountPaid?.toString() || "0",
    notes: expense?.notes || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const amount = Number.parseFloat(formData.amount)
    const amountPaid = Number.parseFloat(formData.amountPaid)
    const amountDue = amount - amountPaid

    const expenseData: Partial<Expense> = {
      ...expense,
      date: new Date(formData.date),
      category: formData.category,
      description: formData.description,
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
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="labor">Labor</SelectItem>
                  <SelectItem value="chemicals">Chemicals</SelectItem>
                  <SelectItem value="fuel">Fuel</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
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
              <Label htmlFor="amount">Amount (ZMW)</Label>
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
              <Label htmlFor="amountPaid">Amount Paid (ZMW)</Label>
              <Input
                id="amountPaid"
                type="number"
                step="0.01"
                value={formData.amountPaid}
                onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
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

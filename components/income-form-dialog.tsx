"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus } from "lucide-react"
import type { Income, MineralType, PaymentStatus } from "@/lib/types"

interface IncomeFormDialogProps {
  income?: Income
  onSave: (income: Partial<Income>) => void
  trigger?: React.ReactNode
}

export function IncomeFormDialog({ income, onSave, trigger }: IncomeFormDialogProps) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    date: income?.date ? new Date(income.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    mineralType: income?.mineralType || ("gold" as MineralType),
    quantity: income?.quantity?.toString() || "",
    unit: income?.unit || "kg",
    pricePerUnit: income?.pricePerUnit?.toString() || "",
    customerName: income?.customerName || "",
    customerContact: income?.customerContact || "",
    paymentStatus: income?.paymentStatus || ("unpaid" as PaymentStatus),
    amountPaid: income?.amountPaid?.toString() || "0",
    notes: income?.notes || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const quantity = Number.parseFloat(formData.quantity)
    const pricePerUnit = Number.parseFloat(formData.pricePerUnit)
    const totalAmount = quantity * pricePerUnit
    const amountPaid = Number.parseFloat(formData.amountPaid)
    const amountDue = totalAmount - amountPaid

    const incomeData: Partial<Income> = {
      ...income,
      date: new Date(formData.date),
      mineralType: formData.mineralType,
      quantity,
      unit: formData.unit,
      pricePerUnit,
      totalAmount,
      customerName: formData.customerName,
      customerContact: formData.customerContact,
      paymentStatus: formData.paymentStatus,
      amountPaid,
      amountDue,
      notes: formData.notes || undefined,
    }

    onSave(incomeData)
    setOpen(false)
    toast({
      title: income ? "Income updated" : "Income added",
      description: `Successfully ${income ? "updated" : "added"} income record.`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Income
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{income ? "Edit Income" : "Add New Income"}</DialogTitle>
          <DialogDescription>
            {income ? "Update the income record details below." : "Fill in the details to add a new income record."}
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
              <Label htmlFor="mineralType">Mineral Type</Label>
              <Select
                value={formData.mineralType}
                onValueChange={(value) => setFormData({ ...formData, mineralType: value as MineralType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="copper">Copper</SelectItem>
                  <SelectItem value="cobalt">Cobalt</SelectItem>
                  <SelectItem value="diamond">Diamond</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="kg, tons, etc."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pricePerUnit">Price per Unit (ZMW)</Label>
              <Input
                id="pricePerUnit"
                type="number"
                step="0.01"
                value={formData.pricePerUnit}
                onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Total Amount</Label>
              <Input
                value={
                  formData.quantity && formData.pricePerUnit
                    ? `ZMW ${(Number.parseFloat(formData.quantity) * Number.parseFloat(formData.pricePerUnit)).toLocaleString()}`
                    : "ZMW 0"
                }
                disabled
                className="bg-stone-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerContact">Customer Contact</Label>
              <Input
                id="customerContact"
                value={formData.customerContact}
                onChange={(e) => setFormData({ ...formData, customerContact: e.target.value })}
                placeholder="+260 XXX XXX XXX"
                required
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
              placeholder="Additional notes about this transaction..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white"
            >
              {income ? "Update Income" : "Add Income"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

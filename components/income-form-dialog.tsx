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
import type { Income, MineralType, PaymentStatus, GemstoneType, SalesType } from "@/lib/types"

// Currency updated to UGX

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
    itemName: income?.itemName || "",
    mineralType: income?.mineralType || ("gold" as MineralType),
    gemstoneType: income?.gemstoneType || ("" as GemstoneType | ""),
    salesType: income?.salesType || ("mineral" as SalesType),
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
      itemName: formData.itemName || undefined,
      mineralType: formData.mineralType,
      gemstoneType: formData.mineralType === "gemstones" && formData.gemstoneType ? formData.gemstoneType : undefined,
      salesType: formData.salesType,
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
      title: income ? "Sales updated" : "Sales added",
      description: `Successfully ${income ? "updated" : "added"} sales record.`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Sales
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{income ? "Edit Sales" : "Add New Sales"}</DialogTitle>
          <DialogDescription>
            {income ? "Update the sales record details below." : "Fill in the details to add a new sales record."}
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
              <Label htmlFor="itemName">Item Name</Label>
              <Input
                id="itemName"
                value={formData.itemName}
                onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                placeholder="e.g., Gold Ore, Iron Ore, Lead, Zinc, Lithium, Nickel, Coltan, Tin, Wolfram, Titanium, Manganese, Rare Earth Elements, Uranium, Bentonite, Diatomite, Graphite, Gypsum, Feldspar, Limestone, Marble, Kaolin, Phosphates, Pozzolana, Salt, Sand, Vermiculite, Silver, Granite, Chromite, Gemstones"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mineralType">Mineral Type</Label>
              <Select
                value={formData.mineralType}
                onValueChange={(value) => setFormData({ ...formData, mineralType: value as MineralType, gemstoneType: value === "gemstones" ? formData.gemstoneType : "" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="copper">Copper</SelectItem>
                  <SelectItem value="cobalt">Cobalt</SelectItem>
                  <SelectItem value="diamond">Diamond</SelectItem>
                  <SelectItem value="iron_ore">Iron Ore</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="zinc">Zinc</SelectItem>
                  <SelectItem value="lithium">Lithium</SelectItem>
                  <SelectItem value="nickel">Nickel</SelectItem>
                  <SelectItem value="coltan">Coltan</SelectItem>
                  <SelectItem value="tin">Tin</SelectItem>
                  <SelectItem value="wolfram">Wolfram</SelectItem>
                  <SelectItem value="titanium">Titanium</SelectItem>
                  <SelectItem value="manganese">Manganese</SelectItem>
                  <SelectItem value="rare_earth_elements">Rare Earth Elements</SelectItem>
                  <SelectItem value="uranium">Uranium</SelectItem>
                  <SelectItem value="bentonite">Bentonite</SelectItem>
                  <SelectItem value="diatomite">Diatomite</SelectItem>
                  <SelectItem value="graphite">Graphite</SelectItem>
                  <SelectItem value="gypsum">Gypsum</SelectItem>
                  <SelectItem value="feldspar">Feldspar</SelectItem>
                  <SelectItem value="limestone">Limestone</SelectItem>
                  <SelectItem value="marble">Marble</SelectItem>
                  <SelectItem value="kaolin">Kaolin</SelectItem>
                  <SelectItem value="phosphates">Phosphates</SelectItem>
                  <SelectItem value="pozzolana">Pozzolana</SelectItem>
                  <SelectItem value="salt">Salt</SelectItem>
                  <SelectItem value="sand">Sand</SelectItem>
                  <SelectItem value="vermiculite">Vermiculite</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="granite">Granite</SelectItem>
                  <SelectItem value="chromite">Chromite</SelectItem>
                  <SelectItem value="gemstones">Gemstones</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.mineralType === "gemstones" && (
              <div className="space-y-2">
                <Label htmlFor="gemstoneType">Gemstone Type</Label>
                <Select
                  value={formData.gemstoneType || ""}
                  onValueChange={(value) => setFormData({ ...formData, gemstoneType: value as GemstoneType })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gemstone type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apatite">Apatite</SelectItem>
                    <SelectItem value="beryl">Beryl</SelectItem>
                    <SelectItem value="aquamarine">Aquamarine</SelectItem>
                    <SelectItem value="ruby">Ruby</SelectItem>
                    <SelectItem value="sapphire">Sapphire</SelectItem>
                    <SelectItem value="flourite">Flourite</SelectItem>
                    <SelectItem value="garnet">Garnet</SelectItem>
                    <SelectItem value="opal">Opal</SelectItem>
                    <SelectItem value="quartz">Quartz</SelectItem>
                    <SelectItem value="topaz">Topaz</SelectItem>
                    <SelectItem value="tourmaline">Tourmaline</SelectItem>
                    <SelectItem value="zircon">Zircon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="salesType">Type</Label>
              <Select
                value={formData.salesType}
                onValueChange={(value) => setFormData({ ...formData, salesType: value as SalesType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mineral">Mineral</SelectItem>
                  <SelectItem value="supply">Supply</SelectItem>
                  <SelectItem value="concentrates">Concentrates</SelectItem>
                  <SelectItem value="tailings">Tailings</SelectItem>
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
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">Grams (g)</SelectItem>
                  <SelectItem value="kg">Kilogram (kg)</SelectItem>
                  <SelectItem value="ct">Carats (ct)</SelectItem>
                  <SelectItem value="oz">Ounces (oz)</SelectItem>
                  <SelectItem value="tonnes">Tonnes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pricePerUnit">Price per Unit (UGX)</Label>
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
                    ? `UGX ${(Number.parseFloat(formData.quantity) * Number.parseFloat(formData.pricePerUnit)).toLocaleString()}`
                    : "UGX 0"
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
              <Label htmlFor="amountPaid">Amount Paid (UGX)</Label>
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
              {income ? "Update Sales" : "Add Sale"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

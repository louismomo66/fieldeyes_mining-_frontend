"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus } from "lucide-react"
import type { InventoryItem, ProductionFrom, ProcessingMethod } from "@/lib/types"

interface InventoryFormDialogProps {
  item?: InventoryItem
  onSave: (item: Partial<InventoryItem>) => void
  trigger?: React.ReactNode
}

export function InventoryFormDialog({ item, onSave, trigger }: InventoryFormDialogProps) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    date: item?.date ? new Date(item.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    name: item?.name || "",
    type: item?.type || ("mineral" as "mineral" | "supply"),
    from: item?.from || ("" as ProductionFrom | ""),
    pitNumber: item?.pitNumber || "",
    minerName: item?.minerName || "",
    minerSerialNumber: item?.minerSerialNumber || "",
    batchNumber: item?.batchNumber || "",
    processingMethod: item?.processingMethod || ("" as ProcessingMethod | ""),
    quantity: item?.quantity?.toString() || "",
    unit: item?.unit || "kg",
    minStockLevel: item?.minStockLevel?.toString() || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const itemData: Partial<InventoryItem> = {
      ...item,
      date: new Date(formData.date),
      name: formData.name,
      type: formData.type,
      from: formData.type === "mineral" && formData.from ? formData.from : undefined,
      pitNumber: formData.from === "mine" ? formData.pitNumber : undefined,
      minerName: formData.from === "mine" ? formData.minerName : undefined,
      minerSerialNumber: formData.minerSerialNumber || undefined,
      batchNumber: formData.batchNumber || undefined,
      processingMethod: formData.from === "processing" && formData.processingMethod ? formData.processingMethod : undefined,
      quantity: Number.parseFloat(formData.quantity),
      unit: formData.unit,
      minStockLevel: Number.parseFloat(formData.minStockLevel),
      currentValue: 0, // Set to 0 as production cost is removed
      lastUpdated: new Date(),
    }

    onSave(itemData)
    setOpen(false)
    toast({
      title: item ? "Item updated" : "Item added",
      description: `Successfully ${item ? "updated" : "added"} production item.`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Production Item" : "Add New Production Item"}</DialogTitle>
          <DialogDescription>
            {item ? "Update the production item details below." : "Fill in the details to add a new production item."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Production Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Item Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Gold Ore, Safety Equipment"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value, from: value === "mineral" ? formData.from : "" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mineral">Mineral</SelectItem>
                  <SelectItem value="supply">Supply</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.type === "mineral" && (
              <div className="space-y-2">
                <Label htmlFor="from">From</Label>
                <Select
                  value={formData.from || ""}
                  onValueChange={(value: ProductionFrom) => setFormData({ ...formData, from: value, processingMethod: "", pitNumber: "", minerName: "", minerSerialNumber: "" })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mine">Mine</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {formData.type === "mineral" && formData.from === "mine" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="pitNumber">Pit Number / Miner Name</Label>
                <Input
                  id="pitNumber"
                  value={formData.pitNumber}
                  onChange={(e) => setFormData({ ...formData, pitNumber: e.target.value })}
                  placeholder="e.g., Pit 1, Pit 2, or Miner name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minerName">Miner Name (Buying Centers)</Label>
                <Input
                  id="minerName"
                  value={formData.minerName}
                  onChange={(e) => setFormData({ ...formData, minerName: e.target.value })}
                  placeholder="Name of miner (for buying centers)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minerSerialNumber">Miner Serial Number *</Label>
                <Input
                  id="minerSerialNumber"
                  value={formData.minerSerialNumber}
                  onChange={(e) => setFormData({ ...formData, minerSerialNumber: e.target.value })}
                  placeholder="e.g., MIN-001, MIN-002"
                  required
                />
              </div>
            </div>
          )}

          {formData.type === "mineral" && formData.from === "processing" && (
            <div className="space-y-2 border-t pt-4">
              <Label htmlFor="processingMethod">Processing Method</Label>
              <Select
                value={formData.processingMethod || ""}
                onValueChange={(value: ProcessingMethod) => setFormData({ ...formData, processingMethod: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select processing method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="crushing">Crushing</SelectItem>
                  <SelectItem value="milling">Milling</SelectItem>
                  <SelectItem value="sieving">Sieving</SelectItem>
                  <SelectItem value="grading">Grading</SelectItem>
                  <SelectItem value="sorting">Sorting</SelectItem>
                  <SelectItem value="cutting">Cutting</SelectItem>
                  <SelectItem value="dressing">Dressing</SelectItem>
                  <SelectItem value="leaching">Leaching</SelectItem>
                  <SelectItem value="elution">Elution</SelectItem>
                  <SelectItem value="refining">Refining</SelectItem>
                  <SelectItem value="floatation">Floatation</SelectItem>
                  <SelectItem value="grinding">Grinding</SelectItem>
                  <SelectItem value="screening">Screening</SelectItem>
                  <SelectItem value="drying">Drying</SelectItem>
                  <SelectItem value="exfoliation">Exfoliation</SelectItem>
                  <SelectItem value="polishing">Polishing</SelectItem>
                  <SelectItem value="washing">Washing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="batchNumber">Batch Number / Serial Number</Label>
            <Input
              id="batchNumber"
              value={formData.batchNumber}
              onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
              placeholder="Serial or batch number for tracking"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                  <SelectItem value="sacks">Sacks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="minStockLevel">Minimum Stock Level</Label>
            <Input
              id="minStockLevel"
              type="number"
              step="0.01"
              value={formData.minStockLevel}
              onChange={(e) => setFormData({ ...formData, minStockLevel: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white"
            >
              {item ? "Update Item" : "Add Item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

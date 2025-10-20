"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus } from "lucide-react"
import type { InventoryItem } from "@/lib/types"

interface InventoryFormDialogProps {
  item?: InventoryItem
  onSave: (item: Partial<InventoryItem>) => void
  trigger?: React.ReactNode
}

export function InventoryFormDialog({ item, onSave, trigger }: InventoryFormDialogProps) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: item?.name || "",
    type: item?.type || ("mineral" as "mineral" | "supply"),
    quantity: item?.quantity?.toString() || "",
    unit: item?.unit || "kg",
    minStockLevel: item?.minStockLevel?.toString() || "",
    currentValue: item?.currentValue?.toString() || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const itemData: Partial<InventoryItem> = {
      ...item,
      name: formData.name,
      type: formData.type,
      quantity: Number.parseFloat(formData.quantity),
      unit: formData.unit,
      minStockLevel: Number.parseFloat(formData.minStockLevel),
      currentValue: Number.parseFloat(formData.currentValue),
      lastUpdated: new Date(),
    }

    onSave(itemData)
    setOpen(false)
    toast({
      title: item ? "Item updated" : "Item added",
      description: `Successfully ${item ? "updated" : "added"} inventory item.`,
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Inventory Item" : "Add New Inventory Item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mineral">Mineral</SelectItem>
                <SelectItem value="supply">Supply</SelectItem>
              </SelectContent>
            </Select>
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
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="kg, units, etc."
                required
              />
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

          <div className="space-y-2">
            <Label htmlFor="currentValue">Current Value (ZMW)</Label>
            <Input
              id="currentValue"
              type="number"
              step="0.01"
              value={formData.currentValue}
              onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
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

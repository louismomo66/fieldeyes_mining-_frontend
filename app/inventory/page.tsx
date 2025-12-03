"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Factory, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { dataService } from "@/lib/data-service"
import type { InventoryItem, ProductionFrom, ProcessingMethod } from "@/lib/types"

const mineralCommodities = [
  "Gold", "Iron Ore", "Lead", "Zinc", "Lithium", "Nickel",
  "Coltan", "Tin", "Wolfram", "Titanium", "Manganese",
  "Rare Earth Elements", "Uranium", "Bentonite", "Diatomite",
  "Graphite", "Gypsum", "Feldspar", "Limestone", "Marble",
  "Kaolin", "Phosphates", "Pozzolana", "Salt", "Sand",
  "Vermiculite", "Silver", "Granite", "Chromite", "Gemstones"
]

const processingMethods = [
  "crushing", "milling", "sieving", "grading", "sorting",
  "cutting", "dressing", "leaching", "elution", "refining",
  "floatation", "grinding", "screening", "drying", "exfoliation",
  "polishing", "washing"
]

export default function ProductionManagement() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [sourceType, setSourceType] = useState<ProductionFrom | "">("")
  const [production, setProduction] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    mineral: "",
    type: "mineral" as "mineral" | "supply",
    source: "" as ProductionFrom | "",
    pit: "",
    batch: "",
    minerName: "",
    method: "" as ProcessingMethod | "",
    quantity: "",
    unit: "kg",
    notes: "",
  })

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const fetchProduction = async () => {
      if (!user) return
      
      try {
        setLoading(true)
        const data = await dataService.getInventory()
        setProduction(data)
      } catch (error) {
        console.error("Failed to fetch production:", error)
        toast.error("Failed to load production data")
      } finally {
        setLoading(false)
      }
    }

    fetchProduction()
  }, [user])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    // Format unit for display
    let unitDisplay = item.unit
    if (item.unit === "kg") unitDisplay = "kilogram (kg)"
    else if (item.unit === "g") unitDisplay = "grams (g)"
    else if (item.unit === "ct") unitDisplay = "carats (ct)"
    else if (item.unit === "oz") unitDisplay = "ounces (oz)"
    else if (item.unit === "tonnes") unitDisplay = "tonnes"

    setFormData({
      date: new Date(item.lastUpdated).toISOString().split("T")[0],
      mineral: item.name,
      type: item.type,
      source: item.from || ("" as ProductionFrom | ""),
      pit: item.pitNumber || "",
      batch: item.batchNumber || "",
      minerName: item.minerName || "",
      method: item.processingMethod || ("" as ProcessingMethod | ""),
      quantity: item.quantity.toString(),
      unit: unitDisplay,
      notes: "",
    })
    setSourceType(item.from || "")
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Extract unit value (e.g., "kilogram (kg)" -> "kg")
      const unitValue = formData.unit.split("(")[1]?.replace(")", "").trim() || formData.unit || "kg"

      const itemData: Partial<InventoryItem> = {
        name: formData.mineral,
        type: formData.type,
        from: formData.source || undefined,
        pitNumber: formData.source === "mine" ? formData.pit : undefined,
        minerName: formData.source === "mine" ? formData.minerName : undefined,
        batchNumber: formData.batch || undefined,
        processingMethod: formData.source === "processing" && formData.method ? formData.method : undefined,
        quantity: parseFloat(formData.quantity),
        unit: unitValue,
        minStockLevel: 0, // Default for production records
        currentValue: 0, // Production cost removed - set to 0
        lastUpdated: new Date(formData.date),
      }

      if (editingItem) {
        // Update existing production record
        const updatedItem = await dataService.updateInventoryItem(editingItem.id, {
          name: itemData.name!,
          type: itemData.type!,
          from: itemData.from,
          pitNumber: itemData.pitNumber,
          minerName: itemData.minerName,
          batchNumber: itemData.batchNumber,
          processingMethod: itemData.processingMethod,
          quantity: itemData.quantity!,
          unit: itemData.unit!,
          minStockLevel: itemData.minStockLevel!,
          currentValue: itemData.currentValue!,
          lastUpdated: itemData.lastUpdated!,
        })
        if (updatedItem) {
          setProduction(production.map(p => p.id === editingItem.id ? updatedItem : p))
          toast.success("Production record updated successfully!")
        }
    } else {
        // Create new production record
        const newItem = await dataService.createInventoryItem({
          name: itemData.name!,
          type: itemData.type!,
          from: itemData.from,
          pitNumber: itemData.pitNumber,
          minerName: itemData.minerName,
          batchNumber: itemData.batchNumber,
          processingMethod: itemData.processingMethod,
          quantity: itemData.quantity!,
          unit: itemData.unit!,
          minStockLevel: itemData.minStockLevel!,
          currentValue: itemData.currentValue!,
          lastUpdated: itemData.lastUpdated!,
        })
        if (newItem) {
          setProduction([newItem, ...production])
          toast.success("Production record added successfully!")
        }
      }
      
      setShowForm(false)
      setEditingItem(null)
      // Reset form
      setFormData({
        date: new Date().toISOString().split("T")[0],
        mineral: "",
        type: "mineral",
        source: "" as ProductionFrom | "",
        pit: "",
        batch: "",
        minerName: "",
        method: "" as ProcessingMethod | "",
        quantity: "",
        unit: "kg",
        cost: "",
        notes: "",
      })
      setSourceType("")
    } catch (error) {
      console.error("Failed to save production:", error)
      toast.error(`Failed to ${editingItem ? "update" : "add"} production record`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this production record?")) return

    try {
      await dataService.deleteInventoryItem(id)
      setProduction(production.filter((item) => item.id !== id))
      toast.success("Production record deleted successfully!")
    } catch (error) {
      console.error("Failed to delete production:", error)
      toast.error("Failed to delete production record")
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Instructions */}
        <div className="rounded-lg border-l-4 border-amber-600 bg-amber-50/50 p-4">
          <div className="flex items-start justify-between">
          <div>
              <h1 className="text-3xl font-bold text-stone-900 flex items-center gap-2">
                <Factory className="h-8 w-8 text-amber-700" />
                Production
              </h1>
              <p className="text-stone-600 mt-1">
                📝 <strong>What to do here:</strong> Log daily production output and track quantities
              </p>
              <p className="text-sm text-stone-600 mt-2">
                💡 Click "Add Production" button to record a new production record with mineral details and quantities
              </p>
            </div>
            <Button 
              onClick={() => setShowForm(!showForm)} 
              className="gap-2 shadow-md bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white" 
              size="lg"
            >
              <Plus className="h-5 w-5" />
              Add Production
            </Button>
          </div>
        </div>

        {showForm && (
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle>{editingItem ? "Edit Production Record" : "Add New Production Record"}</CardTitle>
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
                    <Label htmlFor="mineral">Mineral Commodity</Label>
                    <Select 
                      value={formData.mineral} 
                      onValueChange={(value) => {
                        setFormData({ ...formData, mineral: value })
                      }} 
                      required
                    >
                      <SelectTrigger className="border-stone-300">
                        <SelectValue placeholder="Select mineral" />
                      </SelectTrigger>
                      <SelectContent>
                        {mineralCommodities.map((mineral) => (
                          <SelectItem key={mineral} value={mineral}>
                            {mineral}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="source">From</Label>
                    <Select 
                      value={sourceType} 
                      onValueChange={(value) => {
                        setSourceType(value as ProductionFrom)
                        setFormData({ ...formData, source: value as ProductionFrom, pit: "", minerName: "", method: "" as ProcessingMethod })
                      }} 
                      required
                    >
                      <SelectTrigger className="border-stone-300">
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mine">Mine</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {sourceType === "mine" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="pit">Pit Number / Miner Name</Label>
                        <Input 
                          id="pit" 
                          type="text" 
                          placeholder="e.g., Pit 1" 
                          value={formData.pit}
                          onChange={(e) => setFormData({ ...formData, pit: e.target.value })}
                          required 
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="minerName">Miner Name (Buying Centers)</Label>
                        <Input 
                          id="minerName" 
                          type="text" 
                          placeholder="Name of miner"
                          value={formData.minerName}
                          onChange={(e) => setFormData({ ...formData, minerName: e.target.value })}
                        />
        </div>

                      <div className="space-y-2">
                        <Label htmlFor="batch">Batch Number</Label>
                        <Input 
                          id="batch" 
                          type="text" 
                          placeholder="Serial number" 
                          value={formData.batch}
                          onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                          required 
                        />
                      </div>
                    </>
                  )}

                  {sourceType === "processing" && (
                    <div className="space-y-2">
                      <Label htmlFor="method">Processing Method</Label>
                      <Select 
                        value={formData.method}
                        onValueChange={(value) => setFormData({ ...formData, method: value as ProcessingMethod })}
                        required
                      >
                        <SelectTrigger className="border-stone-300">
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          {processingMethods.map((method) => (
                            <SelectItem key={method} value={method}>
                              {method.charAt(0).toUpperCase() + method.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

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
                      required
                    >
                      <SelectTrigger className="border-stone-300">
                        <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
                        <SelectItem value="kg">Kilogram (kg)</SelectItem>
                        <SelectItem value="tonnes">Tonnes</SelectItem>
                        <SelectItem value="g">Grams (g)</SelectItem>
                        <SelectItem value="oz">Ounces (oz)</SelectItem>
                        <SelectItem value="ct">Carats (ct)</SelectItem>
            </SelectContent>
          </Select>
        </div>


                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Input 
                      id="notes" 
                      type="text" 
                      placeholder="Additional information" 
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowForm(false)
                      setEditingItem(null)
                      setFormData({
                        date: new Date().toISOString().split("T")[0],
                        mineral: "",
                        type: "mineral",
                        source: "" as ProductionFrom | "",
                        pit: "",
                        batch: "",
                        minerName: "",
                        method: "" as ProcessingMethod | "",
                        quantity: "",
                        unit: "kg",
                        notes: "",
                      })
                      setSourceType("")
                    }}
                    className="border-stone-300"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white"
                  >
                    {editingItem ? "Update Production" : "Add Production"}
                  </Button>
              </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Production Table */}
              <Card className="border-stone-200">
          <CardHeader>
            <CardTitle>Production Records</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
          ) : (
              <div className="rounded-md border border-stone-200 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50">
                      <th className="p-3 text-left font-medium text-stone-900">Date</th>
                      <th className="p-3 text-left font-medium text-stone-900">Mineral</th>
                      <th className="p-3 text-left font-medium text-stone-900">Source</th>
                      <th className="p-3 text-left font-medium text-stone-900">Pit/Miner</th>
                      <th className="p-3 text-left font-medium text-stone-900">Quantity</th>
                      <th className="p-3 text-left font-medium text-stone-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {production.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-stone-500">
                          No production records found. Click "Add Production" to create one.
                        </td>
                      </tr>
                    ) : (
                      production
                        .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
                        .map((item) => (
                          <tr key={item.id} className="border-b border-stone-200 last:border-0">
                            <td className="p-3 text-stone-700">{formatDate(item.lastUpdated)}</td>
                            <td className="p-3 text-stone-700 font-medium">{item.name}</td>
                            <td className="p-3">
                              {item.from === "mine" ? (
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                  Mine
                                </Badge>
                              ) : item.from === "processing" ? (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  Processing
                                </Badge>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="p-3 text-stone-700">
                              {item.pitNumber || item.minerName || "-"}
                            </td>
                            <td className="p-3 text-stone-700">
                              {item.quantity.toLocaleString()} {item.unit}
                            </td>
                            <td className="p-3">
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEdit(item)}
                                >
                                  <Edit className="h-4 w-4 text-amber-600" />
                            </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleDelete(item.id)}
                                >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
                    </div>
            )}
                  </CardContent>
                </Card>
      </div>
    </DashboardLayout>
  )
}

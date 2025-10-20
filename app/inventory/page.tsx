"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { InventoryFormDialog } from "@/components/inventory-form-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { dataService } from "@/lib/data-service"
import { Edit, Trash2, Search, AlertTriangle, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import type { InventoryItem } from "@/lib/types"

export default function InventoryPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | "mineral" | "supply">("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const fetchInventory = async () => {
      if (!user) return
      
      try {
        setLoading(true)
        const inventoryData = await dataService.getInventory()
        setInventory(inventoryData)
      } catch (error) {
        console.error("Failed to fetch inventory:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchInventory()
  }, [user])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  const handleSave = async (itemData: Partial<InventoryItem>) => {
    try {
      if (itemData.id) {
        // Update existing
        await dataService.updateInventoryItem(itemData.id, itemData)
        setInventory(inventory.map((item) => (item.id === itemData.id ? { ...item, ...itemData } : item)))
      } else {
        // Add new
        const newItem = await dataService.createInventoryItem(itemData)
        setInventory([newItem, ...inventory])
      }
    } catch (error) {
      console.error("Failed to save inventory item:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this inventory item?")) {
      try {
        await dataService.deleteInventoryItem(id)
        setInventory(inventory.filter((item) => item.id !== id))
      } catch (error) {
        console.error("Failed to delete inventory item:", error)
      }
    }
  }

  const filteredInventory = inventory.filter((item) => {
    if (typeFilter !== "all" && item.type !== typeFilter) return false
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  const getStockStatus = (item: InventoryItem) => {
    const percentage = (item.quantity / item.minStockLevel) * 100
    if (percentage <= 50) return { label: "Critical", color: "text-red-700", bgColor: "bg-red-100" }
    if (percentage <= 100) return { label: "Low", color: "text-amber-700", bgColor: "bg-amber-100" }
    return { label: "Good", color: "text-emerald-700", bgColor: "bg-emerald-100" }
  }

  const getStockPercentage = (item: InventoryItem) => {
    return Math.min((item.quantity / (item.minStockLevel * 2)) * 100, 100)
  }

  const totalValue = filteredInventory.reduce((sum, item) => sum + item.currentValue, 0)
  const lowStockItems = filteredInventory.filter((item) => item.quantity <= item.minStockLevel).length
  const minerals = filteredInventory.filter((item) => item.type === "mineral")
  const supplies = filteredInventory.filter((item) => item.type === "supply")

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-stone-900 mb-2">Inventory Management</h1>
            <p className="text-stone-600">Track minerals and supplies stock levels</p>
          </div>
          <InventoryFormDialog onSave={handleSave} />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-stone-600">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-stone-900">{formatCurrency(totalValue)}</p>
            </CardContent>
          </Card>
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-stone-600">Total Items</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-stone-900">{filteredInventory.length}</p>
            </CardContent>
          </Card>
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-stone-600">Low Stock Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-700">{lowStockItems}</p>
            </CardContent>
          </Card>
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-stone-600">Minerals / Supplies</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-stone-900">
                {minerals.length} / {supplies.length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-400" />
            <Input
              placeholder="Search inventory items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="mineral">Minerals</SelectItem>
              <SelectItem value="supply">Supplies</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Low Stock Alerts */}
        {lowStockItems > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-700" />
                <CardTitle className="text-amber-900">Low Stock Alerts</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-amber-800">
                {lowStockItems} item{lowStockItems > 1 ? "s are" : " is"} at or below minimum stock level. Consider
                restocking soon.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Inventory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInventory.length === 0 ? (
            <div className="col-span-full">
              <Card className="border-stone-200">
                <CardContent className="py-12">
                  <div className="text-center">
                    <Package className="h-12 w-12 text-stone-400 mx-auto mb-4" />
                    <p className="text-stone-500">No inventory items found</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            filteredInventory.map((item) => {
              const status = getStockStatus(item)
              const percentage = getStockPercentage(item)

              return (
                <Card key={item.id || `inventory-${index}`} className="border-stone-200 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{item.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              item.type === "mineral"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-stone-100 text-stone-700 border-stone-200",
                            )}
                          >
                            {item.type}
                          </Badge>
                          <Badge variant="outline" className={cn("text-xs", status.bgColor, status.color)}>
                            {status.label}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <InventoryFormDialog
                          item={item}
                          onSave={handleSave}
                          trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-stone-600">Stock Level</span>
                        <span className="font-medium text-stone-900">
                          {item.quantity} / {item.minStockLevel * 2} {item.unit}
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <p className="text-xs text-stone-500 mt-1">
                        Min: {item.minStockLevel} {item.unit}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-stone-200 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-stone-600">Current Value</span>
                        <span className="text-sm font-bold text-stone-900">{formatCurrency(item.currentValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-stone-500">Last Updated</span>
                        <span className="text-xs text-stone-600">{formatDate(item.lastUpdated)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

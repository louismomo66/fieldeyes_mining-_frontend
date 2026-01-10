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
import { Plus, DollarSign, Trash2, Edit } from "lucide-react"
import { toast } from "sonner"
import { dataService } from "@/lib/data-service"
import type { Income, PaymentStatus } from "@/lib/types"
import { cn, formatWithCommas, parseCommas } from "@/lib/utils"

const mineralCommodities = [
  "Gold", "Iron Ore", "Lead", "Zinc", "Lithium", "Nickel",
  "Coltan", "Tin", "Wolfram", "Titanium", "Manganese",
  "Rare Earth Elements", "Uranium", "Bentonite", "Diatomite",
  "Graphite", "Gypsum", "Feldspar", "Limestone", "Marble",
  "Kaolin", "Phosphates", "Pozzolana", "Salt", "Sand",
  "Vermiculite", "Silver", "Granite", "Chromite", "Gemstones"
]

const gemstoneTypes = [
  "Apatite", "Beryl", "Aquamarine", "Ruby", "Sapphire",
  "Flourite", "Garnet", "Opal", "Quartz", "Topaz",
  "Tourmaline", "Zircon"
]

const gemstoneQualities = ["Rough", "Cut", "Polished", "Faceted", "Jewelry"]

const productTypes = ["Mineral", "Supply", "Concentrates", "Tailings"]

const units = ["grams (g)", "kilogram (kg)", "carats (ct)", "ounces (oz)", "tonnes", "trips", "loads"]

export default function SalesManagement() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editingSale, setEditingSale] = useState<Income | null>(null)
  const [selectedMineral, setSelectedMineral] = useState("")
  const [selectedType, setSelectedType] = useState("")
  const [selectedGemstone, setSelectedGemstone] = useState("")
  const [selectedGemstoneQuality, setSelectedGemstoneQuality] = useState("")
  const [sales, setSales] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    mineral: "",
    gemstone: "",
    gemstoneQuality: "",
    type: "",
    quantity: "",
    unit: "",
    pricePerUnit: "",
    totalAmount: "",
    buyerName: "",
    contact: "",
    paymentStatus: "unpaid" as "paid" | "unpaid" | "partial",
    amountPaid: "",
  })

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const loadSales = async () => {
      if (user) {
        try {
          setLoading(true)
          const data = await dataService.getIncomes()
          setSales(data)
        } catch (error) {
          console.error("Error loading sales:", error)
          toast.error("Failed to load sales data")
        } finally {
          setLoading(false)
        }
      }
    }

    loadSales()

    // Refresh data when page becomes visible (user returns from another page)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        loadSales()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user, toast])

  // Auto-calculate total amount
  useEffect(() => {
    if (formData.quantity && formData.pricePerUnit) {
      const quantity = parseFloat(formData.quantity)
      const price = parseFloat(parseCommas(formData.pricePerUnit))
      if (!isNaN(quantity) && !isNaN(price)) {
        const total = quantity * price
        setFormData(prev => ({ ...prev, totalAmount: total.toFixed(2) }))
      }
    }
  }, [formData.quantity, formData.pricePerUnit])

  // Auto-update payment status based on amount paid (only if status hasn't been manually changed recently)
  const [isManualStatusChange, setIsManualStatusChange] = useState(false)

  useEffect(() => {
    if (isManualStatusChange) {
      return
    }

    const total = parseFloat(parseCommas(formData.totalAmount || "0"))
    const paid = parseFloat(parseCommas(formData.amountPaid || "0"))
    if (total > 0) {
      if (paid >= total) {
        setFormData(prev => ({ ...prev, paymentStatus: "paid" }))
      } else if (paid > 0) {
        setFormData(prev => ({ ...prev, paymentStatus: "partial" }))
      } else {
        setFormData(prev => ({ ...prev, paymentStatus: "unpaid" }))
      }
    }
  }, [formData.totalAmount, formData.amountPaid, isManualStatusChange])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  const handleEdit = (sale: Income) => {
    setIsManualStatusChange(false)
    setEditingSale(sale)
    // Map mineral type to commodity name
    let commodityName = sale.mineralType.charAt(0).toUpperCase() + sale.mineralType.slice(1)
    if (commodityName === "Iron_ore") commodityName = "Iron Ore"
    else if (commodityName === "Rare_earth_elements") commodityName = "Rare Earth Elements"

    // Format unit for display (e.g., "kg" -> "kilogram (kg)")
    let unitDisplay = sale.unit
    if (sale.unit === "kg") unitDisplay = "kilogram (kg)"
    else if (sale.unit === "g") unitDisplay = "grams (g)"
    else if (sale.unit === "ct") unitDisplay = "carats (ct)"
    else if (sale.unit === "oz") unitDisplay = "ounces (oz)"
    else if (sale.unit === "tonnes") unitDisplay = "tonnes"
    else if (sale.unit === "trips") unitDisplay = "trips"
    else if (sale.unit === "loads") unitDisplay = "loads"

    setFormData({
      date: new Date(sale.date).toISOString().split("T")[0],
      mineral: commodityName,
      gemstone: "",
      gemstoneQuality: "",
      type: "Mineral",
      quantity: sale.quantity.toString(),
      unit: unitDisplay,
      pricePerUnit: formatWithCommas(sale.pricePerUnit),
      totalAmount: formatWithCommas(sale.totalAmount),
      buyerName: sale.customerName,
      contact: sale.customerContact || "",
      paymentStatus: sale.paymentStatus,
      amountPaid: formatWithCommas(sale.amountPaid),
    })
    setSelectedMineral(commodityName)
    setSelectedType("Mineral")
    setSelectedGemstone("")
    setSelectedGemstoneQuality("")
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Map mineral commodity to mineralType (simplified mapping)
      let mineralType = "other"
      if (selectedMineral === "Gold") mineralType = "gold"
      else if (selectedMineral === "Iron Ore") mineralType = "iron_ore"
      else if (selectedMineral === "Copper") mineralType = "copper"
      else if (selectedMineral === "Cobalt") mineralType = "cobalt"
      else if (selectedMineral === "Diamond") mineralType = "diamond"

      // Map sales type
      let salesType = "mineral"
      if (selectedType === "Supply") salesType = "supply"
      else if (selectedType === "Concentrates") salesType = "concentrates"
      else if (selectedType === "Tailings") salesType = "tailings"

      // Extract unit value (e.g., "kilogram (kg)" -> "kg")
      const unitValue = formData.unit.split("(")[1]?.replace(")", "").trim() || formData.unit || "kg"

      // Calculate payment details
      const totalAmount = parseFloat(parseCommas(formData.totalAmount || "0"))
      const amountPaid = parseFloat(parseCommas(formData.amountPaid || "0"))
      const amountDue = totalAmount - amountPaid

      // Use the selected payment status (user can override auto-calculation)
      let paymentStatus: "paid" | "unpaid" | "partial" = formData.paymentStatus

      // If the user hasn't manually changed the status, align it with amounts
      if (!isManualStatusChange) {
        if (amountPaid >= totalAmount && totalAmount > 0) {
          paymentStatus = "paid"
        } else if (amountPaid > 0 && amountPaid < totalAmount) {
          paymentStatus = "partial"
        } else {
          paymentStatus = "unpaid"
        }
      }

      const incomeData: Partial<Income> = {
        date: new Date(formData.date),
        mineralType: mineralType as any,
        quantity: parseFloat(formData.quantity),
        unit: unitValue,
        pricePerUnit: parseFloat(parseCommas(formData.pricePerUnit)),
        totalAmount,
        customerName: formData.buyerName,
        customerContact: formData.contact || "",
        paymentStatus,
        amountPaid,
        amountDue: Math.max(0, amountDue),
        notes: selectedMineral === "Gemstones" ? `Gemstone Type: ${selectedGemstone}, Quality: ${selectedGemstoneQuality}` : undefined,
      }

      if (editingSale) {
        // Update existing sale
        console.log("Updating sale:", editingSale.id, "with data:", incomeData)
        const updatedIncome = await dataService.updateIncome(editingSale.id, incomeData as Omit<Income, "id" | "createdAt">)
        if (updatedIncome) {
          console.log("Sale updated successfully:", updatedIncome)
          // Reload all sales to ensure consistency across the app
          const refreshedSales = await dataService.getIncomes()
          setSales(refreshedSales)
          setIsManualStatusChange(false)
          toast.success(`Sale record updated successfully! Status: ${updatedIncome.paymentStatus}, Amount Paid: ${formatCurrency(updatedIncome.amountPaid)}`)

          // Dispatch custom event to notify other components (Dashboard, Analytics, Reports)
          window.dispatchEvent(new CustomEvent('salesUpdated', {
            detail: {
              saleId: editingSale.id,
              paymentStatus: updatedIncome.paymentStatus,
              amountPaid: updatedIncome.amountPaid,
              amountDue: updatedIncome.amountDue
            }
          }))
        } else {
          console.error("Failed to update sale - no response from backend")
          toast.error("Failed to update sale record. Please try again.")
        }
      } else {
        // Create new sale
        const newIncome = await dataService.createIncome(incomeData as Omit<Income, "id" | "createdAt">)
        if (newIncome) {
          setSales([newIncome, ...sales])
          toast.success("Sale record added successfully!")
        }
      }

      setShowForm(false)
      setEditingSale(null)
      setIsManualStatusChange(false)
      // Reset form
      setFormData({
        date: new Date().toISOString().split("T")[0],
        mineral: "",
        gemstone: "",
        gemstoneQuality: "",
        type: "",
        quantity: "",
        unit: "",
        pricePerUnit: "",
        totalAmount: "",
        buyerName: "",
        contact: "",
        paymentStatus: "unpaid",
        amountPaid: "",
      })
      setSelectedMineral("")
      setSelectedType("")
      setSelectedGemstone("")
      setSelectedGemstoneQuality("")
    } catch (error) {
      console.error("Failed to save sale:", error)
      toast.error(`Failed to ${editingSale ? "update" : "add"} sale record`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sales record?")) return

    try {
      await dataService.deleteIncome(id)
      setSales(sales.filter((sale) => sale.id !== id))
      toast.success("Sales record deleted successfully!")
    } catch (error) {
      console.error("Failed to delete sale:", error)
      toast.error("Failed to delete sales record")
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
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d)
  }

  const getStatusColor = (status: PaymentStatus) => {
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Instructions */}
        <div className="rounded-lg border-l-4 border-emerald-600 bg-emerald-50/50 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-stone-900 flex items-center gap-2">
                <DollarSign className="h-8 w-8 text-emerald-700" />
                Sales
              </h1>
              <p className="text-stone-600 mt-1">
                📝 <strong>What to do here:</strong> Record all mineral sales transactions
              </p>
              <p className="text-sm text-stone-600 mt-2">
                💡 Click "Add Sale" button to record a new transaction with buyer details and pricing
              </p>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="gap-2 shadow-md bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white"
              size="lg"
            >
              <Plus className="h-5 w-5" />
              Add Sale
            </Button>
          </div>
        </div>

        {showForm && (
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle>{editingSale ? "Edit Sale" : "Add New Sale"}</CardTitle>
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
                      className="border-stone-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mineral">Mineral Commodity</Label>
                    <Select
                      value={selectedMineral}
                      onValueChange={(value) => {
                        setSelectedMineral(value)
                        setFormData({ ...formData, mineral: value })
                        setSelectedGemstone("") // Reset gemstone when mineral changes
                        setSelectedGemstoneQuality("") // Reset gemstone quality when mineral changes
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

                  {selectedMineral === "Gemstones" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="gemstone">Gemstone Type</Label>
                        <Select
                          value={selectedGemstone}
                          onValueChange={(value) => {
                            setSelectedGemstone(value)
                            setFormData({ ...formData, gemstone: value })
                          }}
                          required
                        >
                          <SelectTrigger className="border-stone-300">
                            <SelectValue placeholder="Select gemstone type" />
                          </SelectTrigger>
                          <SelectContent>
                            {gemstoneTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="gemstoneQuality">Quality/Processing</Label>
                        <Select
                          value={selectedGemstoneQuality}
                          onValueChange={(value) => {
                            setSelectedGemstoneQuality(value)
                            setFormData({ ...formData, gemstoneQuality: value })
                          }}
                          required
                        >
                          <SelectTrigger className="border-stone-300">
                            <SelectValue placeholder="Select quality" />
                          </SelectTrigger>
                          <SelectContent>
                            {gemstoneQualities.map((quality) => (
                              <SelectItem key={quality} value={quality}>
                                {quality}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {selectedMineral !== "Gemstones" && (
                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={selectedType}
                        onValueChange={(value) => {
                          setSelectedType(value)
                          setFormData({ ...formData, type: value })
                        }}
                        required
                      >
                        <SelectTrigger className="border-stone-300">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {productTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
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
                      className="border-stone-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit of Measurement</Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(value) => setFormData({ ...formData, unit: value })}
                      required
                    >
                      <SelectTrigger className="border-stone-300">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price per Unit (UGX)</Label>
                    <Input
                      id="price"
                      type="text"
                      value={formData.pricePerUnit}
                      onChange={(e) => setFormData({ ...formData, pricePerUnit: formatWithCommas(e.target.value) })}
                      required
                      className="border-stone-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="total">Total Amount (UGX)</Label>
                    <Input
                      id="total"
                      type="text"
                      value={formatWithCommas(formData.totalAmount)}
                      required
                      readOnly
                      className="bg-stone-50 border-stone-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buyer">Buyer Name (Optional)</Label>
                    <Input
                      id="buyer"
                      type="text"
                      value={formData.buyerName}
                      onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                      placeholder="Enter buyer name"
                      className="border-stone-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact">Contact Information (Optional)</Label>
                    <Input
                      id="contact"
                      type="text"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      placeholder="+260 XXX XXX XXX"
                      className="border-stone-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentStatus">Payment Status</Label>
                    <Select
                      value={formData.paymentStatus}
                      onValueChange={(value: "paid" | "unpaid" | "partial") => {
                        setIsManualStatusChange(true)
                        setFormData({ ...formData, paymentStatus: value })
                      }}
                      required
                    >
                      <SelectTrigger className="border-stone-300">
                        <SelectValue placeholder="Select payment status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-stone-500">
                      💡 Status will auto-update based on amount paid, but you can override it manually
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amountPaid">Amount Paid (UGX)</Label>
                    <Input
                      id="amountPaid"
                      type="text"
                      value={formData.amountPaid}
                      onChange={(e) => {
                        const paid = formatWithCommas(e.target.value)
                        setIsManualStatusChange(false)
                        setFormData({ ...formData, amountPaid: paid })
                      }}
                      className="border-stone-300"
                    />
                    {formData.totalAmount && (
                      <p className="text-xs text-stone-500">
                        Amount Due: {formatCurrency(Math.max(0, parseFloat(parseCommas(formData.totalAmount || "0")) - parseFloat(parseCommas(formData.amountPaid || "0"))))}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false)
                      setEditingSale(null)
                      setIsManualStatusChange(false)
                      setFormData({
                        date: new Date().toISOString().split("T")[0],
                        mineral: "",
                        gemstone: "",
                        gemstoneQuality: "",
                        type: "",
                        quantity: "",
                        unit: "",
                        pricePerUnit: "",
                        totalAmount: "",
                        buyerName: "",
                        contact: "",
                        paymentStatus: "unpaid",
                        amountPaid: "",
                      })
                      setSelectedMineral("")
                      setSelectedType("")
                      setSelectedGemstone("")
                      setSelectedGemstoneQuality("")
                    }}
                    className="border-stone-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white"
                  >
                    {editingSale ? "Update Sale" : "Add Sale"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Sales Table */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
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
                      <th className="p-3 text-left font-medium text-stone-900">Quantity</th>
                      <th className="p-3 text-left font-medium text-stone-900">Total Amount</th>
                      <th className="p-3 text-left font-medium text-stone-900">Amount Paid</th>
                      <th className="p-3 text-left font-medium text-stone-900">Amount Due</th>
                      <th className="p-3 text-left font-medium text-stone-900">Status</th>
                      <th className="p-3 text-left font-medium text-stone-900">Buyer</th>
                      <th className="p-3 text-left font-medium text-stone-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-stone-500">
                          No sales records found. Click "Add Sale" to create one.
                        </td>
                      </tr>
                    ) : (
                      sales
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((sale) => (
                          <tr key={sale.id} className="border-b border-stone-200 last:border-0 hover:bg-stone-50">
                            <td className="p-3 text-stone-700">{formatDate(sale.date)}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-stone-900">
                                  {sale.mineralType.charAt(0).toUpperCase() + sale.mineralType.slice(1).replace(/_/g, ' ')}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-stone-700">
                              {sale.quantity.toLocaleString()} {sale.unit}
                            </td>
                            <td className="p-3 font-medium text-emerald-700">{formatCurrency(sale.totalAmount)}</td>
                            <td className="p-3 text-stone-700">{formatCurrency(sale.amountPaid)}</td>
                            <td className="p-3">
                              {sale.amountDue > 0 ? (
                                <span className="font-medium text-amber-700">{formatCurrency(sale.amountDue)}</span>
                              ) : (
                                <span className="text-stone-400">-</span>
                              )}
                            </td>
                            <td className="p-3">
                              <Badge variant="outline" className={cn("text-xs", getStatusColor(sale.paymentStatus))}>
                                {sale.paymentStatus.charAt(0).toUpperCase() + sale.paymentStatus.slice(1)}
                              </Badge>
                            </td>
                            <td className="p-3 text-stone-700">{sale.customerName}</td>
                            <td className="p-3">
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEdit(sale)}
                                >
                                  <Edit className="h-4 w-4 text-amber-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleDelete(sale.id)}
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

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Save, MapPin } from "lucide-react"
import { toast } from "sonner"
import { dataService } from "@/lib/data-service"
import type { MineSiteInfo } from "@/lib/types"

export default function MineSiteInfoPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mineSiteInfo, setMineSiteInfo] = useState<MineSiteInfo | null>(null)
  const [formData, setFormData] = useState({
    owner: "",
    license: "",
    location: "",
    size: "",
    numberOfPits: "",
    commodities: "",
    equipment: "",
    employees: "",
    establishedYear: "",
    contact: "",
  })
  const [pitsData, setPitsData] = useState<Array<{ name: string; mineral: string; output: number }>>([])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const loadMineSiteInfo = async () => {
      if (!user) return

      try {
        setLoading(true)
        const info = await dataService.getMineSiteInfo()
        if (info) {
          setMineSiteInfo(info)
          setFormData({
            owner: info.owner || "",
            license: info.license || "",
            location: info.location || "",
            size: info.size?.toString() || "",
            numberOfPits: info.number_of_pits?.toString() || "",
            commodities: info.commodities || "",
            equipment: info.equipment || "",
            employees: info.employees?.toString() || "",
            establishedYear: info.established_year?.toString() || "",
            contact: info.contact || "",
          })
        } else {
          setMineSiteInfo(null)
          setIsEditing(true)
          toast.info("Please complete your mine site information to unlock the rest of the application.")
        }
      } catch (error) {
        console.error("Failed to load mine site info:", error)
        toast.error("Failed to load mine site information")
      } finally {
        setLoading(false)
      }
    }

    loadMineSiteInfo()
  }, [user])

  useEffect(() => {
    const loadPitsData = async () => {
      if (!user) return

      try {
        const inventory = await dataService.getInventory()
        const pitsMap = new Map<string, { mineral: string; output: number }>()

        inventory
          .filter(item => item.from === "mine" && item.pitNumber)
          .forEach(item => {
            const pitName = item.pitNumber || "Unknown"
            const existing = pitsMap.get(pitName)
            if (existing) {
              existing.output += item.quantity
            } else {
              pitsMap.set(pitName, {
                mineral: item.name,
                output: item.quantity,
              })
            }
          })

        const pits = Array.from(pitsMap.entries()).map(([name, data]) => ({
          name,
          ...data,
        }))

        setPitsData(pits)
      } catch (error) {
        console.error("Failed to load pits data:", error)
      }
    }

    loadPitsData()
  }, [user])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const updatedInfo = await dataService.createOrUpdateMineSiteInfo({
        owner: formData.owner,
        license: formData.license || undefined,
        location: formData.location,
        size: formData.size ? parseFloat(formData.size) : undefined,
        number_of_pits: formData.numberOfPits ? parseInt(formData.numberOfPits) : undefined,
        commodities: formData.commodities || undefined,
        equipment: formData.equipment || undefined,
        employees: formData.employees ? parseInt(formData.employees) : undefined,
        established_year: formData.establishedYear ? parseInt(formData.establishedYear) : undefined,
        contact: formData.contact || undefined,
      })

      if (updatedInfo) {
        setMineSiteInfo(updatedInfo)
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("mineInfoUpdated"))
        }
        toast.success("Mine site information updated successfully!")
        setIsEditing(false)
      } else {
        toast.error("Failed to update mine site information")
      }
    } catch (error) {
      console.error("Failed to save mine site info:", error)
      toast.error("Failed to update mine site information")
    }
  }
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Instructions */}
        <div className="rounded-lg border-l-4 border-amber-600 bg-amber-50 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-stone-900 flex items-center gap-2">
                <MapPin className="h-8 w-8 text-amber-600" />
                Mine Site Information
              </h1>
              <p className="text-stone-600 mt-1">
                📝 <strong>What to do here:</strong> Manage your mining facility details, license info, and equipment inventory
              </p>
              <p className="text-sm text-stone-600 mt-2">
                💡 Click "Edit Info" to update facility details, then "Save Changes" when done
              </p>
            </div>
            <Button onClick={() => setIsEditing(!isEditing)} className="gap-2 shadow-md" size="lg">
              {isEditing ? (
                <>
                  <Save className="h-5 w-5" />
                  Save Changes
                </>
              ) : (
                <>
                  <Edit className="h-5 w-5" />
                  Edit Info
                </>
              )}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          </div>
        ) : (
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle>Facility Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="owner">Owner / Company Name</Label>
                    <Input
                      id="owner"
                      value={formData.owner}
                      onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                      disabled={!isEditing}
                      className="border-stone-300"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="license">Mining License Number</Label>
                    <Input
                      id="license"
                      value={formData.license}
                      onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                      disabled={!isEditing}
                      className="border-stone-300"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      disabled={!isEditing}
                      className="border-stone-300"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="size">Facility Size (hectares)</Label>
                    <Input
                      id="size"
                      type="number"
                      step="0.01"
                      value={formData.size}
                      onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                      disabled={!isEditing}
                      className="border-stone-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pits">Number of Active Pits</Label>
                    <Input
                      id="pits"
                      type="number"
                      value={formData.numberOfPits}
                      onChange={(e) => setFormData({ ...formData, numberOfPits: e.target.value })}
                      disabled={!isEditing}
                      className="border-stone-300"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="commodities">Primary Commodities Mined</Label>
                    <Input
                      id="commodities"
                      value={formData.commodities}
                      onChange={(e) => setFormData({ ...formData, commodities: e.target.value })}
                      disabled={!isEditing}
                      className="border-stone-300"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="equipment">Equipment & Assets</Label>
                    <Textarea
                      id="equipment"
                      value={formData.equipment}
                      onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                      disabled={!isEditing}
                      rows={3}
                      className="border-stone-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employees">Total Employees</Label>
                    <Input
                      id="employees"
                      type="number"
                      value={formData.employees}
                      onChange={(e) => setFormData({ ...formData, employees: e.target.value })}
                      disabled={!isEditing}
                      className="border-stone-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="established">Year Established</Label>
                    <Input
                      id="established"
                      type="number"
                      value={formData.establishedYear}
                      onChange={(e) => setFormData({ ...formData, establishedYear: e.target.value })}
                      disabled={!isEditing}
                      className="border-stone-300"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="contact">Contact Information</Label>
                    <Input
                      id="contact"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      disabled={!isEditing}
                      className="border-stone-300"
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => {
                      setIsEditing(false)
                      // Reset form data to original values
                      if (mineSiteInfo) {
                        setFormData({
                          owner: mineSiteInfo.owner || "",
                          license: mineSiteInfo.license || "",
                          location: mineSiteInfo.location || "",
                          size: mineSiteInfo.size?.toString() || "",
                          numberOfPits: mineSiteInfo.number_of_pits?.toString() || "",
                          commodities: mineSiteInfo.commodities || "",
                          equipment: mineSiteInfo.equipment || "",
                          employees: mineSiteInfo.employees?.toString() || "",
                          establishedYear: mineSiteInfo.established_year?.toString() || "",
                          contact: mineSiteInfo.contact || "",
                        })
                      }
                    }}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white">
                      Save Changes
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        )}

        {/* Pit Details */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle>Active Pits Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {pitsData.length === 0 ? (
              <p className="text-stone-500 text-center py-8">
                No pit data available. Add production records with pit information to see pit details here.
              </p>
            ) : (
              <div className="rounded-md border border-stone-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50">
                      <th className="p-3 text-left font-medium text-stone-900">Pit Name</th>
                      <th className="p-3 text-left font-medium text-stone-900">Primary Mineral</th>
                      <th className="p-3 text-left font-medium text-stone-900">Status</th>
                      <th className="p-3 text-left font-medium text-stone-900">Total Output</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pitsData.map((pit, i) => (
                      <tr key={i} className="border-b border-stone-200 last:border-0">
                        <td className="p-3 text-stone-700">{pit.name}</td>
                        <td className="p-3 text-stone-700">{pit.mineral}</td>
                        <td className="p-3">
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                            Active
                          </span>
                        </td>
                        <td className="p-3 text-stone-700">{pit.output.toLocaleString()} kg</td>
                      </tr>
                    ))}
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

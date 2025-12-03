"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Users, Shield } from "lucide-react"
import { dataService } from "@/lib/data-service"
import { useToast } from "@/hooks/use-toast"

interface UserCategory {
  user: {
    id: number
    email: string
    name: string
    phone?: string
    role: string
    created_at: string
  }
  category: string
}

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserCategory[]>([])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
      return
    }
    
    if (!authLoading && user && user.role !== "admin") {
      router.push("/dashboard")
      toast({
        title: "Access Denied",
        description: "Admin access required",
        variant: "destructive",
      })
      return
    }

    if (user && user.role === "admin") {
      loadUsers()
    }
  }, [user, authLoading, router, toast])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const usersData = await dataService.getAllUsers()
      setUsers(usersData)
    } catch (error) {
      console.error("Error loading users:", error)
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    )
  }

  if (!user || user.role !== "admin") {
    return null
  }

  const miners = users.filter(u => u.category === "miner")
  const buyers = users.filter(u => u.category === "buyer")
  const sellers = users.filter(u => u.category === "seller")
  const unknown = users.filter(u => u.category === "unknown")

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "miner":
        return "bg-amber-100 text-amber-700 border-amber-200"
      case "buyer":
        return "bg-emerald-100 text-emerald-700 border-emerald-200"
      case "seller":
        return "bg-blue-100 text-blue-700 border-blue-200"
      default:
        return "bg-stone-100 text-stone-700 border-stone-200"
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-lg border-l-4 border-amber-600 bg-amber-50/50 p-4">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-amber-600" />
            <div>
              <h1 className="text-3xl font-bold text-stone-900">Admin Panel</h1>
              <p className="text-stone-600 mt-1">
                Manage and view all users in the system
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-stone-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-stone-600">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-stone-900">{users.length}</p>
            </CardContent>
          </Card>
          <Card className="border-stone-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-stone-600">Miners</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-700">{miners.length}</p>
            </CardContent>
          </Card>
          <Card className="border-stone-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-stone-600">Buyers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-700">{buyers.length}</p>
            </CardContent>
          </Card>
          <Card className="border-stone-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-stone-600">Sellers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-700">{sellers.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="text-center text-stone-500 py-8">No users found</p>
            ) : (
              <div className="rounded-md border border-stone-200 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50">
                      <th className="p-3 text-left font-medium text-stone-900">Name</th>
                      <th className="p-3 text-left font-medium text-stone-900">Email</th>
                      <th className="p-3 text-left font-medium text-stone-900">Phone</th>
                      <th className="p-3 text-left font-medium text-stone-900">Category</th>
                      <th className="p-3 text-left font-medium text-stone-900">Role</th>
                      <th className="p-3 text-left font-medium text-stone-900">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((userCategory) => (
                      <tr key={userCategory.user.id} className="border-b border-stone-200 last:border-0">
                        <td className="p-3 text-stone-700 font-medium">{userCategory.user.name}</td>
                        <td className="p-3 text-stone-700">{userCategory.user.email}</td>
                        <td className="p-3 text-stone-700">{userCategory.user.phone || "-"}</td>
                        <td className="p-3">
                          <Badge variant="outline" className={getCategoryColor(userCategory.category)}>
                            {userCategory.category}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className={userCategory.user.role === "admin" ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-stone-100 text-stone-700 border-stone-200"}>
                            {userCategory.user.role}
                          </Badge>
                        </td>
                        <td className="p-3 text-stone-600 text-xs">
                          {new Date(userCategory.user.created_at).toLocaleDateString()}
                        </td>
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


"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useCurrency } from "@/lib/currency-context"
import { cn } from "@/lib/utils"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield, AlertCircle, User, Mail, Calendar, Key, MapPin, Phone } from "lucide-react"

export default function SettingsPage() {
  const { user, isLoading } = useAuth()
  const { currency, setCurrency } = useCurrency()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [location, setLocation] = useState<string>(user?.location || "")
  const [phone, setPhone] = useState<string>(user?.phone?.replace(/^\+\d+/, '') || "")
  const [countryCode, setCountryCode] = useState<string>(user?.phone?.match(/^\+\d+/)?.[0] || "+256")

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Settings</h1>
          <p className="text-stone-600">Manage your account settings and preferences</p>
        </div>

        {user.role === "admin" && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-700" />
                <CardTitle className="text-amber-900">Admin Access</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-amber-800">
                You have administrator privileges with full access to all system features and settings.
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Your account details and personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-amber-700 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-stone-600">Full Name</p>
                <p className="font-medium text-stone-900">{user.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-stone-600">Email Address</p>
                <p className="font-medium text-stone-900">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-full flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-stone-600">Account Role</p>
                <Badge className="bg-gradient-to-r from-amber-600 to-amber-700 text-white mt-1">
                  </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center">
                <Phone className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-stone-600">Phone Number</p>
                <div className="flex gap-2 mt-1">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-[100px] border-stone-300 bg-white h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+256">UG (+256)</SelectItem>
                      <SelectItem value="+254">KE (+254)</SelectItem>
                      <SelectItem value="+255">TZ (+255)</SelectItem>
                      <SelectItem value="+250">RW (+250)</SelectItem>
                      <SelectItem value="+257">BI (+257)</SelectItem>
                      <SelectItem value="+243">CD (+243)</SelectItem>
                      <SelectItem value="+211">SS (+211)</SelectItem>
                      <SelectItem value="+1">US (+1)</SelectItem>
                    </SelectContent>
                  </Select>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="700 123 456"
                    className="flex-1 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 h-9"
                  />
                </div>
              </div>
            </div>

          <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-full flex items-center justify-center">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-stone-600">Mine Location</p>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Mubende, Uganda"
                className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-stone-300"
              onClick={async () => {
                try {
                  const res = await fetch('/api/v1/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      name: user.name, 
                      location,
                      phone: phone ? `${countryCode}${phone.startsWith('0') ? phone.substring(1) : phone}` : undefined
                    }),
                  })
                  const data = await res.json()
                  if (data?.success) {
                    setIsEditing(false)
                  }
                } catch (e) {
                  console.error('Failed to update location', e)
                }
              }}
            >
              Save
            </Button>
          </div>

            <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-stone-600">Member Since</p>
                <p className="font-medium text-stone-900">
                  {new Date(user.createdAt).toLocaleDateString("en-UG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Security</CardTitle>
                <CardDescription>Manage your password and security settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center">
                <Key className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-stone-600">Password</p>
                <p className="font-medium text-stone-900">••••••••</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/forgot-password")}
                className="border-stone-300"
              >
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle>Application Preferences</CardTitle>
            <CardDescription>System details and display preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-stone-600">Version</span>
              <span className="font-medium text-stone-900">1.0.0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-stone-600">Region</span>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                Uganda
              </Badge>
            </div>
            
            <div className="space-y-2 border-t pt-4 border-stone-100">
              <label className="text-sm font-medium text-stone-700">Display Currency</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                    { code: "UGX", name: "UGX (Shillings)" },
                    { code: "USD", name: "USD ($)" },
                    { code: "KES", name: "KES (Kenya)" },
                    { code: "TZS", name: "TZS (Tanzania)" },
                    { code: "EUR", name: "EUR (€)" },
                    { code: "GBP", name: "GBP (£)" },
                    { code: "RWF", name: "RWF (Rwanda)" },
                ].map((cur) => (
                  <Button
                    key={cur.code}
                    variant={currency === cur.code ? "default" : "outline"}
                    className={cn(
                      "text-xs py-1 h-9",
                      currency === cur.code ? "bg-amber-600 hover:bg-amber-700" : "border-stone-200"
                    )}
                    onClick={() => setCurrency(cur.code as any)}
                  >
                    {cur.name}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-stone-500 mt-2 italic">
                * This will change how monetary values are displayed across the entire application.
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  )
}

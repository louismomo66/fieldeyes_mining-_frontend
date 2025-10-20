"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Eye, EyeOff, Shield } from "lucide-react"
import Image from "next/image"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"

export default function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [adminCode, setAdminCode] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showAdminCode, setShowAdminCode] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { signup } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)

    const result = await signup(email, password, name, phone || undefined, adminCode || undefined)

    if (result.success) {
      router.push("/dashboard")
    } else {
      setError(result.error || "Signup failed")
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-stone-50 to-emerald-50 p-4">
      <Card className="w-full max-w-md border-stone-200 shadow-xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-16 h-16">
            <Image
              src="/logo.png"
              alt="Mining Finance Logo"
              width={64}
              height={64}
              className="w-full h-full object-contain"
            />
          </div>
          <CardTitle className="text-3xl font-bold text-stone-900">Create Account</CardTitle>
          <CardDescription className="text-stone-600">Join Mining Finance to manage your operations</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-stone-700">
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="border-stone-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-stone-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-stone-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-stone-700">
                Phone Number (Optional)
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+256 700 123 456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border-stone-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-stone-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-stone-300 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-stone-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-stone-500" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-stone-700">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="border-stone-300"
              />
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isAdmin"
                  checked={showAdminCode}
                  onCheckedChange={(checked) => {
                    setShowAdminCode(checked as boolean)
                    if (!checked) setAdminCode("")
                  }}
                />
                <Label
                  htmlFor="isAdmin"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                >
                  <Shield className="h-4 w-4 text-amber-600" />I have an admin code
                </Label>
              </div>

              {showAdminCode && (
                <div className="space-y-2 pl-6">
                  <Label htmlFor="adminCode" className="text-stone-700 text-sm">
                    Admin Code
                  </Label>
                  <Input
                    id="adminCode"
                    type="text"
                    placeholder="Enter admin code"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    className="border-amber-300 focus-visible:ring-amber-600"
                  />
                  <p className="text-xs text-stone-500">Enter the admin code to create an administrator account</p>
                </div>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>

            <div className="text-center text-sm text-stone-600">
              Already have an account?{" "}
              <Link href="/login" className="text-amber-700 hover:text-amber-800 font-medium">
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

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
import { AlertCircle, ArrowLeft, Eye, EyeOff, CheckCircle } from "lucide-react"
import Image from "next/image"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "otp" | "success">("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { sendPasswordResetOTP, verifyOTPAndResetPassword } = useAuth()
  const router = useRouter()

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const result = await sendPasswordResetOTP(email)

    if (result.success) {
      setStep("otp")
    } else {
      setError(result.error || "Failed to send OTP")
    }

    setIsLoading(false)
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)

    const result = await verifyOTPAndResetPassword(email, otp, newPassword)

    if (result.success) {
      setStep("success")
    } else {
      setError(result.error || "Failed to reset password")
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
          <CardTitle className="text-3xl font-bold text-stone-900">
            {step === "success" ? "Password Reset" : "Forgot Password"}
          </CardTitle>
          <CardDescription className="text-stone-600">
            {step === "email" && "Enter your email to receive a verification code"}
            {step === "otp" && "Enter the OTP sent to your email"}
            {step === "success" && "Your password has been successfully reset"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-stone-700">
                  Email Address
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
                {isLoading ? "Sending..." : "Send Verification Code"}
              </Button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-stone-600 hover:text-stone-900 inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </Link>
              </div>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-stone-700">
                  Verification Code (OTP)
                </Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  maxLength={6}
                  className="border-stone-300 text-center text-2xl tracking-widest"
                />
                <p className="text-xs text-stone-500">Check your email for the verification code</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-stone-700">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
                  Confirm New Password
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
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="text-sm text-stone-600 hover:text-stone-900 inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Use different email
                </button>
              </div>
            </form>
          )}

          {step === "success" && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-emerald-600" />
                </div>
              </div>

              <Alert className="border-emerald-200 bg-emerald-50">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-emerald-800">
                  Your password has been successfully reset. You can now log in with your new password.
                </AlertDescription>
              </Alert>

              <Button
                onClick={() => router.push("/login")}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white"
              >
                Go to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

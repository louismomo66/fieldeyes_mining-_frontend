"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User } from "./types"
import { apiService } from "./api"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  signup: (
    email: string,
    password: string,
    name: string,
    phone?: string,
    adminCode?: string,
  ) => Promise<{ success: boolean; error?: string }>
  sendPasswordResetOTP: (email: string) => Promise<{ success: boolean; error?: string }>
  verifyOTPAndResetPassword: (
    email: string,
    otp: string,
    newPassword: string,
  ) => Promise<{ success: boolean; error?: string }>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored auth token and get user profile
    const token = localStorage.getItem("auth_token")
    
    if (token) {
      // Verify token by getting user profile
      apiService.getProfile().then((response) => {
        if (response.success && response.data) {
          setUser(response.data)
        } else {
          // Token is invalid, remove it
          localStorage.removeItem("auth_token")
        }
        setIsLoading(false)
      }).catch(() => {
        localStorage.removeItem("auth_token")
        setIsLoading(false)
      })
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiService.login(email, password)
      
      if (response.success && response.data) {
        // Store the token
        localStorage.setItem("auth_token", response.data.token)
        
        // Set user data
        setUser(response.data.user)
        return true
      }
      
      return false
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const signup = async (
    email: string,
    password: string,
    name: string,
    phone?: string,
    adminCode?: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiService.signup({
        email,
        name,
        phone,
        password,
        admin_code: adminCode,
      })
      
      if (response.success && response.data) {
        // Store the token
        localStorage.setItem("auth_token", response.data.token)
        
        // Set user data
        setUser(response.data.user)
        return { success: true }
      }
      
      return { success: false, error: response.error || "Signup failed" }
    } catch (error) {
      console.error("Signup error:", error)
      return { success: false, error: "Network error" }
    }
  }

  const sendPasswordResetOTP = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiService.forgotPassword(email)
      return { success: response.success, error: response.error }
    } catch (error) {
      console.error("Forgot password error:", error)
      return { success: false, error: "Network error" }
    }
  }

  const verifyOTPAndResetPassword = async (
    email: string,
    otp: string,
    newPassword: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await apiService.resetPassword({
        email,
        otp,
        new_password: newPassword,
      })
      return { success: response.success, error: response.error }
    } catch (error) {
      console.error("Reset password error:", error)
      return { success: false, error: "Network error" }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("auth_token")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        signup,
        sendPasswordResetOTP,
        verifyOTPAndResetPassword,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

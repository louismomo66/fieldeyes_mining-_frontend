// API service for communicating with the backend
// Use relative base to go through Caddy proxy (avoids CORS): http://localhost:8086/api/v1
const API_BASE_URL = '/api/v1'

interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse {
  token: string
  user: {
    id: number
    email: string
    name: string
    phone?: string
    role: string
  }
}

interface SignupRequest {
  email: string
  name: string
  phone?: string
  password: string
  admin_code?: string
}

interface ForgotPasswordRequest {
  email: string
}

interface ResetPasswordRequest {
  email: string
  otp: string
  new_password: string
}

interface IncomeRequest {
  date: string
  mineral_type: string
  quantity: number
  unit: string
  price_per_unit: number
  total_amount?: number
  customer_name: string
  customer_contact: string
  payment_status: string
  amount_paid: number
  amount_due?: number
  notes?: string
}

interface ExpenseRequest {
  date: string
  category: string
  description: string
  amount: number
  supplier_name: string
  supplier_contact?: string
  payment_status: string
  amount_paid: number
  notes?: string
}

interface InventoryRequest {
  name: string
  type: string
  date?: string
  from?: string
  pit_number?: string
  miner_name?: string
  batch_number?: string
  processing_method?: string
  product?: string
  gemstone_type?: string
  quantity: number
  unit: string
  min_stock_level: number
  current_value: number
  last_updated?: string
}

interface MineSiteInfoRequest {
  owner: string
  license?: string
  location: string
  size?: number
  number_of_pits?: number
  commodities?: string
  equipment?: string
  employees?: number
  established_year?: number
  contact?: string
}

class ApiService {
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token')
    }
    return null
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getAuthToken()
    const url = `${API_BASE_URL}${endpoint}`

    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (token) {
      defaultHeaders.Authorization = `Bearer ${token}`
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      // Same-origin through Caddy; no explicit CORS mode or credentials needed
    }

    try {
      const response = await fetch(url, config)

      // Get response text first to check content type
      const responseText = await response.text()
      const contentType = response.headers.get('content-type')

      // Check if response is HTML (404 page) instead of JSON
      if (!contentType || !contentType.includes('application/json')) {
        // If we got HTML, it's likely a 404 from Next.js
        if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<!doctype')) {
          return {
            success: false,
            error: `Backend API not available. Ensure backend is running on port 9006. Got HTML response instead of JSON.`,
          }
        }
        // Try to parse as JSON anyway
        try {
          const data = JSON.parse(responseText)
          if (!response.ok) {
            return {
              success: false,
              error: data.error || `HTTP ${response.status}: ${response.statusText}`,
            }
          }
          return data
        } catch {
          return {
            success: false,
            error: `Invalid response format: ${responseText.substring(0, 100)}`,
          }
        }
      }

      // Response is JSON, parse it
      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        return {
          success: false,
          error: `Failed to parse JSON response: ${responseText.substring(0, 100)}`,
        }
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        }
      }

      return data
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  // Authentication methods
  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return this.makeRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async signup(data: SignupRequest): Promise<ApiResponse<LoginResponse>> {
    return this.makeRequest<LoginResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    return this.makeRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse> {
    return this.makeRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getProfile(): Promise<ApiResponse> {
    return this.makeRequest('/profile')
  }

  async updateProfile(data: { name: string; phone?: string }): Promise<ApiResponse> {
    return this.makeRequest('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Income methods
  async getIncomes(): Promise<ApiResponse> {
    return this.makeRequest('/income')
  }

  async getIncome(id: number): Promise<ApiResponse> {
    return this.makeRequest(`/income/${id}`)
  }

  async createIncome(data: IncomeRequest): Promise<ApiResponse> {
    return this.makeRequest('/income', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateIncome(id: number, data: IncomeRequest): Promise<ApiResponse> {
    return this.makeRequest(`/income/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteIncome(id: number): Promise<ApiResponse> {
    return this.makeRequest(`/income/${id}`, {
      method: 'DELETE',
    })
  }

  async getIncomeByDateRange(startDate: string, endDate: string): Promise<ApiResponse> {
    return this.makeRequest(`/income/range?start_date=${startDate}&end_date=${endDate}`)
  }

  // Expense methods
  async getExpenses(): Promise<ApiResponse> {
    return this.makeRequest('/expense')
  }

  async getExpense(id: number): Promise<ApiResponse> {
    return this.makeRequest(`/expense/${id}`)
  }

  async createExpense(data: ExpenseRequest): Promise<ApiResponse> {
    return this.makeRequest('/expense', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateExpense(id: number, data: ExpenseRequest): Promise<ApiResponse> {
    return this.makeRequest(`/expense/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteExpense(id: number): Promise<ApiResponse> {
    return this.makeRequest(`/expense/${id}`, {
      method: 'DELETE',
    })
  }

  async getExpenseByDateRange(startDate: string, endDate: string): Promise<ApiResponse> {
    return this.makeRequest(`/expense/range?start_date=${startDate}&end_date=${endDate}`)
  }

  async getExpenseBreakdown(): Promise<ApiResponse> {
    return this.makeRequest('/expense/breakdown')
  }

  // Inventory methods
  async getInventory(): Promise<ApiResponse> {
    return this.makeRequest('/inventory')
  }

  async getInventoryItem(id: number): Promise<ApiResponse> {
    return this.makeRequest(`/inventory/${id}`)
  }

  async createInventoryItem(data: InventoryRequest): Promise<ApiResponse> {
    return this.makeRequest('/inventory', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateInventoryItem(id: number, data: InventoryRequest): Promise<ApiResponse> {
    return this.makeRequest(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteInventoryItem(id: number): Promise<ApiResponse> {
    return this.makeRequest(`/inventory/${id}`, {
      method: 'DELETE',
    })
  }

  async getLowStockItems(): Promise<ApiResponse> {
    return this.makeRequest('/inventory/low-stock')
  }

  async updateInventoryQuantity(id: number, quantity: number): Promise<ApiResponse> {
    return this.makeRequest(`/inventory/${id}/quantity`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    })
  }

  // Analytics methods
  async getFinancialSummary(): Promise<ApiResponse> {
    return this.makeRequest('/analytics/summary')
  }

  async getMonthlyData(year?: number): Promise<ApiResponse> {
    const url = year ? `/analytics/monthly?year=${year}` : '/analytics/monthly'
    return this.makeRequest(url)
  }

  async getExpenseCategoryBreakdown(): Promise<ApiResponse> {
    return this.makeRequest('/analytics/expense-breakdown')
  }

  // Mine site info methods
  async getMineSiteInfo(): Promise<ApiResponse> {
    return this.makeRequest('/minesite')
  }

  async createOrUpdateMineSiteInfo(data: MineSiteInfoRequest): Promise<ApiResponse> {
    return this.makeRequest('/minesite', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Admin methods
  async getAllUsers(): Promise<ApiResponse> {
    return this.makeRequest('/admin/users')
  }

  async getUserSerialNumber(): Promise<ApiResponse> {
    return this.makeRequest('/serial-number')
  }

  // Admin methods
  async getSystemStats(): Promise<ApiResponse> {
    return this.makeRequest('/admin/stats')
  }

  async getSystemTrends(year?: number): Promise<ApiResponse> {
    const url = year ? `/admin/trends?year=${year}` : '/admin/trends'
    return this.makeRequest(url)
  }

  async getSystemCategoryBreakdown(): Promise<ApiResponse> {
    return this.makeRequest('/admin/category-breakdown')
  }

  async getDailyUsage(startDate?: string, endDate?: string): Promise<ApiResponse> {
    let url = '/admin/daily-usage'
    if (startDate && endDate) {
      url += `?start_date=${startDate}&end_date=${endDate}`
    }
    return this.makeRequest(url)
  }
}

export const apiService = new ApiService()
export type { ApiResponse, LoginRequest, SignupRequest, IncomeRequest, ExpenseRequest, InventoryRequest, MineSiteInfoRequest }

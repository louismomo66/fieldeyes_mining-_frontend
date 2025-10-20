// Data service for managing application data with API calls
import { apiService } from "./api"
import type { Income, Expense, InventoryItem, FinancialSummary, MonthlyData, CategoryBreakdown } from "./types"

export class DataService {
  // Income methods
  async getIncomes(): Promise<Income[]> {
    try {
      const response = await apiService.getIncomes()
      console.log("DataService - Raw incomes response:", response)
      if (response.success && response.data) {
        const transformed = this.transformIncomes(response.data)
        console.log("DataService - Transformed incomes:", transformed)
        return transformed
      }
      return []
    } catch (error) {
      console.error("Error fetching incomes:", error)
      return []
    }
  }

  async createIncome(income: Omit<Income, "id" | "createdAt">): Promise<Income | null> {
    try {
      const response = await apiService.createIncome({
        date: income.date.toISOString().split('T')[0],
        mineral_type: income.mineralType,
        quantity: income.quantity,
        unit: income.unit,
        price_per_unit: income.pricePerUnit,
        customer_name: income.customerName,
        customer_contact: income.customerContact,
        payment_status: income.paymentStatus,
        amount_paid: income.amountPaid,
        notes: income.notes,
      })
      
      if (response.success && response.data) {
        return this.transformIncome(response.data)
      }
      return null
    } catch (error) {
      console.error("Error creating income:", error)
      return null
    }
  }

  async updateIncome(id: string, income: Omit<Income, "id" | "createdAt">): Promise<Income | null> {
    try {
      if (!id || id === '' || isNaN(parseInt(id))) {
        console.error("Invalid income ID for update:", id)
        return null
      }
      const response = await apiService.updateIncome(parseInt(id), {
        date: income.date.toISOString().split('T')[0],
        mineral_type: income.mineralType,
        quantity: income.quantity,
        unit: income.unit,
        price_per_unit: income.pricePerUnit,
        customer_name: income.customerName,
        customer_contact: income.customerContact,
        payment_status: income.paymentStatus,
        amount_paid: income.amountPaid,
        notes: income.notes,
      })
      
      if (response.success && response.data) {
        return this.transformIncome(response.data)
      }
      return null
    } catch (error) {
      console.error("Error updating income:", error)
      return null
    }
  }

  async deleteIncome(id: string): Promise<boolean> {
    try {
      if (!id || id === '' || isNaN(parseInt(id))) {
        console.error("Invalid income ID for deletion:", id)
        return false
      }
      const response = await apiService.deleteIncome(parseInt(id))
      return response.success
    } catch (error) {
      console.error("Error deleting income:", error)
      return false
    }
  }

  // Expense methods
  async getExpenses(): Promise<Expense[]> {
    try {
      const response = await apiService.getExpenses()
      if (response.success && response.data) {
        return this.transformExpenses(response.data)
      }
      return []
    } catch (error) {
      console.error("Error fetching expenses:", error)
      return []
    }
  }

  async createExpense(expense: Omit<Expense, "id" | "createdAt">): Promise<Expense | null> {
    try {
      const response = await apiService.createExpense({
        date: expense.date.toISOString().split('T')[0],
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        supplier_name: expense.supplierName,
        supplier_contact: expense.supplierContact,
        payment_status: expense.paymentStatus,
        amount_paid: expense.amountPaid,
        notes: expense.notes,
      })
      
      if (response.success && response.data) {
        return this.transformExpense(response.data)
      }
      return null
    } catch (error) {
      console.error("Error creating expense:", error)
      return null
    }
  }

  async updateExpense(id: string, expense: Omit<Expense, "id" | "createdAt">): Promise<Expense | null> {
    try {
      if (!id || id === '' || isNaN(parseInt(id))) {
        console.error("Invalid expense ID for update:", id)
        return null
      }
      const response = await apiService.updateExpense(parseInt(id), {
        date: expense.date.toISOString().split('T')[0],
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        supplier_name: expense.supplierName,
        supplier_contact: expense.supplierContact,
        payment_status: expense.paymentStatus,
        amount_paid: expense.amountPaid,
        notes: expense.notes,
      })
      
      if (response.success && response.data) {
        return this.transformExpense(response.data)
      }
      return null
    } catch (error) {
      console.error("Error updating expense:", error)
      return null
    }
  }

  async deleteExpense(id: string): Promise<boolean> {
    try {
      if (!id || id === '' || isNaN(parseInt(id))) {
        console.error("Invalid expense ID for deletion:", id)
        return false
      }
      const response = await apiService.deleteExpense(parseInt(id))
      return response.success
    } catch (error) {
      console.error("Error deleting expense:", error)
      return false
    }
  }

  // Inventory methods
  async getInventory(): Promise<InventoryItem[]> {
    try {
      const response = await apiService.getInventory()
      if (response.success && response.data) {
        return this.transformInventoryItems(response.data)
      }
      return []
    } catch (error) {
      console.error("Error fetching inventory:", error)
      return []
    }
  }

  async createInventoryItem(item: Omit<InventoryItem, "id" | "createdAt" | "lastUpdated">): Promise<InventoryItem | null> {
    try {
      const response = await apiService.createInventoryItem({
        name: item.name,
        type: item.type,
        quantity: item.quantity,
        unit: item.unit,
        min_stock_level: item.minStockLevel,
        current_value: item.currentValue,
      })
      
      if (response.success && response.data) {
        return this.transformInventoryItem(response.data)
      }
      return null
    } catch (error) {
      console.error("Error creating inventory item:", error)
      return null
    }
  }

  async updateInventoryItem(id: string, item: Omit<InventoryItem, "id" | "createdAt" | "lastUpdated">): Promise<InventoryItem | null> {
    try {
      if (!id || id === '' || isNaN(parseInt(id))) {
        console.error("Invalid inventory item ID for update:", id)
        return null
      }
      const response = await apiService.updateInventoryItem(parseInt(id), {
        name: item.name,
        type: item.type,
        quantity: item.quantity,
        unit: item.unit,
        min_stock_level: item.minStockLevel,
        current_value: item.currentValue,
      })
      
      if (response.success && response.data) {
        return this.transformInventoryItem(response.data)
      }
      return null
    } catch (error) {
      console.error("Error updating inventory item:", error)
      return null
    }
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    try {
      if (!id || id === '' || isNaN(parseInt(id))) {
        console.error("Invalid inventory item ID for deletion:", id)
        return false
      }
      const response = await apiService.deleteInventoryItem(parseInt(id))
      return response.success
    } catch (error) {
      console.error("Error deleting inventory item:", error)
      return false
    }
  }

  async getLowStockItems(): Promise<InventoryItem[]> {
    try {
      const response = await apiService.getLowStockItems()
      if (response.success && response.data) {
        return this.transformInventoryItems(response.data)
      }
      return []
    } catch (error) {
      console.error("Error fetching low stock items:", error)
      return []
    }
  }

  // Analytics methods
  async getFinancialSummary(): Promise<FinancialSummary | null> {
    try {
      const response = await apiService.getFinancialSummary()
      console.log("DataService - Raw financial summary response:", response)
      if (response.success && response.data) {
        // Transform snake_case backend response to camelCase frontend interface
        const transformed = {
          totalIncome: response.data.total_income,
          totalExpenses: response.data.total_expenses,
          netProfit: response.data.net_profit,
          totalReceivables: response.data.total_receivables,
          totalPayables: response.data.total_payables,
          profitMargin: response.data.profit_margin,
        }
        console.log("DataService - Transformed financial summary:", transformed)
        return transformed
      }
      return null
    } catch (error) {
      console.error("Error fetching financial summary:", error)
      return null
    }
  }

  async getMonthlyData(year?: number): Promise<MonthlyData[]> {
    try {
      const response = await apiService.getMonthlyData(year)
      if (response.success && response.data) {
        // MonthlyData interface already matches backend response format
        return response.data
      }
      return []
    } catch (error) {
      console.error("Error fetching monthly data:", error)
      return []
    }
  }

  async getExpenseBreakdown(): Promise<CategoryBreakdown[]> {
    try {
      const response = await apiService.getExpenseCategoryBreakdown()
      if (response.success && response.data) {
        // CategoryBreakdown interface already matches backend response format
        return response.data
      }
      return []
    } catch (error) {
      console.error("Error fetching expense breakdown:", error)
      return []
    }
  }

  // Transform methods to convert API data to frontend types
  private transformIncomes(data: any[]): Income[] {
    return data.map(item => this.transformIncome(item))
  }

  private transformIncome(data: any): Income {
    // Handle different possible ID formats from backend
    let id = ''
    if (data.id !== undefined && data.id !== null) {
      id = data.id.toString()
    } else if (data.ID !== undefined && data.ID !== null) {
      id = data.ID.toString()
    }
    
    return {
      id,
      date: new Date(data.date),
      mineralType: data.mineral_type,
      quantity: data.quantity,
      unit: data.unit,
      pricePerUnit: data.price_per_unit,
      totalAmount: data.total_amount,
      customerName: data.customer_name,
      customerContact: data.customer_contact,
      paymentStatus: data.payment_status,
      amountPaid: data.amount_paid,
      amountDue: data.amount_due,
      notes: data.notes,
      userId: data.user_id ? data.user_id.toString() : '',
      createdAt: new Date(data.created_at),
    }
  }

  private transformExpenses(data: any[]): Expense[] {
    return data.map(item => this.transformExpense(item))
  }

  private transformExpense(data: any): Expense {
    // Handle different possible ID formats from backend
    let id = ''
    if (data.id !== undefined && data.id !== null) {
      id = data.id.toString()
    } else if (data.ID !== undefined && data.ID !== null) {
      id = data.ID.toString()
    }
    
    return {
      id,
      date: new Date(data.date),
      category: data.category,
      description: data.description,
      amount: data.amount,
      supplierName: data.supplier_name,
      supplierContact: data.supplier_contact,
      paymentStatus: data.payment_status,
      amountPaid: data.amount_paid,
      amountDue: data.amount_due,
      notes: data.notes,
      userId: data.user_id ? data.user_id.toString() : '',
      createdAt: new Date(data.created_at),
    }
  }

  private transformInventoryItems(data: any[]): InventoryItem[] {
    return data.map(item => this.transformInventoryItem(item))
  }

  private transformInventoryItem(data: any): InventoryItem {
    // Handle different possible ID formats from backend
    let id = ''
    if (data.id !== undefined && data.id !== null) {
      id = data.id.toString()
    } else if (data.ID !== undefined && data.ID !== null) {
      id = data.ID.toString()
    }
    
    return {
      id,
      name: data.name,
      type: data.type,
      quantity: data.quantity,
      unit: data.unit,
      minStockLevel: data.min_stock_level,
      currentValue: data.current_value,
      lastUpdated: new Date(data.last_updated),
      userId: data.user_id ? data.user_id.toString() : '',
      createdAt: new Date(data.created_at),
    }
  }
}

export const dataService = new DataService()

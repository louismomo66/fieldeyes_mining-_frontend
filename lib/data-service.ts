// Data service for managing application data with API calls
import { apiService } from "./api"
import { offlineService } from "./offline-service"
import type { Income, Expense, InventoryItem, FinancialSummary, MonthlyData, CategoryBreakdown, MineSiteInfo } from "./types"

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
    const incomeRequest = {
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
    }

    try {
      // Check if online
      if (typeof window !== "undefined" && !navigator.onLine) {
        await offlineService.saveOffline("income", incomeRequest)
        console.log("Income saved offline")
        return { ...income, id: 'offline-' + Date.now(), createdAt: new Date(), userId: 'offline' } as Income
      }

      const response = await apiService.createIncome(incomeRequest)

      if (response.success && response.data) {
        return this.transformIncome(response.data)
      }
      return null
    } catch (error: any) {
      if (error.message?.includes("Offline limit reached")) {
        throw error
      }
      console.error("Error creating income, attempting offline save:", error)
      try {
        await offlineService.saveOffline("income", incomeRequest)
        return { ...income, id: 'offline-' + Date.now(), createdAt: new Date(), userId: 'offline' } as Income
      } catch (offlineError) {
        throw offlineError
      }
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
        total_amount: income.totalAmount,
        customer_name: income.customerName,
        customer_contact: income.customerContact,
        payment_status: income.paymentStatus,
        amount_paid: income.amountPaid,
        amount_due: income.amountDue,
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
    const expenseRequest = {
      date: expense.date.toISOString().split('T')[0],
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      supplier_name: expense.supplierName,
      supplier_contact: expense.supplierContact,
      payment_status: expense.paymentStatus,
      amount_paid: expense.amountPaid,
      notes: expense.notes,
    }

    try {
      if (typeof window !== "undefined" && !navigator.onLine) {
        await offlineService.saveOffline("expense", expenseRequest)
        console.log("Expense saved offline")
        return { ...expense, id: 'offline-' + Date.now(), createdAt: new Date(), userId: 'offline' } as Expense
      }

      const response = await apiService.createExpense(expenseRequest)

      if (response.success && response.data) {
        return this.transformExpense(response.data)
      }
      return null
    } catch (error: any) {
      if (error.message?.includes("Offline limit reached")) {
        throw error
      }
      console.error("Error creating expense, attempting offline save:", error)
      try {
        await offlineService.saveOffline("expense", expenseRequest)
        return { ...expense, id: 'offline-' + Date.now(), createdAt: new Date(), userId: 'offline' } as Expense
      } catch (offlineError) {
        throw offlineError
      }
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

  async createInventoryItem(item: Omit<InventoryItem, "id" | "createdAt" | "userId">): Promise<InventoryItem | null> {
    // Format date as date string if available
    const dateStr = item.date ? new Date(item.date).toISOString().split("T")[0] : undefined
    // Format lastUpdated as date string if available
    const lastUpdatedStr = item.lastUpdated ? new Date(item.lastUpdated).toISOString().split("T")[0] : undefined

    const itemRequest = {
      name: item.name,
      type: item.type,
      date: dateStr,
      from: item.from,
      pit_number: item.pitNumber,
      miner_name: item.minerName,
      batch_number: item.batchNumber,
      processing_method: item.processingMethod,
      product: item.product,
      gemstone_type: item.gemstoneType,
      quantity: item.quantity,
      unit: item.unit,
      min_stock_level: item.minStockLevel,
      current_value: item.currentValue,
      last_updated: lastUpdatedStr,
    }

    try {
      if (typeof window !== "undefined" && !navigator.onLine) {
        await offlineService.saveOffline("inventory", itemRequest)
        console.log("Inventory item saved offline")
        return { ...item, id: 'offline-' + Date.now(), createdAt: new Date(), lastUpdated: new Date(), userId: 'offline' } as InventoryItem
      }

      const response = await apiService.createInventoryItem(itemRequest)

      if (response.success && response.data) {
        return this.transformInventoryItem(response.data)
      }
      return null
    } catch (error: any) {
      if (error.message?.includes("Offline limit reached")) {
        throw error
      }
      console.error("Error creating inventory item, attempting offline save:", error)
      try {
        await offlineService.saveOffline("inventory", itemRequest)
        return { ...item, id: 'offline-' + Date.now(), createdAt: new Date(), lastUpdated: new Date(), userId: 'offline' } as InventoryItem
      } catch (offlineError) {
        throw offlineError
      }
    }
  }

  async updateInventoryItem(id: string, item: Omit<InventoryItem, "id" | "createdAt" | "userId">): Promise<InventoryItem | null> {
    try {
      if (!id || id === '' || isNaN(parseInt(id))) {
        console.error("Invalid inventory item ID for update:", id)
        return null
      }

      // Format date as date string if available
      const dateStr = item.date ? new Date(item.date).toISOString().split("T")[0] : undefined
      // Format lastUpdated as date string if available
      const lastUpdatedStr = item.lastUpdated ? new Date(item.lastUpdated).toISOString().split("T")[0] : undefined

      const response = await apiService.updateInventoryItem(parseInt(id), {
        name: item.name,
        type: item.type,
        date: dateStr,
        from: item.from,
        pit_number: item.pitNumber,
        miner_name: item.minerName,
        batch_number: item.batchNumber,
        processing_method: item.processingMethod,
        product: item.product,
        gemstone_type: item.gemstoneType,
        quantity: item.quantity,
        unit: item.unit,
        min_stock_level: item.minStockLevel,
        current_value: item.currentValue,
        last_updated: lastUpdatedStr,
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
      date: data.date ? new Date(data.date) : undefined,
      from: data.from || undefined,
      pitNumber: data.pit_number || data.pitNumber || undefined,
      minerName: data.miner_name || data.minerName || undefined,
      batchNumber: data.batch_number || data.batchNumber || undefined,
      processingMethod: data.processing_method || data.processingMethod || undefined,
      quantity: data.quantity,
      unit: data.unit,
      minStockLevel: data.min_stock_level,
      currentValue: data.current_value,
      lastUpdated: new Date(data.last_updated),
      userId: data.user_id ? data.user_id.toString() : '',
    }
  }

  // Mine site info methods
  async getMineSiteInfo(): Promise<MineSiteInfo | null> {
    try {
      const response = await apiService.getMineSiteInfo()
      if (response.success && response.data) {
        return this.transformMineSiteInfo(response.data)
      }
      return null
    } catch (error) {
      console.error("Error fetching mine site info:", error)
      return null
    }
  }

  async createOrUpdateMineSiteInfo(info: Omit<MineSiteInfo, "id" | "created_at" | "updated_at" | "user_id">): Promise<MineSiteInfo | null> {
    try {
      const response = await apiService.createOrUpdateMineSiteInfo({
        owner: info.owner,
        license: info.license,
        location: info.location,
        size: info.size,
        number_of_pits: info.number_of_pits,
        commodities: info.commodities,
        equipment: info.equipment,
        employees: info.employees,
        established_year: info.established_year,
        contact: info.contact,
      })

      if (response.success && response.data) {
        return this.transformMineSiteInfo(response.data)
      }
      return null
    } catch (error) {
      console.error("Error creating/updating mine site info:", error)
      return null
    }
  }

  private transformMineSiteInfo(data: any): MineSiteInfo {
    let id = ''
    if (data.id !== undefined && data.id !== null) {
      id = data.id.toString()
    } else if (data.ID !== undefined && data.ID !== null) {
      id = data.ID.toString()
    }

    return {
      id,
      owner: data.owner,
      license: data.license || undefined,
      location: data.location,
      size: data.size || undefined,
      number_of_pits: data.number_of_pits || data.numberOfPits || undefined,
      commodities: data.commodities || undefined,
      equipment: data.equipment || undefined,
      employees: data.employees || undefined,
      established_year: data.established_year || data.establishedYear || undefined,
      contact: data.contact || undefined,
      user_id: data.user_id ? data.user_id.toString() : (data.userID ? data.userID.toString() : ''),
      created_at: new Date(data.created_at || data.createdAt),
      updated_at: new Date(data.updated_at || data.updatedAt),
    }
  }

  // Admin methods
  async getAllUsers(): Promise<Array<{ user: any; category: string; serial_number: string }>> {
    try {
      const response = await apiService.getAllUsers()
      if (response.success && response.data) {
        return response.data
      }
      return []
    } catch (error) {
      console.error("Error fetching users:", error)
      return []
    }
  }

  async getSystemStats(): Promise<any> {
    try {
      const response = await apiService.getSystemStats()
      if (response.success && response.data) {
        return response.data
      }
      return null
    } catch (error) {
      console.error("Error fetching system stats:", error)
      return null
    }
  }

  async getSystemTrends(year?: number): Promise<any[]> {
    try {
      const response = await apiService.getSystemTrends(year)
      if (response.success && response.data) {
        return response.data
      }
      return []
    } catch (error) {
      console.error("Error fetching system trends:", error)
      return []
    }
  }

  async getSystemCategoryBreakdown(): Promise<any[]> {
    try {
      const response = await apiService.getSystemCategoryBreakdown()
      if (response.success && response.data) {
        return response.data
      }
      return []
    } catch (error) {
      console.error("Error fetching category breakdown:", error)
      return []
    }
  }

  async getDailyUsage(startDate?: string, endDate?: string): Promise<any[]> {
    try {
      const response = await apiService.getDailyUsage(startDate, endDate)
      if (response.success && response.data) {
        return response.data
      }
      return []
    } catch (error) {
      console.error("Error fetching daily usage:", error)
      return []
    }
  }
}

export const dataService = new DataService()

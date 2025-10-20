// User and Authentication Types
export type UserRole = "admin" | "standard"

export interface User {
  id: string
  email: string
  name: string
  phone?: string
  role: UserRole
  createdAt: Date
}

// Transaction Types
export type TransactionType = "income" | "expense"
export type PaymentStatus = "paid" | "unpaid" | "partial"
export type MineralType = "gold" | "copper" | "cobalt" | "diamond" | "other"
export type ExpenseCategory = "equipment" | "labor" | "chemicals" | "fuel" | "maintenance" | "transport" | "other"

export interface Income {
  id: string
  date: Date
  mineralType: MineralType
  quantity: number
  unit: string
  pricePerUnit: number
  totalAmount: number
  customerName: string
  customerContact: string
  paymentStatus: PaymentStatus
  amountPaid: number
  amountDue: number
  notes?: string
  userId: string
  createdAt: Date
}

export interface Expense {
  id: string
  date: Date
  category: ExpenseCategory
  description: string
  amount: number
  supplierName: string
  supplierContact?: string
  paymentStatus: PaymentStatus
  amountPaid: number
  amountDue: number
  notes?: string
  userId: string
  createdAt: Date
}

export type Transaction = (Income | Expense) & {
  type: TransactionType
}

// Inventory Types
export interface InventoryItem {
  id: string
  name: string
  type: "mineral" | "supply"
  quantity: number
  unit: string
  minStockLevel: number
  currentValue: number
  lastUpdated: Date
  userId: string
}

// Financial Summary Types
export interface FinancialSummary {
  totalIncome: number
  totalExpenses: number
  netProfit: number
  totalReceivables: number
  totalPayables: number
  profitMargin: number
}

// Analytics Types
export interface MonthlyData {
  month: string
  income: number
  expenses: number
  profit: number
}

export interface CategoryBreakdown {
  category: string
  amount: number
  percentage: number
}

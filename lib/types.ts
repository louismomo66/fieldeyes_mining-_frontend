// User and Authentication Types
export type UserRole = "admin" | "standard"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: Date
}

// Transaction Types
export type TransactionType = "income" | "expense"
export type PaymentStatus = "paid" | "unpaid" | "partial"
export type MineralType =
  | "gold" | "copper" | "cobalt" | "diamond" | "iron_ore" | "lead" | "zinc"
  | "lithium" | "nickel" | "coltan" | "tin" | "wolfram" | "titanium"
  | "manganese" | "rare_earth_elements" | "uranium" | "bentonite" | "diatomite"
  | "graphite" | "gypsum" | "feldspar" | "limestone" | "marble" | "kaolin"
  | "phosphates" | "pozzolana" | "salt" | "sand" | "vermiculite" | "silver"
  | "granite" | "chromite" | "gemstones" | "other"
export type ExpenseCategory = "equipment" | "labor" | "chemicals" | "maintenance" | "transport" | "trips" | "other"

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
  quantity?: number
  unit?: string
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

// Production Types
export type ProductionFrom = "mine" | "processing"
export type ProcessingMethod =
  | "crushing" | "milling" | "sieving" | "grading" | "sorting" | "cutting"
  | "dressing" | "leaching" | "elution" | "refining" | "floatation" | "grinding"
  | "screening" | "drying" | "exfoliation" | "polishing" | "washing"

export type ProductType = "ore" | "concentrate" | "metal" | "rough" | "cut" | "polished" | "faceted" | "aggregates" | "stone_dust" | "other"

export type GemstoneType =
  | "apatite" | "diamond" | "flourite" | "ruby" | "emerald" | "sapphire"
  | "amethyst" | "aquamarine" | "garnet" | "opal" | "topaz" | "tourmaline"
  | "pearl" | "amber" | "kyanite" | "coral" | "jade" | "malachite"
  | "onyx" | "peridot" | "quartz" | "turquoise" | "zircon" | "other"

// Inventory Types
export interface InventoryItem {
  id: string
  name: string
  type: "mineral" | "supply"
  date?: Date // Production date - when the production actually occurred
  from?: ProductionFrom
  pitNumber?: string
  minerName?: string
  minerSerialNumber?: string
  batchNumber?: string
  processingMethod?: ProcessingMethod
  product?: ProductType
  gemstoneType?: GemstoneType
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

// Mine Site Info Types
export interface MineSiteInfo {
  id: string
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
  user_id: string
  created_at: Date
  updated_at: Date
}

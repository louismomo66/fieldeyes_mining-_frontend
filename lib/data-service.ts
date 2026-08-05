// Data service for managing application data with API calls
import { apiService } from "./api"
import { offlineService } from "./offline-service"
import type { ProcessingRecordPayload, TransportRecordPayload } from "./traceability-payloads"
import type {
  Income,
  Expense,
  InventoryItem,
  FinancialSummary,
  MonthlyData,
  CategoryBreakdown,
  MineSiteInfo,
  ComplianceSummary,
  MineSiteCertification,
  CoCLot,
  ExportShipment,
  DueDiligenceReport,
  ThirdPartyAudit,
  ComplianceDocument,
  // Everything below was referenced throughout this file but never imported. The
  // resulting "Cannot find name" errors were invisible because next.config.mjs
  // sets typescript.ignoreBuildErrors and Turbopack dev does not typecheck.
  TransportRecord,
  ProcessingRecord,
  TrackingStatus,
  EnhancedCoCLot,
  GPSLocation,
  Stakeholder,
  TrackingAlert,
} from "./types"

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
      grade_value: item.gradeValue,
      grade_unit: item.gradeUnit,
      grade_notes: item.gradeNotes,
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
        grade_value: item.gradeValue,
        grade_unit: item.gradeUnit,
        grade_notes: item.gradeNotes,
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

  // ICGLR compliance methods
  async getComplianceSummary(): Promise<ComplianceSummary | null> {
    const response = await apiService.getComplianceSummary()
    return response.success && response.data ? response.data : null
  }

  async getMineSiteCertifications(): Promise<MineSiteCertification[]> {
    const response = await apiService.getMineSiteCertifications()
    return response.success && response.data ? response.data.map((item: any) => this.transformComplianceDates(item)) : []
  }

  async createMineSiteCertification(record: Partial<MineSiteCertification>): Promise<MineSiteCertification | null> {
    const response = await apiService.createMineSiteCertification(this.toCompliancePayload(record))
    return response.success && response.data ? this.transformComplianceDates(response.data) : null
  }

  async updateMineSiteCertification(id: string, record: Partial<MineSiteCertification>): Promise<MineSiteCertification | null> {
    const response = await apiService.updateMineSiteCertification(parseInt(id), this.toCompliancePayload(record))
    return response.success && response.data ? this.transformComplianceDates(response.data) : null
  }

  async deleteMineSiteCertification(id: string): Promise<boolean> {
    const response = await apiService.deleteMineSiteCertification(parseInt(id))
    return response.success
  }

  async getCoCLots(): Promise<CoCLot[]> {
    const response = await apiService.getCoCLots()
    return response.success && response.data ? response.data.map((item: any) => this.transformComplianceDates(item)) : []
  }

  async createCoCLot(record: Partial<CoCLot>): Promise<CoCLot | null> {
    const response = await apiService.createCoCLot(this.toCompliancePayload(record))
    if (!response.success) {
      throw new Error(response.error || "Failed to create CoC lot")
    }
    return response.data ? this.transformComplianceDates(response.data) : null
  }

  async updateCoCLot(id: string, record: Partial<CoCLot>): Promise<CoCLot | null> {
    const response = await apiService.updateCoCLot(parseInt(id), this.toCompliancePayload(record))
    return response.success && response.data ? this.transformComplianceDates(response.data) : null
  }

  async deleteCoCLot(id: string): Promise<boolean> {
    const response = await apiService.deleteCoCLot(parseInt(id))
    return response.success
  }

  // Full production→transport→export trace for one lot
  async getLotPassport(id: string): Promise<any | null> {
    const response = await apiService.getLotPassport(parseInt(id))
    return response.success && response.data ? response.data : null
  }

  /**
   * One lot with its whole journey attached.
   *
   * getCoCLots() only preloads production records, certification and source lots
   * — it does NOT load custody transfers, transport, processing or documents.
   * Anything built from that list therefore shows an empty chain no matter what
   * has actually been recorded. The passport endpoint returns the full picture,
   * so trace views must come from here.
   */
  async getLotTrace(id: string): Promise<EnhancedCoCLot | null> {
    const passport = await this.getLotPassport(id)
    if (!passport?.lot) return null

    const lot = this.transformComplianceDates(passport.lot)

    return {
      ...lot,
      production_records: passport.production_records || [],
      // Custody transfer JSON already matches the CustodyTransfer type
      // (from_custodian, to_custodian, transfer_date, …) so it passes through.
      custody_chain: passport.custody_transfers || [],
      transport_records: (passport.transport_records || []).map((r: any) => this.transformTransportRecord(r)),
      processing_records: (passport.processing_records || []).map((r: any) => this.transformProcessingRecord(r)),
      compliance_documents: passport.documents || [],
      photos: [],
      qr_code: lot.verify_code || "",
      chain_complete: passport.chain_complete ?? false,
      export_shipment: passport.export_shipment,
      alerts: passport.alerts || [],
    } as EnhancedCoCLot
  }

  // Hand a lot over to another registered user by email
  async handoverCoCLot(id: string, payload: { to_email: string; note?: string; location?: string }): Promise<{ ok: boolean; error?: string; toName?: string }> {
    const response = await apiService.handoverCoCLot(parseInt(id), payload)
    if (!response.success) return { ok: false, error: response.error }
    return { ok: true, toName: (response.data as any)?.to_name }
  }

  async getExportShipments(): Promise<ExportShipment[]> {
    const response = await apiService.getExportShipments()
    return response.success && response.data ? response.data.map((item: any) => this.transformComplianceDates(item)) : []
  }

  async createExportShipment(record: Partial<ExportShipment>): Promise<ExportShipment | null> {
    const response = await apiService.createExportShipment(this.toCompliancePayload(record))
    if (!response.success) {
      throw new Error(response.error || "Failed to create export shipment")
    }
    return response.data ? this.transformComplianceDates(response.data) : null
  }

  async updateExportShipment(id: string, record: Partial<ExportShipment>): Promise<ExportShipment | null> {
    const response = await apiService.updateExportShipment(parseInt(id), this.toCompliancePayload(record))
    return response.success && response.data ? this.transformComplianceDates(response.data) : null
  }

  async deleteExportShipment(id: string): Promise<boolean> {
    const response = await apiService.deleteExportShipment(parseInt(id))
    return response.success
  }

  async getDueDiligenceReports(): Promise<DueDiligenceReport[]> {
    const response = await apiService.getDueDiligenceReports()
    return response.success && response.data ? response.data.map((item: any) => this.transformComplianceDates(item)) : []
  }

  async createDueDiligenceReport(record: Partial<DueDiligenceReport>): Promise<DueDiligenceReport | null> {
    const response = await apiService.createDueDiligenceReport(this.toCompliancePayload(record))
    return response.success && response.data ? this.transformComplianceDates(response.data) : null
  }

  async updateDueDiligenceReport(id: string, record: Partial<DueDiligenceReport>): Promise<DueDiligenceReport | null> {
    const response = await apiService.updateDueDiligenceReport(parseInt(id), this.toCompliancePayload(record))
    return response.success && response.data ? this.transformComplianceDates(response.data) : null
  }

  async deleteDueDiligenceReport(id: string): Promise<boolean> {
    const response = await apiService.deleteDueDiligenceReport(parseInt(id))
    return response.success
  }

  async getThirdPartyAudits(): Promise<ThirdPartyAudit[]> {
    const response = await apiService.getThirdPartyAudits()
    return response.success && response.data ? response.data.map((item: any) => this.transformComplianceDates(item)) : []
  }

  async createThirdPartyAudit(record: Partial<ThirdPartyAudit>): Promise<ThirdPartyAudit | null> {
    const response = await apiService.createThirdPartyAudit(this.toCompliancePayload(record))
    return response.success && response.data ? this.transformComplianceDates(response.data) : null
  }

  async updateThirdPartyAudit(id: string, record: Partial<ThirdPartyAudit>): Promise<ThirdPartyAudit | null> {
    const response = await apiService.updateThirdPartyAudit(parseInt(id), this.toCompliancePayload(record))
    return response.success && response.data ? this.transformComplianceDates(response.data) : null
  }

  async deleteThirdPartyAudit(id: string): Promise<boolean> {
    const response = await apiService.deleteThirdPartyAudit(parseInt(id))
    return response.success
  }

  async getComplianceDocuments(): Promise<ComplianceDocument[]> {
    const response = await apiService.getComplianceDocuments()
    return response.success && response.data ? response.data.map((item: any) => this.transformComplianceDates(item)) : []
  }

  async createComplianceDocument(record: Partial<ComplianceDocument>): Promise<ComplianceDocument | null> {
    const response = await apiService.createComplianceDocument(this.toCompliancePayload(record))
    return response.success && response.data ? this.transformComplianceDates(response.data) : null
  }

  async updateComplianceDocument(id: string, record: Partial<ComplianceDocument>): Promise<ComplianceDocument | null> {
    const response = await apiService.updateComplianceDocument(parseInt(id), this.toCompliancePayload(record))
    return response.success && response.data ? this.transformComplianceDates(response.data) : null
  }

  async deleteComplianceDocument(id: string): Promise<boolean> {
    const response = await apiService.deleteComplianceDocument(parseInt(id))
    return response.success
  }

  // Production record linking methods
  async getAvailableProductionRecords(mineralType?: string): Promise<InventoryItem[]> {
    const response = await apiService.getAvailableProductionRecords(mineralType)
    return response.success && response.data ? response.data.map((item: any) => this.transformInventoryItem(item)) : []
  }

  async getProductionRecordsByPit(pitNumber: string): Promise<InventoryItem[]> {
    const response = await apiService.getProductionRecordsByPit(pitNumber)
    return response.success && response.data ? response.data.map((item: any) => this.transformInventoryItem(item)) : []
  }

  async linkProductionRecords(cocLotId: string, productionRecordIds: number[]): Promise<boolean> {
    const response = await apiService.linkProductionRecords(parseInt(cocLotId), productionRecordIds)
    return response.success
  }

  // Enhanced Traceability methods
  async getTransportRecords(): Promise<TransportRecord[]> {
    try {
      const response = await apiService.getTransportRecords()
      return response.success && response.data ? response.data.map((item: any) => this.transformTransportRecord(item)) : []
    } catch (error) {
      console.error("Error fetching transport records:", error)
      return []
    }
  }

  // Takes the backend's flat payload (see lib/traceability-payloads.ts), not the
  // nested TransportRecord read model — the previous signature claimed the latter
  // and would never have decoded server-side.
  async createTransportRecord(payload: TransportRecordPayload): Promise<TransportRecord | null> {
    try {
      const response = await apiService.createTransportRecord(payload)
      if (response.success && response.data) {
        return this.transformTransportRecord(response.data)
      }
      throw new Error(response.error || "Failed to record transport")
    } catch (error) {
      console.error("Error creating transport record:", error)
      throw error
    }
  }

  async updateTransportStatus(id: string, status: string, updates?: any): Promise<boolean> {
    try {
      const response = await apiService.updateTransportStatus(parseInt(id), { status, ...updates })
      return response.success
    } catch (error) {
      console.error("Error updating transport status:", error)
      return false
    }
  }

  async getProcessingRecords(): Promise<ProcessingRecord[]> {
    try {
      const response = await apiService.getProcessingRecords()
      return response.success && response.data ? response.data.map((item: any) => this.transformProcessingRecord(item)) : []
    } catch (error) {
      console.error("Error fetching processing records:", error)
      return []
    }
  }

  // Flat backend payload — see the note on createTransportRecord above.
  async createProcessingRecord(payload: ProcessingRecordPayload): Promise<ProcessingRecord | null> {
    try {
      const response = await apiService.createProcessingRecord(payload)
      if (response.success && response.data) {
        return this.transformProcessingRecord(response.data)
      }
      throw new Error(response.error || "Failed to record processing")
    } catch (error) {
      console.error("Error creating processing record:", error)
      throw error
    }
  }

  async getRealTimeTracking(): Promise<TrackingStatus[]> {
    try {
      const response = await apiService.getRealTimeTracking()
      return response.success && response.data ? response.data.map((item: any) => this.transformTrackingStatus(item)) : []
    } catch (error) {
      console.error("Error fetching real-time tracking:", error)
      return []
    }
  }

  async updateLotLocation(lotId: number, lotType: string, location: GPSLocation, custodian: string, status: string): Promise<boolean> {
    try {
      const response = await apiService.updateLotLocation({
        lot_id: lotId,
        lot_type: lotType,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address || '',
        current_custodian: custodian,
        status
      })
      return response.success
    } catch (error) {
      console.error("Error updating lot location:", error)
      return false
    }
  }

  async getStakeholders(): Promise<Stakeholder[]> {
    try {
      const response = await apiService.getStakeholders()
      return response.success && response.data ? response.data.map((item: any) => this.transformStakeholder(item)) : []
    } catch (error) {
      console.error("Error fetching stakeholders:", error)
      return []
    }
  }

  async createStakeholder(record: Partial<Stakeholder>): Promise<Stakeholder | null> {
    try {
      const response = await apiService.createStakeholder(record)
      return response.success && response.data ? this.transformStakeholder(response.data) : null
    } catch (error) {
      console.error("Error creating stakeholder:", error)
      return null
    }
  }

  async getTrackingAlerts(): Promise<TrackingAlert[]> {
    try {
      const response = await apiService.getTrackingAlerts()
      return response.success && response.data ? response.data.map((item: any) => this.transformTrackingAlert(item)) : []
    } catch (error) {
      console.error("Error fetching tracking alerts:", error)
      return []
    }
  }

  async createTrackingAlert(alert: Partial<TrackingAlert>): Promise<TrackingAlert | null> {
    try {
      const response = await apiService.createTrackingAlert(alert)
      return response.success && response.data ? this.transformTrackingAlert(response.data) : null
    } catch (error) {
      console.error("Error creating tracking alert:", error)
      return null
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
      product: data.product || undefined,
      gemstoneType: data.gemstone_type || data.gemstoneType || undefined,
      gradeValue: data.grade_value ?? data.gradeValue ?? undefined,
      gradeUnit: data.grade_unit || data.gradeUnit || undefined,
      gradeNotes: data.grade_notes || data.gradeNotes || undefined,
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

      // Surface the backend's validation message ("Contact must be a valid
      // phone number or email address", "Owner is required", ...) instead of
      // collapsing every failure into a null the caller can't explain.
      throw new Error(response.error || "Failed to save mine site information")
    } catch (error) {
      console.error("Error creating/updating mine site info:", error)
      throw error
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

  private transformComplianceDates<T extends Record<string, any>>(data: T): T {
    const copy: Record<string, any> = { ...data }
    const idValue = copy.id ?? copy.ID
    if (idValue !== undefined && idValue !== null) {
      copy.id = idValue.toString()
    }
    for (const key of Object.keys(copy)) {
      if ((key.endsWith("_at") || key.endsWith("_date") || key.endsWith("_start") || key.endsWith("_end")) && copy[key]) {
        copy[key] = new Date(copy[key])
      }
    }
    if (copy.user_id !== undefined && copy.user_id !== null) {
      copy.user_id = copy.user_id.toString()
    }
    return copy as T
  }

  private toCompliancePayload(record: Record<string, any>): Record<string, any> {
    const payload: Record<string, any> = {}
    for (const [key, value] of Object.entries(record)) {
      if (value === undefined || key === "id" || key === "created_at" || key === "updated_at" || key === "user_id") continue
      payload[key] = value instanceof Date ? value.toISOString().split("T")[0] : value
    }
    return payload
  }

  // Transform methods for traceability types
  private transformTransportRecord(data: any): TransportRecord {
    return {
      id: data.id?.toString() || '',
      transportType: data.transport_type || data.transportType,
      vehicleDetails: {
        licensePlate: data.license_plate || data.vehicleDetails?.licensePlate || '',
        driverName: data.driver_name || data.vehicleDetails?.driverName || '',
        driverLicense: data.driver_license || data.vehicleDetails?.driverLicense || '',
        vehicleType: data.vehicle_type || data.vehicleDetails?.vehicleType || '',
        capacity: data.vehicle_capacity || data.vehicleDetails?.capacity || 0
      },
      route: {
        origin: data.origin || { latitude: 0, longitude: 0, timestamp: new Date() },
        destination: data.destination || { latitude: 0, longitude: 0, timestamp: new Date() },
        waypoints: data.waypoints || [],
        plannedDistance: data.planned_distance || data.route?.plannedDistance || 0,
        actualDistance: data.actual_distance || data.route?.actualDistance
      },
      timing: {
        departureTime: new Date(data.departure_time || data.timing?.departureTime),
        arrivalTime: data.arrival_time ? new Date(data.arrival_time) : undefined,
        estimatedDuration: data.estimated_duration || data.timing?.estimatedDuration || 0,
        actualDuration: data.actual_duration || data.timing?.actualDuration
      },
      cargo: {
        lotIds: JSON.parse(data.coc_lot_ids || '[]'),
        cocLotIds: JSON.parse(data.coc_lot_ids || '[]'),
        sealNumbers: JSON.parse(data.seal_numbers || '[]'),
        packagingType: data.packaging_type || '',
        grossWeight: data.gross_weight || 0,
        netWeight: data.net_weight || 0
      },
      custody: {
        handoverFrom: data.handover_from_name || '',
        handoverFromId: data.handover_from_id || '',
        handoverTo: data.handover_to_name || '',
        handoverToId: data.handover_to_id || '',
        witnessedBy: data.witnessed_by ? JSON.parse(data.witnessed_by) : [],
        handoverNotes: data.handover_notes
      },
      security: {
        securityEscort: data.security_escort || false,
        escortDetails: data.escort_details,
        routeSecurity: data.route_security_level || 'low'
      },
      compliance: {
        transportPermit: data.transport_permit,
        customsDeclaration: data.customs_declaration,
        insurancePolicy: data.insurance_policy
      },
      status: data.status,
      user_id: data.user_id?.toString() || '',
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    }
  }

  private transformProcessingRecord(data: any): ProcessingRecord {
    return {
      id: data.id?.toString() || '',
      facilityId: data.facility_id || '',
      facilityName: data.facility_name || '',
      processType: JSON.parse(data.process_type || '[]'),
      inputBatches: JSON.parse(data.input_batches || '[]').map((batch: any) => ({
        inventoryItemId: batch.inventory_item_id || batch.inventoryItemId,
        inputWeight: batch.input_weight || batch.inputWeight,
        inputGrade: batch.input_grade || batch.inputGrade,
        inputUnit: batch.input_unit || batch.inputUnit
      })),
      processing: {
        equipment: JSON.parse(data.equipment || '[]'),
        parameters: data.parameters || '',
        duration: data.duration || 0,
        operator: data.operator || '',
        supervisor: data.supervisor || '',
        startTime: new Date(data.start_time),
        endTime: data.end_time ? new Date(data.end_time) : undefined
      },
      output: {
        outputItems: JSON.parse(data.output_items || '[]'),
        yield: data.yield || 0,
        recovery: data.recovery,
        wasteGenerated: data.waste_generated || 0
      },
      qualityControl: {
        samplesCollected: data.samples_collected || 0,
        assayResults: data.assay_results,
        qualityNotes: data.quality_notes,
        certificates: data.certificates ? JSON.parse(data.certificates) : []
      },
      status: data.status,
      user_id: data.user_id?.toString() || '',
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    }
  }

  private transformTrackingStatus(data: any): TrackingStatus {
    return {
      id: data.id?.toString() || '',
      lotId: data.lot_id?.toString() || '',
      lotType: data.lot_type,
      currentLocation: data.current_location || { latitude: 0, longitude: 0, timestamp: new Date() },
      currentCustodian: data.current_custodian || '',
      status: data.status,
      lastUpdated: new Date(data.last_updated),
      nextDestination: data.next_destination,
      estimatedArrival: data.estimated_arrival ? new Date(data.estimated_arrival) : undefined,
      transportRecordId: data.transport_record_id?.toString(),
      processingRecordId: data.processing_record_id?.toString(),
      alerts: [],
      user_id: data.user_id?.toString() || '',
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    }
  }

  private transformStakeholder(data: any): Stakeholder {
    return {
      id: data.id?.toString() || '',
      name: data.name || '',
      type: data.type,
      contact: {
        email: data.email,
        phone: data.phone,
        address: data.address
      },
      licenses: JSON.parse(data.licenses || '[]'),
      compliance_status: data.compliance_status,
      verified_by: data.verified_by,
      verified_at: data.verified_at ? new Date(data.verified_at) : undefined,
      user_id: data.user_id?.toString() || '',
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    }
  }

  private transformTrackingAlert(data: any): TrackingAlert {
    return {
      id: data.id?.toString() || '',
      alertType: data.alert_type,
      severity: data.severity,
      message: data.message,
      resolved: data.resolved || false,
      resolvedAt: data.resolved_at ? new Date(data.resolved_at) : undefined,
      resolvedBy: data.resolved_by,
      created_at: new Date(data.created_at)
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

// User and Authentication Types
export type UserRole = "admin" | "standard"

// Supply-chain role. Empty/undefined = legacy account with full access.
export type ChainRole = "operator" | "transporter" | "exporter" | "inspector" | ""

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  chain_role?: ChainRole
  phone?: string
  location?: string
  createdAt: Date | string
}

// Transaction Types
export type TransactionType = "income" | "expense"
export type PaymentStatus = "paid" | "unpaid" | "partial"
export type SalesType = "mineral" | "supply" | "concentrates" | "tailings"
export type MineralType =
  | "gold" | "copper" | "cobalt" | "diamond" | "iron_ore" | "lead" | "zinc"
  | "lithium" | "nickel" | "coltan" | "tantalum" | "tin" | "wolfram" | "titanium"
  | "manganese" | "rare_earth_elements" | "uranium" | "bentonite" | "diatomite"
  | "graphite" | "gypsum" | "feldspar" | "limestone" | "marble" | "kaolin"
  | "phosphates" | "pozzolana" | "salt" | "sand" | "vermiculite" | "silver"
  | "granite" | "chromite" | "gemstones" | "other"
export type ExpenseCategory = "equipment" | "labor" | "chemicals" | "maintenance" | "transport" | "trips" | "fuel" | "other"

export interface Income {
  id: string
  date: Date
  itemName?: string
  mineralType: MineralType
  salesType?: SalesType
  gemstoneType?: GemstoneType
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
  gradeValue?: number
  gradeUnit?: string
  gradeNotes?: string
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

export type ComplianceStatus = "green" | "yellow" | "red" | "blue"
export type ReportFrequency = "monthly" | "quarterly" | "annual"

export interface MineSiteCertification {
  id: string
  mine_site_info_id?: number
  mine_site_name: string
  rmd_identification?: string
  inspection_date?: Date
  inspector_name?: string
  status: ComplianceStatus
  report_reference?: string
  findings?: string
  corrective_actions?: string
  grace_period_ends_at?: Date
  follow_up_requested_at?: Date
  follow_up_due_at?: Date
  is_suspended: boolean
  suspension_lifted_at?: Date
  user_id: string
  created_at: Date
  updated_at: Date
}

export interface CoCLot {
  id: string
  lot_number: string
  verify_code?: string
  production_record_ids?: string
  production_records?: InventoryItem[]
  parent_lot_numbers?: string
  mineral_type: MineralType
  ore_type?: string
  weight: number
  unit: string
  grade?: string
  grade_value?: number
  grade_unit?: string
  number_of_sacks?: number
  source_mine_site: string
  mine_site_status: ComplianceStatus
  mine_operator_name?: string
  miner_name?: string
  miner_national_id?: string
  artisanal_license_number?: string
  coc_system: string
  seal_number?: string
  registered_at?: Date
  sealed_at?: Date
  shipped_at?: Date
  transporter_name?: string
  transport_route?: string
  current_custodian?: string
  upstream_actors?: string
  taxes_fees_royalties?: string
  verification_officer?: string
  documentation_reference?: string
  is_exported: boolean
  // Interoperability fields — derived links, no re-typing
  mine_site_certification_id?: number
  mine_site_certification?: MineSiteCertification
  purchase_order_number?: string
  purchase_date?: Date
  accepted_by?: string
  export_shipment_id?: number
  tracking_state?: string
  source_lots?: LotComposition[]
  user_id: string
  created_at: Date
  updated_at: Date
}

// One source lot's contribution to a mixed lot (Schedule 5 para 3)
export interface LotComposition {
  id: number
  mixed_lot_id: number
  source_lot_id: number
  source_lot?: CoCLot
  weight_contributed: number
  grade_contributed?: number
  purchase_order_number?: string
}

// Complete production→transport→export trace for one lot
export interface LotPassport {
  lot: CoCLot
  certification?: MineSiteCertification
  production_records: InventoryItem[]
  composition: LotComposition[]
  used_in_lots: LotComposition[]
  custody_transfers: any[]
  transport_records: any[]
  processing_records: any[]
  export_shipment?: ExportShipment
  documents: any[]
  alerts: any[]
  tracking?: any
  chain_complete: boolean
}

export interface ExportShipment {
  id: string
  exporter_lot_number: string
  exporter_name: string
  exporter_license_number?: string
  exporter_status: ComplianceStatus
  customer_name: string
  customer_address?: string
  destination_country: string
  material_description: string
  weight: number
  unit: string
  grade?: string
  incoming_lot_numbers: string
  incoming_lot_weights?: string
  coc_lots?: CoCLot[]
  weight_discrepancy_pct?: number
  taxes_fees_royalties?: string
  sealed_at?: Date
  shipped_at?: Date
  transporter_name?: string
  transport_route?: string
  authorised_officer?: string
  application_status: string
  icglr_certificate_number?: string
  icglr_certificate_file?: string
  certificate_issued_at?: Date
  certificate_expires_at?: Date
  user_id: string
  created_at: Date
  updated_at: Date
}

export interface DueDiligenceReport {
  id: string
  reporting_period_start: Date
  reporting_period_end: Date
  frequency: ReportFrequency
  responsible_person: string
  mineral_chain_policy?: string
  management_system?: string
  risk_assessment_summary?: string
  risk_mitigation_plan?: string
  grievance_mechanism?: string
  supplier_capacity?: string
  government_payments?: string
  beneficial_ownership?: string
  published_at?: Date
  submitted_to_directorate: boolean
  submitted_at?: Date
  attachment_reference?: string
  user_id: string
  created_at: Date
  updated_at: Date
}

export interface ThirdPartyAudit {
  id: string
  exporter_name: string
  auditor_name?: string
  audit_requested_at?: Date
  audit_started_at?: Date
  audit_completed_at?: Date
  status: ComplianceStatus
  status_expires_at?: Date
  report_reference?: string
  findings?: string
  corrective_actions?: string
  follow_up_requested_at?: Date
  follow_up_due_at?: Date
  user_id: string
  created_at: Date
  updated_at: Date
}

export interface ComplianceDocument {
  id: string
  document_type: string
  title: string
  reference: string
  related_entity?: string
  related_id?: number
  issued_at?: Date
  expires_at?: Date
  notes?: string
  user_id: string
  created_at: Date
  updated_at: Date
}

// Enhanced types for comprehensive traceability system

// Transport and Logistics Types
export interface GPSLocation {
  latitude: number
  longitude: number
  address?: string
  timestamp: Date
}

export interface TransportRecord {
  id: string
  transportType: 'road' | 'rail' | 'air' | 'sea'
  vehicleDetails: {
    licensePlate: string
    driverName: string
    driverLicense: string
    vehicleType: string
    capacity: number
  }
  route: {
    origin: GPSLocation
    destination: GPSLocation
    waypoints?: GPSLocation[]
    plannedDistance: number
    actualDistance?: number
  }
  timing: {
    departureTime: Date
    arrivalTime?: Date
    estimatedDuration: number
    actualDuration?: number
  }
  cargo: {
    lotIds: string[]
    cocLotIds?: string[]
    sealNumbers: string[]
    packagingType: string
    grossWeight: number
    netWeight: number
  }
  custody: {
    handoverFrom: string
    handoverFromId: string
    handoverTo: string
    handoverToId: string
    witnessedBy?: string[]
    handoverNotes?: string
  }
  security: {
    securityEscort: boolean
    escortDetails?: string
    routeSecurity: 'low' | 'medium' | 'high'
  }
  compliance: {
    transportPermit?: string
    customsDeclaration?: string
    insurancePolicy?: string
  }
  status: 'scheduled' | 'in_transit' | 'delivered' | 'delayed' | 'incident'
  user_id: string
  created_at: Date
  updated_at: Date
}

// Processing and Quality Control Types
export interface ProcessingRecord {
  id: string
  facilityId: string
  facilityName: string
  processType: ProcessingMethod[]
  inputBatches: {
    inventoryItemId: string
    inputWeight: number
    inputGrade?: number
    inputUnit: string
  }[]
  processing: {
    equipment: string
    parameters: string
    duration: number // in minutes
    operator: string
    supervisor: string
    startTime: Date
    endTime?: Date
  }
  output: {
    outputItems: {
      name: string
      weight: number
      grade?: number
      unit: string
      product: ProductType
    }[]
    yield: number // percentage
    recovery?: number // percentage
    wasteGenerated: number
  }
  qualityControl: {
    samplesCollected: number
    assayResults?: string
    qualityNotes?: string
    certificates?: string[]
  }
  status: 'scheduled' | 'in_progress' | 'completed' | 'failed'
  user_id: string
  created_at: Date
  updated_at: Date
}

// Real-time Tracking Types
export interface TrackingStatus {
  id: string
  lotId: string
  lotType: 'inventory' | 'coc_lot'
  currentLocation: GPSLocation
  currentCustodian: string
  status: 'extracted' | 'stored' | 'in_transit' | 'processing' | 'quality_control' | 'ready_for_export' | 'exported'
  lastUpdated: Date
  nextDestination?: string
  estimatedArrival?: Date
  transportRecordId?: string
  processingRecordId?: string
  alerts: TrackingAlert[]
  user_id: string
  created_at: Date
  updated_at: Date
}

export interface TrackingAlert {
  id: string
  alertType: 'delay' | 'route_deviation' | 'temperature' | 'security' | 'compliance' | 'quality'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  resolved: boolean
  resolvedAt?: Date
  resolvedBy?: string
  created_at: Date
}

// Enhanced Chain of Custody with full traceability
export interface EnhancedCoCLot extends Omit<CoCLot, 'production_records'> {
  production_records?: InventoryItem[]
  transport_records?: TransportRecord[]
  processing_records?: ProcessingRecord[]
  tracking_status?: TrackingStatus
  custody_chain: CustodyTransfer[]
  compliance_documents: ComplianceDocument[]
  photos: PhotoRecord[]
  qr_code: string
}

export interface CustodyTransfer {
  id: string
  from_custodian: string
  to_custodian: string
  transfer_date: Date
  transfer_location: GPSLocation
  witness?: string
  transfer_reason: string
  condition_notes?: string
  photos?: string[]
  digital_signature?: string
  user_id: string
  created_at: Date
}

export interface PhotoRecord {
  id: string
  photo_url: string
  photo_type: 'extraction' | 'transport' | 'processing' | 'quality_control' | 'custody_transfer' | 'compliance'
  description?: string
  location?: GPSLocation
  taken_by: string
  taken_at: Date
}

// Stakeholder Management
export interface Stakeholder {
  id: string
  name: string
  type: 'miner' | 'processor' | 'transporter' | 'trader' | 'exporter' | 'customs' | 'inspector'
  contact: {
    email?: string
    phone?: string
    address?: string
  }
  licenses: {
    license_type: string
    license_number: string
    issued_by: string
    valid_from: Date
    valid_until: Date
    status: 'valid' | 'expired' | 'suspended'
  }[]
  compliance_status: ComplianceStatus
  verified_by?: string
  verified_at?: Date
  user_id: string
  created_at: Date
  updated_at: Date
}

export interface ComplianceSummary {
  mine_site_certifications: number
  coc_lots: number
  export_shipments: number
  due_diligence_reports: number
  third_party_audits: number
  documents: number
  blocked_red_status_lots: number
}
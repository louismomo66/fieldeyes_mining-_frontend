/**
 * Request payloads for the enhanced traceability endpoints.
 *
 * These mirror the anonymous structs the Go handlers decode into
 * (backend/handlers/traceability.go — CreateTransportRecord and
 * CreateProcessingRecord). They are deliberately flat and snake_case.
 *
 * Note this is NOT the same shape as the TransportRecord / ProcessingRecord
 * types in lib/types.ts, which are the nested read models the UI renders
 * (transport.vehicleDetails.licensePlate, transport.route.origin.address, …).
 * The old data-service signatures claimed to accept Partial<TransportRecord>
 * and passed it straight through to the API, which would never have decoded
 * correctly. Nothing called them, so the mismatch was never hit.
 */

export interface GeoPointPayload {
  latitude: number
  longitude: number
  address: string
}

export interface TransportRecordPayload {
  transport_type: string
  license_plate: string
  driver_name: string
  driver_license: string
  vehicle_type: string
  vehicle_capacity: number
  origin: GeoPointPayload
  destination: GeoPointPayload
  planned_distance: number
  /** RFC3339 — Go decodes into time.Time. Use new Date(...).toISOString(). */
  departure_time: string
  estimated_duration: number
  coc_lot_ids: number[]
  seal_numbers: string[]
  packaging_type: string
  gross_weight: number
  net_weight: number
  handover_from_name: string
  handover_from_id: string
  handover_to_name: string
  handover_to_id: string
  handover_notes: string
  security_escort: boolean
  escort_details: string
  route_security_level: string
  transport_permit: string
}

export interface ProcessingInputBatchPayload {
  inventory_item_id: number
  input_weight: number
  input_grade: number
  input_unit: string
}

export interface ProcessingOutputItemPayload {
  name: string
  weight: number
  grade: number
  unit: string
  product: string
}

export interface ProcessingRecordPayload {
  facility_id: string
  facility_name: string
  process_type: string[]
  input_batches: ProcessingInputBatchPayload[]
  equipment: string[]
  parameters: string
  duration: number
  operator: string
  supervisor: string
  /** RFC3339 — Go decodes into time.Time. */
  start_time: string
  output_items: ProcessingOutputItemPayload[]
  yield: number
  recovery: number
  waste_generated: number
  samples_collected: number
  assay_results: string
  quality_notes: string
}

/** Sensible zero-values so forms only need to set the fields they show. */
export function emptyTransportPayload(): TransportRecordPayload {
  return {
    transport_type: "road",
    license_plate: "",
    driver_name: "",
    driver_license: "",
    vehicle_type: "truck",
    vehicle_capacity: 0,
    origin: { latitude: 0, longitude: 0, address: "" },
    destination: { latitude: 0, longitude: 0, address: "" },
    planned_distance: 0,
    departure_time: new Date().toISOString(),
    estimated_duration: 0,
    coc_lot_ids: [],
    seal_numbers: [],
    packaging_type: "",
    gross_weight: 0,
    net_weight: 0,
    handover_from_name: "",
    handover_from_id: "",
    handover_to_name: "",
    handover_to_id: "",
    handover_notes: "",
    security_escort: false,
    escort_details: "",
    route_security_level: "standard",
    transport_permit: "",
  }
}

export function emptyProcessingPayload(): ProcessingRecordPayload {
  return {
    facility_id: "",
    facility_name: "",
    process_type: [],
    input_batches: [],
    equipment: [],
    parameters: "",
    duration: 0,
    operator: "",
    supervisor: "",
    start_time: new Date().toISOString(),
    output_items: [],
    yield: 0,
    recovery: 0,
    waste_generated: 0,
    samples_collected: 0,
    assay_results: "",
    quality_notes: "",
  }
}

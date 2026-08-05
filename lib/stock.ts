/**
 * Derived mineral inventory.
 *
 * Nothing here is a stored figure. Every number is recomputed from the chain, so
 * the balance cannot drift the way a saved stock count does.
 *
 * Two facts about the backend make this necessary:
 *
 *  1. Packaging production into a lot only appends a many-to-many row
 *     (ComplianceRepository.LinkProductionRecords). The InventoryItem keeps its
 *     full quantity, so the same material exists twice — once on the production
 *     record and again as the lot's weight. Adding "inventory" to "lots"
 *     double-counts.
 *
 *  2. Recording a sale does not touch inventory at all. There is no link between
 *     an Income row and a lot, so sold material never leaves the stock figure by
 *     itself.
 *
 * Everything normalises to kg — a mineral can be recorded in kg, g, tonnes or
 * troy ounces, and those cannot be added directly.
 */

import type { CoCLot, Income, InventoryItem } from "./types"

export const UNIT_TO_KG: Record<string, number> = {
  kg: 1,
  g: 0.001,
  grams: 0.001,
  tonnes: 1000,
  t: 1000,
  // Troy ounce — the precious-metals standard, not the avoirdupois ounce.
  oz: 0.0311034768,
}

export function toKg(quantity: number, unit: string | undefined): number | null {
  if (!unit) return null
  const factor = UNIT_TO_KG[unit.toLowerCase()]
  return factor === undefined ? null : quantity * factor
}

/** Lot lifecycle states, grouped by what they mean for stock. */
const EXPORTED_STATES = ["exported"]
const IN_TRANSIT_STATES = ["in_transit", "processing", "quality_control"]
const AWAITING_STATES = ["ready_for_export"]

export interface StockLine {
  mineral: string
  /** Everything ever recorded as produced. */
  producedKg: number
  /** Production not yet packaged into a lot. */
  unpackagedKg: number
  /** Lots held at the mine. */
  atMineKg: number
  /** Lots in transit or being processed. */
  inTransitKg: number
  /** Lots ready for export, not yet gone. */
  awaitingExportKg: number
  /** Lots exported — left the chain. */
  exportedKg: number
  /** Recorded as sold in Sales. Not linked to lots, so tracked separately. */
  soldKg: number
  /** unpackaged + atMine + inTransit + awaitingExport. */
  onHandKg: number
  /**
   * produced − exported − sold. Should equal onHandKg. Where it does not,
   * something has been sold or shipped that the chain does not account for.
   */
  expectedKg: number
  varianceKg: number
}

export interface StockDiscrepancy {
  lotId: string
  lotNumber: string
  lotKg: number
  linkedProductionKg: number
  differenceKg: number
}

export interface StockReport {
  lines: StockLine[]
  totalOnHandKg: number
  totalProducedKg: number
  totalSoldKg: number
  totalExportedKg: number
  unconvertible: { name: string; quantity: number; unit: string }[]
  discrepancies: StockDiscrepancy[]
}

function blankLine(mineral: string): StockLine {
  return {
    mineral,
    producedKg: 0,
    unpackagedKg: 0,
    atMineKg: 0,
    inTransitKg: 0,
    awaitingExportKg: 0,
    exportedKg: 0,
    soldKg: 0,
    onHandKg: 0,
    expectedKg: 0,
    varianceKg: 0,
  }
}

/**
 * Production records are named freely ("Gold ore", "raw gold"), while lots and
 * sales carry a mineral_type. Match them by looking for the mineral inside the
 * name — the same fuzzy rule the backend uses in GetAvailableProductionRecords.
 */
// Order matters: "tantalum" is checked before "tin" only incidentally, but
// longer, more specific names must come before any name they contain.
const KNOWN_MINERALS = [
  "gold", "tantalum", "titanium", "tin", "coltan", "wolfram",
  "copper", "cobalt", "lithium", "nickel",
]

export function mineralOf(name: string | undefined): string {
  const lower = (name || "").toLowerCase()
  return KNOWN_MINERALS.find((m) => lower.includes(m)) || lower.trim() || "unknown"
}

/**
 * @param production Every mineral production record (inventory items of type
 *   "mineral"). Pass them all — this function works out which are packaged.
 * @param lots Every lot owned or held, with production_records preloaded.
 * @param sales Income rows, used to show what has been sold.
 */
export function buildStockReport(
  production: InventoryItem[],
  lots: (CoCLot & { production_records?: InventoryItem[] })[],
  sales: Income[] = [],
): StockReport {
  const lines = new Map<string, StockLine>()
  const unconvertible: StockReport["unconvertible"] = []

  const lineFor = (mineral: string) => {
    const key = mineral.toLowerCase()
    if (!lines.has(key)) lines.set(key, blankLine(key))
    return lines.get(key)!
  }

  // Which production records have already been packaged. GetCoCLots preloads
  // production_records, so this is exact and avoids the mineral_type-only
  // endpoint that 400s without a parameter.
  const packaged = new Set<string>()
  for (const lot of lots) {
    for (const rec of lot.production_records || []) packaged.add(String(rec.id))
  }

  for (const rec of production) {
    const kg = toKg(rec.quantity, rec.unit)
    if (kg === null) {
      unconvertible.push({ name: rec.name, quantity: rec.quantity, unit: rec.unit })
      continue
    }
    const line = lineFor(mineralOf(rec.name))
    line.producedKg += kg
    if (!packaged.has(String(rec.id))) line.unpackagedKg += kg
  }

  for (const lot of lots) {
    const kg = toKg(lot.weight, lot.unit)
    if (kg === null) {
      unconvertible.push({ name: lot.lot_number, quantity: lot.weight, unit: lot.unit })
      continue
    }
    const line = lineFor(mineralOf(lot.mineral_type))
    const state = (lot.tracking_state || "").toLowerCase()

    if (lot.is_exported || EXPORTED_STATES.includes(state)) line.exportedKg += kg
    else if (IN_TRANSIT_STATES.includes(state)) line.inTransitKg += kg
    else if (AWAITING_STATES.includes(state)) line.awaitingExportKg += kg
    else line.atMineKg += kg
  }

  for (const sale of sales) {
    const kg = toKg(sale.quantity, sale.unit)
    if (kg === null) continue // priced by the piece — not a mass sale
    lineFor(mineralOf(sale.mineralType)).soldKg += kg
  }

  const out: StockLine[] = []
  for (const line of lines.values()) {
    line.onHandKg = line.unpackagedKg + line.atMineKg + line.inTransitKg + line.awaitingExportKg
    line.expectedKg = line.producedKg - line.exportedKg - line.soldKg
    line.varianceKg = line.onHandKg - line.expectedKg
    out.push(line)
  }
  out.sort((a, b) => b.onHandKg - a.onHandKg)

  return {
    lines: out,
    totalOnHandKg: out.reduce((s, l) => s + l.onHandKg, 0),
    totalProducedKg: out.reduce((s, l) => s + l.producedKg, 0),
    totalSoldKg: out.reduce((s, l) => s + l.soldKg, 0),
    totalExportedKg: out.reduce((s, l) => s + l.exportedKg, 0),
    unconvertible,
    discrepancies: findDiscrepancies(lots),
  }
}

/**
 * Compare each lot's stated weight against the production linked to it.
 *
 * This is the most important check in a chain of custody: it is where material
 * that nobody produced would first appear.
 */
export function findDiscrepancies(
  lots: (CoCLot & { production_records?: InventoryItem[] })[],
  toleranceKg = 0.01,
): StockDiscrepancy[] {
  const out: StockDiscrepancy[] = []

  for (const lot of lots) {
    const records = lot.production_records || []
    if (records.length === 0) continue // nothing to reconcile against

    const lotKg = toKg(lot.weight, lot.unit)
    if (lotKg === null) continue

    let linkedKg = 0
    let convertible = true
    for (const rec of records) {
      const kg = toKg(rec.quantity, rec.unit)
      if (kg === null) {
        convertible = false
        break
      }
      linkedKg += kg
    }
    if (!convertible) continue

    const difference = lotKg - linkedKg
    if (Math.abs(difference) > toleranceKg) {
      out.push({
        lotId: lot.id,
        lotNumber: lot.lot_number,
        lotKg,
        linkedProductionKg: linkedKg,
        differenceKg: difference,
      })
    }
  }

  return out.sort((a, b) => Math.abs(b.differenceKg) - Math.abs(a.differenceKg))
}

export function formatKg(kg: number): string {
  if (Math.abs(kg) < 1e-9) return "0 kg"
  if (Math.abs(kg) >= 1000) return `${(kg / 1000).toFixed(3)} t`
  if (Math.abs(kg) < 0.001) return `${(kg * 1000).toFixed(2)} g`
  return `${kg.toFixed(2)} kg`
}

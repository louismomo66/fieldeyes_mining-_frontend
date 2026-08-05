/**
 * Derived compliance readiness.
 *
 * The point of this module is to answer one question per lot — *can it ship, and
 * if not, what is the next thing to do* — rather than to present a checklist and
 * leave the operator to work it out.
 *
 * Three ideas do that work:
 *
 *  1. **Nothing is stored.** Every check is recomputed from records already
 *     entered elsewhere: the linked production records, the mine site
 *     certification, the export shipment. Each satisfied check reports whether it
 *     was `derived` (the system worked it out) or `entered` (somebody typed it).
 *     The Mineral Records page asks for 83 fields; roughly half are already known.
 *
 *  2. **Checks are tiered, not counted.** A red mine site stops trade outright; a
 *     missing sack count does not. Treating them as equal parts of a percentage
 *     makes 90% look nearly fine when the missing 10% is the export certificate.
 *     So there is no percentage — there is a verdict. See SEVERITY below; it is a
 *     judgement call, and it is a single map so it can be argued with and changed.
 *
 *  3. **A check that cannot apply is not a gap.** An export certificate for a lot
 *     that was never exported is marked not-applicable and disappears from the
 *     count entirely.
 *
 * Statutory references are deliberately coarse. Where the backend models already
 * pin a field to a paragraph of Schedule 5 the reference repeats it; everywhere
 * else it names the Schedule only.
 */

import type {
  CoCLot,
  ComplianceDocument,
  ComplianceStatus,
  DueDiligenceReport,
  ExportShipment,
  ThirdPartyAudit,
} from "./types"
import { toKg } from "./stock"

export type CheckState = "satisfied" | "missing" | "blocked" | "not_applicable"

/** Where a satisfied check got its answer. */
export type CheckSource = "derived" | "entered"

/**
 * How much a failing check actually costs you.
 *
 *  - `blocking`  — the lot cannot lawfully be traded at all until this clears.
 *  - `required`  — an export officer will stop the shipment without it.
 *  - `advisory`  — good record-keeping; nobody will hold the lot over it.
 */
export type Severity = "blocking" | "required" | "advisory"

/**
 * The tiering, in one place. Anything not listed is advisory.
 *
 * `site_status` is the only check that can reach `blocking`, and only when the
 * site is red — a blue (uninspected) site is merely required, because it can be
 * resolved by booking an inspection rather than by lifting a suspension.
 */
const SEVERITY: Record<string, Severity> = {
  site_status: "blocking",
  origin: "required",
  certification: "required",
  seal: "required",
  weight: "required",
  coc_system: "required",
  verifier: "required",
  sealed_at: "required",
  shipped_at: "required",
  transport: "required",
  artisanal_licence: "required",
  composition: "required",
  royalties: "required",
  documents: "required",
  verify: "required",
  icglr: "required",
  // advisory: grade, packaging, operator, custodian, purchase
}

const severityOf = (id: string): Severity => SEVERITY[id] ?? "advisory"

export interface Check {
  id: string
  /** Plain-language name for the thing, as an operator would say it. */
  label: string
  /** Statutory hook, for the auditor reading over the operator's shoulder. */
  reference: string
  state: CheckState
  severity: Severity
  /** The answer, when there is one — shown instead of asking for it again. */
  value?: string
  source?: CheckSource
  /** What to do about it, phrased as an instruction. */
  remedy?: string
}

/** The single answer for a lot. */
export type Verdict = "blocked" | "not_ready" | "ready"

export interface LotReadiness {
  lotId: string
  lotNumber: string
  mineral: string
  weight: number
  unit: string
  weightKg: number | null
  siteStatus: ComplianceStatus
  stage: "registered" | "sealed" | "in transit" | "exported"

  verdict: Verdict
  /** One sentence stating where the lot stands. */
  headline: string
  /** The single most important thing to do next, or undefined when ready. */
  nextAction?: string
  /** How many things are outstanding after the next action, so "and 3 more" can be said honestly. */
  outstanding: number

  /** The lot can show where it came from: production or source lots, plus a certified site. */
  originDemonstrated: boolean
  checks: Check[]
}

const has = (v: unknown): boolean =>
  v !== undefined && v !== null && String(v).trim() !== ""

const fmtDate = (d: Date | string | undefined): string | undefined => {
  if (!d) return undefined
  const date = d instanceof Date ? d : new Date(d)
  return Number.isNaN(date.getTime()) ? undefined : date.toLocaleDateString()
}

function ok(
  id: string,
  label: string,
  reference: string,
  value: string | undefined,
  source: CheckSource,
): Check {
  return { id, label, reference, state: "satisfied", severity: severityOf(id), value, source }
}

function gap(id: string, label: string, reference: string, remedy: string): Check {
  return { id, label, reference, state: "missing", severity: severityOf(id), remedy }
}

function na(id: string, label: string, reference: string, why: string): Check {
  return { id, label, reference, state: "not_applicable", severity: "advisory", value: why }
}

/** True once the lot has left the mine, which is when transport details start to matter. */
function hasMoved(lot: CoCLot): boolean {
  const state = (lot.tracking_state ?? "").toLowerCase()
  return (
    lot.is_exported ||
    has(lot.shipped_at) ||
    ["in_transit", "processing", "quality_control", "ready_for_export", "exported"].includes(state)
  )
}

function stageOf(lot: CoCLot): LotReadiness["stage"] {
  if (lot.is_exported || (lot.tracking_state ?? "") === "exported") return "exported"
  if (hasMoved(lot)) return "in transit"
  if (has(lot.sealed_at)) return "sealed"
  return "registered"
}

/**
 * Assess one lot. `documents` and `shipments` are the full lists — the caller does
 * not have to pre-filter them, since the matching rules differ per check.
 */
export function assessLot(
  lot: CoCLot,
  documents: ComplianceDocument[] = [],
  shipments: ExportShipment[] = [],
): LotReadiness {
  const checks: Check[] = []

  const productionCount = lot.production_records?.length ?? 0
  const sourceLots = lot.source_lots ?? []
  const purchased =
    has(lot.purchase_order_number) || has(lot.purchase_date) || has(lot.accepted_by)
  const moved = hasMoved(lot)

  // --- Origin -------------------------------------------------------------
  if (productionCount > 0) {
    checks.push(
      ok(
        "origin",
        "Linked to the production it came from",
        "Schedule 5",
        `${productionCount} production record${productionCount === 1 ? "" : "s"}`,
        "derived",
      ),
    )
  } else if (sourceLots.length > 0) {
    checks.push(
      ok(
        "origin",
        "Linked to the lots it was blended from",
        "Schedule 5 ¶3",
        `${sourceLots.length} source lot${sourceLots.length === 1 ? "" : "s"}`,
        "derived",
      ),
    )
  } else {
    checks.push(
      gap(
        "origin",
        "Linked to the production it came from",
        "Schedule 5",
        "Link the production records this lot was packaged from.",
      ),
    )
  }

  const cert = lot.mine_site_certification
  if (cert) {
    checks.push(
      ok(
        "certification",
        "Mine site certificate attached",
        "Schedule 5",
        cert.mine_site_name + (has(cert.rmd_identification) ? ` (${cert.rmd_identification})` : ""),
        "derived",
      ),
    )
  } else if (lot.mine_site_certification_id) {
    checks.push(ok("certification", "Mine site certificate attached", "Schedule 5", "Linked", "derived"))
  } else {
    checks.push(
      gap(
        "certification",
        "Mine site certificate attached",
        "Schedule 5",
        `Attach the certificate for ${has(lot.source_mine_site) ? lot.source_mine_site : "the source site"} — the lot's status then follows it automatically.`,
      ),
    )
  }

  if (lot.mine_site_status === "red") {
    checks.push({
      id: "site_status",
      label: "Mine site cleared for trade",
      reference: "S.I. 23/2023",
      state: "blocked",
      severity: "blocking",
      value: "Mine site status is red",
      remedy: "This lot cannot be traded or exported until the site's suspension is lifted.",
    })
  } else if (lot.mine_site_status === "blue") {
    checks.push({
      ...gap(
        "site_status",
        "Mine site cleared for trade",
        "S.I. 23/2023",
        "The site has not been inspected. Record an inspection to move it off blue.",
      ),
      severity: "required",
    })
  } else {
    checks.push(
      ok(
        "site_status",
        "Mine site cleared for trade",
        "S.I. 23/2023",
        lot.mine_site_status === "green" ? "Green — certified" : "Yellow — provisionally certified",
        "derived",
      ),
    )
  }

  // --- Identity and quantity ---------------------------------------------
  checks.push(
    has(lot.seal_number)
      ? ok("seal", "Seal number", "Schedule 5 ¶1", lot.seal_number, "entered")
      : gap("seal", "Seal number", "Schedule 5 ¶1", "Record the seal applied when the lot was closed."),
  )

  checks.push(
    lot.weight > 0
      ? ok(
          "weight",
          "Weight",
          "Schedule 5",
          `${lot.weight} ${lot.unit}`,
          productionCount > 0 || sourceLots.length > 0 ? "derived" : "entered",
        )
      : gap("weight", "Weight", "Schedule 5", "Set the lot weight, or link production records to derive it."),
  )

  checks.push(
    has(lot.grade_value) && has(lot.grade_unit)
      ? ok("grade", "Grade", "Schedule 5", `${lot.grade_value} ${lot.grade_unit}`, "entered")
      : has(lot.grade)
        ? ok("grade", "Grade", "Schedule 5", lot.grade, "entered")
        : gap("grade", "Grade", "Schedule 5", "Record the assayed grade and its unit."),
  )

  checks.push(
    has(lot.number_of_sacks)
      ? ok("packaging", "Number of sacks", "Schedule 5", `${lot.number_of_sacks}`, "entered")
      : gap("packaging", "Number of sacks", "Schedule 5", "Record how many sacks or bags make up the lot."),
  )

  // --- Actors -------------------------------------------------------------
  const operator = has(lot.mine_operator_name) ? lot.mine_operator_name : lot.miner_name
  checks.push(
    has(operator)
      ? ok("operator", "Operator or miner named", "Schedule 5", operator, "entered")
      : gap(
          "operator",
          "Operator or miner named",
          "Schedule 5",
          "Name the operator working the site, or the miner who produced the material.",
        ),
  )

  // Artisanal licensing only bites where the lot is attributed to an individual
  // miner rather than to a company operating the site.
  if (has(lot.miner_name)) {
    checks.push(
      has(lot.artisanal_license_number)
        ? ok("artisanal_licence", "Miner's licence number", "S.I. 23/2023", lot.artisanal_license_number, "entered")
        : gap(
            "artisanal_licence",
            "Miner's licence number",
            "S.I. 23/2023",
            `Record the licence or tag number for ${lot.miner_name}.`,
          ),
    )
  } else {
    checks.push(
      na("artisanal_licence", "Miner's licence number", "S.I. 23/2023", "No individual miner on this lot"),
    )
  }

  checks.push(
    has(lot.coc_system)
      ? ok("coc_system", "Chain-of-custody system", "Schedule 5", lot.coc_system, "entered")
      : gap(
          "coc_system",
          "Chain-of-custody system",
          "Schedule 5",
          "State which system governs this lot — for example ICGLR/RCM.",
        ),
  )

  checks.push(
    has(lot.current_custodian)
      ? ok("custodian", "Who is holding it now", "Schedule 5", lot.current_custodian, "entered")
      : gap("custodian", "Who is holding it now", "Schedule 5", "Record who currently holds the lot."),
  )

  checks.push(
    has(lot.verification_officer)
      ? ok("verifier", "Paperwork checked by", "Schedule 5 ¶1", lot.verification_officer, "entered")
      : gap(
          "verifier",
          "Paperwork checked by",
          "Schedule 5 ¶1",
          "Name the staff member who checked this lot's documentation.",
        ),
  )

  // --- Dates and movement -------------------------------------------------
  checks.push(
    has(lot.sealed_at)
      ? ok("sealed_at", "Date sealed", "Schedule 5 ¶1", fmtDate(lot.sealed_at), "entered")
      : gap("sealed_at", "Date sealed", "Schedule 5 ¶1", "Record the date the lot was sealed."),
  )

  if (moved) {
    checks.push(
      has(lot.shipped_at)
        ? ok("shipped_at", "Date shipped", "Schedule 5 ¶1", fmtDate(lot.shipped_at), "entered")
        : gap("shipped_at", "Date shipped", "Schedule 5 ¶1", "Record the date the lot left the site."),
    )
    checks.push(
      has(lot.transporter_name) && has(lot.transport_route)
        ? ok(
            "transport",
            "Transporter and route",
            "Schedule 5",
            `${lot.transporter_name} — ${lot.transport_route}`,
            "entered",
          )
        : gap("transport", "Transporter and route", "Schedule 5", "Record who moved the lot and by what route."),
    )
  } else {
    checks.push(na("shipped_at", "Date shipped", "Schedule 5 ¶1", "Still at the site"))
    checks.push(na("transport", "Transporter and route", "Schedule 5", "Still at the site"))
  }

  // --- Purchase, only for material bought in ------------------------------
  if (purchased || sourceLots.length > 0) {
    const parts = [
      has(lot.purchase_order_number) ? `PO ${lot.purchase_order_number}` : undefined,
      fmtDate(lot.purchase_date),
      has(lot.accepted_by) ? `accepted by ${lot.accepted_by}` : undefined,
    ].filter(Boolean)
    checks.push(
      has(lot.purchase_order_number) && has(lot.accepted_by)
        ? ok("purchase", "Purchase order and who accepted it", "Schedule 5 ¶2", parts.join(" • "), "entered")
        : gap(
            "purchase",
            "Purchase order and who accepted it",
            "Schedule 5 ¶2",
            "Record the purchase order number and who accepted the material.",
          ),
    )
  } else {
    checks.push(na("purchase", "Purchase order and who accepted it", "Schedule 5 ¶2", "Own production"))
  }

  // --- Blend composition, only for mixed lots -----------------------------
  if (sourceLots.length > 0) {
    const weighed = sourceLots.filter((c) => c.weight_contributed > 0).length
    checks.push(
      weighed === sourceLots.length
        ? ok(
            "composition",
            "Weight from each source lot",
            "Schedule 5 ¶3",
            `${sourceLots.length} source lots, all weighed`,
            "derived",
          )
        : gap(
            "composition",
            "Weight from each source lot",
            "Schedule 5 ¶3",
            `${sourceLots.length - weighed} of ${sourceLots.length} source lots have no contributed weight.`,
          ),
    )
  } else {
    checks.push(na("composition", "Weight from each source lot", "Schedule 5 ¶3", "Not a mixed lot"))
  }

  // --- Payments -----------------------------------------------------------
  checks.push(
    has(lot.taxes_fees_royalties)
      ? ok("royalties", "Royalties and fees paid", "S.I. 23/2023", lot.taxes_fees_royalties, "entered")
      : gap("royalties", "Royalties and fees paid", "S.I. 23/2023", "Record what was paid on this lot, and to whom."),
  )

  // --- Supporting documents -----------------------------------------------
  const attached = documents.filter(
    (d) => d.related_entity === "coc_lot" && String(d.related_id ?? "") === String(lot.id),
  )
  if (attached.length > 0) {
    checks.push(
      ok(
        "documents",
        "Paperwork on file",
        "Schedule 5",
        `${attached.length} document${attached.length === 1 ? "" : "s"}`,
        "derived",
      ),
    )
  } else if (has(lot.documentation_reference)) {
    checks.push(ok("documents", "Paperwork on file", "Schedule 5", lot.documentation_reference, "entered"))
  } else {
    checks.push(
      gap("documents", "Paperwork on file", "Schedule 5", "Attach the lot's paperwork, or record where it is filed."),
    )
  }

  // --- Public verification -------------------------------------------------
  checks.push(
    has(lot.verify_code)
      ? ok("verify", "Public QR code", "reg. 53", "Issued", "derived")
      : gap("verify", "Public QR code", "reg. 53", "No verification code on this lot — re-save it to have one issued."),
  )

  // --- Export certificate, only once exported ------------------------------
  if (lot.is_exported || lot.export_shipment_id) {
    const shipment = shipments.find((s) => String(s.id) === String(lot.export_shipment_id))
    const certNumber = shipment?.icglr_certificate_number
    checks.push(
      has(certNumber)
        ? ok("icglr", "ICGLR export certificate", "ICGLR", certNumber, "derived")
        : gap(
            "icglr",
            "ICGLR export certificate",
            "ICGLR",
            shipment
              ? `Export ${shipment.exporter_lot_number} has no certificate number yet.`
              : "This lot is marked exported but is not linked to an export shipment.",
          ),
    )
  } else {
    checks.push(na("icglr", "ICGLR export certificate", "ICGLR", "Not exported"))
  }

  // --- The verdict ---------------------------------------------------------
  const blocking = checks.filter((c) => c.state === "blocked")
  const missingRequired = checks.filter((c) => c.state === "missing" && c.severity === "required")
  const missingAdvisory = checks.filter((c) => c.state === "missing" && c.severity === "advisory")
  const stage = stageOf(lot)

  let verdict: Verdict
  let headline: string
  let nextAction: string | undefined
  let outstanding: number

  if (blocking.length > 0) {
    verdict = "blocked"
    headline = blocking[0].value ?? "Trade blocked"
    nextAction = blocking[0].remedy
    outstanding = missingRequired.length
  } else if (missingRequired.length > 0) {
    verdict = "not_ready"
    headline =
      missingRequired.length === 1
        ? "One thing left before this can be exported"
        : `${missingRequired.length} things left before this can be exported`
    nextAction = missingRequired[0].remedy
    outstanding = missingRequired.length - 1
  } else {
    verdict = "ready"
    headline =
      stage === "exported" ? "Exported, file complete" : "Ready to export — nothing outstanding"
    nextAction = undefined
    outstanding = missingAdvisory.length
  }

  return {
    lotId: String(lot.id),
    lotNumber: lot.lot_number,
    mineral: lot.mineral_type,
    weight: lot.weight,
    unit: lot.unit,
    weightKg: toKg(lot.weight, lot.unit),
    siteStatus: lot.mine_site_status,
    stage,
    verdict,
    headline,
    nextAction,
    outstanding,
    originDemonstrated:
      (productionCount > 0 || sourceLots.length > 0) &&
      Boolean(lot.mine_site_certification_id || lot.mine_site_certification),
    checks,
  }
}

export interface OrgCheck extends Check {
  /** Which tab of the records workspace fixes this. */
  tab?: string
  /**
   * The problem as a noun phrase — "expired licences" — so it can be dropped into
   * a sentence. Only set when the check is blocking.
   */
  problem?: string
}

/**
 * Obligations that sit on the operator rather than on any one lot: the due
 * diligence report, the third-party audit, and documents about to lapse. These
 * stop every lot at once, which is why they are reported separately.
 */
export function assessOrganisation(
  reports: DueDiligenceReport[],
  audits: ThirdPartyAudit[],
  documents: ComplianceDocument[],
  now: Date = new Date(),
): OrgCheck[] {
  const checks: OrgCheck[] = []

  const covering = reports.find((r) => {
    const start = new Date(r.reporting_period_start)
    const end = new Date(r.reporting_period_end)
    return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start <= now && now <= end
  })
  const submitted = reports.filter((r) => r.submitted_to_directorate)
  if (covering) {
    checks.push({
      ...ok(
        "due_diligence",
        "Due diligence report covers today",
        "S.I. 23/2023",
        `${fmtDate(covering.reporting_period_start)} – ${fmtDate(covering.reporting_period_end)}${covering.submitted_to_directorate ? ", submitted" : ", not yet submitted"}`,
        "derived",
      ),
      severity: "required",
      tab: "diligence",
    })
  } else {
    checks.push({
      ...gap(
        "due_diligence",
        "Due diligence report covers today",
        "S.I. 23/2023",
        submitted.length > 0
          ? "The most recent report's period has ended. Start the next one."
          : "No due diligence report has been filed.",
      ),
      severity: "required",
      tab: "diligence",
    })
  }

  const liveAudit = audits.find((a) => {
    if (a.status === "red") return false
    if (!a.status_expires_at) return Boolean(a.audit_completed_at)
    const expires = new Date(a.status_expires_at)
    return !Number.isNaN(expires.getTime()) && expires > now
  })
  const redAudit = audits.find((a) => a.status === "red")
  if (redAudit) {
    checks.push({
      id: "audit",
      label: "Third-party audit is current",
      reference: "ICGLR",
      state: "blocked",
      severity: "blocking",
      value: `${redAudit.auditor_name ?? "Audit"} — red`,
      remedy: "Close out the audit findings before exporting.",
      tab: "audits",
      problem: "a red third-party audit",
    })
  } else if (liveAudit) {
    checks.push({
      ...ok(
        "audit",
        "Third-party audit is current",
        "ICGLR",
        `${liveAudit.auditor_name ?? "Audit"}${liveAudit.status_expires_at ? ` — valid to ${fmtDate(liveAudit.status_expires_at)}` : ""}`,
        "derived",
      ),
      severity: "required",
      tab: "audits",
    })
  } else {
    checks.push({
      ...gap(
        "audit",
        "Third-party audit is current",
        "ICGLR",
        audits.length > 0
          ? "Every audit on file has lapsed. Request the next one."
          : "No third-party audit recorded.",
      ),
      severity: "required",
      tab: "audits",
    })
  }

  const expired: ComplianceDocument[] = []
  const expiring: ComplianceDocument[] = []
  const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  for (const doc of documents) {
    if (!doc.expires_at) continue
    const expires = new Date(doc.expires_at)
    if (Number.isNaN(expires.getTime())) continue
    if (expires < now) expired.push(doc)
    else if (expires <= soon) expiring.push(doc)
  }
  if (expired.length > 0) {
    checks.push({
      id: "documents_valid",
      label: "Licences and permits in date",
      reference: "S.I. 23/2023",
      state: "blocked",
      severity: "blocking",
      value: `${expired.length} expired — ${expired.map((d) => d.title).join(", ")}`,
      remedy: "Renew these before trading further.",
      tab: "documents",
      problem: expired.length === 1 ? `an expired ${expired[0].title.toLowerCase()}` : "expired licences",
    })
  } else if (expiring.length > 0) {
    checks.push({
      ...gap(
        "documents_valid",
        "Licences and permits in date",
        "S.I. 23/2023",
        `Expiring within 30 days — ${expiring.map((d) => d.title).join(", ")}`,
      ),
      severity: "required",
      tab: "documents",
    })
  } else {
    checks.push({
      ...ok(
        "documents_valid",
        "Licences and permits in date",
        "S.I. 23/2023",
        documents.length > 0 ? `${documents.length} on file, none expiring` : "Nothing on file to expire",
        "derived",
      ),
      severity: "required",
      tab: "documents",
    })
  }

  return checks
}

export interface BoardSummary {
  lots: number
  ready: number
  notReady: number
  blocked: number
  /**
   * One sentence for the top of the page. Company-level problems are named first
   * because they stop every lot at once, and no amount of per-lot work clears them.
   */
  headline: string
  /** Every outstanding item across all lots, worst and most common first. */
  topGaps: Array<{ id: string; label: string; count: number; severity: Severity; remedy?: string }>
}

const RANK: Record<Severity, number> = { blocking: 0, required: 1, advisory: 2 }

export function summarise(readiness: LotReadiness[], orgChecks: OrgCheck[] = []): BoardSummary {
  const counts = new Map<string, { label: string; count: number; severity: Severity; remedy?: string }>()
  for (const lot of readiness) {
    for (const check of lot.checks) {
      if (check.state !== "missing") continue
      const existing = counts.get(check.id)
      if (existing) existing.count += 1
      else counts.set(check.id, { label: check.label, count: 1, severity: check.severity, remedy: check.remedy })
    }
  }

  const ready = readiness.filter((l) => l.verdict === "ready").length
  const blocked = readiness.filter((l) => l.verdict === "blocked").length
  const notReady = readiness.filter((l) => l.verdict === "not_ready").length
  const orgBlocking = orgChecks.filter((c) => c.state === "blocked")

  let headline: string
  if (readiness.length === 0) {
    headline = "No lots recorded yet."
  } else if (orgBlocking.length > 0) {
    headline = `Every lot is held up by ${orgBlocking.map((c) => c.problem ?? c.label.toLowerCase()).join(" and ")}.`
  } else if (ready === readiness.length) {
    headline = `All ${readiness.length} lots are ready to export.`
  } else {
    const parts = [`${ready} of ${readiness.length} lots ready to export`]
    if (blocked > 0) parts.push(`${blocked} blocked`)
    if (notReady > 0) parts.push(`${notReady} needing work`)
    headline = parts.join(", ") + "."
  }

  return {
    lots: readiness.length,
    ready,
    notReady,
    blocked,
    headline,
    topGaps: Array.from(counts.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => RANK[a.severity] - RANK[b.severity] || b.count - a.count),
  }
}

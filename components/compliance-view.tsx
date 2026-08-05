"use client"

import { useEffect, useState } from "react"
import type React from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck, Plus, Trash2, RefreshCw } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { toast } from "sonner"
import { ComplianceBoard } from "@/components/compliance-board"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth-context"
import { dataService } from "@/lib/data-service"
import type {
  CoCLot,
  ComplianceDocument,
  ComplianceStatus,
  DueDiligenceReport,
  ExportShipment,
  InventoryItem,
  MineSiteCertification,
  ThirdPartyAudit,
} from "@/lib/types"

const statusOptions: ComplianceStatus[] = ["green", "yellow", "blue", "red"]

// The colour alone means nothing to anyone who has not read the regulations, so
// every dropdown spells out what it does to the material.
const statusLabels: Record<ComplianceStatus, string> = {
  green: "Green — certified, cleared to trade",
  yellow: "Yellow — provisionally certified",
  blue: "Blue — not yet inspected",
  red: "Red — suspended, trade blocked",
}

// The minerals the Regulations designate for chain-of-custody, plus tantalum and
// titanium, which are lotted here in their own right rather than only as coltan.
const designatedMinerals = ["gold", "tin", "tantalum", "coltan", "wolfram", "titanium"]

// Anything else the production side can record. A lot has to be able to describe
// whatever was actually produced, so these are offered below the designated set
// instead of forcing an unrelated mineral into one of the six.
const otherMinerals = [
  "copper", "cobalt", "lithium", "nickel", "iron_ore", "lead", "zinc",
  "manganese", "chromite", "rare_earth_elements", "uranium", "graphite",
  "silver", "diamond", "gemstones", "bentonite", "diatomite", "gypsum",
  "feldspar", "limestone", "marble", "kaolin", "phosphates", "pozzolana",
  "salt", "sand", "vermiculite", "granite", "other",
]

const mineralLabels: Record<string, string> = {
  gold: "Gold (Au)",
  tin: "Tin — cassiterite (Sn)",
  tantalum: "Tantalum (Ta)",
  coltan: "Coltan — tantalum/niobium ore",
  wolfram: "Wolfram — tungsten (W)",
  titanium: "Titanium — ilmenite/rutile (Ti)",
  copper: "Copper (Cu)",
  cobalt: "Cobalt (Co)",
  lithium: "Lithium (Li)",
  nickel: "Nickel (Ni)",
  iron_ore: "Iron ore (Fe)",
  lead: "Lead (Pb)",
  zinc: "Zinc (Zn)",
  manganese: "Manganese (Mn)",
  chromite: "Chromite",
  rare_earth_elements: "Rare earth elements",
  uranium: "Uranium (U)",
  graphite: "Graphite",
  silver: "Silver (Ag)",
  diamond: "Diamond",
  gemstones: "Gemstones",
  bentonite: "Bentonite",
  diatomite: "Diatomite",
  gypsum: "Gypsum",
  feldspar: "Feldspar",
  limestone: "Limestone",
  marble: "Marble",
  kaolin: "Kaolin",
  phosphates: "Phosphates",
  pozzolana: "Pozzolana",
  salt: "Salt",
  sand: "Sand",
  vermiculite: "Vermiculite",
  granite: "Granite",
  other: "Other",
}

const unitOptions = [
  { value: "kg", label: "kg — kilograms" },
  { value: "g", label: "g — grams" },
  { value: "tonnes", label: "tonnes" },
  { value: "carats", label: "carats" },
  { value: "lbs", label: "lbs — pounds" },
]

const documentTypeOptions = [
  { value: "licence", label: "Licence" },
  { value: "permit", label: "Permit" },
  { value: "certificate", label: "Certificate (ICGLR, origin, analysis)" },
  { value: "assay_report", label: "Assay / lab report" },
  { value: "royalty_receipt", label: "Royalty or tax receipt" },
  { value: "invoice", label: "Invoice" },
  { value: "packing_list", label: "Packing list" },
  { value: "transport_document", label: "Transport document / waybill" },
  { value: "audit_report", label: "Audit report" },
  { value: "due_diligence_report", label: "Due diligence report" },
  { value: "identification", label: "Identification (miner, operator, buyer)" },
  { value: "other", label: "Other" },
]

// `coc_lot` is not a cosmetic choice — it is the exact string the passport query
// matches on (data/compliance.go). Typing anything else silently detaches the
// document from the lot, which is why this is a dropdown and not a text field.
const relatedEntityOptions = [
  { value: "none", label: "Not linked to a specific record" },
  { value: "coc_lot", label: "A CoC lot" },
  { value: "export_shipment", label: "An export shipment" },
  { value: "mine_site", label: "A mine site" },
]

const reportFrequencyOptions = [
  { value: "annual", label: "Annual" },
  { value: "quarterly", label: "Quarterly" },
  { value: "monthly", label: "Monthly" },
]

const applicationStatusOptions = [
  { value: "draft", label: "Draft — not yet submitted" },
  { value: "submitted", label: "Submitted to the Directorate" },
  { value: "approved", label: "Approved — certificate issued" },
  { value: "rejected", label: "Rejected" },
]

// Common destinations for Ugandan 3TG exports, offered as suggestions rather
// than a closed list — the field stays free text.
const destinationSuggestions = [
  "United Arab Emirates", "Switzerland", "China", "India", "Belgium",
  "Germany", "Kenya", "Rwanda", "Turkey", "United Kingdom", "Singapore",
]

const blankMineSite = {
  mine_site_name: "",
  rmd_identification: "",
  inspection_date: "",
  inspector_name: "",
  status: "blue" as ComplianceStatus,
  report_reference: "",
  findings: "",
  corrective_actions: "",
  grace_period_ends_at: "",
  follow_up_due_at: "",
  is_suspended: false,
}

const blankLot = {
  lot_number: "",
  parent_lot_numbers: "",
  mine_site_certification_id: undefined as number | undefined,
  mineral_type: "gold",
  ore_type: "",
  weight: "",
  unit: "kg",
  grade: "",
  grade_value: "",
  grade_unit: "",
  number_of_sacks: "",
  source_mine_site: "",
  mine_site_status: "blue" as ComplianceStatus,
  mine_operator_name: "",
  miner_name: "",
  miner_national_id: "",
  artisanal_license_number: "",
  coc_system: "",
  seal_number: "",
  registered_at: "",
  sealed_at: "",
  shipped_at: "",
  transporter_name: "",
  transport_route: "",
  current_custodian: "",
  upstream_actors: "",
  taxes_fees_royalties: "",
  verification_officer: "",
  documentation_reference: "",
}

const blankExport = {
  exporter_lot_number: "",
  exporter_name: "",
  exporter_license_number: "",
  exporter_status: "blue" as ComplianceStatus,
  customer_name: "",
  customer_address: "",
  destination_country: "",
  material_description: "",
  weight: "",
  unit: "kg",
  grade: "",
  incoming_lot_numbers: "",
  incoming_lot_weights: "",
  taxes_fees_royalties: "",
  sealed_at: "",
  shipped_at: "",
  transporter_name: "",
  transport_route: "",
  authorised_officer: "",
  application_status: "draft",
  icglr_certificate_number: "",
  icglr_certificate_file: "",
  certificate_issued_at: "",
  certificate_expires_at: "",
}

const blankDueDiligence = {
  reporting_period_start: "",
  reporting_period_end: "",
  frequency: "annual",
  responsible_person: "",
  mineral_chain_policy: "",
  management_system: "",
  risk_assessment_summary: "",
  risk_mitigation_plan: "",
  grievance_mechanism: "",
  supplier_capacity: "",
  government_payments: "",
  beneficial_ownership: "",
  published_at: "",
  submitted_to_directorate: false,
  submitted_at: "",
  attachment_reference: "",
}

const blankAudit = {
  exporter_name: "",
  auditor_name: "",
  audit_requested_at: "",
  audit_started_at: "",
  audit_completed_at: "",
  status: "blue" as ComplianceStatus,
  status_expires_at: "",
  report_reference: "",
  findings: "",
  corrective_actions: "",
  follow_up_requested_at: "",
  follow_up_due_at: "",
}

const blankDocument = {
  document_type: "licence",
  title: "",
  reference: "",
  related_entity: "none",
  related_id: undefined as number | undefined,
  issued_at: "",
  expires_at: "",
  notes: "",
}

export function ComplianceView() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("board")
  const [certifications, setCertifications] = useState<MineSiteCertification[]>([])
  const [lots, setLots] = useState<CoCLot[]>([])
  const [exportsData, setExportsData] = useState<ExportShipment[]>([])
  const [reports, setReports] = useState<DueDiligenceReport[]>([])
  const [audits, setAudits] = useState<ThirdPartyAudit[]>([])
  const [documents, setDocuments] = useState<ComplianceDocument[]>([])
  const [mineSiteForm, setMineSiteForm] = useState(blankMineSite)
  const [lotForm, setLotForm] = useState(blankLot)
  const [exportForm, setExportForm] = useState(blankExport)
  const [dueDiligenceForm, setDueDiligenceForm] = useState(blankDueDiligence)
  const [auditForm, setAuditForm] = useState(blankAudit)
  const [documentForm, setDocumentForm] = useState(blankDocument)

  useEffect(() => {
    if (!isLoading && !user) router.push("/login")
  }, [isLoading, router, user])

  useEffect(() => {
    if (user) loadCompliance()
  }, [user])

  async function loadCompliance() {
    setLoading(true)
    try {
      // The board derives its own counts, so the server summary is not fetched.
      const [certResult, lotResult, exportResult, reportResult, auditResult, docResult] = await Promise.all([
        dataService.getMineSiteCertifications(),
        dataService.getCoCLots(),
        dataService.getExportShipments(),
        dataService.getDueDiligenceReports(),
        dataService.getThirdPartyAudits(),
        dataService.getComplianceDocuments(),
      ])
      setCertifications(certResult)
      setLots(lotResult)
      setExportsData(exportResult)
      setReports(reportResult)
      setAudits(auditResult)
      setDocuments(docResult)
    } catch (error) {
      console.error("Failed to load mineral records:", error)
      toast.error("Failed to load mineral records")
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" /></div>
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-stone-900">
              <ShieldCheck className="h-8 w-8 text-emerald-700" />
              Compliance
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              What each lot can already demonstrate, and what is genuinely still missing.
            </p>
          </div>
          <Button onClick={loadCompliance} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList className="grid h-auto grid-cols-2 gap-1 md:grid-cols-7">
            <TabsTrigger value="board">Status</TabsTrigger>
            <TabsTrigger value="lots">CoC Lots</TabsTrigger>
            <TabsTrigger value="exports">Exports</TabsTrigger>
            <TabsTrigger value="sites">Mine Sites</TabsTrigger>
            <TabsTrigger value="diligence">Due Diligence</TabsTrigger>
            <TabsTrigger value="audits">Audits</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="board">
            <ComplianceBoard
              lots={lots}
              documents={documents}
              shipments={exportsData}
              reports={reports}
              audits={audits}
              onGoToTab={setTab}
            />
          </TabsContent>

          <TabsContent value="lots">
            <RecordSection
              title="Chain of Custody Lots"
              form={<CoCLotForm form={lotForm} setForm={setLotForm} certifications={certifications} onSubmit={async (selectedRecordIds: number[]) => {
                const weight = lotForm.weight ? Number(lotForm.weight) : 0
                const gradeValue = lotForm.grade_value ? Number(lotForm.grade_value) : undefined

                // Weight, grade and mine-site status are derived server-side from
                // the linked production records and certification — no re-typing.
                const created = await dataService.createCoCLot(cleanPayload({
                  ...lotForm,
                  weight: weight,
                  grade_value: gradeValue,
                  unit: lotForm.unit || "kg",
                  number_of_sacks: lotForm.number_of_sacks ? Number(lotForm.number_of_sacks) : undefined,
                  production_record_ids: selectedRecordIds.length > 0 ? selectedRecordIds : undefined,
                }))
                if (created) {
                  setLots([created, ...lots])
                  setLotForm(blankLot)
                  toast.success(selectedRecordIds.length > 0
                    ? `CoC lot recorded — ${selectedRecordIds.length} production record(s) linked`
                    : "CoC lot recorded")
                }
              }} />}
              rows={lots.map((lot) => ({
                id: lot.id,
                title: lot.lot_number,
                meta: `${lot.mineral_type} from ${lot.source_mine_site} - ${lot.weight} ${lot.unit}${lot.grade_value && lot.grade_unit ? ` (${lot.grade_value} ${lot.grade_unit})` : ''}`,
                status: lot.mine_site_status,
                detail: [lot.coc_system, lot.seal_number ? `Seal: ${lot.seal_number}` : '', lot.tracking_state ? `State: ${lot.tracking_state}` : '', lot.is_exported ? 'EXPORTED' : ''].filter(Boolean).join(' • '),
                traceable: true,
                verifyCode: lot.verify_code,
                handover: true,
              }))}
              onHandover={loadCompliance}
              onDelete={async (id) => removeRecord(id, dataService.deleteCoCLot.bind(dataService), setLots, lots)}
            />
          </TabsContent>

          <TabsContent value="exports">
            <RecordSection
              title="Export Certificate Applications"
              form={<ExportForm form={exportForm} setForm={setExportForm} availableLots={lots} onSubmit={async (selectedLotIds: number[]) => {
                // Lot numbers, weights and grades are aggregated server-side from
                // the selected CoC lots; red-status lots are blocked by law.
                const created = await dataService.createExportShipment(cleanPayload({
                  ...exportForm,
                  weight: exportForm.weight ? Number(exportForm.weight) : 0,
                  coc_lot_ids: selectedLotIds.length > 0 ? selectedLotIds : undefined,
                }))
                if (created) {
                  setExportForm(blankExport)
                  toast.success(selectedLotIds.length > 0
                    ? `Export shipment recorded — ${selectedLotIds.length} CoC lot(s) attached`
                    : "Export shipment recorded")
                  loadCompliance()
                } else {
                  toast.error("Export shipment was rejected — check lot status and weights")
                }
              }} />}
              rows={exportsData.map((item) => ({
                id: item.id,
                title: item.exporter_lot_number,
                meta: `${item.exporter_name} to ${item.destination_country} - ${item.weight} ${item.unit}${item.coc_lots?.length ? ` • ${item.coc_lots.length} lot(s)` : ''}`,
                status: item.exporter_status,
                detail: [item.icglr_certificate_number || item.application_status,
                  item.weight_discrepancy_pct != null && Math.abs(item.weight_discrepancy_pct) > 2 ? `⚠ mass-balance ${item.weight_discrepancy_pct.toFixed(1)}%` : ''].filter(Boolean).join(' • '),
              }))}
              onDelete={async (id) => removeRecord(id, dataService.deleteExportShipment.bind(dataService), setExportsData, exportsData)}
            />
          </TabsContent>

          <TabsContent value="sites">
            <RecordSection
              title="Mine Site Certification Status"
              form={<MineSiteForm form={mineSiteForm} setForm={setMineSiteForm} onSubmit={async () => {
                const created = await dataService.createMineSiteCertification(cleanPayload(mineSiteForm))
                if (created) {
                  setCertifications([created, ...certifications])
                  setMineSiteForm(blankMineSite)
                  toast.success("Mine site status recorded")
                }
              }} />}
              rows={certifications.map((cert) => ({
                id: cert.id,
                title: cert.mine_site_name,
                meta: cert.inspection_date ? `Inspected ${formatDate(cert.inspection_date)}` : "Inspection pending",
                status: cert.status,
                detail: cert.report_reference || cert.findings || "No report reference",
              }))}
              onDelete={async (id) => removeRecord(id, dataService.deleteMineSiteCertification.bind(dataService), setCertifications, certifications)}
            />
          </TabsContent>

          <TabsContent value="diligence">
            <RecordSection
              title="Due Diligence Reports"
              form={<DueDiligenceForm form={dueDiligenceForm} setForm={setDueDiligenceForm} onSubmit={async () => {
                const created = await dataService.createDueDiligenceReport(cleanPayload(dueDiligenceForm))
                if (created) {
                  setReports([created, ...reports])
                  setDueDiligenceForm(blankDueDiligence)
                  toast.success("Due diligence report recorded")
                }
              }} />}
              rows={reports.map((report) => ({
                id: report.id,
                title: `${report.frequency} report`,
                meta: `${formatDate(report.reporting_period_start)} to ${formatDate(report.reporting_period_end)}`,
                status: report.submitted_to_directorate ? "green" : "yellow",
                detail: report.attachment_reference || report.responsible_person,
              }))}
              onDelete={async (id) => removeRecord(id, dataService.deleteDueDiligenceReport.bind(dataService), setReports, reports)}
            />
          </TabsContent>

          <TabsContent value="audits">
            <RecordSection
              title="Third Party Audits"
              form={<AuditForm form={auditForm} setForm={setAuditForm} onSubmit={async () => {
                const created = await dataService.createThirdPartyAudit(cleanPayload(auditForm))
                if (created) {
                  setAudits([created, ...audits])
                  setAuditForm(blankAudit)
                  toast.success("Audit record saved")
                }
              }} />}
              rows={audits.map((audit) => ({
                id: audit.id,
                title: audit.exporter_name,
                meta: audit.audit_completed_at ? `Completed ${formatDate(audit.audit_completed_at)}` : "Audit pending",
                status: audit.status,
                detail: audit.report_reference || audit.corrective_actions || "No report reference",
              }))}
              onDelete={async (id) => removeRecord(id, dataService.deleteThirdPartyAudit.bind(dataService), setAudits, audits)}
            />
          </TabsContent>

          <TabsContent value="documents">
            <RecordSection
              title="Evidence and Document Register"
              form={<DocumentForm form={documentForm} setForm={setDocumentForm} availableLots={lots} exports={exportsData} certifications={certifications} onSubmit={async () => {
                // "none" is a UI sentinel for "not linked"; the API expects the
                // field absent, and related_id is meaningless without it.
                const payload = documentForm.related_entity === "none" || !documentForm.related_entity
                  ? { ...documentForm, related_entity: "", related_id: undefined }
                  : documentForm
                const created = await dataService.createComplianceDocument(cleanPayload(payload))
                if (created) {
                  setDocuments([created, ...documents])
                  setDocumentForm(blankDocument)
                  toast.success("Document reference saved")
                }
              }} />}
              rows={documents.map((doc) => ({
                id: doc.id,
                title: doc.title,
                meta: doc.document_type,
                status: doc.expires_at && doc.expires_at < new Date() ? "red" : "green",
                detail: doc.reference,
              }))}
              onDelete={async (id) => removeRecord(id, dataService.deleteComplianceDocument.bind(dataService), setDocuments, documents)}
            />
          </TabsContent>
        </Tabs>

        {loading && <p className="text-sm text-stone-500">Loading mineral records...</p>}
      </div>
    </>
  )
}

function RecordSection({ title, form, rows, onDelete, onHandover }: {
  title: string
  form: React.ReactNode
  rows: Array<{ id: string; title: string; meta: string; status: ComplianceStatus; detail?: string; traceable?: boolean; verifyCode?: string; handover?: boolean }>
  onDelete: (id: string) => Promise<void>
  onHandover?: () => void
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(340px,420px)_1fr]">
      <Card>
        <CardHeader><CardTitle className="text-lg">{title}</CardTitle></CardHeader>
        <CardContent>{form}</CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-stone-200">
            {rows.length === 0 ? (
              <div className="p-6 text-sm text-stone-600">No records yet.</div>
            ) : rows.map((row) => (
              <RecordRow key={row.id} row={row} onDelete={onDelete} onHandover={onHandover} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function RecordRow({ row, onDelete, onHandover }: {
  row: { id: string; title: string; meta: string; status: ComplianceStatus; detail?: string; traceable?: boolean; verifyCode?: string; handover?: boolean }
  onDelete: (id: string) => Promise<void>
  onHandover?: () => void
}) {
  const [showTraceability, setShowTraceability] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [showHandover, setShowHandover] = useState(false)

  return (
    <div className="p-4">
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-stone-900">{row.title}</p>
            <StatusBadge status={row.status} />
          </div>
          <p className="text-sm text-stone-600">{row.meta}</p>
          {row.detail && <p className="mt-1 truncate text-xs text-stone-500">{row.detail}</p>}

          <div className="mt-2 flex flex-wrap gap-3">
            {row.traceable && (
              <button
                onClick={() => setShowTraceability(!showTraceability)}
                className="text-xs text-emerald-600 hover:text-emerald-800"
              >
                {showTraceability ? 'Hide' : 'Show'} Full Trace (Lot Passport)
              </button>
            )}
            {row.verifyCode && (
              <button
                onClick={() => setShowQR(!showQR)}
                className="text-xs text-emerald-600 hover:text-emerald-800"
              >
                {showQR ? 'Hide' : 'Show'} Verification QR
              </button>
            )}
            {row.handover && (
              <button
                onClick={() => setShowHandover(!showHandover)}
                className="text-xs text-emerald-600 hover:text-emerald-800"
              >
                {showHandover ? 'Cancel' : 'Hand over custody'}
              </button>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => onDelete(row.id)} title="Delete record">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {showHandover && row.handover && (
        <LotHandover lotId={row.id} onDone={() => { setShowHandover(false); onHandover?.() }} />
      )}
      {showQR && row.verifyCode && <LotQR code={row.verifyCode} />}
      {showTraceability && row.traceable && <LotTrace lotId={row.id} />}
    </div>
  )
}

// LotHandover transfers a lot's custody to another registered user by email.
// The lot then appears in that user's account (multi-party chain of custody).
function LotHandover({ lotId, onDone }: { lotId: string; onDone: () => void }) {
  const [email, setEmail] = useState("")
  const [note, setNote] = useState("")
  const [location, setLocation] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    const result = await dataService.handoverCoCLot(lotId, { to_email: email, note, location })
    setBusy(false)
    if (result.ok) {
      toast.success(`Custody handed to ${result.toName ?? email}`)
      onDone()
    } else {
      toast.error(result.error || "Handover failed")
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-2 rounded-lg border bg-stone-50 p-4">
      <p className="text-xs font-medium text-stone-700">Hand this lot to another party</p>
      <Input placeholder="Recipient's registered email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <div className="grid grid-cols-2 gap-2">
        <Input placeholder="Location (optional)" value={location} onChange={(e) => setLocation(e.target.value)} />
        <Input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <Button type="submit" size="sm" disabled={busy} className="gap-2">
        {busy ? "Handing over…" : "Confirm handover"}
      </Button>
    </form>
  )
}

// LotQR shows the QR code and public link for a lot. Scanning it opens the
// login-free /verify page (reg. 53 — public access to lot/site status).
function LotQR({ code }: { code: string }) {
  const url = typeof window !== "undefined" ? `${window.location.origin}/verify/${code}` : ""
  return (
    <div className="mt-3 flex flex-col items-center gap-2 rounded-lg border bg-stone-50 p-4 text-center">
      <QRCodeSVG value={url} size={148} />
      <p className="text-xs text-stone-600">Scan or print — anyone can verify this lot's origin without logging in.</p>
      <a href={url} target="_blank" rel="noopener noreferrer" className="break-all text-xs font-medium text-emerald-700 hover:underline">
        {url}
      </a>
    </div>
  )
}

// LotTrace renders the real production→transport→export chain for a lot,
// fetched from the lot passport endpoint.
function LotTrace({ lotId }: { lotId: string }) {
  const [passport, setPassport] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    dataService.getLotPassport(lotId)
      .then((data) => { if (active) setPassport(data) })
      .catch(() => { if (active) setPassport(null) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [lotId])

  if (loading) return <p className="mt-3 text-xs text-stone-500">Loading trace…</p>
  if (!passport) return <p className="mt-3 text-xs text-red-600">Could not load trace for this lot.</p>

  let step = 0
  const Step = ({ title, children }: { title: string; children: React.ReactNode }) => {
    step += 1
    return (
      <div className="flex items-start space-x-2 text-xs">
        <div className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-200 text-[10px] font-bold text-emerald-700">
          {step}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-stone-900">{title}</div>
          <div className="text-stone-600">{children}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-3 space-y-2 rounded-lg border bg-stone-50 p-3">
      <h4 className="text-sm font-medium text-stone-900">Lot Passport — full chain of custody</h4>

      {passport.production_records?.length > 0 && (
        <Step title={`Production (${passport.production_records.length} record(s))`}>
          {passport.production_records.map((rec: any) => (
            <div key={rec.id ?? rec.ID}>
              {rec.name} — {rec.pit_number ? `Pit ${rec.pit_number} • ` : ''}{rec.miner_name ? `Miner ${rec.miner_name} • ` : ''}{rec.quantity} {rec.unit}{rec.grade_value ? ` • ${rec.grade_value} ${rec.grade_unit ?? ''}` : ''}
            </div>
          ))}
        </Step>
      )}

      {passport.composition?.length > 0 && (
        <Step title={`Blended from ${passport.composition.length} source lot(s)`}>
          {passport.composition.map((c: any) => (
            <div key={c.id}>
              {c.source_lot?.lot_number ?? `Lot #${c.source_lot_id}`} — contributed {c.weight_contributed}{c.grade_contributed ? ` • grade ${c.grade_contributed}` : ''}{c.purchase_order_number ? ` • PO ${c.purchase_order_number}` : ''}
            </div>
          ))}
        </Step>
      )}

      {passport.certification && (
        <Step title="Mine site certification">
          {passport.certification.mine_site_name} — status {passport.certification.status}
          {passport.certification.rmd_identification ? ` • RMD ${passport.certification.rmd_identification}` : ''}
        </Step>
      )}

      {passport.custody_transfers?.length > 0 && (
        <Step title={`Custody transfers (${passport.custody_transfers.length})`}>
          {passport.custody_transfers.map((t: any) => (
            <div key={t.id ?? t.ID}>{t.from_custodian} → {t.to_custodian} ({formatDate(t.transfer_date)})</div>
          ))}
        </Step>
      )}

      {passport.transport_records?.length > 0 && (
        <Step title={`Transport (${passport.transport_records.length} movement(s))`}>
          {passport.transport_records.map((t: any) => (
            <div key={t.id ?? t.ID}>
              {t.license_plate} — {t.origin?.address ?? 'origin'} → {t.destination?.address ?? 'destination'} • {t.status}
            </div>
          ))}
        </Step>
      )}

      {passport.processing_records?.length > 0 && (
        <Step title={`Processing (${passport.processing_records.length})`}>
          {passport.processing_records.map((p: any) => (
            <div key={p.id ?? p.ID}>{p.facility_name} — yield {p.yield}%</div>
          ))}
        </Step>
      )}

      {passport.export_shipment && (
        <Step title="Export shipment">
          {passport.export_shipment.exporter_lot_number} → {passport.export_shipment.destination_country}
          {passport.export_shipment.icglr_certificate_number ? ` • ICGLR cert ${passport.export_shipment.icglr_certificate_number}` : ` • ${passport.export_shipment.application_status}`}
        </Step>
      )}

      {passport.used_in_lots?.length > 0 && (
        <p className="text-xs text-stone-500">Also blended into {passport.used_in_lots.length} downstream lot(s).</p>
      )}

      <div className={passport.chain_complete
        ? "mt-2 rounded bg-emerald-50 p-2 text-xs text-emerald-700"
        : "mt-2 rounded bg-amber-50 p-2 text-xs text-amber-700"}>
        {passport.chain_complete
          ? '✓ Complete traceability: origin demonstrated from production records and mine site certification'
          : '⚠ Chain incomplete — link production records (or source lots) and a mine site certification to demonstrate origin'}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: ComplianceStatus }) {
  const classes = {
    green: "bg-emerald-100 text-emerald-800 border-emerald-200",
    yellow: "bg-amber-100 text-amber-800 border-amber-200",
    blue: "bg-sky-100 text-sky-800 border-sky-200",
    red: "bg-red-100 text-red-800 border-red-200",
  }
  return <Badge variant="outline" className={classes[status]}>{status}</Badge>
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs leading-relaxed text-stone-500">{hint}</p>}
    </div>
  )
}

function FormShell({ children, onSubmit }: { children: React.ReactNode; onSubmit: () => Promise<void> }) {
  return (
    <form className="space-y-3" onSubmit={async (event) => {
      event.preventDefault()
      try {
        await onSubmit()
      } catch (error: any) {
        // Surface the backend's validation message (e.g. red-status block,
        // missing weight, mass-balance rejection) instead of failing silently.
        toast.error(error?.message || "Request failed")
      }
    }}>
      {children}
      <Button type="submit" className="w-full gap-2"><Plus className="h-4 w-4" />Add record</Button>
    </form>
  )
}

function MineSiteForm({ form, setForm, onSubmit }: any) {
  return (
    <FormShell onSubmit={onSubmit}>
      <TextInput
        label="Mine site name"
        value={form.mine_site_name}
        onChange={(v) => setForm({ ...form, mine_site_name: v })}
        required
        placeholder="e.g. Kitaka Gold Mine, Buhweju"
        hint="Use the same name every time — lots link to this certificate by it."
      />
      <TextInput
        label="RMD identification"
        value={form.rmd_identification}
        onChange={(v) => setForm({ ...form, rmd_identification: v })}
        placeholder="e.g. RMD/BUH/014"
        hint="The Regional Mineral Database reference issued at inspection."
      />
      <DateInput
        label="Inspection date"
        value={form.inspection_date}
        onChange={(v) => setForm({ ...form, inspection_date: v })}
        hint="When the inspectorate last visited the site."
      />
      <StatusSelect
        label="Status"
        value={form.status}
        onChange={(v) => setForm({ ...form, status: v, is_suspended: v === "red" })}
        hint="Every lot from this site inherits this status. Choosing red suspends the site and blocks its lots from trade."
      />
      <DateInput
        label="Follow-up due"
        value={form.follow_up_due_at}
        onChange={(v) => setForm({ ...form, follow_up_due_at: v })}
        hint="When the next inspection or re-check is expected."
      />
      <TextInput
        label="Report reference"
        value={form.report_reference}
        onChange={(v) => setForm({ ...form, report_reference: v })}
        placeholder="e.g. INSP/2026/113"
        hint="The inspection report this status came from."
      />
      <TextareaInput
        label="Findings"
        value={form.findings}
        onChange={(v) => setForm({ ...form, findings: v })}
        placeholder="e.g. Site fenced and signposted. No under-18s present. Two pits lack shoring."
        hint="What the inspector actually observed."
      />
      <TextareaInput
        label="Corrective actions"
        value={form.corrective_actions}
        onChange={(v) => setForm({ ...form, corrective_actions: v })}
        placeholder="e.g. Shore pits 3 and 4 by 30/09/2026; submit photographs to the district office."
        hint="What must be done, and by when, to clear the finding."
      />
    </FormShell>
  )
}

function CoCLotForm({ form, setForm, onSubmit, certifications = [] }: any) {
  const [availableRecords, setAvailableRecords] = useState<InventoryItem[]>([])
  const [selectedRecords, setSelectedRecords] = useState<number[]>([])
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [showRecords, setShowRecords] = useState(false)

  // Load available production records when mineral type changes
  useEffect(() => {
    if (form.mineral_type && showRecords) {
      loadAvailableRecords()
    }
  }, [form.mineral_type, showRecords])

  const loadAvailableRecords = async () => {
    setLoadingRecords(true)
    try {
      // Capitalize the mineral type to match inventory naming
      const mineralTypeForAPI = form.mineral_type.charAt(0).toUpperCase() + form.mineral_type.slice(1)
      const records = await dataService.getAvailableProductionRecords(mineralTypeForAPI)
      setAvailableRecords(records)
    } catch (error) {
      console.error('Failed to load production records:', error)
      toast.error('Failed to load production records')
    } finally {
      setLoadingRecords(false)
    }
  }

  const handleRecordSelection = (recordId: number) => {
    setSelectedRecords(prev => 
      prev.includes(recordId) 
        ? prev.filter(id => id !== recordId)
        : [...prev, recordId]
    )
  }

  const getSelectedRecordsWeight = () => {
    return selectedRecords.reduce((total, recordId) => {
      const record = availableRecords.find(r => parseInt(r.id) === recordId)
      return total + (record?.quantity || 0)
    }, 0)
  }

  const getSelectedRecordsGradeInfo = () => {
    const recordsWithGrade = selectedRecords
      .map(recordId => availableRecords.find(r => parseInt(r.id) === recordId))
      .filter(record => record?.gradeValue && record?.gradeUnit)
    
    if (recordsWithGrade.length === 0) return null
    
    const avgGrade = recordsWithGrade.reduce((sum, record) => 
      sum + (record!.gradeValue! * record!.quantity), 0
    ) / recordsWithGrade.reduce((sum, record) => sum + record!.quantity, 0)
    
    return {
      value: avgGrade,
      unit: recordsWithGrade[0]?.gradeUnit,
      count: recordsWithGrade.length
    }
  }

  const handleFormSubmit = async () => {
    // Either a weight is typed, or production records are linked (the backend
    // derives weight and weighted grade from them in one transaction).
    if (!form.weight && selectedRecords.length === 0) {
      toast.error('Enter a weight, or select production records so the weight is calculated automatically')
      return
    }
    await onSubmit(selectedRecords)
    setSelectedRecords([])
  }

  return (
    <FormShell onSubmit={handleFormSubmit}>
      <TextInput
        label="Lot number"
        value={form.lot_number}
        onChange={(v: string) => setForm({ ...form, lot_number: v })}
        required
        placeholder="Unique lot ID, e.g. LOT-2026-001"
      />
      
      <Field
        label="Mineral"
        hint="Designated minerals under S.I. No. 23 of 2023 come first; below them, the other minerals production can record. This also filters which production records you can link below."
      >
        <Select value={form.mineral_type} onValueChange={(v) => setForm({ ...form, mineral_type: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Designated minerals</SelectLabel>
              {designatedMinerals.map((mineral) => (
                <SelectItem key={mineral} value={mineral}>{mineralLabels[mineral] ?? mineral}</SelectItem>
              ))}
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Other minerals captured in production</SelectLabel>
              {otherMinerals.map((mineral) => (
                <SelectItem key={mineral} value={mineral}>{mineralLabels[mineral] ?? mineral}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>

      {/* Link the certified mine site — name and status are derived from the
          certification record instead of being re-typed. Always rendered: when
          there are no certifications the operator needs to be told where to make
          one, not shown a field that silently disappears. */}
      <Field
        label="Certified mine site"
        hint={
          certifications.length > 0
            ? "Picking a site fills in the site name below and sets the lot's status from the certificate — neither is re-typed."
            : "You have no mine site certificates yet. Add one under the Mine Sites tab and it will appear here; until then, type the site name below by hand."
        }
      >
        <Select
          value={form.mine_site_certification_id ? String(form.mine_site_certification_id) : "none"}
          onValueChange={(v) => {
            if (v === "none") {
              setForm({ ...form, mine_site_certification_id: undefined })
              return
            }
            const cert = certifications.find((c: any) => String(c.id) === v)
            setForm({
              ...form,
              mine_site_certification_id: Number(v),
              source_mine_site: cert?.mine_site_name ?? form.source_mine_site,
              mine_site_status: cert?.status ?? form.mine_site_status,
            })
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={certifications.length > 0 ? "Select a certified mine site" : "No certificates on file"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              {certifications.length > 0 ? "— enter the site manually —" : "— enter the site manually —"}
            </SelectItem>
            {certifications.map((cert: any) => (
              <SelectItem key={cert.id} value={String(cert.id)}>
                {cert.mine_site_name} — {statusLabels[cert.status as ComplianceStatus] ?? cert.status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <TextInput
        label="Source mine site"
        value={form.source_mine_site}
        onChange={(v: string) => setForm({ ...form, source_mine_site: v })}
        required
        placeholder={form.mine_site_certification_id ? "Filled from the certificate above" : "e.g. Kitaka Gold Mine, Buhweju"}
        hint={
          form.mine_site_certification_id
            ? "Taken from the certificate you selected. Editing it here will not change the certificate."
            : "Where the material was dug. Selecting a certified site above fills this in for you."
        }
      />

      {!form.mine_site_certification_id && (
        <StatusSelect
          label="Mine site status"
          value={form.mine_site_status}
          onChange={(v) => setForm({ ...form, mine_site_status: v })}
          hint="Set by the inspectorate. A red site cannot be traded or exported, so the lot will be blocked."
        />
      )}

      {/* Production Records Selection */}
      <ProductionRecordSelector 
        showRecords={showRecords}
        setShowRecords={setShowRecords}
        loadingRecords={loadingRecords}
        availableRecords={availableRecords}
        selectedRecords={selectedRecords}
        onRecordSelection={handleRecordSelection}
        getSelectedRecordsWeight={getSelectedRecordsWeight}
        getSelectedRecordsGradeInfo={getSelectedRecordsGradeInfo}
        mineralType={form.mineral_type}
      />

      {/* Weight & unit — optional only when production records are linked. Marked
          required otherwise so the browser points at the field, rather than the
          submit appearing to do nothing. */}
      <div className="grid grid-cols-2 gap-3">
        <TextInput
          label={selectedRecords.length > 0 ? "Weight (auto from records)" : "Weight"}
          type="number"
          value={form.weight}
          onChange={(v: string) => setForm({ ...form, weight: v })}
          required={selectedRecords.length === 0}
          placeholder={selectedRecords.length > 0 ? "Calculated automatically" : "e.g. 45.5"}
          hint={
            selectedRecords.length > 0
              ? "Summed from the production records you linked above."
              : "Required — or link production records above and it is worked out for you."
          }
        />
        <Field label="Unit">
          <Select value={form.unit || "kg"} onValueChange={(v) => setForm({ ...form, unit: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {unitOptions.map((u) => (
                <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      {/* Grade — sent on submit, so it needs somewhere to be entered. Derived as a
          weighted average server-side when production records carry a grade. */}
      <div className="grid grid-cols-2 gap-3">
        <TextInput
          label="Grade (optional)"
          type="number"
          value={form.grade_value}
          onChange={(v: string) => setForm({ ...form, grade_value: v })}
          placeholder="e.g. 3.2"
          hint={selectedRecords.length > 0 ? "Averaged from linked records if left blank." : "Assayed grade of the lot."}
        />
        <Field label="Grade unit">
          <Select value={form.grade_unit || "g/t"} onValueChange={(v) => setForm({ ...form, grade_unit: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["g/t", "%", "ppm", "carats/t", "oz/t"].map((u) => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      {/* CoC system — pick a known scheme or type your own */}
      <TextInput
        label="CoC system"
        value={form.coc_system}
        onChange={(v: string) => setForm({ ...form, coc_system: v })}
        required
        placeholder="Start typing, or pick a scheme — e.g. iTSCi"
        list="coc-systems"
        hint="The traceability scheme this lot is tracked under. Click the field to see the common ones, or type your own."
      />
      <datalist id="coc-systems">
        <option value="ICGLR/RCM" />
        <option value="iTSCi" />
        <option value="Better Sourcing Program" />
        <option value="RCS Global" />
        <option value="Government CoC (DGSM)" />
        <option value="Internal CoC" />
      </datalist>

      <div className="grid grid-cols-2 gap-3">
        <TextInput
          label="Number of sacks (optional)"
          type="number"
          value={form.number_of_sacks}
          onChange={(v: string) => setForm({ ...form, number_of_sacks: v })}
          placeholder="e.g. 12"
          hint="How many bags make up the lot."
        />
        <TextInput
          label="Seal number (optional)"
          value={form.seal_number}
          onChange={(v: string) => setForm({ ...form, seal_number: v })}
          placeholder="e.g. UG-SEAL-00123"
          hint="The tag applied when the lot was closed."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <DateInput
          label="Date sealed (optional)"
          value={form.sealed_at}
          onChange={(v: string) => setForm({ ...form, sealed_at: v })}
          hint="Schedule 5 ¶1."
        />
        <DateInput
          label="Date shipped (optional)"
          value={form.shipped_at}
          onChange={(v: string) => setForm({ ...form, shipped_at: v })}
          hint="Leave blank while the lot is still at the site."
        />
      </div>

      <TextInput
        label="Mine operator (optional)"
        value={form.mine_operator_name}
        onChange={(v: string) => setForm({ ...form, mine_operator_name: v })}
        placeholder="e.g. Kitaka Mining Company Ltd"
        hint="The company working the site. For artisanal material, name the miner below instead."
      />

      <div className="grid grid-cols-2 gap-3">
        <TextInput
          label="Miner name (optional)"
          value={form.miner_name}
          onChange={(v: string) => setForm({ ...form, miner_name: v })}
          placeholder="e.g. A. Mugisha"
          hint="Only for artisanal material attributed to an individual."
        />
        <TextInput
          label="Artisanal licence number"
          value={form.artisanal_license_number}
          onChange={(v: string) => setForm({ ...form, artisanal_license_number: v })}
          placeholder="e.g. ASM/BUH/2026/0412"
          hint="Required once a miner is named above."
        />
      </div>

      <TextInput
        label="Current custodian (optional)"
        value={form.current_custodian || ''}
        onChange={(v: string) => setForm({ ...form, current_custodian: v })}
        placeholder="e.g. Kitaka Mining Company Ltd"
        hint="Whoever physically holds the lot right now — updated automatically by a handover."
      />

      <TextInput
        label="Verification officer (optional)"
        value={form.verification_officer || ''}
        onChange={(v: string) => setForm({ ...form, verification_officer: v })}
        placeholder="e.g. J. Okello, Compliance Officer"
        hint="The staff member who checked this lot's paperwork (Schedule 5 ¶1)."
      />

      <TextareaInput
        label="Taxes, fees and royalties (optional)"
        value={form.taxes_fees_royalties}
        onChange={(v: string) => setForm({ ...form, taxes_fees_royalties: v })}
        placeholder="e.g. Royalty UGX 1,200,000 paid to DGSM on 12/07/2026, receipt DGSM-4471"
        hint="What was paid on this lot, to whom, and the receipt reference."
      />

      <TextInput
        label="Documentation reference (optional)"
        value={form.documentation_reference}
        onChange={(v: string) => setForm({ ...form, documentation_reference: v })}
        placeholder="e.g. FILE/2026/44"
        hint="Where the paper file lives, if the documents are not uploaded under the Documents tab."
      />
    </FormShell>
  )
}

function ProductionRecordSelector({ 
  showRecords, 
  setShowRecords, 
  loadingRecords, 
  availableRecords, 
  selectedRecords,
  onRecordSelection,
  getSelectedRecordsWeight,
  getSelectedRecordsGradeInfo,
  mineralType 
}: any) {
  return (
    <div className="space-y-3 p-3 border rounded-lg bg-stone-50">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Link Production Records</Label>
        <Button 
          type="button"
          variant="outline" 
          size="sm"
          onClick={() => setShowRecords(!showRecords)}
        >
          {showRecords ? 'Hide Records' : 'Select Records'}
        </Button>
      </div>
      
      {showRecords && (
        <div className="space-y-2">
          {loadingRecords ? (
            <p className="text-sm text-stone-600">Loading production records...</p>
          ) : availableRecords.length === 0 ? (
            <p className="text-sm text-stone-600">
              No production records available for {mineralType}. 
              Create inventory items with type "mineral" first.
            </p>
          ) : (
            <>
              <p className="text-xs text-stone-600">
                Select production records to link to this CoC lot:
              </p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {availableRecords.map((record) => (
                  <ProductionRecordItem 
                    key={record.id}
                    record={record}
                    isSelected={selectedRecords.includes(parseInt(record.id))}
                    onSelection={() => onRecordSelection(parseInt(record.id))}
                  />
                ))}
              </div>
              
              {selectedRecords.length > 0 && (
                <SelectedRecordsSummary 
                  count={selectedRecords.length}
                  totalWeight={getSelectedRecordsWeight()}
                  gradeInfo={getSelectedRecordsGradeInfo()}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function ProductionRecordItem({ record, isSelected, onSelection }: any) {
  return (
    <div className="flex items-center space-x-2 p-2 rounded border bg-white">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onSelection}
        className="rounded border-stone-300"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{record.name}</p>
        <p className="text-xs text-stone-600">
          {record.pitNumber && `Pit: ${record.pitNumber} • `}
          {record.minerName && `Miner: ${record.minerName} • `}
          {record.quantity} {record.unit}
          {record.gradeValue && record.gradeUnit && 
            ` • Grade: ${record.gradeValue} ${record.gradeUnit}`
          }
        </p>
        {record.batchNumber && (
          <p className="text-xs text-stone-500">Batch: {record.batchNumber}</p>
        )}
      </div>
    </div>
  )
}

function SelectedRecordsSummary({ count, totalWeight, gradeInfo }: any) {
  return (
    <div className="p-2 bg-emerald-50 rounded border border-emerald-200">
      <p className="text-sm font-medium text-emerald-800">
        Selected: {count} records
      </p>
      <p className="text-xs text-emerald-700">
        Total weight: {totalWeight.toFixed(2)} kg
        {gradeInfo && ` • Weighted avg grade: ${gradeInfo.value.toFixed(4)} ${gradeInfo.unit}`}
      </p>
    </div>
  )
}

function ExportForm({ form, setForm, onSubmit, availableLots = [] }: any) {
  const [selectedLots, setSelectedLots] = useState<number[]>([])

  // Lots eligible for export: not exported, not on another shipment, not red-flagged.
  const eligibleLots = (availableLots as CoCLot[]).filter(
    (lot) => !lot.is_exported && !lot.export_shipment_id && lot.mine_site_status !== "red",
  )
  const blockedCount = (availableLots as CoCLot[]).filter((lot) => lot.mine_site_status === "red" && !lot.is_exported).length

  const toggleLot = (id: number) => {
    setSelectedLots((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }
  const selectedWeight = selectedLots.reduce((sum, id) => {
    const lot = eligibleLots.find((l) => Number(l.id) === id)
    return sum + (lot ? Number(lot.weight) : 0)
  }, 0)

  return (
    <FormShell onSubmit={async () => {
      await onSubmit(selectedLots)
      setSelectedLots([])
    }}>
      <TextInput label="Exporter lot/order number" value={form.exporter_lot_number} onChange={(v: string) => setForm({ ...form, exporter_lot_number: v })} required placeholder="e.g. EXP-2026-014" />
      <TextInput label="Exporter name" value={form.exporter_name} onChange={(v: string) => setForm({ ...form, exporter_name: v })} required placeholder="Licensed exporting company" />
      <StatusSelect label="Exporter status" value={form.exporter_status} onChange={(v) => setForm({ ...form, exporter_status: v })} />
      <TextInput label="Customer/importer" value={form.customer_name} onChange={(v: string) => setForm({ ...form, customer_name: v })} required placeholder="Buyer receiving the shipment" />
      <TextInput
        label="Destination country"
        value={form.destination_country}
        onChange={(v: string) => setForm({ ...form, destination_country: v })}
        required
        placeholder="Start typing, or pick from the list"
        list="destination-countries"
        hint="Where the shipment is going."
      />
      <datalist id="destination-countries">
        {destinationSuggestions.map((country) => <option key={country} value={country} />)}
      </datalist>

      {/* CoC lot picker — lot numbers, weights and material description are
          aggregated automatically from the selected lots */}
      <div className="space-y-2 rounded-lg border bg-stone-50 p-3">
        <Label className="text-sm font-medium">Select CoC lots for this shipment</Label>
        {eligibleLots.length === 0 ? (
          <p className="text-xs text-stone-600">No eligible lots. Register CoC lots first{blockedCount > 0 ? ` (${blockedCount} lot(s) blocked: red-status mine site)` : ''}.</p>
        ) : (
          <div className="max-h-40 space-y-1 overflow-y-auto">
            {eligibleLots.map((lot) => (
              <label key={lot.id} className="flex items-center space-x-2 rounded border bg-white p-2">
                <input
                  type="checkbox"
                  checked={selectedLots.includes(Number(lot.id))}
                  onChange={() => toggleLot(Number(lot.id))}
                  className="rounded border-stone-300"
                />
                <span className="min-w-0 flex-1 text-xs">
                  <span className="font-medium">{lot.lot_number}</span> — {lot.mineral_type}, {lot.weight} {lot.unit}
                  {lot.grade_value ? ` • ${lot.grade_value} ${lot.grade_unit ?? ''}` : ''} • {lot.mine_site_status}
                </span>
              </label>
            ))}
          </div>
        )}
        {selectedLots.length > 0 && (
          <div className="rounded border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-800">
            {selectedLots.length} lot(s) selected — combined weight {selectedWeight.toFixed(2)}. Lot numbers, weights and description will be filled automatically.
          </div>
        )}
        {blockedCount > 0 && eligibleLots.length > 0 && (
          <p className="text-xs text-red-600">{blockedCount} lot(s) hidden — red-status mine sites cannot be exported (reg. 37, S.I. No. 23 of 2023).</p>
        )}
      </div>

      <TextareaInput
        label="Material description"
        value={form.material_description}
        onChange={(v) => setForm({ ...form, material_description: v })}
        placeholder="e.g. Cassiterite concentrate, 62% Sn, 40 bags"
        hint="Leave blank and it is built from the lots you selected above."
      />
      <div className="grid grid-cols-2 gap-3">
        <TextInput
          label="Weight"
          value={form.weight}
          onChange={(v) => setForm({ ...form, weight: v })}
          type="number"
          required={selectedLots.length === 0}
          placeholder={selectedLots.length > 0 ? "Summed from lots" : "e.g. 1250"}
          hint={selectedLots.length > 0 ? "Leave blank to sum the selected lots." : undefined}
        />
        <Field label="Unit">
          <Select value={form.unit || "kg"} onValueChange={(v) => setForm({ ...form, unit: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {unitOptions.map((u) => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <TextareaInput
        label="Incoming lot numbers"
        value={form.incoming_lot_numbers}
        onChange={(v) => setForm({ ...form, incoming_lot_numbers: v })}
        placeholder="e.g. LOT-2026-001, LOT-2026-002"
        hint="Filled from the lots you ticked above. Only type here if the lot is not in the system."
      />
      <SelectInput
        label="Application status"
        value={form.application_status}
        onChange={(v) => setForm({ ...form, application_status: v })}
        options={applicationStatusOptions}
        hint="Where the ICGLR certificate application has got to."
      />
      <TextInput
        label="ICGLR certificate number"
        value={form.icglr_certificate_number}
        onChange={(v) => setForm({ ...form, icglr_certificate_number: v })}
        placeholder="e.g. UG-ICGLR-2026-0148"
        hint="Fill this in once the certificate is issued — every lot on this shipment then clears its export check."
      />
      <div className="grid grid-cols-2 gap-3">
        <DateInput label="Certificate issued" value={form.certificate_issued_at} onChange={(v) => setForm({ ...form, certificate_issued_at: v })} />
        <DateInput label="Certificate expires" value={form.certificate_expires_at} onChange={(v) => setForm({ ...form, certificate_expires_at: v })} />
      </div>
      <TextInput
        label="Transporter"
        value={form.transporter_name}
        onChange={(v) => setForm({ ...form, transporter_name: v })}
        placeholder="e.g. Kampala Haulage Ltd"
        hint="The carrier moving the shipment."
      />
      <TextareaInput
        label="Transport route"
        value={form.transport_route}
        onChange={(v) => setForm({ ...form, transport_route: v })}
        placeholder="e.g. Buhweju → Kampala (road) → Entebbe International Airport"
        hint="Each leg of the journey, in order."
      />
      <TextInput
        label="Authorised officer"
        value={form.authorised_officer}
        onChange={(v) => setForm({ ...form, authorised_officer: v })}
        placeholder="e.g. M. Nakato, DGSM"
        hint="The official who signed off the export."
      />
      <TextareaInput
        label="Taxes, fees and royalties"
        value={form.taxes_fees_royalties}
        onChange={(v) => setForm({ ...form, taxes_fees_royalties: v })}
        placeholder="e.g. Export levy UGX 3,400,000 paid 18/07/2026, receipt URA-99213"
        hint="What was paid on this shipment, and the receipt reference."
      />
    </FormShell>
  )
}

function DueDiligenceForm({ form, setForm, onSubmit }: any) {
  return (
    <FormShell onSubmit={onSubmit}>
      <div className="grid grid-cols-2 gap-3">
        <DateInput label="Period start" value={form.reporting_period_start} onChange={(v) => setForm({ ...form, reporting_period_start: v })} required />
        <DateInput label="Period end" value={form.reporting_period_end} onChange={(v) => setForm({ ...form, reporting_period_end: v })} required />
      </div>
      <p className="-mt-1 text-xs text-stone-500">
        The Status tab checks whether a report covers today, so these dates matter.
      </p>
      <SelectInput
        label="Frequency"
        value={form.frequency}
        onChange={(v) => setForm({ ...form, frequency: v })}
        options={reportFrequencyOptions}
        hint="How often you report. Annual is the usual cycle."
      />
      <TextInput
        label="Responsible person"
        value={form.responsible_person}
        onChange={(v) => setForm({ ...form, responsible_person: v })}
        required
        placeholder="e.g. J. Okello, Head of Compliance"
        hint="The named person accountable for due diligence — a role, not a department."
      />
      <TextareaInput
        label="Mineral chain policy"
        value={form.mineral_chain_policy}
        onChange={(v) => setForm({ ...form, mineral_chain_policy: v })}
        placeholder="e.g. We source only from green- or yellow-status sites, apply the OECD five-step framework, and suspend any supplier linked to armed groups or child labour."
        hint="Your published supply-chain policy, or a summary of it."
      />
      <TextareaInput
        label="Risk assessment summary"
        value={form.risk_assessment_summary}
        onChange={(v) => setForm({ ...form, risk_assessment_summary: v })}
        placeholder="e.g. 14 sites assessed. Two flagged for unlicensed diggers; none in a conflict-affected or high-risk area."
        hint="What you looked at, and what you found."
      />
      <TextareaInput
        label="Risk mitigation plan"
        value={form.risk_mitigation_plan}
        onChange={(v) => setForm({ ...form, risk_mitigation_plan: v })}
        placeholder="e.g. Suspend purchases from the two flagged sites until licences are produced; re-inspect within 90 days."
        hint="What you are doing about the risks above."
      />
      <TextareaInput
        label="Grievance mechanism"
        value={form.grievance_mechanism}
        onChange={(v) => setForm({ ...form, grievance_mechanism: v })}
        placeholder="e.g. Anonymous complaints box at each site and a toll-free line, reviewed monthly by the compliance officer."
        hint="How workers and communities raise concerns, and who handles them."
      />
      <TextareaInput
        label="Government payments"
        value={form.government_payments}
        onChange={(v) => setForm({ ...form, government_payments: v })}
        placeholder="e.g. Royalties UGX 48,000,000 and licence fees UGX 6,500,000 paid to DGSM in the period."
        hint="Taxes, royalties and fees paid to government during the period."
      />
      <TextInput
        label="Attachment reference"
        value={form.attachment_reference}
        onChange={(v) => setForm({ ...form, attachment_reference: v })}
        placeholder="e.g. DD-REPORT-2026.pdf"
        hint="Where the full report is filed."
      />
      <label className="flex items-start gap-2 rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm">
        <input
          type="checkbox"
          checked={form.submitted_to_directorate}
          onChange={(event) => setForm({ ...form, submitted_to_directorate: event.target.checked })}
          className="mt-0.5 rounded border-stone-300"
        />
        <span>
          <span className="font-medium text-stone-900">Submitted to the Directorate</span>
          <span className="block text-xs text-stone-500">
            Tick once the report has actually been filed with DGSM, not when it is written.
          </span>
        </span>
      </label>
    </FormShell>
  )
}

function AuditForm({ form, setForm, onSubmit }: any) {
  return (
    <FormShell onSubmit={onSubmit}>
      <TextInput
        label="Exporter name"
        value={form.exporter_name}
        onChange={(v) => setForm({ ...form, exporter_name: v })}
        required
        placeholder="e.g. Woodcross Resources Ltd"
        hint="The company being audited."
      />
      <TextInput
        label="Auditor name"
        value={form.auditor_name}
        onChange={(v) => setForm({ ...form, auditor_name: v })}
        placeholder="e.g. RCS Global, or the ICGLR-appointed auditor"
        hint="The independent third party who carried out the audit."
      />
      <StatusSelect
        label="Audit status"
        value={form.status}
        onChange={(v) => setForm({ ...form, status: v })}
        hint="A red audit holds up every lot until the findings are closed out."
      />
      <div className="grid grid-cols-2 gap-3">
        <DateInput
          label="Audit completed"
          value={form.audit_completed_at}
          onChange={(v) => setForm({ ...form, audit_completed_at: v })}
          hint="When the audit finished."
        />
        <DateInput
          label="Status expires"
          value={form.status_expires_at}
          onChange={(v) => setForm({ ...form, status_expires_at: v })}
          hint="After this date the audit lapses."
        />
      </div>
      <TextInput
        label="Report reference"
        value={form.report_reference}
        onChange={(v) => setForm({ ...form, report_reference: v })}
        placeholder="e.g. AUD/2026/07"
        hint="Where the audit report is filed."
      />
      <TextareaInput
        label="Findings"
        value={form.findings}
        onChange={(v) => setForm({ ...form, findings: v })}
        placeholder="e.g. Chain of custody complete for all sampled lots. Two lots lacked a sealed date."
        hint="What the auditor concluded."
      />
      <TextareaInput
        label="Corrective actions"
        value={form.corrective_actions}
        onChange={(v) => setForm({ ...form, corrective_actions: v })}
        placeholder="e.g. Record sealed dates at the point of sealing; re-train weighbridge staff by 31/10/2026."
        hint="What you must do, and by when, to clear the findings."
      />
    </FormShell>
  )
}

function DocumentForm({ form, setForm, onSubmit, availableLots = [], exports = [], certifications = [] }: any) {
  // Which record the document attaches to decides what the picker offers. Getting
  // this right is what makes the document show up on the lot's passport and count
  // towards "Paperwork on file" on the Status tab.
  const targets: Array<{ value: string; label: string }> =
    form.related_entity === "coc_lot"
      ? (availableLots as CoCLot[]).map((lot) => ({
          value: String(lot.id),
          label: `${lot.lot_number} — ${lot.mineral_type}, ${lot.weight} ${lot.unit}`,
        }))
      : form.related_entity === "export_shipment"
        ? (exports as ExportShipment[]).map((shipment) => ({
            value: String(shipment.id),
            label: `${shipment.exporter_lot_number} — ${shipment.destination_country}`,
          }))
        : form.related_entity === "mine_site"
          ? (certifications as MineSiteCertification[]).map((cert) => ({
              value: String(cert.id),
              label: `${cert.mine_site_name} — ${statusLabels[cert.status] ?? cert.status}`,
            }))
          : []

  return (
    <FormShell onSubmit={onSubmit}>
      <SelectInput
        label="Document type"
        value={form.document_type}
        onChange={(v) => setForm({ ...form, document_type: v })}
        options={documentTypeOptions}
        hint="Licences and permits with an expiry date are watched on the Status tab and flagged before they lapse."
      />
      <TextInput
        label="Title"
        value={form.title}
        onChange={(v) => setForm({ ...form, title: v })}
        required
        placeholder="e.g. Mineral export licence 2026"
        hint="What the document is, in words you would use to ask a colleague for it."
      />
      <TextInput
        label="Reference or file path"
        value={form.reference}
        onChange={(v) => setForm({ ...form, reference: v })}
        required
        placeholder="e.g. EL/2026/0091, or /records/2026/export-licence.pdf"
        hint="The document number, or where the file is kept."
      />

      <SelectInput
        label="Attach to"
        value={form.related_entity || "none"}
        onChange={(v) => setForm({ ...form, related_entity: v, related_id: undefined })}
        options={relatedEntityOptions}
        hint="Attaching a document to a lot makes it appear on that lot's passport and satisfies its paperwork check."
      />
      {form.related_entity && form.related_entity !== "none" && (
        targets.length > 0 ? (
          <SelectInput
            label="Which one"
            value={form.related_id ? String(form.related_id) : ""}
            onChange={(v) => setForm({ ...form, related_id: Number(v) })}
            options={targets}
            placeholder="Select the record"
          />
        ) : (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-stone-700">
            No records of that type yet. Save the document without attaching it, or create the record first.
          </p>
        )
      )}

      <div className="grid grid-cols-2 gap-3">
        <DateInput
          label="Issued"
          value={form.issued_at}
          onChange={(v) => setForm({ ...form, issued_at: v })}
          hint="When it was granted."
        />
        <DateInput
          label="Expires"
          value={form.expires_at}
          onChange={(v) => setForm({ ...form, expires_at: v })}
          hint="Leave blank if it does not expire."
        />
      </div>
      <TextareaInput
        label="Notes"
        value={form.notes}
        onChange={(v) => setForm({ ...form, notes: v })}
        placeholder="e.g. Renewal application submitted 14/06/2026, awaiting DGSM."
      />
    </FormShell>
  )
}

/**
 * These three are typed rather than `any` so that every `onChange={(v) => …}` at
 * a call site infers `v: string`. The forms themselves are still loosely typed,
 * so this is the one place that can give them back some safety.
 */
interface InputProps {
  label: string
  value: string | number | undefined
  onChange: (value: string) => void
  required?: boolean
  placeholder?: string
  hint?: string
}

function TextInput({ label, value, onChange, type = "text", required = false, placeholder = "", list, hint }: InputProps & { type?: string; list?: string }) {
  return (
    <Field label={label} hint={hint}>
      <Input type={type} value={value ?? ""} required={required} placeholder={placeholder} list={list} onChange={(event) => onChange(event.target.value)} />
    </Field>
  )
}

function DateInput({ label, value, onChange, required = false, hint }: InputProps) {
  return <TextInput label={label} type="date" value={value} onChange={onChange} required={required} hint={hint} />
}

function TextareaInput({ label, value, onChange, placeholder = "", hint, rows = 3 }: InputProps & { rows?: number }) {
  return (
    <Field label={label} hint={hint}>
      <Textarea value={value ?? ""} placeholder={placeholder} rows={rows} onChange={(event) => onChange(event.target.value)} />
    </Field>
  )
}

/**
 * A labelled dropdown. Options carry a human label separate from the value the
 * API expects, so the stored value stays exactly what the backend matches on
 * while the operator reads plain English.
 */
function SelectInput({
  label,
  value,
  onChange,
  options,
  placeholder = "Select…",
  hint,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
  hint?: string
}) {
  return (
    <Field label={label} hint={hint}>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

function StatusSelect({ label, value, onChange, hint }: { label: string; value: ComplianceStatus; onChange: (value: ComplianceStatus) => void; hint?: string }) {
  return (
    <Field label={label} hint={hint}>
      <Select value={value} onValueChange={(v) => onChange(v as ComplianceStatus)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {statusOptions.map((status) => (
            <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

function cleanPayload<T extends Record<string, any>>(payload: T): T {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== "" && value !== undefined)) as T
}

async function removeRecord<T extends { id: string }>(
  id: string,
  remover: (id: string) => Promise<boolean>,
  setter: (records: T[]) => void,
  records: T[],
) {
  const ok = await remover(id)
  if (ok) {
    setter(records.filter((record) => record.id !== id))
    toast.success("Record deleted")
  }
}

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date))
}

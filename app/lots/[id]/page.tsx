"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Factory,
  MapPin,
  Package,
  Truck,
  User,
} from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { dataService } from "@/lib/data-service"
import type { EnhancedCoCLot } from "@/lib/types"

/**
 * One lot, its whole journey, and every action you can take on it.
 *
 * This is the MineTrace shape: the chain reads top to bottom as a sequence of
 * events rather than a set of forms, and the actions sit next to the step they
 * advance. Data comes from the passport endpoint, which is the only source that
 * returns custody, transport and processing together.
 */
export default function LotDetailPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const lotId = String(params?.id || "")

  const [trace, setTrace] = useState<EnhancedCoCLot | null>(null)
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState<"handover" | "transport" | "processing" | null>(null)

  useEffect(() => {
    if (!isLoading && !user) router.push("/login")
  }, [isLoading, router, user])

  const load = useCallback(async () => {
    if (!lotId) return
    setLoading(true)
    try {
      setTrace(await dataService.getLotTrace(lotId))
    } catch (error) {
      console.error(error)
      toast.error("Could not load this lot")
    } finally {
      setLoading(false)
    }
  }, [lotId])

  useEffect(() => {
    if (user) load()
  }, [user, load])

  const refresh = () => {
    setAction(null)
    load()
  }

  if (isLoading || !user || loading) {
    return (
      <DashboardLayout>
        <p className="py-12 text-center text-sm text-stone-500">Loading lot…</p>
      </DashboardLayout>
    )
  }

  if (!trace) {
    return (
      <DashboardLayout>
        <div className="py-12 text-center">
          <p className="text-stone-600">Lot not found, or it is no longer in your custody.</p>
          <Button asChild variant="outline" className="mt-4 gap-2">
            <Link href="/lots-compliance?view=lots"><ArrowLeft className="h-4 w-4" /> Back to lots</Link>
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const verifyUrl =
    typeof window !== "undefined" && trace.verify_code
      ? `${window.location.origin}/verify/${trace.verify_code}`
      : ""

  const custody = trace.custody_chain || []
  const transports = trace.transport_records || []
  const processing = trace.processing_records || []
  const productionRecords = trace.production_records || []

  // The chain, in order. Each step knows whether it has actually happened.
  const steps = [
    {
      key: "production",
      label: "Production",
      icon: MapPin,
      done: productionRecords.length > 0,
      summary: productionRecords.length
        ? `${productionRecords.length} record(s) from pit(s) ${
            Array.from(new Set(productionRecords.map((r) => r.pitNumber).filter(Boolean))).join(", ") ||
            "unrecorded"
          }`
        : "No production records linked — origin is unverified",
    },
    {
      key: "custody",
      label: "Custody",
      icon: User,
      done: custody.length > 0,
      summary: custody.length
        ? `${custody.length} handover(s) — held by ${trace.current_custodian || "the owner"}`
        : "Still with the owner",
    },
    {
      key: "transport",
      label: "Transport",
      icon: Truck,
      done: transports.length > 0,
      summary: transports.length
        ? `${transports.length} movement(s)`
        : "No transport recorded",
    },
    {
      key: "processing",
      label: "Processing",
      icon: Factory,
      done: processing.length > 0,
      summary: processing.length ? `${processing.length} run(s)` : "No processing recorded",
    },
    {
      key: "export",
      label: "Export",
      icon: Package,
      done: Boolean(trace.is_exported),
      summary: trace.is_exported ? "Exported" : "Not yet exported",
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 gap-2 px-0">
            <Link href="/lots-compliance?view=lots"><ArrowLeft className="h-4 w-4" /> All lots</Link>
          </Button>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-stone-900">{trace.lot_number}</h1>
              <p className="mt-1 text-sm capitalize text-stone-600">
                {trace.mineral_type} • {trace.weight} {trace.unit}
                {trace.source_mine_site ? ` • ${trace.source_mine_site}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {trace.mine_site_status === "red" && <Badge variant="destructive">site red-flagged</Badge>}
              <Badge variant="outline">{trace.tracking_state || "extracted"}</Badge>
            </div>
          </div>
        </div>

        {/* The chain, at a glance */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Chain of custody</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {steps.map((step) => {
                const Icon = step.icon
                return (
                  <div key={step.key} className="flex items-start gap-3">
                    <div
                      className={`rounded-full p-2 ${
                        step.done ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-400"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 border-b pb-3">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-stone-900">{step.label}</p>
                        {step.done ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-stone-300" />
                        )}
                      </div>
                      <p className="text-sm text-stone-600">{step.summary}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="gap-2" onClick={() => setAction("handover")}>
                <ArrowRight className="h-4 w-4" /> Hand over custody
              </Button>
              <Button size="sm" variant="outline" className="gap-2" onClick={() => setAction("transport")}>
                <Truck className="h-4 w-4" /> Record transport
              </Button>
              <Button size="sm" variant="outline" className="gap-2" onClick={() => setAction("processing")}>
                <Factory className="h-4 w-4" /> Record processing
              </Button>
            </div>

            {action === "handover" && <HandoverForm lotId={trace.id} onDone={refresh} />}
            {action === "transport" && <QuickTransportForm lotId={trace.id} onDone={refresh} />}
            {action === "processing" && <QuickProcessingForm onDone={refresh} />}
          </CardContent>
        </Card>

        {/* Public verification */}
        {trace.verify_code && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Public verification</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center gap-3 text-center">
              <QRCodeSVG value={verifyUrl} size={148} />
              <p className="text-xs text-stone-600">
                Anyone can scan this to verify the lot's origin without logging in.
              </p>
              <a
                href={verifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-xs font-medium text-emerald-700 hover:underline"
              >
                {verifyUrl}
              </a>
            </CardContent>
          </Card>
        )}

        {/* Event history */}
        {custody.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Handovers</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {custody.map((t) => (
                <div key={t.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {t.from_custodian} → {t.to_custodian}
                    </span>
                    <span className="text-xs text-stone-500">
                      {new Date(t.transfer_date).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-stone-600">{t.transfer_reason}</p>
                  {t.condition_notes && (
                    <p className="mt-1 text-xs text-stone-500">{t.condition_notes}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {transports.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Transport</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {transports.map((t) => (
                <div key={t.id} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">
                    {t.vehicleDetails.licensePlate} • {t.vehicleDetails.driverName}
                  </p>
                  <p className="text-stone-600">
                    {t.route.origin?.address || "—"} → {t.route.destination?.address || "—"}
                  </p>
                  <p className="text-xs text-stone-500">
                    Departed {new Date(t.timing.departureTime).toLocaleString()}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {processing.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Processing</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {processing.map((p) => (
                <div key={p.id} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">
                    {p.facilityName} • {p.processType.join(", ")}
                  </p>
                  <p className="text-stone-600">
                    Yield {p.output.yield}% • waste {p.output.wasteGenerated} kg
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

function HandoverForm({ lotId, onDone }: { lotId: string; onDone: () => void }) {
  const [email, setEmail] = useState("")
  const [location, setLocation] = useState("")
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      toast.error("Enter the receiving account's email")
      return
    }
    setBusy(true)
    const result = await dataService.handoverCoCLot(lotId, {
      to_email: email.trim(),
      note: note.trim() || undefined,
      location: location.trim() || undefined,
    })
    setBusy(false)
    if (result.ok) {
      toast.success(`Custody handed to ${result.toName || email.trim()}`)
      onDone()
    } else {
      toast.error(result.error || "Handover failed")
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 rounded-lg border bg-stone-50 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Receiving account email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="transporter@example.com" />
        </div>
        <div className="space-y-1">
          <Label>Location (optional)</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Note (optional)</Label>
        <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <Button type="submit" size="sm" disabled={busy}>{busy ? "Handing over…" : "Confirm handover"}</Button>
    </form>
  )
}

function QuickTransportForm({ lotId, onDone }: { lotId: string; onDone: () => void }) {
  const [f, setF] = useState({ plate: "", driver: "", from: "", to: "" })
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!f.plate.trim() || !f.driver.trim()) {
      toast.error("Vehicle plate and driver are required")
      return
    }
    setBusy(true)
    try {
      const { emptyTransportPayload } = await import("@/lib/traceability-payloads")
      await dataService.createTransportRecord({
        ...emptyTransportPayload(),
        license_plate: f.plate.trim(),
        driver_name: f.driver.trim(),
        origin: { latitude: 0, longitude: 0, address: f.from.trim() },
        destination: { latitude: 0, longitude: 0, address: f.to.trim() },
        coc_lot_ids: Number.isNaN(Number(lotId)) ? [] : [Number(lotId)],
      })
      toast.success("Transport recorded")
      onDone()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to record transport")
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 rounded-lg border bg-stone-50 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1"><Label>Vehicle plate</Label><Input value={f.plate} onChange={(e) => setF({ ...f, plate: e.target.value })} /></div>
        <div className="space-y-1"><Label>Driver</Label><Input value={f.driver} onChange={(e) => setF({ ...f, driver: e.target.value })} /></div>
        <div className="space-y-1"><Label>From</Label><Input value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></div>
        <div className="space-y-1"><Label>To</Label><Input value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></div>
      </div>
      <Button type="submit" size="sm" disabled={busy}>{busy ? "Saving…" : "Save transport"}</Button>
    </form>
  )
}

function QuickProcessingForm({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ facility: "", type: "crushing", input: "", output: "", waste: "" })
  const [busy, setBusy] = useState(false)

  const input = Number(f.input) || 0
  const output = Number(f.output) || 0
  const waste = Number(f.waste) || 0
  const broken = input > 0 && output + waste > input

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!f.facility.trim()) {
      toast.error("Facility is required")
      return
    }
    if (broken) {
      toast.error("Output plus waste cannot exceed the input weight")
      return
    }
    setBusy(true)
    try {
      const { emptyProcessingPayload } = await import("@/lib/traceability-payloads")
      await dataService.createProcessingRecord({
        ...emptyProcessingPayload(),
        facility_name: f.facility.trim(),
        process_type: [f.type],
        input_batches: input ? [{ inventory_item_id: 0, input_weight: input, input_grade: 0, input_unit: "kg" }] : [],
        output_items: output ? [{ name: "Output", weight: output, grade: 0, unit: "kg", product: "" }] : [],
        yield: input > 0 ? Number(((output / input) * 100).toFixed(2)) : 0,
        waste_generated: waste,
      })
      toast.success("Processing recorded")
      onDone()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to record processing")
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 rounded-lg border bg-stone-50 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1"><Label>Facility</Label><Input value={f.facility} onChange={(e) => setF({ ...f, facility: e.target.value })} /></div>
        <div className="space-y-1"><Label>Process</Label><Input value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} /></div>
        <div className="space-y-1"><Label>Input (kg)</Label><Input type="number" min="0" step="0.01" value={f.input} onChange={(e) => setF({ ...f, input: e.target.value })} /></div>
        <div className="space-y-1"><Label>Output (kg)</Label><Input type="number" min="0" step="0.01" value={f.output} onChange={(e) => setF({ ...f, output: e.target.value })} /></div>
        <div className="space-y-1"><Label>Waste (kg)</Label><Input type="number" min="0" step="0.01" value={f.waste} onChange={(e) => setF({ ...f, waste: e.target.value })} /></div>
      </div>
      {input > 0 && (
        <p className={`text-sm ${broken ? "text-red-600" : "text-stone-600"}`}>
          {broken
            ? `Output + waste (${(output + waste).toFixed(2)} kg) exceeds input (${input.toFixed(2)} kg)`
            : `Yield ${((output / input) * 100).toFixed(1)}%`}
        </p>
      )}
      <Button type="submit" size="sm" disabled={busy || broken}>{busy ? "Saving…" : "Save processing"}</Button>
    </form>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { BadgeCheck, MapPin, ShieldAlert, ShieldCheck } from "lucide-react"

// Public lot verification — the page a QR scan lands on. No login required.
// Fetches the public endpoint directly (same origin, no auth header).

interface PublicStep {
  date: string
  type: string
  from?: string
  to?: string
  location?: string
}

interface PublicLot {
  lot_number: string
  mineral: string
  weight: number
  unit: string
  grade?: string
  source_mine_site: string
  site_status: "green" | "yellow" | "red" | "blue"
  seal_number?: string
  registered: string
  sealed_at?: string
  shipped_at?: string
  is_exported: boolean
  clean_chain: boolean
  steps: PublicStep[]
}

const stepLabels: Record<string, string> = {
  registered: "Registered at mine site",
  custody_transfer: "Custody handover",
  exported: "Exported",
}

const statusLabel: Record<string, string> = {
  green: "Green — certified",
  yellow: "Yellow — provisionally certified",
  red: "Red — trade blocked",
  blue: "Blue — not yet inspected",
}

const statusClass: Record<string, string> = {
  green: "bg-emerald-100 text-emerald-800",
  yellow: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-800",
  blue: "bg-sky-100 text-sky-800",
}

export default function VerifyPage() {
  const params = useParams<{ code: string }>()
  const [lot, setLot] = useState<PublicLot | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/v1/public/verify/${params.code}`)
      .then(async (res) => {
        const body = await res.json()
        if (!res.ok || body?.success === false) throw new Error(body?.error || "Not found")
        setLot(body.data as PublicLot)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [params.code])

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="text-sm font-bold text-stone-900">FieldEyes — mineral verification</p>
        </div>

        {loading && (
          <div className="flex justify-center p-10">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-emerald-700" />
          </div>
        )}

        {error && !loading && (
          <div className="rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
            <ShieldAlert className="mx-auto mb-2 h-8 w-8 text-red-600" />
            <p className="font-semibold text-stone-900">Not found</p>
            <p className="mt-1 text-sm text-stone-600">{error}</p>
          </div>
        )}

        {lot && (
          <>
            <div className={`rounded-2xl border bg-white p-6 text-center shadow-sm ${lot.clean_chain ? "border-emerald-300" : "border-red-300"}`}>
              {lot.clean_chain ? (
                <BadgeCheck className="mx-auto mb-2 h-9 w-9 text-emerald-700" />
              ) : (
                <ShieldAlert className="mx-auto mb-2 h-9 w-9 text-red-600" />
              )}
              <p className="text-lg font-bold text-stone-900">{lot.lot_number}</p>
              <p className="text-sm capitalize text-stone-600">
                {lot.mineral} • {lot.weight} {lot.unit}{lot.grade ? ` • ${lot.grade}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass[lot.site_status]}`}>
                  {statusLabel[lot.site_status]}
                </span>
                {lot.is_exported && (
                  <span className="rounded-full bg-emerald-700 px-2.5 py-0.5 text-xs font-medium text-white">Exported</span>
                )}
              </div>
              <p className="mt-3 text-xs text-stone-500">
                Origin: {lot.source_mine_site || "unknown"} • registered {new Date(lot.registered).toLocaleDateString()}
                {lot.seal_number ? ` • seal ${lot.seal_number}` : ""}
              </p>
              <p className={`mt-3 rounded-lg px-3 py-2 text-xs font-medium ${lot.clean_chain ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
                {lot.clean_chain
                  ? "This lot's chain of custody is recorded and its mine site is not red-flagged."
                  : "Warning: this lot's mine site is red-flagged. Trade in this material is blocked under S.I. No. 23 of 2023."}
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-stone-900">Recorded journey</h3>
              <ol className="relative space-y-5 border-l border-stone-200 pl-6">
                {lot.steps.map((step, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-600 ring-4 ring-emerald-100" />
                    <p className="text-sm font-medium text-stone-900">{stepLabels[step.type] ?? step.type}</p>
                    <p className="text-xs text-stone-500">{new Date(step.date).toLocaleString()}</p>
                    {(step.from || step.to) && (
                      <p className="mt-0.5 text-xs text-stone-600">
                        {step.from && `${step.from} `}
                        {step.from && step.to && "→ "}
                        {step.to}
                      </p>
                    )}
                    {step.location && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-500">
                        <MapPin className="h-3 w-3" /> {step.location}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </div>

            <p className="mt-6 text-center text-xs text-stone-400">
              Verified via FieldEyes traceability. This page shows only public chain-of-custody information.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

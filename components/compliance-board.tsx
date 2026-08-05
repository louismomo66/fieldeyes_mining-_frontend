"use client"

/**
 * The compliance board.
 *
 * Answers one question — which lots can ship, and what is the next thing to do
 * about the ones that cannot. Lots are grouped by that answer rather than listed
 * and scored, and each one leads with a single instruction; the full checklist is
 * behind a disclosure for the operator who wants it.
 *
 * Everything here is computed by lib/compliance.ts from records already entered.
 */

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Check as CheckIcon,
  ChevronDown,
  ChevronRight,
  CircleDashed,
  Minus,
  OctagonAlert,
  Sparkles,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  assessLot,
  assessOrganisation,
  summarise,
  type Check,
  type LotReadiness,
  type OrgCheck,
  type Verdict,
} from "@/lib/compliance"
import type {
  CoCLot,
  ComplianceDocument,
  DueDiligenceReport,
  ExportShipment,
  ThirdPartyAudit,
} from "@/lib/types"

interface ComplianceBoardProps {
  lots: CoCLot[]
  documents: ComplianceDocument[]
  shipments: ExportShipment[]
  reports: DueDiligenceReport[]
  audits: ThirdPartyAudit[]
  /** Jump to one of the record tabs to fix something. */
  onGoToTab?: (tab: string) => void
}

const GROUPS: Array<{
  verdict: Verdict
  title: string
  blurb: string
  accent: string
  openByDefault: boolean
}> = [
  {
    verdict: "blocked",
    title: "Blocked",
    blurb: "Cannot be traded or exported until this is cleared.",
    accent: "text-red-700",
    openByDefault: true,
  },
  {
    verdict: "not_ready",
    title: "Needs work",
    blurb: "An export officer would stop these.",
    accent: "text-amber-700",
    openByDefault: true,
  },
  {
    verdict: "ready",
    title: "Ready to export",
    blurb: "Nothing outstanding.",
    accent: "text-emerald-700",
    openByDefault: false,
  },
]

export function ComplianceBoard({
  lots,
  documents,
  shipments,
  reports,
  audits,
  onGoToTab,
}: ComplianceBoardProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(GROUPS.map((g) => [g.verdict, g.openByDefault])),
  )

  const readiness = useMemo(
    () => lots.map((lot) => assessLot(lot, documents, shipments)),
    [lots, documents, shipments],
  )
  const orgChecks = useMemo(
    () => assessOrganisation(reports, audits, documents),
    [reports, audits, documents],
  )
  const summary = useMemo(() => summarise(readiness, orgChecks), [readiness, orgChecks])

  const orgProblems = orgChecks.filter((c) => c.state === "blocked" || c.state === "missing")

  if (lots.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-stone-600">
          No lots recorded yet. Register one under{" "}
          <Link href="/lots-compliance?view=lots" className="font-medium text-emerald-700 underline">
            Lots
          </Link>{" "}
          and its position will appear here.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* The whole page in one sentence. */}
      <div className="rounded-lg border border-stone-200 bg-white px-6 py-5">
        <p className="text-xl font-semibold leading-snug text-stone-900">{summary.headline}</p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-stone-600">
          <Count n={summary.ready} label="ready" tone="text-emerald-700" />
          <Count n={summary.notReady} label="need work" tone="text-amber-700" />
          <Count n={summary.blocked} label="blocked" tone="text-red-700" />
        </div>
      </div>

      {orgProblems.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-5 py-4">
          <p className="mb-3 text-sm font-semibold text-stone-900">
            Company-level — these hold up every lot
          </p>
          <div className="space-y-3">
            {orgProblems.map((check) => (
              <OrgRow key={check.id} check={check} onGoToTab={onGoToTab} />
            ))}
          </div>
        </div>
      )}

      {GROUPS.map((group) => {
        const inGroup = readiness.filter((l) => l.verdict === group.verdict)
        if (inGroup.length === 0) return null
        const open = openGroups[group.verdict]
        return (
          <section key={group.verdict}>
            <button
              type="button"
              onClick={() => setOpenGroups({ ...openGroups, [group.verdict]: !open })}
              className="mb-3 flex w-full items-center gap-2 text-left"
            >
              {open ? (
                <ChevronDown className="h-4 w-4 text-stone-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-stone-400" />
              )}
              <span className={`text-sm font-semibold ${group.accent}`}>
                {group.title} ({inGroup.length})
              </span>
              <span className="text-sm text-stone-500">— {group.blurb}</span>
            </button>
            {open && (
              <div className="space-y-2">
                {inGroup.map((lot) => (
                  <LotRow
                    key={lot.lotId}
                    lot={lot}
                    open={expanded === lot.lotId}
                    onToggle={() => setExpanded(expanded === lot.lotId ? null : lot.lotId)}
                  />
                ))}
              </div>
            )}
          </section>
        )
      })}

      {summary.topGaps.length > 0 && (
        <div className="rounded-lg border border-stone-200 bg-stone-50/70 px-5 py-4">
          <p className="mb-3 text-sm font-semibold text-stone-900">
            Across all lots, most common first
          </p>
          <ul className="space-y-1.5 text-sm">
            {summary.topGaps.map((g) => (
              <li key={g.id} className="flex items-baseline gap-2">
                <span className="w-8 shrink-0 text-right font-semibold text-stone-900">
                  {g.count}×
                </span>
                <span className="text-stone-700">{g.label}</span>
                {g.severity === "advisory" && (
                  <span className="text-xs text-stone-400">optional</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function Count({ n, label, tone }: { n: number; label: string; tone: string }) {
  return (
    <span>
      <span className={`font-semibold ${n > 0 ? tone : "text-stone-400"}`}>{n}</span>{" "}
      <span className="text-stone-600">{label}</span>
    </span>
  )
}

function LotRow({
  lot,
  open,
  onToggle,
}: {
  lot: LotReadiness
  open: boolean
  onToggle: () => void
}) {
  const blocking = lot.checks.filter((c) => c.state === "blocked")
  const needed = lot.checks.filter((c) => c.state === "missing" && c.severity === "required")
  const optional = lot.checks.filter((c) => c.state === "missing" && c.severity === "advisory")
  const onFile = lot.checks.filter((c) => c.state === "satisfied")
  const notApplicable = lot.checks.filter((c) => c.state === "not_applicable")
  const derived = onFile.filter((c) => c.source === "derived").length

  const border =
    lot.verdict === "blocked"
      ? "border-red-200"
      : lot.verdict === "not_ready"
        ? "border-amber-200"
        : "border-stone-200"

  return (
    <div className={`rounded-lg border bg-white ${border}`}>
      <button type="button" onClick={onToggle} className="flex w-full items-start gap-3 px-4 py-3 text-left">
        {open ? (
          <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-stone-400" />
        ) : (
          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-stone-400" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-stone-900">{lot.lotNumber}</span>
            <span className="text-sm text-stone-500">
              {lot.mineral} · {lot.weight} {lot.unit}
            </span>
            <Badge variant="outline" className="capitalize text-xs">
              {lot.stage}
            </Badge>
            {!lot.originDemonstrated && (
              <Badge className="bg-amber-100 text-xs text-amber-800">Origin not demonstrated</Badge>
            )}
          </div>

          {/* The one thing to do, or confirmation there is nothing. */}
          {lot.nextAction ? (
            <p className="mt-1.5 flex items-start gap-1.5 text-sm text-stone-900">
              <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-400" />
              <span>
                {lot.nextAction}
                {lot.outstanding > 0 && (
                  <span className="ml-1.5 text-stone-500">
                    and {lot.outstanding} more {lot.outstanding === 1 ? "item" : "items"}
                  </span>
                )}
              </span>
            </p>
          ) : (
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-emerald-700">
              <CheckIcon className="h-3.5 w-3.5" />
              {lot.headline}
              {lot.outstanding > 0 && (
                <span className="text-stone-500">
                  ({lot.outstanding} optional {lot.outstanding === 1 ? "field" : "fields"} blank)
                </span>
              )}
            </p>
          )}
        </div>
      </button>

      {open && (
        <div className="space-y-4 border-t border-stone-100 px-4 pb-4 pt-4">
          {blocking.length > 0 && <CheckGroup title="Blocking" checks={blocking} />}
          {needed.length > 0 && <CheckGroup title="Needed before export" checks={needed} />}
          {optional.length > 0 && <CheckGroup title="Optional" checks={optional} />}
          {onFile.length > 0 && (
            <CheckGroup
              title={
                derived > 0
                  ? `Already on file — ${derived} filled in from your records`
                  : "Already on file"
              }
              checks={onFile}
            />
          )}
          {notApplicable.length > 0 && (
            <CheckGroup title="Does not apply to this lot" checks={notApplicable} />
          )}
          <Link href={`/lots/${lot.lotId}`} className="inline-block text-sm font-medium text-emerald-700 underline">
            Open lot passport
          </Link>
        </div>
      )}
    </div>
  )
}

function CheckGroup({ title, checks }: { title: string; checks: Check[] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">{title}</p>
      <ul className="space-y-1.5">
        {checks.map((check) => (
          <li key={check.id} className="flex items-start gap-2.5 text-sm">
            <CheckIconFor state={check.state} />
            <div className="min-w-0">
              <span className={check.state === "not_applicable" ? "text-stone-400" : "text-stone-900"}>
                {check.label}
              </span>
              <span className="ml-2 text-xs text-stone-400">{check.reference}</span>
              {check.value && (
                <p
                  className={`mt-0.5 ${
                    check.state === "not_applicable" ? "italic text-stone-400" : "text-stone-600"
                  }`}
                >
                  {check.value}
                  {check.source === "derived" && check.state === "satisfied" && (
                    <span className="ml-2 inline-flex items-center gap-1 text-xs text-emerald-700">
                      <Sparkles className="h-3 w-3" />
                      from your records
                    </span>
                  )}
                </p>
              )}
              {check.remedy && <p className="mt-0.5 text-stone-600">{check.remedy}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function CheckIconFor({ state }: { state: Check["state"] }) {
  const base = "mt-0.5 h-4 w-4 shrink-0"
  if (state === "satisfied") return <CheckIcon className={`${base} text-emerald-600`} />
  if (state === "blocked") return <OctagonAlert className={`${base} text-red-600`} />
  if (state === "not_applicable") return <Minus className={`${base} text-stone-300`} />
  return <CircleDashed className={`${base} text-amber-500`} />
}

function OrgRow({ check, onGoToTab }: { check: OrgCheck; onGoToTab?: (tab: string) => void }) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <CheckIconFor state={check.state} />
      <div className="min-w-0 flex-1">
        <span className="font-medium text-stone-900">{check.label}</span>
        {check.value && <p className="mt-0.5 text-stone-600">{check.value}</p>}
        {check.remedy && <p className="mt-0.5 text-stone-600">{check.remedy}</p>}
      </div>
      {check.tab && onGoToTab && (
        <Button size="sm" variant="outline" onClick={() => onGoToTab(check.tab as string)}>
          Fix
        </Button>
      )}
    </div>
  )
}

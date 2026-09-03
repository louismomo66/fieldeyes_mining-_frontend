"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Package, Plus, ShieldAlert } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
import { dataService } from "@/lib/data-service"
import { toKg } from "@/lib/stock"
import type { CoCLot, InventoryItem, MineSiteCertification, MineralType } from "@/lib/types"

// The minerals the Regulations cover (reg. 2), plus tantalum and titanium, which
// are lotted in their own right rather than only as coltan. Shown first because
// they are the ones a chain-of-custody lot usually concerns.
const DESIGNATED: MineralType[] = ["gold", "tin", "tantalum", "coltan", "wolfram", "titanium"]

// Everything else production can record. A lot has to be able to describe what
// was actually produced, so these are offered below the designated set.
const OTHER_MINERALS: MineralType[] = [
  "copper", "cobalt", "lithium", "nickel", "iron_ore", "lead", "zinc",
  "manganese", "chromite", "rare_earth_elements", "uranium", "graphite",
  "silver", "diamond", "gemstones", "bentonite", "diatomite", "gypsum",
  "feldspar", "limestone", "marble", "kaolin", "phosphates", "pozzolana",
  "salt", "sand", "vermiculite", "granite", "other",
]

const MINERAL_LABELS: Partial<Record<MineralType, string>> = {
  iron_ore: "Iron ore",
  rare_earth_elements: "Rare earth elements",
}

const mineralLabel = (m: MineralType) => MINERAL_LABELS[m] ?? m

const UNITS = ["kg", "g", "tonnes", "oz"]

// Grade is measured differently per mineral, so the unit follows the mineral.
// Minerals without an entry fall back to a generic percentage or free choice.
const GRADE_UNITS: Record<string, string[]> = {
  gold: ["g/t Au", "% Au", "karat"],
  tin: ["% Sn", "% SnO2"],
  tantalum: ["% Ta2O5", "ppm Ta"],
  coltan: ["% Ta2O5", "% Nb2O5"],
  wolfram: ["% WO3", "% W"],
  titanium: ["% TiO2", "% Ti"],
}

const DEFAULT_GRADE_UNITS = ["%", "g/t", "ppm"]

const gradeUnitsFor = (m: string) => GRADE_UNITS[m] ?? DEFAULT_GRADE_UNITS

export function LotsView() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  const [lots, setLots] = useState<CoCLot[] | null>(null)
  const [sites, setSites] = useState<MineSiteCertification[]>([])
  const [production, setProduction] = useState<InventoryItem[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)

  const [form, setForm] = useState({
    certId: "",
    mineral: "gold" as MineralType,
    weight: "",
    unit: "kg",
    gradeValue: "",
    gradeUnit: GRADE_UNITS.gold[0],
    sealNumber: "",
    cocSystem: "ICGLR RCM",
    verificationOfficer: "",
  })

  useEffect(() => {
    if (!isLoading && !user) router.push("/login")
  }, [isLoading, router, user])

  const load = useCallback(async () => {
    try {
      setLots(await dataService.getCoCLots())
    } catch (error) {
      console.error(error)
      setLots([])
    }
  }, [])

  useEffect(() => {
    if (!user) return
    load()
    dataService.getMineSiteCertifications().then(setSites).catch(() => setSites([]))
  }, [user, load])

  // Unpackaged production for the chosen mineral, so a lot is built from records
  // that already exist rather than re-typing weights.
  useEffect(() => {
    if (!showForm) return
    dataService
      .getAvailableProductionRecords(form.mineral)
      .then(setProduction)
      .catch(() => setProduction([]))
    setSelected([])
  }, [showForm, form.mineral])

  // Records can be logged in different units (a pit tally in grams, a
  // stockpile in kg) — converted to kg before summing, or "2 g + 1 kg" reads
  // as "3 kg" instead of 1.002 kg. Always in kg regardless of `form.unit`,
  // matching the backend's own derivation (data/compliance.go).
  const derivedWeightKg = useMemo(
    () =>
      selected.reduce((sum, id) => {
        const rec = production.find((p) => p.id === id)
        const kg = rec ? toKg(rec.quantity, rec.unit) : null
        return sum + (kg ?? 0)
      }, 0),
    [selected, production],
  )

  // A red-flagged site cannot produce a tradable lot — the backend rejects it
  // outright (compliance handler), so don't offer it in the first place.
  const eligibleSites = sites.filter((s) => s.status !== "red")
  const redCount = sites.length - eligibleSites.length

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.certId) {
      toast.error("Select the mine site this lot came from")
      return
    }
    if (selected.length === 0 && !form.weight) {
      toast.error("Enter a weight, or tick the production records this lot was packaged from")
      return
    }

    setBusy(true)
    try {
      const cert = sites.find((s) => s.id === form.certId)
      const lot = await dataService.createCoCLot({
        // Linking the certification is what ties the lot to a mine site — the
        // backend copies the site name and status across from it.
        mine_site_certification_id: cert ? Number(cert.id) : undefined,
        source_mine_site: cert?.mine_site_name || "",
        mineral_type: form.mineral,
        // Sent as-is (this component computes and posts its own weight, unlike
        // the compliance form which leaves it blank for the backend to
        // derive) — so the unit must be forced to kg here too, or a weight
        // that's correctly in kg gets labelled with whatever unit was left
        // selected in the dropdown.
        weight: selected.length > 0 ? derivedWeightKg : Number(form.weight),
        unit: selected.length > 0 ? "kg" : form.unit,
        grade_value: form.gradeValue ? Number(form.gradeValue) : undefined,
        grade_unit: form.gradeUnit,
        seal_number: form.sealNumber || undefined,
        coc_system: form.cocSystem,
        verification_officer: form.verificationOfficer || undefined,
        // Backend decodes these into []uint, so send numbers — InventoryItem.id
        // is a string on the client.
        production_record_ids:
          selected.length > 0 ? selected.map(Number).filter((n) => !Number.isNaN(n)) : undefined,
      } as Partial<CoCLot>)

      toast.success(
        selected.length > 0
          ? `Lot ${lot?.lot_number} registered from ${selected.length} production record(s)`
          : `Lot ${lot?.lot_number} registered`,
      )
      setShowForm(false)
      setSelected([])
      setForm((f) => ({ ...f, weight: "", gradeValue: "", sealNumber: "", verificationOfficer: "" }))
      load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to register lot")
    } finally {
      setBusy(false)
    }
  }

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-amber-600" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-stone-900">
              <Package className="h-8 w-8 text-emerald-700" />
              Lots
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Every lot you own or currently hold, from pit to export
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="h-4 w-4" />
            Register lot
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Register a lot</CardTitle>
            </CardHeader>
            <CardContent>
              {sites.length === 0 ? (
                <p className="text-sm text-stone-600">
                  Register a mine site first — a lot has to come from a certified site.{" "}
                  <Link href="/lots-compliance?view=compliance" className="font-medium text-emerald-700 hover:underline">
                    Go to Mine sites
                  </Link>
                </p>
              ) : (
                <form onSubmit={submit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Mine site</Label>
                      <Select value={form.certId} onValueChange={(v) => setForm({ ...form, certId: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select site…" />
                        </SelectTrigger>
                        <SelectContent>
                          {eligibleSites.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.mine_site_name} ({s.status})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {redCount > 0 && (
                        <p className="flex items-center gap-1 text-xs text-red-600">
                          <ShieldAlert className="h-3 w-3" />
                          {redCount} red-flagged site(s) excluded — they cannot be traded
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label>Mineral</Label>
                      <Select
                        value={form.mineral}
                        onValueChange={(v) =>
                          setForm({ ...form, mineral: v as MineralType, gradeUnit: gradeUnitsFor(v)[0] || "" })
                        }
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Designated minerals</SelectLabel>
                            {DESIGNATED.map((m) => (
                              <SelectItem key={m} value={m} className="capitalize">{mineralLabel(m)}</SelectItem>
                            ))}
                          </SelectGroup>
                          <SelectSeparator />
                          <SelectGroup>
                            <SelectLabel>Other minerals captured in production</SelectLabel>
                            {OTHER_MINERALS.map((m) => (
                              <SelectItem key={m} value={m} className="capitalize">{mineralLabel(m)}</SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Package from production — the step that stops origin being retyped */}
                  {production.length > 0 && (
                    <div className="rounded-lg border bg-stone-50 p-3">
                      <p className="mb-2 text-sm font-medium text-stone-700">
                        Package from production records{" "}
                        <span className="font-normal text-stone-500">(fills the weight automatically)</span>
                      </p>
                      <div className="max-h-44 space-y-1.5 overflow-y-auto">
                        {production.map((rec) => (
                          <label
                            key={rec.id}
                            className="flex cursor-pointer items-center gap-3 rounded-lg bg-white p-2.5 hover:bg-stone-100"
                          >
                            <Checkbox checked={selected.includes(rec.id)} onCheckedChange={() => toggle(rec.id)} />
                            <span className="min-w-0 flex-1 text-xs">
                              <span className="block font-medium text-stone-900">
                                {rec.quantity} {rec.unit}
                                {rec.gradeValue != null ? ` • ${rec.gradeValue} ${rec.gradeUnit || ""}` : ""}
                              </span>
                              <span className="block text-stone-500">
                                {rec.date ? new Date(rec.date).toLocaleDateString() : "no date"}
                                {rec.pitNumber && ` • ${rec.pitNumber}`}
                                {rec.minerName && ` • ${rec.minerName}`}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                      {selected.length > 0 && (
                        <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
                          {selected.length} record(s) — {derivedWeightKg.toFixed(2)} kg
                        </p>
                      )}
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>{selected.length > 0 ? "Weight (auto)" : "Weight"}</Label>
                        <Input
                          type="number" min="0" step="0.0001"
                          value={selected.length > 0 ? derivedWeightKg.toFixed(2) : form.weight}
                          onChange={(e) => setForm({ ...form, weight: e.target.value })}
                          disabled={selected.length > 0}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Unit</Label>
                        {/* Always kg once derived from records — mixed-unit records are
                            converted and summed in kg, so the dropdown can't offer a
                            different unit without relabelling an already-converted number. */}
                        <Select
                          value={selected.length > 0 ? "kg" : form.unit}
                          onValueChange={(v) => setForm({ ...form, unit: v })}
                          disabled={selected.length > 0}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Grade (optional)</Label>
                        <Input
                          type="number" min="0" step="0.0001"
                          value={form.gradeValue}
                          onChange={(e) => setForm({ ...form, gradeValue: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Grade unit</Label>
                        <Select value={form.gradeUnit} onValueChange={(v) => setForm({ ...form, gradeUnit: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {gradeUnitsFor(form.mineral).map((u) => (
                              <SelectItem key={u} value={u}>{u}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label>Seal number (optional)</Label>
                      <Input
                        value={form.sealNumber}
                        onChange={(e) => setForm({ ...form, sealNumber: e.target.value })}
                        placeholder="Physical seal/tag ID"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Verified by</Label>
                      <Input
                        value={form.verificationOfficer}
                        onChange={(e) => setForm({ ...form, verificationOfficer: e.target.value })}
                        placeholder="Staff member who checked the documents"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={busy}>
                      {busy ? "Registering…" : "Register lot"}
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        )}

        {!lots && <p className="text-sm text-stone-500">Loading lots…</p>}

        {lots && lots.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-stone-500">
              <Package className="mx-auto mb-4 h-12 w-12 opacity-40" />
              <p className="font-medium">No lots yet</p>
              <p className="mt-1 text-sm">
                Register your first lot — a lot number and QR verification code are created automatically.
                Lots handed over to you also appear here.
              </p>
            </CardContent>
          </Card>
        )}

        {lots && lots.length > 0 && (
          <Card>
            <div className="divide-y">
              {lots.map((lot) => (
                <Link
                  key={lot.id}
                  href={`/lots/${lot.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-stone-50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-900">{lot.lot_number}</p>
                    <p className="truncate text-xs capitalize text-stone-500">
                      {lot.mineral_type} • {lot.weight} {lot.unit}
                      {lot.source_mine_site ? ` • ${lot.source_mine_site}` : ""}
                      {lot.current_custodian ? ` • held by ${lot.current_custodian}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {lot.mine_site_status === "red" && <Badge variant="destructive">red</Badge>}
                    <Badge variant="outline">{lot.tracking_state || "extracted"}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>
    </>
  )
}

"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertTriangle, Boxes, RefreshCw } from "lucide-react"

import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { dataService } from "@/lib/data-service"
import { buildStockReport, formatKg, type StockReport } from "@/lib/stock"
import type { CoCLot, Income, InventoryItem } from "@/lib/types"

export default function InventoryReconciliationPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  const [report, setReport] = useState<StockReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) router.push("/login")
  }, [isLoading, router, user])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [inventory, lots, sales] = await Promise.all([
        dataService.getInventory(),
        // Preloads production_records, which is how packaged material is
        // identified without the mineral_type-only endpoint.
        dataService.getCoCLots(),
        dataService.getIncomes(),
      ])
      const production = (inventory as InventoryItem[]).filter((i) => i.type === "mineral")
      setReport(buildStockReport(production, lots as CoCLot[], sales as Income[]))
    } catch (error) {
      console.error("Failed to build inventory report:", error)
      setReport(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) load()
  }, [user, load])

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-amber-600" />
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-stone-900">
              <Boxes className="h-8 w-8 text-emerald-700" />
              Inventory
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Reconciled from production, lots, sales and exports — nothing is stored
            </p>
          </div>
          <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Recalculate
          </Button>
        </div>

        {loading && <p className="text-sm text-stone-500">Calculating…</p>}

        {!loading && report && (
          <>
            {/* Headline balance */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Produced", value: report.totalProducedKg, hint: "All production recorded" },
                { label: "Sold", value: report.totalSoldKg, hint: "From Sales" },
                { label: "Exported", value: report.totalExportedKg, hint: "Left the chain" },
                { label: "On hand", value: report.totalOnHandKg, hint: "Unpackaged + lots held", strong: true },
              ].map((c) => (
                <Card key={c.label}>
                  <CardContent className="pt-6">
                    <p className="text-xs uppercase tracking-wide text-stone-500">{c.label}</p>
                    <p className={`mt-1 text-2xl font-bold ${c.strong ? "text-emerald-700" : "text-stone-900"}`}>
                      {formatKg(c.value)}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">{c.hint}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {report.discrepancies.length > 0 && (
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-red-700">
                    <AlertTriangle className="h-5 w-5" />
                    {report.discrepancies.length} lot(s) do not match their production records
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-sm text-stone-600">
                    A lot's weight should equal the production it was packaged from. Where it does
                    not, material is unaccounted for.
                  </p>
                  <div className="space-y-2">
                    {report.discrepancies.map((d) => (
                      <Link
                        key={d.lotId}
                        href={`/lots/${d.lotId}`}
                        className="flex items-center justify-between rounded-lg border p-3 hover:bg-stone-50"
                      >
                        <div>
                          <p className="font-medium">{d.lotNumber}</p>
                          <p className="text-xs text-stone-600">
                            lot {formatKg(d.lotKg)} vs production {formatKg(d.linkedProductionKg)}
                          </p>
                        </div>
                        <Badge variant="destructive">
                          {d.differenceKg > 0 ? "+" : ""}
                          {formatKg(d.differenceKg)}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader><CardTitle className="text-lg">Balance by mineral</CardTitle></CardHeader>
              <CardContent>
                {report.lines.length === 0 ? (
                  <div className="py-10 text-center text-stone-500">
                    <Boxes className="mx-auto mb-3 h-10 w-10 opacity-40" />
                    <p className="text-sm font-medium">No mineral production recorded yet</p>
                    <p className="mt-1 text-xs">
                      Add production on the Production page — items must be type “mineral”.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs uppercase text-stone-500">
                          <th className="py-2 pr-4">Mineral</th>
                          <th className="py-2 pr-4 text-right">Produced</th>
                          <th className="py-2 pr-4 text-right">Unpackaged</th>
                          <th className="py-2 pr-4 text-right">In lots</th>
                          <th className="py-2 pr-4 text-right">In transit</th>
                          <th className="py-2 pr-4 text-right">Sold</th>
                          <th className="py-2 pr-4 text-right">Exported</th>
                          <th className="py-2 pr-4 text-right font-semibold">On hand</th>
                          <th className="py-2 text-right">Variance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.lines.map((l) => (
                          <tr key={l.mineral} className="border-b last:border-0">
                            <td className="py-3 pr-4 font-medium capitalize">{l.mineral}</td>
                            <td className="py-3 pr-4 text-right">{formatKg(l.producedKg)}</td>
                            <td className="py-3 pr-4 text-right">{formatKg(l.unpackagedKg)}</td>
                            <td className="py-3 pr-4 text-right">{formatKg(l.atMineKg)}</td>
                            <td className="py-3 pr-4 text-right">
                              {formatKg(l.inTransitKg + l.awaitingExportKg)}
                            </td>
                            <td className="py-3 pr-4 text-right">{formatKg(l.soldKg)}</td>
                            <td className="py-3 pr-4 text-right">{formatKg(l.exportedKg)}</td>
                            <td className="py-3 pr-4 text-right font-semibold">{formatKg(l.onHandKg)}</td>
                            <td className="py-3 text-right">
                              {Math.abs(l.varianceKg) < 0.01 ? (
                                <span className="text-emerald-700">balanced</span>
                              ) : (
                                <span className="font-medium text-amber-700">
                                  {l.varianceKg > 0 ? "+" : ""}
                                  {formatKg(l.varianceKg)}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="mt-4 space-y-1 text-xs text-stone-500">
                  <p><strong>On hand</strong> = unpackaged production + lots held (at mine, in transit, awaiting export).</p>
                  <p><strong>Variance</strong> = on hand − (produced − sold − exported). It should be zero.</p>
                  <p>
                    A positive variance usually means a sale was recorded without the material
                    leaving the chain — sales are not linked to lots, so selling does not reduce
                    stock on its own.
                  </p>
                </div>
              </CardContent>
            </Card>

            {report.unconvertible.length > 0 && (
              <Card className="border-amber-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-amber-700">
                    <AlertTriangle className="h-5 w-5" />
                    {report.unconvertible.length} record(s) excluded
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-sm text-stone-600">
                    Recorded in units with no mass (carats, cubic metres, basins), so they cannot be
                    added to a kilogram balance.
                  </p>
                  <div className="space-y-1">
                    {report.unconvertible.map((u, i) => (
                      <div key={`${u.name}-${i}`} className="rounded border px-3 py-2 text-sm">
                        {u.name} — {u.quantity} {u.unit}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

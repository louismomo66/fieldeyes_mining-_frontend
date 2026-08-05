"use client"

import { Suspense, useCallback } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LotsView } from "@/components/lots-view"
import { ComplianceView } from "@/components/compliance-view"
import { TraceabilityView } from "@/components/traceability-view"

const VIEWS = ["lots", "compliance", "traceability"] as const
type View = (typeof VIEWS)[number]

function LotsComplianceTabs() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // The open sub-tab lives in the URL so a tab can be linked to and survives a
  // refresh — ?view=traceability etc. Anything unrecognised falls back to Lots.
  const param = searchParams.get("view")
  const view: View = VIEWS.includes(param as View) ? (param as View) : "lots"

  const onChange = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("view", next)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  return (
    <Tabs value={view} onValueChange={onChange} className="space-y-6">
      <TabsList className="grid h-auto w-full grid-cols-3 gap-1 sm:w-auto sm:inline-grid">
        <TabsTrigger value="lots">Lots</TabsTrigger>
        <TabsTrigger value="compliance">Compliance</TabsTrigger>
        <TabsTrigger value="traceability">Traceability</TabsTrigger>
      </TabsList>

      {/* Each view is the original page body untouched, so behaviour, data
          loading and inner tabs are identical to the standalone routes. */}
      <TabsContent value="lots" className="mt-0">
        <LotsView />
      </TabsContent>
      <TabsContent value="compliance" className="mt-0">
        <ComplianceView />
      </TabsContent>
      <TabsContent value="traceability" className="mt-0">
        <TraceabilityView />
      </TabsContent>
    </Tabs>
  )
}

export default function LotsCompliancePage() {
  return (
    <DashboardLayout>
      {/* useSearchParams needs a Suspense boundary during prerender. */}
      <Suspense fallback={<p className="text-sm text-stone-500">Loading…</p>}>
        <LotsComplianceTabs />
      </Suspense>
    </DashboardLayout>
  )
}

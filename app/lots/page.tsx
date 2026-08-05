"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { LotsView } from "@/components/lots-view"

// The Lots screen now lives inside the merged Lots & Compliance section, but the
// route is kept so existing links and bookmarks (compliance board, lot detail
// back-links) still resolve.
export default function LotsPage() {
  return (
    <DashboardLayout>
      <LotsView />
    </DashboardLayout>
  )
}

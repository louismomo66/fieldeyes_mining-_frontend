"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { ComplianceView } from "@/components/compliance-view"

// Kept as a standalone route so existing links and bookmarks still resolve; the
// same view is also rendered as a sub-tab of the merged Lots & Compliance page.
export default function CompliancePage() {
  return (
    <DashboardLayout>
      <ComplianceView />
    </DashboardLayout>
  )
}

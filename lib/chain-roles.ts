import type { ChainRole } from "./types"

/**
 * Display names for the supply-chain role picked at signup. The labels match the
 * signup tiles ("Mine operator", "Exporter", ...) so a user sees the same name
 * they chose. An empty role is a legacy account created before roles existed —
 * it keeps full access, and is labelled as such rather than as a role it never chose.
 */
export const CHAIN_ROLE_LABELS: Record<Exclude<ChainRole, "">, string> = {
  operator: "Mine operator",
  transporter: "Transporter",
  exporter: "Exporter",
  inspector: "Inspector",
}

export const CHAIN_ROLE_ORDER: Array<Exclude<ChainRole, "">> = [
  "operator",
  "transporter",
  "exporter",
  "inspector",
]

// Badge colours, kept distinct from the admin page's activity categories
// (miner = amber, buyer = emerald, seller = blue) so the two don't read as one scheme.
export const CHAIN_ROLE_BADGE: Record<Exclude<ChainRole, ""> | "legacy", string> = {
  operator: "bg-orange-100 text-orange-800 border-orange-200",
  transporter: "bg-sky-100 text-sky-800 border-sky-200",
  exporter: "bg-teal-100 text-teal-800 border-teal-200",
  inspector: "bg-violet-100 text-violet-800 border-violet-200",
  legacy: "bg-stone-100 text-stone-600 border-stone-200",
}

export function chainRoleLabel(role?: string | null): string {
  if (role && role in CHAIN_ROLE_LABELS) return CHAIN_ROLE_LABELS[role as Exclude<ChainRole, "">]
  return "No role set"
}

export function chainRoleBadgeClass(role?: string | null): string {
  if (role && role in CHAIN_ROLE_BADGE) return CHAIN_ROLE_BADGE[role as Exclude<ChainRole, "">]
  return CHAIN_ROLE_BADGE.legacy
}

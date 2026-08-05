"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import {
  Search,
  MapPin,
  Truck,
  Factory,
  Shield,
  Clock,
  User,
  Package,
  Route,
  AlertTriangle,
  CheckCircle,
  QrCode,
  Plus,
  ArrowRight
} from "lucide-react"
import { toast } from "sonner"
import { dataService } from "@/lib/data-service"
import { emptyProcessingPayload, emptyTransportPayload } from "@/lib/traceability-payloads"
import type { CoCLot, EnhancedCoCLot, TrackingStatus, TransportRecord, ProcessingRecord, InventoryItem } from "@/lib/types"

export function TraceabilityView() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedTrace, setSelectedTrace] = useState<EnhancedCoCLot | null>(null)
  const [loading, setLoading] = useState(false)
  const [pits, setPits] = useState<string[]>([])
  const [selectedPit, setSelectedPit] = useState<string>("")
  const [myLots, setMyLots] = useState<CoCLot[]>([])
  const [lotsLoading, setLotsLoading] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) router.push("/login")
  }, [isLoading, router, user])

  // Pits are free text on production records (InventoryItem.pit_number) and there
  // is no endpoint that lists them, so derive the distinct set client-side — the
  // same approach the mine-info page uses.
  useEffect(() => {
    if (!user) return
    let active = true
    dataService
      .getInventory()
      .then((inventory) => {
        if (!active) return
        const names = new Set<string>()
        inventory
          .filter((item) => item.from === "mine" && item.pitNumber)
          .forEach((item) => names.add(item.pitNumber as string))
        setPits(Array.from(names).sort())
      })
      .catch(() => {
        if (active) setPits([])
      })
    return () => {
      active = false
    }
  }, [user])

  // Show every production record from a pit, without needing to type its name.
  const handlePitSelect = async (pit: string) => {
    setSelectedPit(pit)
    setSelectedTrace(null)
    if (!pit) return

    setLoading(true)
    try {
      const records = await dataService.getProductionRecordsByPit(pit)
      setSearchQuery("")
      setSearchResults(records.map((item) => ({ ...item, type: "inventory" })))
      if (records.length === 0) {
        toast.info(`No production records found for ${pit}`)
      }
    } catch (error) {
      console.error("Pit lookup failed:", error)
      toast.error("Failed to load production records for that pit")
    } finally {
      setLoading(false)
    }
  }

  // Re-fetch the open lot so newly recorded transport/processing/custody shows up.
  const refreshTrace = async () => {
    if (!selectedTrace) return
    try {
      const updated = await dataService.getLotTrace(selectedTrace.id)
      if (updated) setSelectedTrace(updated)
      loadMyLots()
    } catch (error) {
      console.error("Failed to refresh trace:", error)
    }
  }

  // Every lot the account can act on: ones it owns, plus ones handed over to it.
  // The backend already returns both (user_id OR current_custodian_user_id), so
  // this is the entry point for transporters and exporters, who have no
  // production records of their own and therefore no pits to browse.
  const loadMyLots = useCallback(async () => {
    if (!user) return
    setLotsLoading(true)
    try {
      const lots = await dataService.getCoCLots()
      setMyLots(lots)
    } catch (error) {
      console.error("Failed to load lots:", error)
      setMyLots([])
    } finally {
      setLotsLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadMyLots()
  }, [loadMyLots])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setLoading(true)
    try {
      // Search across all trackable items (inventory, CoC lots, etc.)
      const [inventory, cocLots] = await Promise.all([
        dataService.getInventory(),
        dataService.getCoCLots()
      ])
      
      const results = [
        ...inventory.filter(item => 
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.batchNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.pitNumber?.toLowerCase().includes(searchQuery.toLowerCase())
        ).map(item => ({...item, type: 'inventory'})),
        ...cocLots.filter(lot =>
          lot.lot_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lot.source_mine_site.toLowerCase().includes(searchQuery.toLowerCase())
        ).map(lot => ({...lot, type: 'coc_lot'}))
      ]
      
      setSearchResults(results)
    } catch (error) {
      console.error('Search failed:', error)
      toast.error('Failed to search items')
    } finally {
      setLoading(false)
    }
  }

  const loadFullTrace = async (item: any) => {
    setLoading(true)
    try {
      if (item.type === 'coc_lot') {
        // Must come from the passport endpoint — the lot list does not preload
        // custody, transport, processing or documents, so building a trace from
        // it always shows an empty chain.
        const trace = await dataService.getLotTrace(item.id)
        if (trace) {
          setSelectedTrace(trace)
        } else {
          toast.error('Could not load the trace for this lot')
        }
      } else {
        // Create a trace view for inventory item
        const trace: EnhancedCoCLot = {
          ...item,
          lot_number: `INV-${item.id}`,
          custody_chain: [],
          compliance_documents: [],
          photos: [],
          qr_code: `INV-${item.id}-${Date.now()}`
        }
        setSelectedTrace(trace)
      }
    } catch (error) {
      console.error('Failed to load trace:', error)
      toast.error('Failed to load trace information')
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" />
    </div>
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-stone-900">
              <Route className="h-8 w-8 text-emerald-700" />
              Mineral Traceability
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Track and trace minerals from extraction to export with complete chain of custody
            </p>
          </div>
        </div>

        {/* Lots this account can act on — owned or held. This is the entry point
            for transporters and exporters, who have no production of their own. */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              My lots
              {myLots.length > 0 && (
                <Badge variant="secondary">{myLots.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lotsLoading ? (
              <p className="py-4 text-sm text-stone-500">Loading lots…</p>
            ) : myLots.length === 0 ? (
              <div className="py-6 text-center text-stone-500">
                <Package className="mx-auto mb-3 h-10 w-10 opacity-40" />
                <p className="text-sm">No lots yet</p>
                <p className="mt-1 text-xs">
                  Lots you own appear here, as do lots handed over into your custody.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-3 gap-2">
                  <Link href="/lots-compliance?view=compliance">
                    <Plus className="h-4 w-4" />
                    Register a lot
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {myLots.map((lot) => (
                  <button
                    key={lot.id}
                    type="button"
                    onClick={() => loadFullTrace({ ...lot, type: "coc_lot" })}
                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition hover:bg-stone-50 ${
                      selectedTrace?.id === lot.id ? "border-emerald-500 bg-emerald-50" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{lot.lot_number}</p>
                      <p className="truncate text-sm text-stone-600">
                        {lot.mineral_type} • {lot.weight} {lot.unit} • {lot.source_mine_site}
                      </p>
                    </div>
                    <div className="ml-3 flex shrink-0 items-center gap-2">
                      {lot.current_custodian && (
                        <span className="hidden text-xs text-stone-500 sm:inline">
                          held by {lot.current_custodian}
                        </span>
                      )}
                      <Badge variant={lot.is_exported ? "default" : "outline"}>
                        {lot.tracking_state || (lot.is_exported ? "exported" : "at mine")}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Trace
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter lot number, batch ID, pit number, or item name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {/* Browse by pit — avoids having to remember pit names. Pits come from
                your own production records, so this is empty for transporters and
                exporters by design; they work from "My lots" above instead. */}
            <div className="mt-4 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center">
              <Label className="whitespace-nowrap text-sm text-stone-600">Or browse by pit</Label>
              <div className="flex flex-1 items-center gap-2">
                <Select value={selectedPit} onValueChange={handlePitSelect} disabled={pits.length === 0}>
                  <SelectTrigger className="flex-1">
                    <SelectValue
                      placeholder={
                        pits.length
                          ? "Select a pit…"
                          : "No pits — only accounts that record production have these"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {pits.map((pit) => (
                      <SelectItem key={pit} value={pit}>
                        {pit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedPit("")
                      setSearchResults([])
                      setSelectedTrace(null)
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-stone-600">{searchResults.length} items found</p>
                {searchResults.map((item) => (
                  <div 
                    key={`${item.type}-${item.id}`}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-stone-50 cursor-pointer"
                    onClick={() => loadFullTrace(item)}
                  >
                    <div>
                      <p className="font-medium">
                        {item.type === 'coc_lot' ? item.lot_number : item.name}
                      </p>
                      <p className="text-sm text-stone-600">
                        {item.type === 'coc_lot' 
                          ? `${item.mineral_type} • ${item.source_mine_site}`
                          : `${item.pitNumber || 'Unknown Pit'} • ${item.batchNumber || 'No Batch'}`
                        }
                      </p>
                    </div>
                    <Badge variant={item.type === 'coc_lot' ? 'default' : 'secondary'}>
                      {item.type === 'coc_lot' ? 'CoC Lot' : 'Production Record'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Trace View */}
        {selectedTrace && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Complete Trace: {selectedTrace.lot_number}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  <span className="text-sm text-stone-600">{selectedTrace.qr_code}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="journey" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="journey">Journey Map</TabsTrigger>
                  <TabsTrigger value="custody">Custody Chain</TabsTrigger>
                  <TabsTrigger value="transport">Transport</TabsTrigger>
                  <TabsTrigger value="processing">Processing</TabsTrigger>
                  <TabsTrigger value="compliance">Compliance</TabsTrigger>
                </TabsList>

                <TabsContent value="journey">
                  <TraceabilityJourney trace={selectedTrace} />
                </TabsContent>

                <TabsContent value="custody">
                  <CustodyChain trace={selectedTrace} onRecorded={refreshTrace} />
                </TabsContent>

                <TabsContent value="transport">
                  <TransportHistory trace={selectedTrace} onRecorded={refreshTrace} />
                </TabsContent>

                <TabsContent value="processing">
                  <ProcessingHistory trace={selectedTrace} onRecorded={refreshTrace} />
                </TabsContent>

                <TabsContent value="compliance">
                  <ComplianceHistory trace={selectedTrace} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}

function TraceabilityJourney({ trace }: { trace: EnhancedCoCLot }) {
  const stages = [
    {
      stage: 'Extraction',
      icon: <MapPin className="h-5 w-5" />,
      status: 'completed',
      location: trace.source_mine_site,
      timestamp: trace.created_at,
      details: trace.production_records?.length
        ? `${trace.mineral_type} from ${trace.source_mine_site} — packaged from ${trace.production_records.length} production record(s), pit(s) ${
            Array.from(
              new Set(
                trace.production_records
                  .map((r) => r.pitNumber)
                  .filter(Boolean)
              )
            ).join(', ') || 'unrecorded'
          }`
        : `${trace.mineral_type} from ${trace.source_mine_site} — no production records linked, so origin is unverified`
    },
    {
      // Custody is the link between extraction and transport: who physically
      // holds the lot. Without it the chain has a gap even if transport exists.
      stage: 'Custody',
      icon: <User className="h-5 w-5" />,
      status: trace.custody_chain?.length ? 'completed' : 'pending',
      location: trace.current_custodian || 'Still with the operator',
      timestamp: trace.custody_chain?.[trace.custody_chain.length - 1]?.transfer_date,
      details: trace.custody_chain?.length
        ? `${trace.custody_chain.length} handover(s) — currently held by ${trace.current_custodian || 'the owner'}`
        : 'No handover recorded yet'
    },
    {
      stage: 'Transport to Processing',
      icon: <Truck className="h-5 w-5" />,
      status: trace.transport_records?.length ? 'completed' : 'pending',
      location: 'Processing Facility',
      timestamp: trace.transport_records?.[0]?.timing.departureTime,
      details: trace.transport_records?.[0] ? 
        `Vehicle: ${trace.transport_records[0].vehicleDetails.licensePlate}` : 
        'Transport pending'
    },
    {
      stage: 'Processing',
      icon: <Factory className="h-5 w-5" />,
      status: trace.processing_records?.length ? 'completed' : 'pending',
      location: 'Processing Facility',
      timestamp: trace.processing_records?.[0]?.processing.startTime,
      details: trace.processing_records?.[0] ? 
        `Processed: ${trace.processing_records[0].processType.join(', ')}` : 
        'Processing pending'
    },
    {
      stage: 'Quality Control',
      icon: <Shield className="h-5 w-5" />,
      status: trace.processing_records?.some(p => p.qualityControl.assayResults) ? 'completed' : 'pending',
      location: 'QC Laboratory',
      timestamp: trace.processing_records?.[0]?.processing.endTime,
      details: 'Quality testing and certification'
    },
    {
      stage: 'Export Ready',
      icon: <CheckCircle className="h-5 w-5" />,
      status: trace.is_exported ? 'completed' : 'pending',
      location: 'Export Facility',
      timestamp: trace.updated_at,
      details: trace.is_exported ? 'Ready for international export' : 'Awaiting export clearance'
    }
  ]

  return (
    <div className="space-y-4">
      {stages.map((stage, index) => (
        <div key={stage.stage} className="flex items-start gap-4">
          <div className={`p-2 rounded-full ${
            stage.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
            stage.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
            'bg-stone-100 text-stone-400'
          }`}>
            {stage.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{stage.stage}</h4>
              <Badge variant={
                stage.status === 'completed' ? 'default' :
                stage.status === 'in_progress' ? 'secondary' : 'outline'
              }>
                {stage.status}
              </Badge>
            </div>
            <p className="text-sm text-stone-600">{stage.details}</p>
            <div className="flex items-center gap-4 mt-1 text-xs text-stone-500">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {stage.location}
              </span>
              {stage.timestamp && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(stage.timestamp).toLocaleString()}
                </span>
              )}
            </div>
          </div>
          {index < stages.length - 1 && (
            <div className={`w-px h-12 ml-6 ${
              stage.status === 'completed' ? 'bg-emerald-200' : 'bg-stone-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  )
}

// A lot's custody can only be handed to a registered account — the backend
// resolves the recipient by email (compliance handler HandoverCoCLot).
function HandoverForm({ trace, onRecorded }: { trace: EnhancedCoCLot; onRecorded: () => void }) {
  const [open, setOpen] = useState(false)
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
    try {
      const result = await dataService.handoverCoCLot(trace.id, {
        to_email: email.trim(),
        note: note.trim() || undefined,
        location: location.trim() || undefined,
      })
      if (result.ok) {
        toast.success(`Custody handed to ${result.toName || email.trim()}`)
        setEmail("")
        setLocation("")
        setNote("")
        setOpen(false)
        onRecorded()
      } else {
        toast.error(result.error || "Handover failed")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Handover failed")
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <ArrowRight className="h-4 w-4" />
        Hand over custody
      </Button>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border bg-stone-50 p-4">
      <h4 className="font-medium">Hand over custody of {trace.lot_number}</h4>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="handover-email">Receiving account email</Label>
          <Input
            id="handover-email"
            type="email"
            placeholder="transporter@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="handover-location">Location (optional)</Label>
          <Input
            id="handover-location"
            placeholder="Weighbridge, Kampala"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="handover-note">Note (optional)</Label>
        <Textarea
          id="handover-note"
          rows={2}
          placeholder="Seal intact, weighed on collection"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? "Recording…" : "Confirm handover"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

function CustodyChain({ trace, onRecorded }: { trace: EnhancedCoCLot; onRecorded: () => void }) {
  const transfers = trace.custody_chain || []

  if (transfers.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8 text-stone-500">
          <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No custody transfers recorded yet</p>
          <p className="text-sm">Hand the lot over to record the first transfer</p>
        </div>
        <HandoverForm trace={trace} onRecorded={onRecorded} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <HandoverForm trace={trace} onRecorded={onRecorded} />
      {transfers.map((transfer, index) => (
        <div key={transfer.id} className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="font-medium">{transfer.from_custodian} → {transfer.to_custodian}</span>
            </div>
            <span className="text-sm text-stone-600">
              {new Date(transfer.transfer_date).toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-stone-600 mt-2">{transfer.transfer_reason}</p>
          {transfer.condition_notes && (
            <p className="text-xs text-stone-500 mt-1">Notes: {transfer.condition_notes}</p>
          )}
        </div>
      ))}
    </div>
  )
}

function TransportForm({ trace, onRecorded }: { trace: EnhancedCoCLot; onRecorded: () => void }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    licensePlate: "",
    driverName: "",
    driverLicense: "",
    vehicleType: "truck",
    originAddress: "",
    destinationAddress: "",
    plannedDistance: "",
    departureTime: "",
    grossWeight: "",
    netWeight: "",
    sealNumbers: "",
    transportPermit: "",
    handoverNotes: "",
  })

  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.licensePlate.trim() || !form.driverName.trim()) {
      toast.error("Vehicle plate and driver name are required")
      return
    }
    if (!form.originAddress.trim() || !form.destinationAddress.trim()) {
      toast.error("Enter both an origin and a destination")
      return
    }

    setBusy(true)
    try {
      await dataService.createTransportRecord({
        ...emptyTransportPayload(),
        license_plate: form.licensePlate.trim(),
        driver_name: form.driverName.trim(),
        driver_license: form.driverLicense.trim(),
        vehicle_type: form.vehicleType,
        origin: { latitude: 0, longitude: 0, address: form.originAddress.trim() },
        destination: { latitude: 0, longitude: 0, address: form.destinationAddress.trim() },
        planned_distance: Number(form.plannedDistance) || 0,
        // Go decodes into time.Time, so an empty string would fail — always send RFC3339.
        departure_time: form.departureTime
          ? new Date(form.departureTime).toISOString()
          : new Date().toISOString(),
        coc_lot_ids: Number.isNaN(Number(trace.id)) ? [] : [Number(trace.id)],
        seal_numbers: form.sealNumbers
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        gross_weight: Number(form.grossWeight) || 0,
        net_weight: Number(form.netWeight) || 0,
        transport_permit: form.transportPermit.trim(),
        handover_notes: form.handoverNotes.trim(),
      })
      toast.success("Transport recorded")
      setOpen(false)
      onRecorded()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to record transport")
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Record transport
      </Button>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border bg-stone-50 p-4">
      <h4 className="font-medium">Record transport for {trace.lot_number}</h4>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Vehicle plate</Label>
          <Input value={form.licensePlate} onChange={(e) => set("licensePlate", e.target.value)} placeholder="UAX 123A" />
        </div>
        <div className="space-y-1">
          <Label>Vehicle type</Label>
          <Select value={form.vehicleType} onValueChange={(v) => set("vehicleType", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="truck">Truck</SelectItem>
              <SelectItem value="pickup">Pickup</SelectItem>
              <SelectItem value="van">Van</SelectItem>
              <SelectItem value="motorcycle">Motorcycle</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Driver name</Label>
          <Input value={form.driverName} onChange={(e) => set("driverName", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Driver licence</Label>
          <Input value={form.driverLicense} onChange={(e) => set("driverLicense", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Origin</Label>
          <Input value={form.originAddress} onChange={(e) => set("originAddress", e.target.value)} placeholder="Mine site" />
        </div>
        <div className="space-y-1">
          <Label>Destination</Label>
          <Input value={form.destinationAddress} onChange={(e) => set("destinationAddress", e.target.value)} placeholder="Processing plant" />
        </div>
        <div className="space-y-1">
          <Label>Departure</Label>
          <Input type="datetime-local" value={form.departureTime} onChange={(e) => set("departureTime", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Planned distance (km)</Label>
          <Input type="number" min="0" step="0.1" value={form.plannedDistance} onChange={(e) => set("plannedDistance", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Gross weight (kg)</Label>
          <Input type="number" min="0" step="0.01" value={form.grossWeight} onChange={(e) => set("grossWeight", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Net weight (kg)</Label>
          <Input type="number" min="0" step="0.01" value={form.netWeight} onChange={(e) => set("netWeight", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Seal numbers</Label>
          <Input value={form.sealNumbers} onChange={(e) => set("sealNumbers", e.target.value)} placeholder="Comma separated" />
        </div>
        <div className="space-y-1">
          <Label>Transport permit</Label>
          <Input value={form.transportPermit} onChange={(e) => set("transportPermit", e.target.value)} />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Notes</Label>
        <Textarea rows={2} value={form.handoverNotes} onChange={(e) => set("handoverNotes", e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy}>{busy ? "Saving…" : "Save transport"}</Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  )
}

function TransportHistory({ trace, onRecorded }: { trace: EnhancedCoCLot; onRecorded: () => void }) {
  const transports = trace.transport_records || []

  if (transports.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8 text-stone-500">
          <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No transport records found</p>
          <p className="text-sm">Record a movement to start the transport leg</p>
        </div>
        <TransportForm trace={trace} onRecorded={onRecorded} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <TransportForm trace={trace} onRecorded={onRecorded} />
      {transports.map((transport) => (
        <div key={transport.id} className="border rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium">Vehicle Details</h4>
              <p className="text-sm">License: {transport.vehicleDetails.licensePlate}</p>
              <p className="text-sm">Driver: {transport.vehicleDetails.driverName}</p>
              <p className="text-sm">Type: {transport.vehicleDetails.vehicleType}</p>
            </div>
            <div>
              <h4 className="font-medium">Route & Timing</h4>
              <p className="text-sm">From: {transport.route.origin.address}</p>
              <p className="text-sm">To: {transport.route.destination.address}</p>
              <p className="text-sm">Distance: {transport.route.plannedDistance} km</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Departure:</span>
              <p>{new Date(transport.timing.departureTime).toLocaleString()}</p>
            </div>
            <div>
              <span className="font-medium">Arrival:</span>
              <p>{transport.timing.arrivalTime ? 
                new Date(transport.timing.arrivalTime).toLocaleString() : 
                'In transit'
              }</p>
            </div>
            <div>
              <span className="font-medium">Status:</span>
              <Badge variant={
                transport.status === 'delivered' ? 'default' :
                transport.status === 'in_transit' ? 'secondary' : 'outline'
              }>
                {transport.status}
              </Badge>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

const PROCESS_TYPES = ["crushing", "milling", "washing", "smelting", "refining", "sorting"]

function ProcessingForm({ trace, onRecorded }: { trace: EnhancedCoCLot; onRecorded: () => void }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [types, setTypes] = useState<string[]>([])
  const [form, setForm] = useState({
    facilityName: "",
    operator: "",
    supervisor: "",
    startTime: "",
    duration: "",
    inputWeight: "",
    outputName: "",
    outputWeight: "",
    wasteGenerated: "",
    samplesCollected: "",
    qualityNotes: "",
  })

  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }))
  const toggleType = (t: string) =>
    setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))

  const inputWeight = Number(form.inputWeight) || 0
  const outputWeight = Number(form.outputWeight) || 0
  const waste = Number(form.wasteGenerated) || 0
  // Mass balance, as MineTrace enforces: output + waste can't exceed input.
  const massBalanceBroken = inputWeight > 0 && outputWeight + waste > inputWeight
  const computedYield = inputWeight > 0 ? (outputWeight / inputWeight) * 100 : 0

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.facilityName.trim()) {
      toast.error("Facility name is required")
      return
    }
    if (types.length === 0) {
      toast.error("Select at least one process type")
      return
    }
    if (massBalanceBroken) {
      toast.error("Output plus waste cannot exceed the input weight")
      return
    }

    setBusy(true)
    try {
      await dataService.createProcessingRecord({
        ...emptyProcessingPayload(),
        facility_name: form.facilityName.trim(),
        process_type: types,
        operator: form.operator.trim(),
        supervisor: form.supervisor.trim(),
        start_time: form.startTime ? new Date(form.startTime).toISOString() : new Date().toISOString(),
        duration: Number(form.duration) || 0,
        input_batches: inputWeight
          ? [{ inventory_item_id: 0, input_weight: inputWeight, input_grade: 0, input_unit: "kg" }]
          : [],
        output_items: form.outputName.trim()
          ? [{ name: form.outputName.trim(), weight: outputWeight, grade: 0, unit: "kg", product: "" }]
          : [],
        yield: Number(computedYield.toFixed(2)),
        waste_generated: waste,
        samples_collected: Number(form.samplesCollected) || 0,
        quality_notes: form.qualityNotes.trim(),
      })
      toast.success("Processing recorded")
      setOpen(false)
      onRecorded()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to record processing")
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Record processing
      </Button>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border bg-stone-50 p-4">
      <h4 className="font-medium">Record processing for {trace.lot_number}</h4>

      <div className="space-y-1">
        <Label>Process type</Label>
        <div className="flex flex-wrap gap-2">
          {PROCESS_TYPES.map((t) => (
            <Button
              key={t}
              type="button"
              size="sm"
              variant={types.includes(t) ? "default" : "outline"}
              onClick={() => toggleType(t)}
              className="capitalize"
            >
              {t}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Facility</Label>
          <Input value={form.facilityName} onChange={(e) => set("facilityName", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Start time</Label>
          <Input type="datetime-local" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Operator</Label>
          <Input value={form.operator} onChange={(e) => set("operator", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Supervisor</Label>
          <Input value={form.supervisor} onChange={(e) => set("supervisor", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Duration (minutes)</Label>
          <Input type="number" min="0" value={form.duration} onChange={(e) => set("duration", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Samples collected</Label>
          <Input type="number" min="0" value={form.samplesCollected} onChange={(e) => set("samplesCollected", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Input weight (kg)</Label>
          <Input type="number" min="0" step="0.01" value={form.inputWeight} onChange={(e) => set("inputWeight", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Waste generated (kg)</Label>
          <Input type="number" min="0" step="0.01" value={form.wasteGenerated} onChange={(e) => set("wasteGenerated", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Output name</Label>
          <Input value={form.outputName} onChange={(e) => set("outputName", e.target.value)} placeholder="Concentrate" />
        </div>
        <div className="space-y-1">
          <Label>Output weight (kg)</Label>
          <Input type="number" min="0" step="0.01" value={form.outputWeight} onChange={(e) => set("outputWeight", e.target.value)} />
        </div>
      </div>

      {inputWeight > 0 && (
        <p className={`text-sm ${massBalanceBroken ? "text-red-600" : "text-stone-600"}`}>
          {massBalanceBroken
            ? `Output + waste (${(outputWeight + waste).toFixed(2)} kg) exceeds input (${inputWeight.toFixed(2)} kg)`
            : `Yield ${computedYield.toFixed(1)}%`}
        </p>
      )}

      <div className="space-y-1">
        <Label>Quality notes</Label>
        <Textarea rows={2} value={form.qualityNotes} onChange={(e) => set("qualityNotes", e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy || massBalanceBroken}>
          {busy ? "Saving…" : "Save processing"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  )
}

function ProcessingHistory({ trace, onRecorded }: { trace: EnhancedCoCLot; onRecorded: () => void }) {
  const processing = trace.processing_records || []

  if (processing.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8 text-stone-500">
          <Factory className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No processing records found</p>
          <p className="text-sm">Record a run to log a transformation</p>
        </div>
        <ProcessingForm trace={trace} onRecorded={onRecorded} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ProcessingForm trace={trace} onRecorded={onRecorded} />
      {processing.map((process) => (
        <div key={process.id} className="border rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium">Process Details</h4>
              <p className="text-sm">Facility: {process.facilityName}</p>
              <p className="text-sm">Process: {process.processType.join(', ')}</p>
              <p className="text-sm">Operator: {process.processing.operator}</p>
              <p className="text-sm">Duration: {process.processing.duration} minutes</p>
            </div>
            <div>
              <h4 className="font-medium">Results</h4>
              <p className="text-sm">Yield: {process.output.yield}%</p>
              <p className="text-sm">Recovery: {process.output.recovery || 'N/A'}%</p>
              <p className="text-sm">Waste: {process.output.wasteGenerated} kg</p>
              <p className="text-sm">QC Samples: {process.qualityControl.samplesCollected}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ComplianceHistory({ trace }: { trace: EnhancedCoCLot }) {
  const documents = trace.compliance_documents || []
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium">Mine Site Status</h4>
          <Badge variant={
            trace.mine_site_status === 'green' ? 'default' :
            trace.mine_site_status === 'yellow' ? 'secondary' :
            trace.mine_site_status === 'red' ? 'destructive' : 'outline'
          }>
            {trace.mine_site_status}
          </Badge>
          <p className="text-sm text-stone-600 mt-1">
            Source: {trace.source_mine_site}
          </p>
        </div>
        <div>
          <h4 className="font-medium">CoC System</h4>
          <p className="text-sm">{trace.coc_system}</p>
          {trace.seal_number && (
            <p className="text-sm text-stone-600">Seal: {trace.seal_number}</p>
          )}
        </div>
      </div>

      {/* Certifications, due-diligence reports, audits and documents are managed
          on the compliance page — link there rather than duplicating the CRUD. */}
      <div className="flex flex-wrap gap-2 border-t pt-4">
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link href="/lots-compliance?view=compliance">
            <Shield className="h-4 w-4" />
            Manage compliance records
          </Link>
        </Button>
        {trace.verify_code && (
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href={`/verify/${trace.verify_code}`} target="_blank">
              <QrCode className="h-4 w-4" />
              Open public verification
            </Link>
          </Button>
        )}
      </div>

      {documents.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Compliance Documents</h4>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <p className="text-sm font-medium">{doc.title}</p>
                  <p className="text-xs text-stone-600">{doc.document_type}</p>
                </div>
                <Badge variant="outline">Valid</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
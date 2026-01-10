"use client"

import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { offlineService } from "@/lib/offline-service"

export function SyncIndicator() {
    const { toast } = useToast()

    useEffect(() => {
        // Initial sync attempt when the component mounts (app loads)
        if (typeof window !== "undefined" && navigator.onLine) {
            offlineService.syncTransactions()
        }

        const handleSyncComplete = (event: any) => {
            const { count } = event.detail
            toast({
                title: "Sync completed",
                description: `Successfully uploaded ${count} offline transaction(s).`,
            })
        }

        window.addEventListener("offlineSyncCompleted", handleSyncComplete)

        // Also listen for online status to trigger sync
        const handleOnline = () => {
            toast({
                title: "Back online",
                description: "Internet connection restored. Syncing data...",
            })
            offlineService.syncTransactions()
        }

        const handleOffline = () => {
            toast({
                title: "You are offline",
                description: "Transactions will be saved locally (up to 10) and synced when you are back online.",
                variant: "destructive",
            })
        }

        window.addEventListener("online", handleOnline)
        window.addEventListener("offline", handleOffline)

        return () => {
            window.removeEventListener("offlineSyncCompleted", handleSyncComplete)
            window.removeEventListener("online", handleOnline)
            window.removeEventListener("offline", handleOffline)
        }
    }, [toast])

    return null
}

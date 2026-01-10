"use client"

import { apiService } from "./api"
import type { Income, Expense, InventoryItem } from "./types"

const OFFLINE_STORAGE_KEY = "fieldeyes_offline_transactions"
const MAX_OFFLINE_TRANSACTIONS = 10

type OfflineTransactionType = "income" | "expense" | "inventory"

interface OfflineTransaction {
    id: string
    type: OfflineTransactionType
    data: any
    timestamp: string
}

export class OfflineService {
    private static instance: OfflineService

    private constructor() {
        if (typeof window !== "undefined") {
            window.addEventListener("online", () => this.syncTransactions())
        }
    }

    public static getInstance(): OfflineService {
        if (!OfflineService.instance) {
            OfflineService.instance = new OfflineService()
        }
        return OfflineService.instance
    }

    private getOfflineTransactions(): OfflineTransaction[] {
        if (typeof window === "undefined") return []
        const stored = localStorage.getItem(OFFLINE_STORAGE_KEY)
        return stored ? JSON.parse(stored) : []
    }

    private saveOfflineTransactions(transactions: OfflineTransaction[]): void {
        if (typeof window === "undefined") return
        localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(transactions))
    }

    public getOfflineCount(): number {
        return this.getOfflineTransactions().length
    }

    public canAddOffline(): boolean {
        return this.getOfflineCount() < MAX_OFFLINE_TRANSACTIONS
    }

    public async saveOffline(type: OfflineTransactionType, data: any): Promise<boolean> {
        if (!this.canAddOffline()) {
            throw new Error(`Offline limit reached. You can only save up to ${MAX_OFFLINE_TRANSACTIONS} transactions offline. Please connect to the internet to sync.`)
        }

        const transactions = this.getOfflineTransactions()
        const newTransaction: OfflineTransaction = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            data,
            timestamp: new Date().toISOString(),
        }

        transactions.push(newTransaction)
        this.saveOfflineTransactions(transactions)
        return true
    }

    public async syncTransactions(): Promise<void> {
        if (typeof window === "undefined" || !navigator.onLine) return

        const transactions = this.getOfflineTransactions()
        if (transactions.length === 0) return

        console.log(`Attempting to sync ${transactions.length} offline transactions...`)

        const remainingTransactions: OfflineTransaction[] = []
        let successCount = 0

        for (const tx of transactions) {
            try {
                let response
                if (tx.type === "income") {
                    response = await apiService.createIncome(tx.data)
                } else if (tx.type === "expense") {
                    response = await apiService.createExpense(tx.data)
                } else if (tx.type === "inventory") {
                    response = await apiService.createInventoryItem(tx.data)
                }

                if (response?.success) {
                    successCount++
                } else {
                    console.error(`Failed to sync transaction ${tx.id}:`, response?.error)
                    remainingTransactions.push(tx)
                }
            } catch (error) {
                console.error(`Error syncing transaction ${tx.id}:`, error)
                remainingTransactions.push(tx)
            }
        }

        this.saveOfflineTransactions(remainingTransactions)

        if (successCount > 0) {
            console.log(`Successfully synced ${successCount} transactions.`)
            // Trigger update events to refresh UI
            window.dispatchEvent(new CustomEvent("salesUpdated"))
            window.dispatchEvent(new CustomEvent("expensesUpdated"))
            window.dispatchEvent(new CustomEvent("productionUpdated"))

            // Notify user via toast if possible (we don't have easy hook access here, but we can use window events)
            window.dispatchEvent(new CustomEvent("offlineSyncCompleted", {
                detail: { count: successCount }
            }))
        }
    }
}

export const offlineService = OfflineService.getInstance()

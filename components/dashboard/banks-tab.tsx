"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, CreditCard, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import BankCard from "./bank-card"
import { addBank, getBanks } from "@/lib/supabase-actions"
import { useActionState } from "react"
import type { Bank } from "@/lib/db-types"

// Sample bank data
const COMMON_BANKS = [
  { bank_type: "chase", name: "Chase", logo: "chase" },
  { bank_type: "bofa", name: "Bank of America", logo: "bofa" },
  { bank_type: "wells", name: "Wells Fargo", logo: "wells" },
  { bank_type: "citi", name: "Citibank", logo: "citi" },
  { bank_type: "capital", name: "Capital One", logo: "capital" },
  { bank_type: "discover", name: "Discover", logo: "discover" },
  { bank_type: "amex", name: "American Express", logo: "amex" },
  { bank_type: "other", name: "Other Bank", logo: "other" },
]

export default function BanksTab() {
  const [banks, setBanks] = useState<Bank[]>([])
  const [loading, setLoading] = useState(true)
  const [addBankOpen, setAddBankOpen] = useState(false)
  const [state, formAction] = useActionState(addBank, null)

  // Fetch banks on component mount
  useEffect(() => {
    async function fetchBanks() {
      try {
        const data = await getBanks()
        setBanks(data)
      } catch (error) {
        console.error("Error fetching banks:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBanks()
  }, [])

  // Close dialog and refresh banks when a bank is successfully added
  useEffect(() => {
    if (state?.success) {
      setAddBankOpen(false)
      // Refresh banks
      getBanks().then((data) => setBanks(data))
    }
  }, [state])

  const handleAddBank = (bank: { bank_type: string; name: string; logo: string }) => {
    const formData = new FormData()
    formData.append("bank_type", bank.bank_type) // Changed from "id" to "bank_type"
    formData.append("name", bank.name)
    formData.append("logo", bank.logo)
    formAction(formData)
  }

  // Get list of bank types that user already has
  const userBankTypes = banks.map((bank) => bank.bank_type)

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Your Banks</h2>
        <Dialog open={addBankOpen} onOpenChange={setAddBankOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Bank
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Your Bank</DialogTitle>
            </DialogHeader>
            {state?.error && (
              <div className="bg-destructive/10 border border-destructive/50 text-destructive px-4 py-3 rounded">
                {state.error}
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {COMMON_BANKS.map((bank) => {
                const isAlreadyAdded = userBankTypes.includes(bank.bank_type)
                return (
                  <Button
                    key={bank.bank_type}
                    variant="outline"
                    className="flex flex-col h-24"
                    onClick={() => handleAddBank(bank)}
                    disabled={isAlreadyAdded}
                  >
                    <CreditCard className="h-8 w-8 mb-2 text-primary" />
                    <span className="text-center">
                      {bank.name}
                      {isAlreadyAdded && <div className="text-xs text-muted-foreground">Already added</div>}
                    </span>
                  </Button>
                )
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {banks.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-lg border">
          <CreditCard className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-medium mb-2">No Banks Added Yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Add your first bank to start uploading statements and tracking your expenses.
          </p>
          <Button onClick={() => setAddBankOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Bank
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banks.map((bank) => (
            <BankCard key={bank.id} bank={bank} />
          ))}
        </div>
      )}
    </div>
  )
}

"use client"

import type React from "react"
import { useState, useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Upload, CreditCard, FileText, Loader2, Trash2, Edit3 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { addStatement, getStatements, deleteStatements } from "@/lib/supabase-actions"
import { useActionState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Bank, Statement } from "@/lib/db-types"

interface BankCardProps {
  bank: Bank
  selectMode?: boolean
}

export default function BankCard({ bank, selectMode = false }: BankCardProps) {
  const [statements, setStatements] = useState<Statement[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [statementSelectMode, setStatementSelectMode] = useState(false)
  const [selectedStatements, setSelectedStatements] = useState<Set<string>>(new Set())
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [state, formAction] = useActionState(addStatement, null)
  const supabase = createClientComponentClient()
  const [isPending, startTransition] = useTransition()

  // Fetch statements on component mount
  useEffect(() => {
    async function fetchStatements() {
      try {
        const data = await getStatements(bank.id)
        setStatements(data)
      } catch (error) {
        console.error("Error fetching statements:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStatements()
  }, [bank.id])

  // Close dialog and refresh statements when a statement is successfully added
  useEffect(() => {
    if (state?.success) {
      setUploadOpen(false)
      setUploading(false)
      // Refresh statements
      getStatements(bank.id).then((data) => setStatements(data))
    }
  }, [state, bank.id])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const file = files[0]

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        throw new Error("User not authenticated")
      }

      // Upload file to Supabase Storage
      const fileExt = file.name.split(".").pop()
      const filePath = `${user.id}/${bank.id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from("statements").upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // Add statement to database using startTransition
      startTransition(() => {
        const formData = new FormData()
        formData.append("bank_id", bank.id)
        formData.append("name", file.name)
        formData.append("file_path", filePath)
        formAction(formData)
      })
    } catch (error) {
      console.error("Error uploading file:", error)
      setUploading(false)
    }
  }

  const handleSelectStatement = (statementId: string, checked: boolean) => {
    const newSelected = new Set(selectedStatements)
    if (checked) {
      newSelected.add(statementId)
    } else {
      newSelected.delete(statementId)
    }
    setSelectedStatements(newSelected)
  }

  const handleSelectAllStatements = (checked: boolean) => {
    if (checked) {
      setSelectedStatements(new Set(statements.map((statement) => statement.id)))
    } else {
      setSelectedStatements(new Set())
    }
  }

  const handleDeleteSelectedStatements = async () => {
    if (selectedStatements.size === 0) return

    setDeleting(true)
    try {
      const result = await deleteStatements(Array.from(selectedStatements))
      if (result?.error) {
        console.error("Error deleting statements:", result.error)
        alert(`Error deleting statements: ${result.error}`)
      } else {
        // Refresh statements
        const data = await getStatements(bank.id)
        setStatements(data)
        setSelectedStatements(new Set())
        setStatementSelectMode(false)
      }
    } catch (error) {
      console.error("Error deleting statements:", error)
      alert("An unexpected error occurred while deleting statements")
    } finally {
      setDeleting(false)
      setDeleteConfirmOpen(false)
    }
  }

  const exitStatementSelectMode = () => {
    setStatementSelectMode(false)
    setSelectedStatements(new Set())
  }

  return (
    <Card className={selectMode ? "opacity-75" : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center">
          <CreditCard className="h-5 w-5 mr-2 text-primary" />
          {bank.name}
        </CardTitle>
        {!selectMode && (
          <div className="flex items-center gap-1">
            {statements.length > 0 && !statementSelectMode && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setStatementSelectMode(true)}
              >
                <Edit3 className="h-4 w-4" />
                <span className="sr-only">Select Statements</span>
              </Button>
            )}
            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" disabled={isPending}>
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Add Statement</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Bank Statement</DialogTitle>
                </DialogHeader>
                {state?.error && (
                  <div className="bg-destructive/10 border border-destructive/50 text-destructive px-4 py-3 rounded mb-4">
                    {state.error}
                  </div>
                )}
                <div className="space-y-4 py-4">
                  <div className="border-2 border-dashed border-muted rounded-lg p-10 text-center">
                    {uploading || isPending ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                        <p className="text-sm text-muted-foreground">
                          {uploading ? "Uploading your statement..." : "Processing..."}
                        </p>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Drag and drop your PDF statement or click to browse
                        </p>
                        <p className="text-xs text-muted-foreground mb-4">Supports PDF files up to 10MB</p>
                        <label htmlFor={`file-upload-${bank.id}`}>
                          <input
                            id={`file-upload-${bank.id}`}
                            name="file-upload"
                            type="file"
                            accept=".pdf"
                            className="sr-only"
                            onChange={handleFileUpload}
                            disabled={uploading || isPending}
                          />
                          <Button
                            onClick={() => document.getElementById(`file-upload-${bank.id}`)?.click()}
                            disabled={uploading || isPending}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Browse Files
                          </Button>
                        </label>
                      </>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8 border-t border-border">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : statements.length === 0 ? (
          <div className="text-center py-8 border-t border-border">
            <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">No statements uploaded yet</p>
            {!selectMode && (
              <Button variant="outline" size="sm" onClick={() => setUploadOpen(true)} disabled={isPending}>
                <Upload className="h-3 w-3 mr-2" />
                Upload Statement
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2 pt-2 border-t border-border">
            {statementSelectMode && (
              <div className="flex items-center justify-between mb-3 p-2 bg-muted rounded">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedStatements.size === statements.length}
                    onCheckedChange={handleSelectAllStatements}
                  />
                  <span className="text-sm">
                    {selectedStatements.size === 0 ? "Select statements" : `${selectedStatements.size} selected`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={exitStatementSelectMode} disabled={deleting}>
                    Cancel
                  </Button>
                  {selectedStatements.size > 0 && (
                    <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={deleting}>
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Statements</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {selectedStatements.size} statement
                            {selectedStatements.size > 1 ? "s" : ""}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteSelectedStatements}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {deleting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              "Delete"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            )}
            {statements.map((statement) => (
              <div key={statement.id} className="flex items-center justify-between p-2 hover:bg-muted rounded-md">
                <div className="flex items-center">
                  {statementSelectMode && (
                    <Checkbox
                      checked={selectedStatements.has(statement.id)}
                      onCheckedChange={(checked) => handleSelectStatement(statement.id, checked as boolean)}
                      className="mr-2"
                    />
                  )}
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm truncate max-w-[150px]">{statement.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(statement.upload_date).toLocaleDateString()}
                </span>
              </div>
            ))}
            {!selectMode && !statementSelectMode && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => setUploadOpen(true)}
                disabled={isPending}
              >
                <Plus className="h-3 w-3 mr-2" />
                Add Another Statement
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

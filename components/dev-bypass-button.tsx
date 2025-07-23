"use client"

import { Button } from "@/components/ui/button"
import { devBypass } from "@/lib/actions"
import { Bug } from "lucide-react"

interface DevBypassButtonProps {
  className?: string
}

export default function DevBypassButton({ className }: DevBypassButtonProps) {
  const allowedEnvs = ["development", "test"]
  const currentEnv = process.env.NODE_ENV || "development"

  if (!allowedEnvs.includes(currentEnv)) {
    return null
  }

  return (
    <form action={devBypass}>
      <Button
        type="submit"
        variant="outline"
        className={`border-amber-700 bg-amber-950 text-amber-500 hover:bg-amber-900/50 hover:text-amber-400 ${className}`}
      >
        <Bug className="mr-2 h-4 w-4" />
        Dev Bypass
      </Button>
    </form>
  )
}

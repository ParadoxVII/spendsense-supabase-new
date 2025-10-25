"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { LogOut, BarChart3 } from "lucide-react"
import { signOut } from "@/lib/actions"
import DashboardTab from "./dashboard-tab"
import { ThemeToggle } from "@/components/theme-toggle"
import BanksTab from "./bank-tabs"
import OcrTab from "./Ocr-tab"

interface DashboardTabsProps {
  userEmail: string
}

export default function DashboardTabs({ userEmail }: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState("banks")

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">SpendSense</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{userEmail}</span>
            <ThemeToggle />
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-6">
        <Tabs defaultValue="banks" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-8">
            <TabsTrigger value="banks">Banks</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="ocr">OCR</TabsTrigger>
          </TabsList>
          <TabsContent value="banks" className="space-y-4">
            <BanksTab />
          </TabsContent>
          <TabsContent value="dashboard">
            <DashboardTab />
          </TabsContent>
          <TabsContent value="ocr">
            <OcrTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

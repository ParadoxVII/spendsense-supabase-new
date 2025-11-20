import type React from "react"
import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const geist = Geist({
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "SpendSense - Financial Insights",
  description: "Track and analyze your spending across multiple accounts and currencies",
  generator: 'v0.dev',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={geist.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="min-h-screen bg-[#efefef] dark:bg-[#161616] text-black dark:text-white">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}

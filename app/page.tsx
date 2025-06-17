import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronRight, CreditCard, BarChart3, Globe, Upload } from "lucide-react"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DevBypassButton from "@/components/dev-bypass-button"
import { ThemeToggle } from "@/components/theme-toggle"

export default async function WelcomePage() {
  // If Supabase is configured, check if user is already logged in
  if (isSupabaseConfigured) {
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // If user is logged in, redirect to dashboard
    if (session) {
      redirect("/dashboard")
    }
  }

  return (
    <div className="min-h-screen bg-[#dbdbdb] dark:bg-[#161616] text-black dark:text-white">
      {/* Header */}
      <header className="container mx-auto py-6 px-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-8 w-8 text-[#2b725e]" />
          <span className="text-2xl font-bold">SpendSense</span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/auth/login">
            <Button variant="outline" className="border-gray-700 hover:bg-gray-800">
              Sign In
            </Button>
          </Link>
          <DevBypassButton />
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Take Control of Your <span className="text-[#2b725e]">Finances</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-10">
          Upload your bank statements and get a comprehensive overview of your spending habits across all your accounts.
        </p>
        <Link href="/auth/sign-up">
          <Button className="bg-[#2b725e] hover:bg-[#235e4c] text-white py-6 px-8 text-lg font-medium rounded-lg">
            Get Started <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How SpendSense Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-[#8dc5b5] dark:bg-[#192320] p-8 rounded-lg border border-gray-800">
            <div className="bg-[#2b725e]/20 p-3 rounded-full w-fit mb-4">
              <Upload className="h-6 w-6 text-[#2b725e]" />
            </div>
            <h3 className="text-xl font-bold mb-3">Easy Upload</h3>
            <p className="dark:text-gray-400">
              Simply upload your bank statements and SpendSense will automatically analyze your transactions.
            </p>
          </div>
          <div className="bg-[#8dc5b5] dark:bg-[#192320] p-8 rounded-lg border border-gray-800">
            <div className="bg-[#2b725e]/20 p-3 rounded-full w-fit mb-4">
              <CreditCard className="h-6 w-6 text-[#2b725e]" />
            </div>
            <h3 className="text-xl font-bold mb-3">Multiple Accounts</h3>
            <p className="dark:text-gray-400">
              Connect all your bank accounts and credit cards to get a complete picture of your finances.
            </p>
          </div>
          <div className="bg-[#8dc5b5] dark:bg-[#192320] p-8 rounded-lg border border-gray-800">
            <div className="bg-[#2b725e]/20 p-3 rounded-full w-fit mb-4">
              <Globe className="h-6 w-6 text-[#2b725e]" />
            </div>
            <h3 className="text-xl font-bold mb-3">Multi-Currency Support</h3>
            <p className="dark:text-gray-400">
              Track spending across different currencies and get everything converted to your preferred currency.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className=" p-12 rounded-2xl border bg-[#8dc5b5] dark:bg-[#192320] border-gray-800 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to understand your spending habits?</h2>
          <p className="text-xl dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Join thousands of users who have gained control over their finances with SpendSense.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/auth/sign-up">
              <Button className="bg-[#2b725e] hover:bg-[#235e4c] text-white py-6 px-8 text-lg font-medium rounded-lg w-full sm:w-auto">
                Sign Up Now
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button
                variant="outline"
                className="border-gray-700 hover:bg-gray-800 py-6 px-8 text-lg font-medium rounded-lg w-full sm:w-auto"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-gray-800 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <BarChart3 className="h-6 w-6 text-[#2b725e]" />
            <span className="text-xl font-bold">SpendSense</span>
          </div>
          <p className="text-gray-500">© {new Date().getFullYear()} SpendSense. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

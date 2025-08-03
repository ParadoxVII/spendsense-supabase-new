import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ForgotPasswordForm from "@/components/forgot-password-form"


export default async function ForgotPasswordPage() {

    const supabase = await createClient()
    const {
        data: { session },
    } = await supabase.auth.getSession()

    if (session) {
        redirect("/dashboard")
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
            <ForgotPasswordForm />
        </div>
    )
}

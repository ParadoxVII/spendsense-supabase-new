"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import ResetPasswordForm from "./reset-password-form"

export default function ResetPasswordHandler() {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isValidSession, setIsValidSession] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    useEffect(() => {
        const handleTokenExchange = async () => {
            try {
                const token = searchParams.get('token')
                const type = searchParams.get('type')

                if (token && type === 'recovery') {
                    // Exchange the token for a session
                    const { error } = await supabase.auth.verifyOtp({
                        token_hash: token,
                        type: 'recovery',
                    })

                    if (error) {
                        setError('Invalid or expired reset link. Please request a new one.')
                        setLoading(false)
                        return
                    }
                }

                // Check if we have a valid session
                const { data: { session } } = await supabase.auth.getSession()

                if (session) {
                    setIsValidSession(true)
                } else {
                    setError('No valid session found. Please request a new reset link.')
                }

                setLoading(false)
            } catch (err) {
                console.error('Reset password error:', err)
                setError('An error occurred. Please try again.')
                setLoading(false)
            }
        }

        handleTokenExchange()
    }, [searchParams, supabase.auth])

    if (loading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
                <div className="flex items-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Verifying reset link...</span>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
                <div className="w-full max-w-md space-y-8">
                    <div className="space-y-2 text-center">
                        <h1 className="text-4xl font-semibold tracking-tight text-red-600">Reset Link Error</h1>
                        <p className="text-lg text-gray-400">{error}</p>
                    </div>
                    <div className="text-center">
                        <button
                            onClick={() => router.push('/auth/forgot-password')}
                            className="text-[#2b725e] hover:text-[#235e4c] underline"
                        >
                            Request a new reset link
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (isValidSession) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
                <ResetPasswordForm />
            </div>
        )
    }

    return null
}

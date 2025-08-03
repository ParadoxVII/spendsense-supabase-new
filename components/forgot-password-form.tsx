"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { forgotPassword } from "@/lib/actions"

function SubmitButton() {
    const { pending } = useFormStatus()

    return (
        <Button
            type="submit"
            disabled={pending}
            className="w-full bg-[#2b725e] hover:bg-[#235e4c] text-white py-6 text-lg font-medium rounded-lg h-[60px]"
        >
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                </>
            ) : (
                "Send Reset Email"
            )}
        </Button>
    )
}

export default function ForgotPasswordForm() {
    const [state, formAction] = useActionState(forgotPassword, null)

    return (
        <div className="w-full max-w-md space-y-8">
            <div className="space-y-2 text-center">
                <h1 className="text-4xl font-semibold tracking-tight">Forgot Password</h1>
                <p className="text-lg text-gray-400">Enter your email to reset your password</p>
            </div>

            <form action={formAction} className="space-y-6">
                {state?.error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-700 px-4 py-3 rounded">
                        {state.error}
                    </div>
                )}

                {state?.success && (
                    <div className="bg-green-500/10 border border-green-500/50 text-green-700 px-4 py-3 rounded">
                        {state.success}
                    </div>
                )}

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                            Email
                        </label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            required
                            className="bg-[#1c1c1c] border-gray-800 text-white placeholder:text-gray-500"
                        />
                    </div>
                </div>

                <SubmitButton />

                <div className="text-center text-gray-400">
                    Remember your password?{" "}
                    <Link href="/auth/login" className="text-black dark:text-white hover:underline">
                        Sign in
                    </Link>
                </div>
            </form>
        </div>
    )
}

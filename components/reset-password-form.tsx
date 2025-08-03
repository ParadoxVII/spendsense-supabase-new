"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { resetPassword } from "@/lib/actions"
import Link from "next/link"

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
                    Updating...
                </>
            ) : (
                "Update Password"
            )}
        </Button>
    )
}

export default function ResetPasswordForm() {
    const router = useRouter()
    const [state, formAction] = useActionState(resetPassword, null)

    // Handle successful password reset by redirecting
    useEffect(() => {
        if (state?.success) {
            router.push("/dashboard")
        }
    }, [state, router])

    return (
        <div className="w-full max-w-md ">
            <div className="space-y-2 text-center">
                <h1 className="text-4xl font-semibold tracking-tight">Reset Password</h1>
                <p className="text-lg text-gray-400">Enter your new password</p>
            </div>

            <form action={formAction} className="space-y-8">
                {state?.error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-700 px-4 py-3 rounded">
                        {state.error}
                    </div>
                )}

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                            New Password
                        </label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            required
                            minLength={6}
                            className="bg-[#1c1c1c] border-gray-800 text-white"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                            Confirm New Password
                        </label>
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            required
                            minLength={6}
                            className="bg-[#1c1c1c] border-gray-800 text-white"
                        />
                    </div>
                </div>

                <SubmitButton />
            </form>
            <div className="space-y-4 my-6 justify-self-start self-start max-w-md w-full">
                <Link href="/auth/forgot-password" className="text-sm text-gray-400 hover:underline">
                    Having trouble? Send a password reset email again
                </Link>
                <br />
                <Link href="/auth/login" className="text-sm hover:underline">
                    Go back to Login
                </Link>
            </div>
        </div>

    )
}

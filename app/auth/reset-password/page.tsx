import ResetPasswordHandler from "@/components/reset-password-handler"
import { Suspense } from "react"

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordHandler />
        </Suspense>
    )
}

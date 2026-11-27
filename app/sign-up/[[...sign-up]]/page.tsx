import { GhostSignUp } from '@/components/clerk/ghost-auth-forms'
import { AuthLayout } from '@/components/auth/auth-layout'

export default function SignUpPage() {
  return (
    <AuthLayout title="Sign Up">
      <GhostSignUp />
    </AuthLayout>
  )
}

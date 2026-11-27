import { GhostSignIn } from '@/components/clerk/ghost-auth-forms'
import { AuthLayout } from '@/components/auth/auth-layout'

export default function SignInPage() {
  return (
    <AuthLayout title="Sign In">
      <GhostSignIn />
    </AuthLayout>
  )
}

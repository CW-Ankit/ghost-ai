import { SignIn } from '@clerk/nextjs'
import { AuthLayout } from '@/components/auth/auth-layout'

export default function SignInPage() {
  return (
    <AuthLayout
      title="Sign In"
      subtitle="The definitive AI-powered workspace for system architecture and technical design."
    >
      <SignIn />
    </AuthLayout>
  )
}

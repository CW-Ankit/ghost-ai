import { SignUp } from '@clerk/nextjs'
import { AuthLayout } from '@/components/auth/auth-layout'

export default function SignUpPage() {
  return (
    <AuthLayout
      title="Sign Up"
      subtitle="Join the future of system architecture. Start building your AI-driven technical specifications today."
    >
      <SignUp />
    </AuthLayout>
  )
}

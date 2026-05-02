import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen w-full">
      {/* Left Panel: Hidden on small screens */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center px-12 bg-bg-surface border-r border-border-subtle">
        <div className="max-w-md space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter text-text-primary">
              GHOST AI
            </h1>
            <p className="text-lg text-text-secondary">
              AI-powered design system builder.
            </p>
          </div>
          <ul className="space-y-4">
            {[
              'Visual canvas editor',
              'AI-driven specifications',
              'Real-time collaboration',
              'Seamless handoff',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-text-secondary">
                <div className="h-1.5 w-1.5 rounded-full bg-text-primary" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right Panel: Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6">
        <SignUp />
      </div>
    </div>
  )
}

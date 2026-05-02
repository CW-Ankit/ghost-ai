import { SignIn } from '@clerk/nextjs'
import { Logo } from '@/components/ui/logo'
import { CheckCircle2 } from 'lucide-react'
import { AuthBackground } from '@/components/auth/auth-background'

export default function SignInPage() {
  return (
    <div className="relative flex min-h-screen w-full overflow-hidden">
      <AuthBackground />
      
      {/* Left Panel: Branding & Features */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center px-12 z-10">
        <div className="max-w-md space-y-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Logo className="text-accent-primary" size={40} />
              <h1 className="text-4xl font-bold tracking-tighter text-text-primary">
                GHOST AI
              </h1>
            </div>
            <p className="text-xl text-text-secondary leading-relaxed">
              The definitive AI-powered workspace for <span className="text-text-primary font-medium">system architecture</span> and technical design.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {[
              { title: 'Visual Canvas', desc: 'Real-time collaborative mapping' },
              { title: 'AI Generation', desc: 'Natural language to architecture' },
              { title: 'Auto-Specs', desc: 'Instant Markdown technical documentation' },
              { title: 'Seamless Handoff', desc: 'Production-ready system blueprints' },
            ].map((feature) => (
              <div key={feature.title} className="flex items-start gap-3 p-3 rounded-lg bg-bg-surface/40 backdrop-blur-sm border border-border-subtle hover:border-accent-primary/50 transition-colors group">
                <CheckCircle2 className="h-5 w-5 text-accent-primary shrink-0" />
                <div>
                  <div className="text-sm font-medium text-text-primary">{feature.title}</div>
                  <div className="text-xs text-text-muted">{feature.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel: Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 z-10">
        <div className="w-full max-w-md p-8 rounded-2xl bg-bg-surface/60 backdrop-blur-xl border border-border-subtle shadow-2xl ring-1 ring-white/5">
          <SignIn />
        </div>
      </div>
    </div>
  )
}

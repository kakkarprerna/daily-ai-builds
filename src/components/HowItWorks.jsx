import { MessageSquareText, ScanSearch, Compass, ShieldOff } from 'lucide-react'
import ResourceFooter from './ResourceFooter.jsx'

const STEPS = [
  {
    icon: MessageSquareText,
    title: 'You describe a conversation',
    desc: 'Paste an actual exchange or just describe how it went. Nobody else can see this, and it is never saved anywhere.',
  },
  {
    icon: ScanSearch,
    title: 'An AI model reads it for patterns',
    desc: 'It is looking for three things: advice that could cause physical harm, signs of real emotional distress, and dynamics built on manipulation or secrecy.',
  },
  {
    icon: Compass,
    title: 'You get a plain-language read, not a verdict',
    desc: 'A colour, a confidence level, and honest reasoning you can check against your own judgement. It is a second opinion, not a diagnosis.',
  },
]

export default function HowItWorks() {
  return (
    <div>
      <div className="page-kicker">How this works</div>
      <h2 className="page-title">What it checks, and what it does not</h2>
      <p className="page-lede">
        This exists because AI chat tools have, in real and documented cases, given people specific and dangerous
        advice they should never have received. It is a prototype built to explore one small piece of the fix.
      </p>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="steps">
          {STEPS.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.title} className="step">
                <div className="step-icon">
                  <Icon size={18} strokeWidth={2.2} />
                </div>
                <div>
                  <div className="step-title">{s.title}</div>
                  <div className="step-desc">{s.desc}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="notice disclaimer" style={{ marginBottom: 16 }}>
        <ShieldOff size={18} strokeWidth={2.2} />
        <div>
          This is a demo, not a clinical or safety product. It can miss things, misread things, or get the
          confidence wrong. It is not a substitute for a parent, a doctor, a counsellor, or a real conversation
          with someone you trust. Treat the read as a prompt to think again, not the final word.
        </div>
      </div>

      <div className="notice privacy">
        <ShieldOff size={18} strokeWidth={2.2} style={{ visibility: 'hidden' }} />
        <div>
          <strong>On privacy:</strong> nothing you type is stored on a server, tied to an account, or shown to
          anyone else, including a parent or guardian. The free option runs on a shared model with no visitor
          key needed. If you choose Anthropic, OpenAI or Gemini, your own key is used only for that one request
          and is never saved.
        </div>
      </div>

      <ResourceFooter />
    </div>
  )
}

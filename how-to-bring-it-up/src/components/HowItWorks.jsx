import { MessageSquareText, ScanSearch, Compass, ShieldOff } from 'lucide-react'
import ResourceFooter from './ResourceFooter.jsx'
import CommunicationResources from './CommunicationResources.jsx'

const STEPS = [
  {
    icon: MessageSquareText,
    title: 'You describe what you noticed, and their age',
    desc: 'A chat history, something they said, or just a feeling. Age changes what actually works, so it is asked directly. Nobody else sees any of this, and it is never saved.',
  },
  {
    icon: ScanSearch,
    title: 'An AI model reads it for tone, stakes, and category',
    desc: 'How you found out changes the approach. It also checks for physical safety, emotional signals, and trust or boundary concerns, and is willing to say none of them apply.',
  },
  {
    icon: Compass,
    title: 'You get an opener, or you get told to stand down',
    desc: 'A line to start with, matched to their age, what tends to backfire, and a real threshold for when this needs more than a conversation. If nothing here actually needs one, it says so instead of manufacturing a script.',
  },
]

export default function HowItWorks() {
  return (
    <div>
      <div className="page-kicker">How this works</div>
      <h2 className="page-title">What it does, and its limits</h2>
      <p className="page-lede">
        Companion piece to Duty of Care, built the same week, for the same reason. That tool reads a conversation
        a kid already had. This one is for the adult on the other side of that discovery.
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
          This is a demo, not a family therapist. Every kid and every relationship is different, and a generated
          opening line can miss the mark. Use it as a starting point, not a script to follow word for word.
        </div>
      </div>

      <div className="notice privacy">
        <ShieldOff size={18} strokeWidth={2.2} style={{ visibility: 'hidden' }} />
        <div>
          <strong>On privacy:</strong> nothing typed here is stored on a server or tied to an account. The free
          option runs on a shared model with no visitor key needed. Anthropic, OpenAI and Gemini use your own key
          for that one request only, never saved.
        </div>
      </div>

      <CommunicationResources />
      <ResourceFooter />
    </div>
  )
}

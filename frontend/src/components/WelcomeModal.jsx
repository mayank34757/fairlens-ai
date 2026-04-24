import { useState } from 'react'

const STEPS = [
  {
    icon: '🤖',
    title: 'AI makes big decisions about you',
    body: "Computers (AI) decide who gets a loan, who gets hired, who gets treated at a hospital. They do this millions of times a day — automatically, without a human checking.",
    color: '#6366f1',
  },
  {
    icon: '😟',
    title: 'But sometimes AI is unfair',
    body: "Sometimes the AI is biased — like a referee who always favors one team. It might reject your loan just because of your gender, race, or where you live. That's discrimination — and it's wrong.",
    color: '#ef4444',
  },
  {
    icon: '🔍',
    title: 'FairLens AI catches the cheating referee',
    body: "FairLens AI looks at these AI decisions and asks: \"Would the result be different if you were a different race or gender?\" If yes — we flag it as BIASED. We show you exactly WHY it's unfair.",
    color: '#10b981',
  },
  {
    icon: '🎯',
    title: 'How to use it',
    body: (
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          ['1️⃣', 'Pick a domain', 'Loan, Job, Hospital, Housing, or College'],
          ['2️⃣', 'Fill in a person\'s profile', 'Age, income, gender, race etc.'],
          ['3️⃣', 'Click Analyze', 'See if the AI is being fair or biased'],
          ['4️⃣', 'Try Fair Mode', 'Watch bias disappear when protected attributes are removed'],
        ].map(([num, title, desc]) => (
          <li key={title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.1rem' }}>{num}</span>
            <div>
              <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.95rem' }}>{title}</div>
              <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>{desc}</div>
            </div>
          </li>
        ))}
      </ul>
    ),
    color: '#22d3ee',
  },
]

export default function WelcomeModal({ onDemo, onClose }) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div className="welcome-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="welcome-modal">
        {/* Progress dots */}
        <div className="welcome-dots">
          {STEPS.map((_, i) => (
            <button
              key={i}
              className={`welcome-dot ${i === step ? 'active' : ''}`}
              onClick={() => setStep(i)}
              style={{ '--dot-color': STEPS[i].color }}
            />
          ))}
        </div>

        {/* Skip */}
        <button className="welcome-skip" onClick={onClose}>Skip ✕</button>

        {/* Content */}
        <div className="welcome-body">
          <div className="welcome-icon" style={{ background: `${current.color}22`, border: `2px solid ${current.color}55` }}>
            <span>{current.icon}</span>
          </div>

          <div className="welcome-step-label" style={{ color: current.color }}>
            Step {step + 1} of {STEPS.length}
          </div>

          <h2 className="welcome-title">{current.title}</h2>

          <div className="welcome-text">
            {typeof current.body === 'string'
              ? <p>{current.body}</p>
              : current.body
            }
          </div>
        </div>

        {/* Footer */}
        <div className="welcome-footer">
          {step > 0 && (
            <button className="welcome-btn-back" onClick={() => setStep(s => s - 1)}>
              ← Back
            </button>
          )}

          {!isLast ? (
            <button
              className="welcome-btn-next"
              style={{ background: `linear-gradient(135deg, ${current.color}, ${current.color}aa)` }}
              onClick={() => setStep(s => s + 1)}
            >
              Next →
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 10, flex: 1, justifyContent: 'flex-end' }}>
              <button className="welcome-btn-back" onClick={onClose}>
                Explore myself
              </button>
              <button
                className="welcome-btn-demo"
                onClick={onDemo}
              >
                🚀 Run Live Demo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

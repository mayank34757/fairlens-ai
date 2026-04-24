const GENDER_LABEL  = { 0: 'Female', 1: 'Male' }
const EDUCATION_LABEL = ['High School', "Bachelor's", "Master's", 'PhD']
const EMPLOYMENT_LABEL = ['Unemployed', 'Part-Time', 'Full-Time', 'Self-Employed']

function ConfidenceRing({ value, approved }) {
  const radius = 36
  const circ = 2 * Math.PI * radius
  const offset = circ - (value / 100) * circ
  const color = approved ? '#10b981' : '#ef4444'

  return (
    <div className="confidence-ring-wrapper">
      <div className="confidence-ring">
        <svg width="88" height="88" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle
            cx="44" cy="44" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 6px ${color}88)` }}
          />
        </svg>
        <div className="confidence-ring-value">{value}%</div>
      </div>
      <div className="confidence-label">Confidence</div>
    </div>
  )
}

export default function PredictionResult({ prediction, input }) {
  if (!prediction) return null
  const approved = prediction.prediction === 1

  return (
    <div className="card fade-in">
      <div className="card-header">
        <div className={`card-icon ${approved ? 'emerald' : 'red'}`}>{approved ? '✅' : '❌'}</div>
        <div>
          <div className="card-title">Prediction Result</div>
          <div className="card-subtitle">Loan application decision</div>
        </div>
      </div>

      <div className="prediction-row">
        <div>
          <div
            className={`prediction-badge ${approved ? 'approved' : 'rejected'}`}
            style={{ fontSize: '1.4rem', padding: '12px 28px' }}
          >
            {approved ? '✅' : '❌'} {prediction.label}
          </div>
          <div style={{ marginTop: 10, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            AI-generated loan decision
          </div>
        </div>
        <ConfidenceRing value={prediction.confidence} approved={approved} />
      </div>

      <div className="prob-row">
        <div className="prob-cell">
          <div className="prob-cell-label">Approval Probability</div>
          <div className="prob-cell-value green">{prediction.prob_approved}%</div>
        </div>
        <div className="prob-cell">
          <div className="prob-cell-label">Rejection Probability</div>
          <div className="prob-cell-value red">{prediction.prob_rejected}%</div>
        </div>
      </div>

      {input && (
        <div className="input-summary">
          <span className="input-chip">Age: <strong>{input.age}</strong></span>
          <span className="input-chip">Income: <strong>${input.income?.toLocaleString()}</strong></span>
          <span className="input-chip">Credit: <strong>{input.credit_score}</strong></span>
          <span className="input-chip">Gender: <strong>{GENDER_LABEL[input.gender]}</strong></span>
          <span className="input-chip">Education: <strong>{EDUCATION_LABEL[input.education]}</strong></span>
          <span className="input-chip">Employment: <strong>{EMPLOYMENT_LABEL[input.employment]}</strong></span>
        </div>
      )}
    </div>
  )
}

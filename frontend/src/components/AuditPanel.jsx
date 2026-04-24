import { useState } from 'react'
import { api } from '../api'

const DOMAINS = [
  { id: 'loan',       label: 'Loan Approval',    icon: '🏦' },
  { id: 'hiring',     label: 'Job Hiring',        icon: '💼' },
  { id: 'healthcare', label: 'Healthcare',        icon: '🏥' },
  { id: 'housing',    label: 'Housing / Rental',  icon: '🏠' },
  { id: 'college',    label: 'College Admission', icon: '🎓' },
  { id: 'general',    label: 'General / Other',   icon: '🌐' },
]

const PLACEHOLDER = `Paste any AI-generated decision text here...

Examples:
• "Based on your profile, your loan application has been declined due to insufficient credit history."
• "After reviewing your resume, we have decided not to move forward with your candidacy."
• "The AI system has determined that you do not qualify for the recommended treatment plan."`

export default function AuditPanel() {
  const [aiText, setAiText]   = useState('')
  const [domain, setDomain]   = useState('general')
  const [context, setContext] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState(null)

  const handleAudit = async () => {
    if (!aiText.trim()) return
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const { data } = await api.auditAI(aiText, domain, context)
      setResult(data.audit)
    } catch (e) {
      setError(e.response?.data?.detail || 'Audit failed. Check backend.')
    }
    setLoading(false)
  }

  const scoreColor = (s) => s >= 75 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444'
  const biasColor  = (b) => b === true ? '#ef4444' : b === false ? '#10b981' : '#f59e0b'

  return (
    <div className="audit-panel card" id="audit-panel">
      <div className="card-header">
        <div className="card-icon indigo">🔎</div>
        <div>
          <div className="card-title">Audit External AI Output</div>
          <div className="card-subtitle">Paste any AI decision text and detect potential bias</div>
        </div>
      </div>

      {/* Domain selector */}
      <div className="form-group">
        <label className="form-label">Domain Context</label>
        <div className="audit-domain-row">
          {DOMAINS.map(d => (
            <button
              key={d.id}
              id={`audit-domain-${d.id}`}
              className={`audit-domain-btn ${domain === d.id ? 'active' : ''}`}
              onClick={() => setDomain(d.id)}
            >
              {d.icon} {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* AI Text input */}
      <div className="form-group">
        <label className="form-label">AI Output to Audit</label>
        <textarea
          id="audit-ai-text"
          className="audit-textarea"
          placeholder={PLACEHOLDER}
          value={aiText}
          onChange={e => setAiText(e.target.value)}
          rows={6}
        />
        <div className="audit-char-count">{aiText.length} characters</div>
      </div>

      {/* Optional context */}
      <div className="form-group">
        <label className="form-label">Additional Context <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
        <input
          id="audit-context-input"
          className="form-input"
          placeholder="e.g. This is from a hiring platform's automated rejection email"
          value={context}
          onChange={e => setContext(e.target.value)}
        />
      </div>

      <button
        id="audit-submit-btn"
        className="btn btn-primary"
        onClick={handleAudit}
        disabled={loading || !aiText.trim()}
        style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
      >
        {loading ? <><div className="spinner" /> Auditing with AI...</> : '🔎 Audit This Decision'}
      </button>

      {error && (
        <div className="audit-error">{error}</div>
      )}

      {/* Results */}
      {result && (
        <div className="audit-result" id="audit-result">
          {/* Verdict banner */}
          <div className={`audit-verdict ${result.bias_detected ? 'bias' : 'clean'}`}>
            <span className="audit-verdict-icon">
              {result.bias_detected ? '⚠️' : result.bias_detected === false ? '✅' : '❓'}
            </span>
            <div>
              <div className="audit-verdict-title">
                {result.bias_detected ? 'Potential Bias Detected' : result.bias_detected === false ? 'No Bias Detected' : 'Inconclusive'}
              </div>
              <div className="audit-verdict-sub">{result.verdict}</div>
            </div>
            <div className="audit-score-ring" style={{ '--score-color': scoreColor(result.fairness_score) }}>
              <svg width="56" height="56" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
                <circle
                  cx="28" cy="28" r="22" fill="none"
                  stroke={scoreColor(result.fairness_score)}
                  strokeWidth="5"
                  strokeDasharray={`${(result.fairness_score / 100) * 138} 138`}
                  strokeLinecap="round"
                  transform="rotate(-90 28 28)"
                  style={{ filter: `drop-shadow(0 0 6px ${scoreColor(result.fairness_score)})` }}
                />
              </svg>
              <div className="audit-score-value">{result.fairness_score}</div>
              <div className="audit-score-label">Fairness Score</div>
            </div>
          </div>

          {/* Bias Types */}
          {result.bias_types?.length > 0 && (
            <div className="audit-section">
              <div className="audit-section-title">⚡ Bias Types Identified</div>
              <div className="audit-tags">
                {result.bias_types.map(t => (
                  <span key={t} className="audit-tag bias">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Concerns */}
          {result.concerns?.length > 0 && (
            <div className="audit-section">
              <div className="audit-section-title">🔍 Specific Concerns</div>
              <ul className="audit-list red">
                {result.concerns.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations?.length > 0 && (
            <div className="audit-section">
              <div className="audit-section-title">💡 Recommendations</div>
              <ul className="audit-list green">
                {result.recommendations.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}

          <div className="audit-confidence">
            Audit Confidence: <strong style={{ color: result.confidence === 'High' ? '#10b981' : result.confidence === 'Medium' ? '#f59e0b' : '#94a3b8' }}>{result.confidence}</strong>
            {' '}· Powered by Gemini AI
          </div>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { api } from '../api'

const DOMAIN_RECS = {
  loan:       { attr: 'Gender',       icon: '♀♂',  recs: ['Remove gender feature from model', 'Reweight by gender group', 'Audit income proxy for gender correlation', 'Monitor approval rates monthly by gender'] },
  hiring:     { attr: 'Gender & Race', icon: '🌍',  recs: ['Blind resume screening (remove name/gender)', 'Audit skills scoring for proxy bias', 'Reweight training data by demographic group', 'Use structured interviews with rubrics'] },
  healthcare: { attr: 'Race',          icon: '🏥',  recs: ['Remove race feature from treatment model', 'Audit pain-score algorithms for racial bias', 'Collect diverse clinical training data', 'Review insurance-type proxy correlations'] },
  housing:    { attr: 'Race',          icon: '🏠',  recs: ['Remove race from applicant model', 'Audit neighborhood score for redlining proxy', 'Monitor approval rates by racial group', 'Apply Fair Housing Act compliance checks'] },
  college:    { attr: 'Race & Gender', icon: '🎓',  recs: ['Remove race & gender from admissions AI', 'Weight extracurriculars fairly across income levels', 'Blind alumni legacy preferences', 'Audit SAT-score proxy for socioeconomic bias'] },
}

const BASE_RECS = [
  { icon: '⚖️', title: 'Reweight Training Data',     desc: 'Apply sample weights to balance representation across sensitive groups during training.' },
  { icon: '🔄', title: 'Fairness-Aware Algorithm',    desc: 'Use adversarial debiasing or prejudice remover techniques during model training.' },
  { icon: '📊', title: 'Regular Bias Audits',         desc: 'Continuously monitor model predictions for demographic parity violations in production.' },
]

export default function MitigationPanel({ fairMode, onToggleFairMode, domain = 'loan' }) {
  const [mitResult, setMitResult] = useState(null)
  const [loading, setLoading]     = useState(false)

  const domainInfo = DOMAIN_RECS[domain] || DOMAIN_RECS.loan

  const handleApplyFix = async () => {
    setLoading(true)
    try {
      const res = await api.mitigate(domain)
      setMitResult(res.data)
      onToggleFairMode(true)
    } catch (e) {
      console.error(e)
    } finally { setLoading(false) }
  }

  return (
    <div className="card fade-in" style={{ borderColor: fairMode ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.2)' }}>
      <div className="card-header">
        <div className={`card-icon ${fairMode ? 'emerald' : 'amber'}`}>🛡️</div>
        <div>
          <div className="card-title">Bias Mitigation</div>
          <div className="card-subtitle">
            {fairMode
              ? <span style={{ color: 'var(--emerald)', fontWeight: 700 }}>✅ Fair Mode Active — Protected features excluded</span>
              : `Recommendations for ${domainInfo.attr} bias in ${domain}`}
          </div>
        </div>
      </div>

      {/* Domain-specific recommendations */}
      <div className="reco-list">
        <div className="reco-item" style={{ borderColor: 'rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.05)' }}>
          <div className="reco-icon">🚫</div>
          <div className="reco-content">
            <div className="reco-title">Remove: <span style={{ color: 'var(--amber)' }}>{domainInfo.attr}</span> Feature</div>
            <div className="reco-desc">Exclude the protected attribute from the model's input features to prevent direct discrimination.</div>
          </div>
          <span className="tag fair" style={{ flexShrink: 0 }}>Key Fix</span>
        </div>

        {domainInfo.recs.slice(1).map((r, i) => (
          <div key={i} className="reco-item">
            <div className="reco-icon">{BASE_RECS[i % BASE_RECS.length]?.icon || '💡'}</div>
            <div className="reco-content">
              <div className="reco-title">{BASE_RECS[i % BASE_RECS.length]?.title || 'Recommendation'}</div>
              <div className="reco-desc">{r}</div>
            </div>
          </div>
        ))}
      </div>

      {!fairMode ? (
        <button id="apply-fix-btn" className="btn btn-emerald" style={{ width: '100%' }} onClick={handleApplyFix} disabled={loading}>
          {loading ? <><span className="spinner" /> Applying Fix...</> : `🔧 Enable Fair Mode — Remove ${domainInfo.attr}`}
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,0.08)', border: '1.5px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: '#6ee7b7', lineHeight: 1.6 }}>
            ✅ <strong>{domainInfo.attr}</strong> removed from the {domain} model.<br />
            Re-run the analysis to see improved fairness metrics.
          </div>
          <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '8px' }} onClick={() => onToggleFairMode(false)}>
            ↩ Revert to Standard Model
          </button>
        </div>
      )}

      {mitResult && (
        <div className="mitigation-result">
          {mitResult.recommendations?.map((r, i) => <div key={i}>{r}</div>)}
        </div>
      )}

      <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
        💡 <strong style={{ color: 'var(--text-secondary)' }}>Fair Mode</strong> retrains the model without
        protected attributes. Toggle in the header and re-analyze to compare.
      </div>
    </div>
  )
}

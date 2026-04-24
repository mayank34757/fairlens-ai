export default function BiasDetectionPanel({ bias }) {
  if (!bias?.counterfactual) return null

  const { counterfactual: cf, demographic_parity: dp } = bias
  const biasDetected = cf.bias_detected
  const attr = cf.protected_attribute || 'Protected Attribute'

  // Determine icon for original group
  const groupIcon = (label = '') => {
    if (label === 'Female') return '♀'
    if (label === 'Male')   return '♂'
    if (label === 'White')  return '⚪'
    if (label === 'Black')  return '⚫'
    if (label === 'Hispanic') return '🟤'
    if (label === 'Asian')  return '🟡'
    return '👤'
  }

  const outcomeIsPositive = (pred) =>
    ['Approved','Hired','Admitted','Treatment Recommended'].includes(pred)

  return (
    <div className="card fade-in" style={{
      borderColor: biasDetected ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)',
    }}>
      <div className="card-header">
        <div className={`card-icon ${biasDetected ? 'red' : 'emerald'}`}>⚖️</div>
        <div>
          <div className="card-title">Counterfactual Bias Test</div>
          <div className="card-subtitle">What if only the <strong>{attr}</strong> was changed?</div>
        </div>
      </div>

      {/* Banner */}
      <div className={`bias-banner ${biasDetected ? 'detected' : 'clean'}`}>
        <div className={`pulse-dot ${biasDetected ? 'red' : 'green'}`} />
        {biasDetected
          ? `❌ Bias Detected — Outcome changed when ${attr} was flipped!`
          : `✅ No Bias — Same outcome regardless of ${attr}.`}
      </div>

      {/* Before / After comparison */}
      <div className="cf-comparison">
        {/* Original */}
        <div className="cf-card">
          <div className="cf-card-label">Original</div>
          <div className="cf-gender">{groupIcon(cf.original.group)} {cf.original.group}</div>
          <div className={`cf-outcome ${outcomeIsPositive(cf.original.prediction) ? 'approved' : 'rejected'}`}>
            {outcomeIsPositive(cf.original.prediction) ? '✅' : '❌'} {cf.original.prediction}
          </div>
          <div className="cf-conf">{cf.original.prob_approved}% positive prob</div>
        </div>

        {/* Arrow */}
        <div className="cf-arrow">{biasDetected ? '⚡' : '→'}</div>

        {/* Counterfactual */}
        <div className={`cf-card ${biasDetected ? 'changed' : ''}`}>
          <div className="cf-card-label">Counterfactual</div>
          <div className="cf-gender">{groupIcon(cf.counterfactual.group)} {cf.counterfactual.group}</div>
          <div className={`cf-outcome ${outcomeIsPositive(cf.counterfactual.prediction) ? 'approved' : 'rejected'}`}>
            {outcomeIsPositive(cf.counterfactual.prediction) ? '✅' : '❌'} {cf.counterfactual.prediction}
          </div>
          <div className="cf-conf">{cf.counterfactual.prob_approved}% positive prob</div>
        </div>
      </div>

      {/* Explanation */}
      <div className="cf-shift">
        <strong>📊 Confidence Shift:</strong>{' '}
        <span style={{ color: 'var(--amber)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
          {cf.confidence_shift}%
        </span>
        <br />
        {cf.explanation}
      </div>

      {/* DPD quick view — now domain-agnostic */}
      {dp && (
        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div className="bias-rate-item">
            <div className="bias-rate-label">{groupIcon(dp.group_a_label)} {dp.group_a_label}</div>
            <div className="bias-rate-value" style={{ color: 'var(--indigo)' }}>{dp.group_a_rate}%</div>
          </div>
          <div className="bias-rate-item">
            <div className="bias-rate-label">{groupIcon(dp.group_b_label)} {dp.group_b_label}</div>
            <div className="bias-rate-value" style={{ color: '#c084fc' }}>{dp.group_b_rate}%</div>
          </div>
        </div>
      )}
    </div>
  )
}

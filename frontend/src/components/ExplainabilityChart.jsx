export default function ExplainabilityChart({ explanation }) {
  if (!explanation?.feature_impacts?.length) return null

  const items = explanation.feature_impacts
  const maxAbs = Math.max(...items.map(i => Math.abs(i.shap_value)), 0.001)

  return (
    <div className="card fade-in">
      <div className="card-header">
        <div className="card-icon cyan">🔬</div>
        <div>
          <div className="card-title">SHAP Explainability</div>
          <div className="card-subtitle">Feature impact on approval probability</div>
        </div>
      </div>

      <div className="shap-legend">
        <div className="shap-legend-item">
          <div className="shap-legend-dot positive" />
          Increases approval
        </div>
        <div className="shap-legend-item">
          <div className="shap-legend-dot negative" />
          Decreases approval
        </div>
      </div>

      <div className="shap-bar-list">
        {items.map((item, idx) => {
          const pct = Math.min((Math.abs(item.shap_value) / maxAbs) * 100, 100)
          const isPos = item.shap_value >= 0

          return (
            <div key={idx} className="shap-item" style={{ animationDelay: `${idx * 0.06}s` }}>
              <div className="shap-label" title={item.label}>{item.label}</div>
              <div className="shap-bar-track">
                <div
                  className={`shap-bar-fill ${item.impact}`}
                  style={{ width: `${pct}%` }}
                >
                  {pct > 25 ? item.value : ''}
                </div>
              </div>
              <div className={`shap-value ${item.impact}`}>
                {isPos ? '+' : ''}{item.shap_value.toFixed(3)}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{
        marginTop: 16,
        padding: '10px 14px',
        background: 'rgba(34,211,238,0.06)',
        border: '1px solid rgba(34,211,238,0.15)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.75rem',
        color: 'var(--text-secondary)',
        lineHeight: 1.5,
      }}>
        📌 Base approval probability: <strong style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
          {((explanation.base_value || 0.5) * 100).toFixed(1)}%
        </strong> — SHAP values show each feature's contribution above/below this baseline.
      </div>
    </div>
  )
}

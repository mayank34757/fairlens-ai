function MetricCard({ name, valuePct, classification, groupALabel, groupARate, groupBLabel, groupBRate, description }) {
  const color = classification?.color === 'green' ? '#10b981'
    : classification?.color === 'amber' ? '#f59e0b' : '#ef4444'
  const barWidth = Math.min(Math.abs(valuePct || 0), 100)

  return (
    <div className="metric-card">
      <div className="metric-name">{name}</div>
      <div className="metric-value" style={{ color }}>
        {(valuePct >= 0 ? '+' : '')}{valuePct?.toFixed(1)}%
      </div>
      <span className={`metric-pill ${classification?.color}`}>{classification?.level}</span>
      <div className="metric-bar-track">
        <div className="metric-bar-fill" style={{ width: `${barWidth}%`, background: `linear-gradient(90deg, ${color}99, ${color}44)` }} />
      </div>
      {groupARate !== undefined && (
        <div style={{ marginTop: 10, fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          <span style={{ color: 'var(--indigo)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{groupALabel}: {groupARate}%</span>
          {'  '}
          <span style={{ color: '#c084fc', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{groupBLabel}: {groupBRate}%</span>
        </div>
      )}
      {description && (
        <div style={{ marginTop: 6, fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
          {description}
        </div>
      )}
    </div>
  )
}

export default function FairnessMetrics({ bias }) {
  if (!bias?.demographic_parity) return null
  const { demographic_parity: dp, equal_opportunity: eo, protected_attribute } = bias

  return (
    <div className="card fade-in">
      <div className="card-header">
        <div className="card-icon amber">📏</div>
        <div>
          <div className="card-title">Fairness Metrics</div>
          <div className="card-subtitle">
            Computed across 2,000-row dataset · Protected: <strong>{protected_attribute || 'gender'}</strong>
          </div>
        </div>
      </div>

      <div className="metrics-grid">
        <MetricCard
          name="Demographic Parity Difference"
          valuePct={dp.dpd_pct}
          classification={dp.classification}
          groupALabel={dp.group_a_label}
          groupARate={dp.group_a_rate}
          groupBLabel={dp.group_b_label}
          groupBRate={dp.group_b_rate}
          description={`Approval rate gap between ${dp.group_a_label} and ${dp.group_b_label}. Ideally < 5%.`}
        />
        {eo && (
          <MetricCard
            name="Equal Opportunity Difference"
            valuePct={eo.eod_pct}
            classification={eo.classification}
            groupALabel={eo.group_a_label}
            groupARate={eo.group_a_tpr}
            groupBLabel={eo.group_b_label}
            groupBRate={eo.group_b_tpr}
            description={`True positive rate gap between ${eo.group_a_label} and ${eo.group_b_label}. Ideally < 5%.`}
          />
        )}
      </div>

      <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 'var(--radius-sm)', fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        📖 <strong>Fair:</strong> &lt;5% &nbsp;•&nbsp; <strong>Moderate Bias:</strong> 5–15% &nbsp;•&nbsp; <strong>High Bias:</strong> &gt;15%<br />
        Metrics reflect systemic model behavior across the full synthetic dataset.
      </div>
    </div>
  )
}

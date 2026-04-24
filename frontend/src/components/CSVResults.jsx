export default function CSVResults({ data }) {
  if (!data) return null
  const dpd = (data.dpd * 100).toFixed(1)
  const dpdColor = Math.abs(data.dpd) < 0.05 ? 'var(--emerald)' : Math.abs(data.dpd) < 0.15 ? 'var(--amber)' : 'var(--red)'

  return (
    <div className="card fade-in">
      <div className="card-header">
        <div className="card-icon cyan">📊</div>
        <div>
          <div className="card-title">Batch CSV Analysis</div>
          <div className="card-subtitle">{data.total_records} records processed</div>
        </div>
      </div>

      <div className="csv-summary">
        <div className="csv-stat">
          <div className="csv-stat-val" style={{ color: 'var(--emerald)' }}>{data.approved_count}</div>
          <div className="csv-stat-label">Approved</div>
        </div>
        <div className="csv-stat">
          <div className="csv-stat-val" style={{ color: 'var(--red)' }}>{data.rejection_count}</div>
          <div className="csv-stat-label">Rejected</div>
        </div>
        <div className="csv-stat">
          <div className="csv-stat-val" style={{ color: 'var(--cyan)' }}>{data.approval_rate}%</div>
          <div className="csv-stat-label">Approval Rate</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div className="bias-rate-item">
          <div className="bias-rate-label">♂ Male Approval</div>
          <div className="bias-rate-value" style={{ color: 'var(--indigo)' }}>{data.male_approval_rate}%</div>
        </div>
        <div className="bias-rate-item">
          <div className="bias-rate-label">♀ Female Approval</div>
          <div className="bias-rate-value" style={{ color: '#c084fc' }}>{data.female_approval_rate}%</div>
        </div>
        <div className="bias-rate-item">
          <div className="bias-rate-label">DPD Score</div>
          <div className="bias-rate-value" style={{ color: dpdColor }}>
            {parseFloat(dpd) >= 0 ? '+' : ''}{dpd}%
          </div>
        </div>
      </div>

      {/* Sample records preview */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
          <thead>
            <tr>
              {['Age','Income','Credit','Gender','Label'].map(h => (
                <th key={h} style={{
                  padding: '6px 10px', textAlign: 'left',
                  color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.7rem',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  borderBottom: '1px solid var(--border)',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.records?.slice(0, 8).map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <td style={{ padding: '6px 10px', color: 'var(--text-secondary)' }}>{r.age}</td>
                <td style={{ padding: '6px 10px', color: 'var(--text-secondary)' }}>${r.income?.toLocaleString()}</td>
                <td style={{ padding: '6px 10px', color: 'var(--text-secondary)' }}>{r.credit_score}</td>
                <td style={{ padding: '6px 10px', color: r.gender === 1 ? 'var(--indigo)' : '#c084fc' }}>
                  {r.gender === 1 ? '♂ M' : '♀ F'}
                </td>
                <td style={{ padding: '6px 10px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 99,
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    background: r.prediction === 1 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                    color: r.prediction === 1 ? '#34d399' : '#f87171',
                  }}>
                    {r.label}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

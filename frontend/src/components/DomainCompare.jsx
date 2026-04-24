import { useState, useEffect } from 'react'
import { api } from '../api'

const DOMAIN_ORDER = ['loan', 'hiring', 'healthcare', 'housing', 'college']

const colorMap = {
  loan:       '#6366f1',
  hiring:     '#22d3ee',
  healthcare: '#10b981',
  housing:    '#f59e0b',
  college:    '#a855f7',
}

function BiasBar({ value, max = 0.3 }) {
  const pct = Math.min(Math.abs(value) / max * 100, 100)
  const color = Math.abs(value) <= 0.05 ? '#10b981' : Math.abs(value) <= 0.15 ? '#f59e0b' : '#ef4444'
  return (
    <div className="compare-bar-track">
      <div className="compare-bar-fill" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}60` }} />
      <span className="compare-bar-label" style={{ color }}>
        {value >= 0 ? '+' : ''}{(value * 100).toFixed(1)}%
      </span>
    </div>
  )
}

function LevelBadge({ level }) {
  const cls = level === 'Fair' ? 'green' : level === 'Moderate Bias' ? 'amber' : 'red'
  return <span className={`metric-pill ${cls}`}>{level}</span>
}

export default function DomainCompare() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.compareDomains()
      setData(res.data)
      setFetched(true)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  return (
    <div className="card compare-card" id="domain-compare-panel">
      <div className="card-header">
        <div className="card-icon" style={{ background: 'rgba(99,102,241,0.2)' }}>📊</div>
        <div>
          <div className="card-title">Cross-Domain Bias Comparison</div>
          <div className="card-subtitle">See how bias manifests across all 5 AI domains simultaneously</div>
        </div>
        <button
          id="compare-refresh-btn"
          className="btn btn-secondary"
          onClick={load}
          disabled={loading}
          style={{ marginLeft: 'auto', fontSize: '0.78rem', padding: '6px 14px' }}
        >
          {loading ? <><span className="spinner" style={{ width: 13, height: 13 }} /> Loading</> : fetched ? '🔄 Refresh' : '▶ Run Comparison'}
        </button>
      </div>

      {!fetched && !loading && (
        <div className="compare-empty">
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📊</div>
          <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Compare Bias Across All Domains</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: 320, lineHeight: 1.6 }}>
            Click <strong>Run Comparison</strong> to simultaneously audit bias in Loan, Hiring, Healthcare, Housing, and College AI systems.
          </div>
        </div>
      )}

      {loading && (
        <div className="compare-empty">
          <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3, margin: '0 auto 16px' }} />
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Training and analysing all 5 domain models…</div>
        </div>
      )}

      {data && (
        <div className="fade-in">
          {/* Summary row */}
          <div className="compare-summary-row">
            {DOMAIN_ORDER.map(domain => {
              const d = data[domain]
              if (!d || d.error) return null
              const level = d.overall_level
              const color = colorMap[domain]
              return (
                <div key={domain} className="compare-summary-card" style={{ '--card-color': color }}>
                  <div className="compare-domain-icon">{d.meta.icon}</div>
                  <div className="compare-domain-name">{d.meta.label}</div>
                  <LevelBadge level={level} />
                  <div className="compare-dpd-big" style={{ color }}>
                    {d.demographic_parity.dpd >= 0 ? '+' : ''}{(d.demographic_parity.dpd * 100).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>DPD</div>
                </div>
              )
            })}
          </div>

          {/* Detailed table */}
          <div className="compare-table-wrap">
            <table className="compare-table">
              <thead>
                <tr>
                  <th>Domain</th>
                  <th>Protected Attr</th>
                  <th>Group A Rate</th>
                  <th>Group B Rate</th>
                  <th>DPD (Demographic Parity Gap)</th>
                  <th>EOD (Equal Opportunity Gap)</th>
                  <th>Overall Risk</th>
                </tr>
              </thead>
              <tbody>
                {DOMAIN_ORDER.map(domain => {
                  const d = data[domain]
                  if (!d || d.error) return null
                  const dp = d.demographic_parity
                  const eo = d.equal_opportunity
                  const color = colorMap[domain]
                  return (
                    <tr key={domain} className="compare-row">
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '1.1rem' }}>{d.meta.icon}</span>
                          <span style={{ fontWeight: 700, color }}>{d.meta.label}</span>
                        </div>
                      </td>
                      <td>
                        <span className="tag sensitive">{d.meta.protected}</span>
                      </td>
                      <td>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{dp.group_a_label}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', color: '#34d399' }}>{dp.group_a_rate}%</div>
                      </td>
                      <td>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{dp.group_b_label}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', color: '#f87171' }}>{dp.group_b_rate}%</div>
                      </td>
                      <td><BiasBar value={dp.dpd} /></td>
                      <td><BiasBar value={eo.eod} /></td>
                      <td><LevelBadge level={d.overall_level} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="compare-legend">
            <span className="metric-pill green" style={{ marginRight: 4 }}>Fair</span> DPD &lt; 5%
            <span style={{ margin: '0 12px' }} />
            <span className="metric-pill amber" style={{ marginRight: 4 }}>Moderate</span> 5–15%
            <span style={{ margin: '0 12px' }} />
            <span className="metric-pill red" style={{ marginRight: 4 }}>High Bias</span> &gt; 15%
          </div>
        </div>
      )}
    </div>
  )
}

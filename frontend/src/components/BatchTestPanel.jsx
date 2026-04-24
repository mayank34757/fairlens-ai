import { useState } from 'react'
import { api } from '../api'

function HistogramBar({ bucket, count, maxCount }) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0
  return (
    <div className="hist-bar-group">
      <div className="hist-bar-track">
        <div
          className="hist-bar-fill"
          style={{ height: `${pct}%` }}
          title={`${count} cases`}
        />
      </div>
      <div className="hist-bar-label">{bucket.split('-')[0]}</div>
      <div className="hist-bar-count">{count}</div>
    </div>
  )
}

function GroupBar({ label, rate, color }) {
  return (
    <div className="group-bar-row">
      <div className="group-bar-label">{label}</div>
      <div className="group-bar-track">
        <div
          className="group-bar-fill"
          style={{ width: `${rate}%`, background: color }}
        />
        <span className="group-bar-pct">{rate}%</span>
      </div>
    </div>
  )
}

export default function BatchTestPanel({ domain }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [n,       setN]       = useState(200)

  const run = async () => {
    setLoading(true)
    setData(null)
    try {
      const res = await api.batchTest(domain, n)
      setData(res.data)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const maxCount = data ? Math.max(...data.histogram.map(h => h.count), 1) : 1
  const ga = data?.group_stats?.group_a
  const gb = data?.group_stats?.group_b
  const gapPct = ga && gb ? Math.abs(ga.rate - gb.rate).toFixed(1) : null

  return (
    <div className="card batch-card">
      <div className="card-header">
        <div className="card-icon amber">🧪</div>
        <div>
          <div className="card-title">Batch Stress Test</div>
          <div className="card-subtitle">Run N random cases — see approval distribution</div>
        </div>
      </div>

      {/* Controls */}
      <div className="batch-controls">
        <div className="batch-n-group">
          <label className="form-label">Sample Size</label>
          <div className="batch-n-row">
            {[50, 100, 200, 500].map(v => (
              <button
                key={v}
                className={`batch-n-btn ${n === v ? 'active' : ''}`}
                onClick={() => setN(v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <button
          className="btn btn-primary batch-run-btn"
          onClick={run}
          disabled={loading}
        >
          {loading
            ? <><span className="spinner" /> Running...</>
            : <><span>▶</span> Run Stress Test</>
          }
        </button>
      </div>

      {/* Results */}
      {data && (
        <div className="batch-results fade-in">
          {/* Summary stats */}
          <div className="batch-stats-grid">
            <div className="batch-stat">
              <div className="batch-stat-val">{data.n}</div>
              <div className="batch-stat-label">Total Cases</div>
            </div>
            <div className="batch-stat">
              <div className="batch-stat-val" style={{ color: '#34d399' }}>{data.stats.approved}</div>
              <div className="batch-stat-label">Approved</div>
            </div>
            <div className="batch-stat">
              <div className="batch-stat-val">{data.stats.approval_rate}%</div>
              <div className="batch-stat-label">Approval Rate</div>
            </div>
            {gapPct && (
              <div className="batch-stat">
                <div
                  className="batch-stat-val"
                  style={{ color: parseFloat(gapPct) > 15 ? '#f87171' : parseFloat(gapPct) > 8 ? '#fbbf24' : '#34d399' }}
                >
                  {gapPct}%
                </div>
                <div className="batch-stat-label">Group Gap</div>
              </div>
            )}
          </div>

          {/* Group comparison */}
          {ga && gb && (
            <div className="batch-group-section">
              <div className="batch-section-label">
                Approval Rate by Protected Group ({data.protected_attribute})
              </div>
              <GroupBar label={ga.label} rate={ga.rate} color="linear-gradient(90deg,#6366f1,#818cf8)" />
              <GroupBar label={gb.label} rate={gb.rate} color="linear-gradient(90deg,#a855f7,#c084fc)" />
              {parseFloat(gapPct) > 10 && (
                <div className="bias-alert-mini">
                  ⚠️ Gap of {gapPct}% exceeds fair threshold (10%) — potential bias detected
                </div>
              )}
            </div>
          )}

          {/* Histogram */}
          <div className="batch-hist-section">
            <div className="batch-section-label">Prediction Score Distribution</div>
            <div className="hist-chart">
              {data.histogram.map((h, i) => (
                <HistogramBar key={i} bucket={h.bucket} count={h.count} maxCount={maxCount} />
              ))}
            </div>
            <div className="hist-x-label">← Rejection probability → Approval →</div>
          </div>
        </div>
      )}

      {!data && !loading && (
        <div className="batch-empty">
          <div style={{ fontSize: 36, marginBottom: 8 }}>🧪</div>
          <div>Click "Run Stress Test" to simulate {n} random applicants</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Reveals approval rate disparities across demographic groups
          </div>
        </div>
      )}
    </div>
  )
}

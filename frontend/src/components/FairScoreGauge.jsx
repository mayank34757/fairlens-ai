import { useEffect, useRef, useState } from 'react'
import { api } from '../api'

function AnimatedNumber({ target, duration = 1400 }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setVal(target); clearInterval(timer) }
      else setVal(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return <>{val}</>
}

function GaugeArc({ score, color }) {
  const radius = 80
  const stroke = 14
  const circ = 2 * Math.PI * radius
  const half = circ / 2
  const offset = half - (score / 100) * half

  return (
    <svg viewBox="0 0 200 110" className="gauge-svg">
      {/* Track */}
      <path
        d={`M 10,100 A 90,90 0 0,1 190,100`}
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      {/* Glow filter */}
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.7"/>
          <stop offset="100%" stopColor={color}/>
        </linearGradient>
      </defs>
      {/* Progress arc */}
      <path
        d={`M 10,100 A 90,90 0 0,1 190,100`}
        fill="none"
        stroke="url(#gaugeGrad)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${half}`}
        strokeDashoffset={offset}
        filter="url(#glow)"
        style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)' }}
      />
      {/* Tick marks */}
      {[0, 25, 50, 75, 100].map((tick) => {
        const angle = -180 + tick * 1.8
        const rad = (angle * Math.PI) / 180
        const cx = 100 + 90 * Math.cos(rad)
        const cy = 100 + 90 * Math.sin(rad)
        return <circle key={tick} cx={cx} cy={cy} r={2} fill="rgba(255,255,255,0.2)" />
      })}
    </svg>
  )
}

export default function FairScoreGauge({ domain }) {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!domain) return
    setData(null)
    setLoading(true)
    api.fairScore(domain)
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [domain])

  const getLevelEmoji = (level) =>
    ({ Excellent: '🏆', Good: '✅', Moderate: '⚠️', Poor: '🚨' }[level] || '📊')

  return (
    <div className="fairscore-card">
      <div className="fairscore-header">
        <div className="fairscore-icon">🎯</div>
        <div>
          <div className="fairscore-title">FairScore™</div>
          <div className="fairscore-subtitle">Composite AI fairness rating</div>
        </div>
      </div>

      {loading && (
        <div className="fairscore-loading">
          <div className="pulse-ring" />
          <span>Calculating score...</span>
        </div>
      )}

      {data && !loading && (
        <>
          <div className="gauge-wrapper">
            <GaugeArc score={data.score} color={data.color} />
            <div className="gauge-center">
              <div className="gauge-number" style={{ color: data.color }}>
                <AnimatedNumber target={data.score} />
              </div>
              <div className="gauge-label">/100</div>
            </div>
          </div>

          <div className="fairscore-level" style={{ color: data.color }}>
            {getLevelEmoji(data.level)} {data.level}
          </div>

          <div className="fairscore-breakdown">
            {[
              { label: 'DPD Penalty', val: data.breakdown.dpd_penalty, color: '#f87171' },
              { label: 'EOD Penalty', val: data.breakdown.eod_penalty, color: '#fb923c' },
              { label: 'CF Penalty',  val: data.breakdown.cf_penalty,  color: '#facc15' },
            ].map(b => (
              <div key={b.label} className="breakdown-item">
                <div className="breakdown-label">{b.label}</div>
                <div className="breakdown-bar-track">
                  <div
                    className="breakdown-bar-fill"
                    style={{ width: `${Math.min(b.val * 2, 100)}%`, background: b.color }}
                  />
                </div>
                <div className="breakdown-val" style={{ color: b.color }}>-{b.val.toFixed(1)}</div>
              </div>
            ))}
          </div>

          <div className="fairscore-stats">
            <div className="fs-stat">
              <div className="fs-stat-val">{data.dpd?.dpd_pct}%</div>
              <div className="fs-stat-label">DPD Gap</div>
            </div>
            <div className="fs-stat-divider"/>
            <div className="fs-stat">
              <div className="fs-stat-val">{data.eod?.eod_pct}%</div>
              <div className="fs-stat-label">EOD Gap</div>
            </div>
            <div className="fs-stat-divider"/>
            <div className="fs-stat">
              <div className="fs-stat-val">{data.breakdown.cf_bias_rate}%</div>
              <div className="fs-stat-label">CF Bias Rate</div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

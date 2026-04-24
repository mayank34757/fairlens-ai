import { useEffect, useState } from 'react'

const DOMAINS = [
  { id: 'loan',       label: 'Loan Approval',    icon: '🏦', desc: 'Bank lending decisions', color: '#6366f1' },
  { id: 'hiring',     label: 'Job Hiring',        icon: '💼', desc: 'Resume screening & hiring', color: '#22d3ee' },
  { id: 'healthcare', label: 'Healthcare',        icon: '🏥', desc: 'Treatment recommendations', color: '#10b981' },
  { id: 'housing',    label: 'Housing / Rental',  icon: '🏠', desc: 'Mortgage & rental approvals', color: '#f59e0b' },
  { id: 'college',    label: 'College Admission', icon: '🎓', desc: 'University admissions AI', color: '#a855f7' },
]

export default function DomainSelector({ activeDomain, onSelect }) {
  return (
    <div className="domain-selector">
      <div className="domain-selector-label">
        <span className="ds-icon">🌐</span>
        Select AI Domain to Audit
      </div>
      <div className="domain-cards">
        {DOMAINS.map((d) => (
          <button
            key={d.id}
            id={`domain-btn-${d.id}`}
            className={`domain-card ${activeDomain === d.id ? 'active' : ''}`}
            onClick={() => onSelect(d.id)}
            style={{ '--domain-color': d.color }}
          >
            <span className="domain-card-icon">{d.icon}</span>
            <span className="domain-card-label">{d.label}</span>
            <span className="domain-card-desc">{d.desc}</span>
            {activeDomain === d.id && <span className="domain-active-dot" />}
          </button>
        ))}
      </div>
    </div>
  )
}

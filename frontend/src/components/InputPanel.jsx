import { useCallback, useEffect, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { api } from '../api'

// Dynamic default values per domain
const DOMAIN_DEFAULTS = {
  loan:       { age: 35, income: 65000, credit_score: 720, gender: 0, education: 1, employment: 2 },
  hiring:     { age: 28, experience_yrs: 5, skills_score: 72, gender: 0, race: 0, education: 1 },
  healthcare: { age: 45, income: 40000, symptom_severity: 6, race: 0, insurance_type: 1, num_visits: 3 },
  housing:    { income: 55000, credit_score: 680, debt_ratio: 30, race: 0, employment: 2, neighborhood_score: 6 },
  college:    { gpa: 3.5, test_score: 1200, extracurricular: 6, race: 0, gender: 0, income: 60000 },
}

const RACE_LABELS = ['Black', 'White', 'Hispanic', 'Asian']
const GENDER_LABELS = ['Female', 'Male']
const EDUCATION_LABELS = ['High School', "Bachelor's", "Master's", 'PhD']
const EMPLOYMENT_LABELS = ['Unemployed', 'Part-Time', 'Full-Time', 'Self-Employed']
const INSURANCE_LABELS = ['No Insurance', 'Medicaid', 'Private', 'Premium']

function SelectField({ id, label, value, options, onChange, sensitive }) {
  return (
    <div className="form-group">
      <label className="form-label">
        {label} {sensitive && <span className="tag sensitive">Protected</span>}
      </label>
      <select id={id} className="form-select" value={value} onChange={e => onChange(parseInt(e.target.value))}>
        {options.map((o, i) => <option key={i} value={i}>{o}</option>)}
      </select>
    </div>
  )
}

function NumberField({ id, label, value, min, max, step = 1, onChange }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        id={id} type="number" className="form-input"
        value={value} min={min} max={max} step={step}
        onChange={e => onChange(step < 1 ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0)}
      />
    </div>
  )
}

function LoanFields({ form, set }) {
  return (
    <>
      <div className="form-group">
        <label className="form-label">Gender <span className="tag sensitive">Protected</span></label>
        <div className="gender-toggle">
          <button className={`gender-btn ${form.gender === 0 ? 'active-female' : ''}`} onClick={() => set('gender', 0)}>♀ Female</button>
          <button className={`gender-btn ${form.gender === 1 ? 'active-male' : ''}`} onClick={() => set('gender', 1)}>♂ Male</button>
        </div>
      </div>
      <div className="form-row">
        <NumberField id="input-age" label="Age" value={form.age} min={18} max={75} onChange={v => set('age', v)} />
        <NumberField id="input-credit" label="Credit Score" value={form.credit_score} min={300} max={850} onChange={v => set('credit_score', v)} />
      </div>
      <NumberField id="input-income" label="Annual Income ($)" value={form.income} min={0} max={300000} onChange={v => set('income', v)} />
      <div className="form-row">
        <SelectField id="input-education" label="Education" value={form.education} options={EDUCATION_LABELS} onChange={v => set('education', v)} />
        <SelectField id="input-employment" label="Employment" value={form.employment} options={EMPLOYMENT_LABELS} onChange={v => set('employment', v)} />
      </div>
    </>
  )
}

function HiringFields({ form, set }) {
  return (
    <>
      <div className="form-row">
        <SelectField id="input-gender" label="Gender" value={form.gender} options={GENDER_LABELS} onChange={v => set('gender', v)} sensitive />
        <SelectField id="input-race" label="Race / Ethnicity" value={form.race} options={RACE_LABELS} onChange={v => set('race', v)} sensitive />
      </div>
      <div className="form-row">
        <NumberField id="input-age" label="Age" value={form.age} min={18} max={60} onChange={v => set('age', v)} />
        <NumberField id="input-exp" label="Years Experience" value={form.experience_yrs} min={0} max={35} onChange={v => set('experience_yrs', v)} />
      </div>
      <NumberField id="input-skills" label="Skills Assessment Score (0–100)" value={form.skills_score} min={0} max={100} onChange={v => set('skills_score', v)} />
      <SelectField id="input-education" label="Education" value={form.education} options={EDUCATION_LABELS} onChange={v => set('education', v)} />
    </>
  )
}

function HealthcareFields({ form, set }) {
  return (
    <>
      <SelectField id="input-race" label="Race / Ethnicity" value={form.race} options={RACE_LABELS} onChange={v => set('race', v)} sensitive />
      <div className="form-row">
        <NumberField id="input-age" label="Patient Age" value={form.age} min={1} max={95} onChange={v => set('age', v)} />
        <NumberField id="input-severity" label="Symptom Severity (1–10)" value={form.symptom_severity} min={1} max={10} onChange={v => set('symptom_severity', v)} />
      </div>
      <NumberField id="input-income" label="Annual Income ($)" value={form.income} min={0} max={300000} onChange={v => set('income', v)} />
      <div className="form-row">
        <SelectField id="input-insurance" label="Insurance Type" value={form.insurance_type} options={INSURANCE_LABELS} onChange={v => set('insurance_type', v)} />
        <NumberField id="input-visits" label="Prior Hospital Visits" value={form.num_visits} min={0} max={50} onChange={v => set('num_visits', v)} />
      </div>
    </>
  )
}

function HousingFields({ form, set }) {
  return (
    <>
      <SelectField id="input-race" label="Race / Ethnicity" value={form.race} options={RACE_LABELS} onChange={v => set('race', v)} sensitive />
      <div className="form-row">
        <NumberField id="input-income" label="Annual Income ($)" value={form.income} min={10000} max={300000} onChange={v => set('income', v)} />
        <NumberField id="input-credit" label="Credit Score" value={form.credit_score} min={300} max={850} onChange={v => set('credit_score', v)} />
      </div>
      <div className="form-row">
        <NumberField id="input-debt" label="Debt-to-Income (%)" value={form.debt_ratio} min={0} max={100} onChange={v => set('debt_ratio', v)} />
        <NumberField id="input-neighborhood" label="Neighborhood Score (1–10)" value={form.neighborhood_score} min={1} max={10} onChange={v => set('neighborhood_score', v)} />
      </div>
      <SelectField id="input-employment" label="Employment Status" value={form.employment} options={EMPLOYMENT_LABELS} onChange={v => set('employment', v)} />
    </>
  )
}

function CollegeFields({ form, set }) {
  return (
    <>
      <div className="form-row">
        <SelectField id="input-race" label="Race / Ethnicity" value={form.race} options={RACE_LABELS} onChange={v => set('race', v)} sensitive />
        <SelectField id="input-gender" label="Gender" value={form.gender} options={GENDER_LABELS} onChange={v => set('gender', v)} sensitive />
      </div>
      <div className="form-row">
        <NumberField id="input-gpa" label="GPA (0.0–4.0)" value={form.gpa} min={0} max={4} step={0.1} onChange={v => set('gpa', v)} />
        <NumberField id="input-test" label="SAT Score (400–1600)" value={form.test_score} min={400} max={1600} onChange={v => set('test_score', v)} />
      </div>
      <div className="form-row">
        <NumberField id="input-extra" label="Extracurricular (1–10)" value={form.extracurricular} min={1} max={10} onChange={v => set('extracurricular', v)} />
        <NumberField id="input-income" label="Family Income ($)" value={form.income} min={0} max={500000} onChange={v => set('income', v)} />
      </div>
    </>
  )
}

const FIELD_COMPONENTS = { loan: LoanFields, hiring: HiringFields, healthcare: HealthcareFields, housing: HousingFields, college: CollegeFields }

export default function InputPanel({ domain = 'loan', onResult, onCSVResult, loading, setLoading, fairMode }) {
  const [form, setForm] = useState(DOMAIN_DEFAULTS[domain] || DOMAIN_DEFAULTS.loan)
  const [tab, setTab] = useState('manual')
  const [csvFile, setCsvFile] = useState(null)

  // Reset form when domain changes
  useEffect(() => {
    setForm(DOMAIN_DEFAULTS[domain] || DOMAIN_DEFAULTS.loan)
  }, [domain])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const onDrop = useCallback(files => { if (files[0]) setCsvFile(files[0]) }, [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'text/csv': ['.csv'] }, multiple: false,
  })

  const handleAnalyze = async () => {
    setLoading(true)
    try {
      const res = await api.predict(domain, form, fairMode)
      onResult(res.data)
    } catch (e) {
      alert('Backend error: ' + (e?.response?.data?.detail || e.message))
    } finally { setLoading(false) }
  }

  const handleCSV = async () => {
    if (!csvFile) return
    setLoading(true)
    try {
      const res = await api.uploadCSV(csvFile, domain)
      onCSVResult(res.data)
    } catch (e) {
      alert('CSV error: ' + (e?.response?.data?.detail || e.message))
    } finally { setLoading(false) }
  }

  const loadSample = async () => {
    try {
      const res = await api.sampleData(domain)
      setForm(res.data.samples[0])
    } catch (e) { console.error(e) }
  }

  const DomainFields = FIELD_COMPONENTS[domain] || LoanFields

  const domainTitles = {
    loan: 'Applicant Data', hiring: 'Candidate Profile', healthcare: 'Patient Information',
    housing: 'Rental / Mortgage Application', college: 'Student Application',
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-icon indigo">🧾</div>
        <div>
          <div className="card-title">{domainTitles[domain] || 'Input Data'}</div>
          <div className="card-subtitle">Enter details manually or upload a CSV batch</div>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['manual', 'csv'].map(t => (
          <button
            key={t}
            className="btn btn-secondary"
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '8px', fontSize: '0.8rem',
              borderColor: tab === t ? 'var(--indigo)' : undefined,
              color: tab === t ? 'var(--indigo)' : undefined,
              background: tab === t ? 'rgba(99,102,241,0.1)' : undefined,
            }}
          >
            {t === 'manual' ? '✏️ Manual Input' : '📂 Upload CSV'}
          </button>
        ))}
      </div>

      {tab === 'manual' ? (
        <>
          <DomainFields form={form} set={set} />

          {fairMode && (
            <div className="fair-mode-notice">
              <span>🛡️</span> <strong>Fair Mode</strong> — Protected attributes will be excluded from the model's decision.
            </div>
          )}

          <button
            className="btn"
            onClick={loadSample}
            style={{ width: '100%', marginBottom: 8, padding: '8px', fontSize: '0.78rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)' }}
          >
            🎲 Load Sample Case
          </button>

          <button
            id="analyze-btn"
            className="btn btn-primary"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? <><span className="spinner" /> Analyzing...</> : '🔍 Analyze Decision'}
          </button>
        </>
      ) : (
        <>
          <div {...getRootProps({ className: `drop-zone ${isDragActive ? 'active' : ''}` })}>
            <input {...getInputProps()} />
            <div className="drop-zone-icon">📂</div>
            <div className="drop-zone-text">
              {csvFile
                ? <><strong>{csvFile.name}</strong><br />{(csvFile.size / 1024).toFixed(1)} KB</>
                : isDragActive
                  ? <><strong>Drop it!</strong></>
                  : <><strong>Drag & drop</strong> a CSV or click to browse<br />Columns must match the <strong>{domain}</strong> domain features</>
              }
            </div>
          </div>
          {csvFile && (
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={handleCSV} disabled={loading}>
              {loading ? <><span className="spinner" /> Processing...</> : '📊 Analyze CSV Batch'}
            </button>
          )}
          <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.5 }}>
            💡 Download <a href={`http://localhost:8000/sample-data/${domain}`} target="_blank" rel="noreferrer" style={{ color: 'var(--indigo)' }}>sample data</a> to see the expected columns for the <strong>{domain}</strong> domain.
          </p>
        </>
      )}
    </div>
  )
}

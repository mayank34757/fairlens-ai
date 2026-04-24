import { useState } from 'react'
import { Toaster, toast } from 'react-hot-toast'

import DomainSelector      from './components/DomainSelector'
import InputPanel          from './components/InputPanel'
import PredictionResult    from './components/PredictionResult'
import ExplainabilityChart from './components/ExplainabilityChart'
import BiasDetectionPanel  from './components/BiasDetectionPanel'
import FairnessMetrics     from './components/FairnessMetrics'
import MitigationPanel     from './components/MitigationPanel'
import CSVResults          from './components/CSVResults'
import ChatbotPanel        from './components/ChatbotPanel'
import AuditPanel          from './components/AuditPanel'
import DomainCompare       from './components/DomainCompare'
import FairScoreGauge      from './components/FairScoreGauge'
import BatchTestPanel      from './components/BatchTestPanel'
import WelcomeModal        from './components/WelcomeModal'
import { api }             from './api'

const TABS = [
  { id: 'analyze', label: '🔍 Analyze',        desc: 'Single prediction & bias check' },
  { id: 'batch',   label: '🧪 Stress Test',    desc: 'Run hundreds of test cases' },
  { id: 'compare', label: '📊 Compare Domains', desc: 'Side-by-side multi-domain audit' },
  { id: 'audit',   label: '🔎 Audit AI Output', desc: 'Paste any AI text for bias audit' },
]

const TOASTSTYLE = (color) => ({
  duration: 4000,
  style: {
    background: '#1a1a2e',
    color,
    border: `1px solid ${color}60`,
    borderRadius: 10,
    fontWeight: 600,
  },
})

export default function App() {
  const [activeDomain, setActiveDomain] = useState('loan')
  const [activeTab,    setActiveTab]    = useState('analyze')
  const [result,       setResult]       = useState(null)
  const [csvData,      setCsvData]      = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [fairMode,     setFairMode]     = useState(false)
  const [showWelcome,  setShowWelcome]  = useState(true)
  const [demoMode,     setDemoMode]     = useState(false)

  const handleResult = (data) => {
    setResult(data)
    setCsvData(null)
    const biasDetected = data?.bias?.counterfactual?.bias_detected
    if (biasDetected) {
      toast.error('⚠️ Bias Detected! Changing the protected attribute changed the outcome.', TOASTSTYLE('#f87171'))
    } else if (data?.prediction) {
      toast.success('✅ Analysis complete — No bias detected.', TOASTSTYLE('#34d399'))
    }
  }

  const handleCSVResult = (data) => {
    setCsvData(data)
    setResult(null)
    toast.success(`📊 ${data.total_records} records analyzed.`, TOASTSTYLE('#22d3ee'))
  }

  const toggleFairMode = (val) => {
    setFairMode(val)
    if (val) toast.success('🛡️ Fair Mode active — Protected attributes removed from model.', TOASTSTYLE('#34d399'))
    else toast('📊 Standard Mode — Full model including protected attributes.', {
      duration: 2500,
      style: { background: '#1a1a2e', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' },
    })
  }

  const handleDomainSwitch = (domain) => {
    setActiveDomain(domain)
    setResult(null)
    setCsvData(null)
  }

  // ── Demo: auto-run a biased loan example ──
  const handleDemo = async () => {
    setShowWelcome(false)
    setActiveTab('analyze')
    setActiveDomain('loan')
    setFairMode(false)
    setDemoMode(true)
    setLoading(true)
    try {
      // Female, Black, decent credentials — classic bias demo case
      const demoInputs = {
        gender: 0, age: 35, credit_score: 720,
        income: 45000, education: 1, employment: 2,
      }
      const res = await api.predict('loan', demoInputs, false)
      handleResult(res.data)
      toast('🎬 Demo running! Check the bias results on the right →', {
        duration: 5000,
        style: { background: '#1a1a2e', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 10, fontWeight: 600 },
      })
    } catch (e) {
      toast.error('Demo failed — is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  const domainIcons = { loan: '🏦', hiring: '💼', healthcare: '🏥', housing: '🏠', college: '🎓' }

  return (
    <div className="app-wrapper">
      <Toaster position="top-right" />

      {/* ── Welcome Modal ── */}
      {showWelcome && (
        <WelcomeModal
          onDemo={handleDemo}
          onClose={() => setShowWelcome(false)}
        />
      )}

      {/* ── Animated background orbs ── */}
      <div className="bg-orbs" aria-hidden="true">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* ───── Header ───── */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-icon">⚖️</div>
            <span className="logo-text">FairLens AI</span>
            <span className="logo-badge">v3.0</span>
          </div>

          <nav className="header-tabs">
            {TABS.map(t => (
              <button
                key={t.id}
                id={`tab-${t.id}`}
                className={`header-tab ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)}
                title={t.desc}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <div className="header-mode-toggle">
            <span className="mode-label">Standard</span>
            <label className="toggle-switch" title="Toggle Fair Mode">
              <input type="checkbox" checked={fairMode} onChange={e => toggleFairMode(e.target.checked)} />
              <div className="toggle-track"><div className="toggle-thumb" /></div>
            </label>
            <span className="toggle-text" style={{ color: fairMode ? 'var(--emerald)' : 'var(--text-secondary)' }}>
              {fairMode ? '🛡️ Fair' : 'Fair Mode'}
            </span>
          </div>
        </div>
      </header>

      {/* ───── Hero ───── */}
      <section className="hero" style={{ padding: '28px 24px 20px' }}>
        <div className="hero-eyebrow"><span>🔬</span> Multi-Domain AI Bias Detection &amp; Mitigation</div>
        <h1>Make AI <span>Fair, Transparent</span><br />&amp; Accountable</h1>
        <p className="hero-subtitle">
          Detect discrimination across 5 domains using counterfactual testing, SHAP explainability,
          and real-time AI bias analysis powered by Gemini 2.0 Flash.
        </p>
        {!showWelcome && (
          <button
            onClick={() => setShowWelcome(true)}
            style={{
              marginTop: 14, padding: '8px 20px',
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.35)',
              borderRadius: 99, color: '#a5b4fc',
              fontSize: '0.85rem', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--font-sans)',
              transition: 'all 0.25s ease',
            }}
          >
            📖 How it works
          </button>
        )}
      </section>

      {/* ── Demo banner ── */}
      {demoMode && result && (
        <div className="demo-banner">
          <span>🎬</span>
          <span><strong>Demo Mode:</strong> This shows a Female applicant with decent credentials (Credit: 720, Income: $45k) — watch how the AI treats her vs. a Male applicant.</span>
          <button className="demo-banner-dismiss" onClick={() => setDemoMode(false)}>✕</button>
        </div>
      )}

      {/* ───── ANALYZE TAB ───── */}
      {activeTab === 'analyze' && (
        <>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 24px' }}>
            <DomainSelector activeDomain={activeDomain} onSelect={handleDomainSwitch} />
          </div>

          {fairMode && (
            <div style={{ maxWidth: 1280, margin: '0 auto 16px', padding: '0 24px' }}>
              <div className="fair-mode-banner">
                <span>🛡️</span>
                <strong>Fair Mode Active</strong> — Model trained without protected attributes.
                Re-run the analysis to compare results.
              </div>
            </div>
          )}

          <main className="main-grid">
            {/* Left: Input + FairScore */}
            <aside>
              <InputPanel
                domain={activeDomain}
                onResult={handleResult}
                onCSVResult={handleCSVResult}
                loading={loading}
                setLoading={setLoading}
                fairMode={fairMode}
              />
              <div style={{ marginTop: 20 }}>
                <FairScoreGauge domain={activeDomain} />
              </div>
            </aside>

            {/* Right: Results */}
            <div className="results-column">
              {!result && !csvData && (
                <div className="empty-state">
                  <div className="empty-state-icon">{domainIcons[activeDomain] || '🔍'}</div>
                  <div className="empty-state-title">Awaiting Analysis</div>
                  <div className="empty-state-subtitle">
                    Fill in the form on the left and click <strong>"Analyze Decision"</strong> to see
                    predictions, SHAP explanations, and bias detection results.
                  </div>
                </div>
              )}

              {result && (
                <div className="fade-in">
                  <div className="result-domain-tag">
                    <span>{domainIcons[result.domain]}</span>
                    <span>{result.domain_meta?.label}</span>
                    <span className={`tag ${result.model_mode === 'fair' ? 'fair' : 'mode'}`}>
                      {result.model_mode === 'fair' ? '🛡️ Fair Model' : 'Standard Model'}
                    </span>
                  </div>

                  <PredictionResult prediction={result.prediction} input={result.input} />
                  <ExplainabilityChart explanation={result.explanation} />
                  {result.bias?.counterfactual && <BiasDetectionPanel bias={result.bias} />}
                  {result.bias?.demographic_parity && <FairnessMetrics bias={result.bias} />}
                  <MitigationPanel fairMode={fairMode} onToggleFairMode={toggleFairMode} domain={activeDomain} />
                </div>
              )}

              {csvData && (
                <div className="fade-in">
                  <CSVResults data={csvData} />
                  <MitigationPanel fairMode={fairMode} onToggleFairMode={toggleFairMode} domain={activeDomain} />
                </div>
              )}
            </div>
          </main>
        </>
      )}

      {/* ───── BATCH STRESS TEST TAB ───── */}
      {activeTab === 'batch' && (
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 60px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto 24px', padding: '0 24px' }}>
            <DomainSelector activeDomain={activeDomain} onSelect={handleDomainSwitch} />
          </div>
          <div className="batch-tab-grid">
            <BatchTestPanel domain={activeDomain} />
            <FairScoreGauge domain={activeDomain} />
          </div>
        </div>
      )}

      {/* ───── COMPARE TAB ───── */}
      {activeTab === 'compare' && (
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 60px' }}>
          <DomainCompare />
        </div>
      )}

      {/* ───── AUDIT TAB ───── */}
      {activeTab === 'audit' && (
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px 60px' }}>
          <AuditPanel />
        </div>
      )}

      {/* ───── Floating FairMind AI Chatbot ───── */}
      <ChatbotPanel lastResult={result} />

      {/* ───── Footer ───── */}
      <footer className="footer">
        FairLens AI v3.0 &nbsp;·&nbsp; Hackathon 2026 &nbsp;·&nbsp;
        Stack: React · FastAPI · scikit-learn · SHAP · <strong>Gemini 2.0 Flash</strong>
      </footer>
    </div>
  )
}

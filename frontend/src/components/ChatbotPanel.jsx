import { useState, useRef, useEffect, useCallback } from 'react'
import { api } from '../api'

const QUICK_QUESTIONS = [
  { icon: '📊', text: 'What is demographic parity?' },
  { icon: '🔍', text: 'Explain my bias results' },
  { icon: '🛡️', text: 'How does fair mode work?' },
  { icon: '⚖️', text: 'What is counterfactual testing?' },
  { icon: '🤖', text: 'What is SHAP analysis?' },
  { icon: '📋', text: 'EU AI Act requirements?' },
]

// Minimal markdown renderer
function renderMarkdown(text) {
  if (!text) return []
  return text.split('\n').map((line, i) => {
    if (line.startsWith('### ')) return <h4 key={i} style={{ color: 'var(--cyan)', fontSize: '0.85rem', fontWeight: 700, marginTop: 8, marginBottom: 2 }}>{line.slice(4)}</h4>
    if (line.startsWith('## '))  return <h3 key={i} style={{ color: 'var(--indigo)', fontSize: '0.9rem', fontWeight: 700, marginTop: 10, marginBottom: 4 }}>{line.slice(3)}</h3>
    if (line.startsWith('**') && line.endsWith('**')) return <p key={i} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{line.replace(/\*\*/g, '')}</p>
    if (line.startsWith('- ') || line.startsWith('• ')) {
      const content = line.slice(2)
      // Inline bold
      const parts = content.split(/\*\*(.*?)\*\*/g)
      return (
        <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 2, alignItems: 'flex-start' }}>
          <span style={{ color: 'var(--indigo)', marginTop: 2, flexShrink: 0 }}>▸</span>
          <span style={{ fontSize: '0.85rem' }}>
            {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
          </span>
        </div>
      )
    }
    if (line.trim() === '') return <div key={i} style={{ height: 4 }} />
    // Inline bold in normal lines
    const parts = line.split(/\*\*(.*?)\*\*/g)
    return (
      <p key={i} style={{ fontSize: '0.87rem', lineHeight: 1.6, marginBottom: 2 }}>
        {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
      </p>
    )
  })
}

function TypingDots() {
  return (
    <div className="typing-dots">
      <span /><span /><span />
    </div>
  )
}

function BotMessage({ content, time }) {
  return (
    <div className="chat-msg-row bot-row">
      <div className="chat-avatar-bot">⚖️</div>
      <div className="chat-bubble-bot">
        <div className="chat-bubble-content">{renderMarkdown(content)}</div>
        <div className="chat-time">{time}</div>
      </div>
    </div>
  )
}

function UserMessage({ content, time }) {
  return (
    <div className="chat-msg-row user-row">
      <div className="chat-bubble-user">
        <div style={{ fontSize: '0.87rem', lineHeight: 1.6 }}>{content}</div>
        <div className="chat-time user-time">{time}</div>
      </div>
      <div className="chat-avatar-user">👤</div>
    </div>
  )
}

function ChatWindow({ messages, loading, bottomRef }) {
  return (
    <div className="chat-messages-container">
      {messages.map((m, i) =>
        m.role === 'bot'
          ? <BotMessage key={i} content={m.content} time={m.time} />
          : <UserMessage key={i} content={m.content} time={m.time} />
      )}
      {loading && (
        <div className="chat-msg-row bot-row">
          <div className="chat-avatar-bot">⚖️</div>
          <div className="chat-bubble-bot">
            <TypingDots />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}

export default function ChatbotPanel({ lastResult }) {
  const [open,     setOpen]     = useState(false)
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [unread,   setUnread]   = useState(0)
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content: `Hi! I'm **FairLens Assistant** 👋\n\nI'm powered by **Gemini 2.0 Flash** and I'm an expert in AI fairness, bias detection, and algorithmic ethics.\n\n- Ask me about your **bias analysis results**\n- Learn about **SHAP explanations** and fairness metrics\n- Get **mitigation strategies** for reducing AI bias\n\nWhat would you like to know?`,
      time: 'now',
    }
  ])
  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      setUnread(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [messages, open])

  const getHistory = () =>
    messages.map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.content }))

  const sendMessage = useCallback(async (text) => {
    if (!text?.trim() || loading) return
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const userMsg = { role: 'user', content: text.trim(), time: now }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const ctx = lastResult
        ? { prediction: lastResult.prediction, bias: lastResult.bias, domain: lastResult.domain }
        : null
      const { data } = await api.chat(text.trim(), ctx, getHistory())
      const botMsg = { role: 'bot', content: data.response, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      setMessages(prev => [...prev, botMsg])
      if (!open) setUnread(u => u + 1)
    } catch {
      setMessages(prev => [...prev, {
        role: 'bot',
        content: '⚠️ Could not connect to the AI assistant. Please ensure the backend is running.',
        time: 'error',
      }])
    }
    setLoading(false)
  }, [loading, lastResult, messages, open])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const clearChat = () => {
    setMessages([{
      role: 'bot',
      content: 'Chat cleared! What would you like to know about AI fairness?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }])
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        id="chatbot-toggle-btn"
        className={`chatbot-fab ${open ? 'open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Open AI Assistant"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        ) : (
          <>
            <span className="fab-icon">✨</span>
            <span className="fab-label">AI Chat</span>
            {unread > 0 && <span className="fab-badge">{unread}</span>}
          </>
        )}
      </button>

      {/* Chat Panel */}
      <div className={`chatbot-panel-v2 ${open ? 'visible' : ''}`} id="chatbot-panel">
        {/* Header */}
        <div className="chat-header-v2">
          <div className="chat-header-left">
            <div className="chat-avatar-header">
              <span>⚖️</span>
              <span className="avatar-status-dot" />
            </div>
            <div>
              <div className="chat-header-title">FairLens Assistant</div>
              <div className="chat-header-sub">
                <span className="gpt-badge">Gemini 2.0 Flash</span>
                <span className="online-text">• Online</span>
              </div>
            </div>
          </div>
          <div className="chat-header-actions">
            {lastResult && (
              <div className="chat-context-tag" title={`Using ${lastResult.domain} analysis context`}>
                📊 {lastResult.domain}
              </div>
            )}
            <button className="chat-action-btn" onClick={clearChat} title="Clear chat">🗑</button>
            <button className="chat-action-btn" onClick={() => setOpen(false)} title="Close">✕</button>
          </div>
        </div>

        {/* Messages */}
        <ChatWindow messages={messages} loading={loading} bottomRef={bottomRef} />

        {/* Quick suggestions — only show if few messages */}
        {messages.length <= 2 && (
          <div className="chat-quick-v2">
            <div className="chat-quick-label">Try asking:</div>
            <div className="chat-quick-grid">
              {QUICK_QUESTIONS.map(q => (
                <button
                  key={q.text}
                  className="quick-chip"
                  onClick={() => sendMessage(q.text)}
                  disabled={loading}
                >
                  {q.icon} {q.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <textarea
              ref={inputRef}
              id="chatbot-input"
              className="chat-textarea"
              placeholder="Ask about AI bias, SHAP, fairness metrics..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              style={{ resize: 'none' }}
            />
            <button
              id="chatbot-send-btn"
              className={`chat-send-btn ${input.trim() && !loading ? 'active' : ''}`}
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              {loading
                ? <span className="spinner" style={{ width: 16, height: 16 }} />
                : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                )
              }
            </button>
          </div>
          <div className="chat-footer-hint">Powered by Google Gemini 2.0 Flash · Enter to send</div>
        </div>
      </div>
    </>
  )
}

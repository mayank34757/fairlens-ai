// Centralized API service — FairLens AI v3.0
import axios from 'axios'

// Reads from .env (local) or Vercel/Netlify environment variable (production)
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = {
  health: () => axios.get(`${BASE}/health`),
  getDomains: () => axios.get(`${BASE}/domains`),
  predict: (domain, inputs, fairMode = false) =>
    axios.post(`${BASE}/predict`, { domain, inputs, fair_mode: fairMode }),
  compareDomains: () => axios.get(`${BASE}/compare-domains`),
  uploadCSV: (file, domain = 'loan') => {
    const form = new FormData()
    form.append('file', file)
    return axios.post(`${BASE}/upload-csv?domain=${domain}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  mitigate: (domain) => axios.get(`${BASE}/mitigate/${domain}`),
  sampleData: (domain) => axios.get(`${BASE}/sample-data/${domain}`),
  chat: (message, context = null, history = []) =>
    axios.post(`${BASE}/chat`, { message, context, history }),
  auditAI: (aiOutput, domain = 'general', context = '') =>
    axios.post(`${BASE}/audit-ai`, { ai_output: aiOutput, domain, context }),
  fairScore: (domain) => axios.get(`${BASE}/fairscore/${domain}`),
  batchTest: (domain, n = 100) => axios.get(`${BASE}/batch-test/${domain}?n=${n}`),
}

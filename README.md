<div align="center">

# 🔍 FairLens AI

### *Detect. Explain. Mitigate. — AI Bias Auditing at Scale*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev)
[![Python](https://img.shields.io/badge/Python-3.11-3776ab?style=flat-square&logo=python)](https://python.org)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?style=flat-square&logo=vite)](https://vite.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
[![Gemini](https://img.shields.io/badge/AI-Gemini_2.0_Flash-4285f4?style=flat-square&logo=google)](https://ai.google.dev)

**FairLens AI** is a production-grade, full-stack AI auditing platform that detects, explains, and mitigates bias in machine learning decision systems across five real-world domains — built for the modern AI ethics era.

[**Live Demo**](#) · [**API Docs**](http://localhost:8000/docs) · [**Report Bug**](#) · [**Request Feature**](#)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎯 **Multi-Domain Auditing** | Loan, Hiring, Healthcare, Housing, College Admissions |
| 🤖 **AI Chatbot** | Context-aware FairLens AI Assistant powered by Gemini 2.0 Flash |
| 📊 **SHAP Explainability** | Feature importance bars showing each factor's decision contribution |
| 🔄 **Counterfactual Testing** | Flip protected attributes to detect hidden discrimination |
| ⚖️ **Fairness Metrics** | Demographic Parity Difference (DPD) + Equal Opportunity Difference (EOD) |
| 🏆 **FairScore™** | Single 0–100 fairness rating per domain |
| 🔬 **Batch Stress Test** | Run 100+ synthetic cases, visualise approval rate distributions |
| 🔍 **Audit External AI** | Paste any AI output → get a bias verdict from Gemini |
| 📁 **CSV Upload** | Batch analyse your own dataset (up to 100 rows) |
| 🌐 **Domain Comparison** | Side-by-side DPD/EOD across all 5 domains |
| ⚡ **Fair Mode Toggle** | Re-run predictions with protected attributes removed |
| 📋 **Mitigation Guide** | Actionable, domain-specific bias reduction strategies |

---

## 🛠 Tech Stack

### Frontend
- **React 19** + **Vite 8** — blazing-fast development & optimized production builds
- **Chart.js** + **react-chartjs-2** — interactive SHAP & metric visualizations
- **react-dropzone** — drag-and-drop CSV uploads
- **react-hot-toast** — elegant notifications
- **Vanilla CSS** — custom dark glassmorphism design system

### Backend
- **FastAPI** + **Uvicorn** — async Python API with OpenAPI docs
- **scikit-learn** — Random Forest classifiers (10 models: 5 domains × biased/fair)
- **SHAP** — TreeExplainer for feature attribution
- **Gemini 2.0 Flash** — AI chatbot & external audit engine
- **python-dotenv** — secure environment variable management

---

## 📂 Project Structure

```
fairlens-ai/
├── backend/                    # FastAPI Python backend
│   ├── main.py                 # API routes & app entry point
│   ├── chatbot.py              # Gemini AI chatbot + audit engine
│   ├── domain_models.py        # 5 domain ML model classes
│   ├── domain_registry.py      # Domain registry & metadata
│   ├── bias_detector.py        # DPD, EOD, counterfactual tests
│   ├── explainer.py            # SHAP TreeExplainer wrapper
│   ├── data_generator.py       # Synthetic bias-injected data
│   ├── model.py                # Base model class
│   ├── requirements.txt        # Python dependencies
│   ├── Procfile                # Render deployment config
│   ├── runtime.txt             # Python version spec
│   ├── .env.example            # Environment variable template
│   └── .env                    # ⚠️ GITIGNORED — your actual secrets
│
├── frontend/                   # React + Vite frontend
│   ├── src/
│   │   ├── components/         # 14 React components
│   │   │   ├── ChatbotPanel.jsx
│   │   │   ├── InputPanel.jsx
│   │   │   ├── PredictionResult.jsx
│   │   │   ├── ExplainabilityChart.jsx
│   │   │   ├── FairnessMetrics.jsx
│   │   │   ├── BiasDetectionPanel.jsx
│   │   │   ├── MitigationPanel.jsx
│   │   │   ├── FairScoreGauge.jsx
│   │   │   ├── DomainCompare.jsx
│   │   │   ├── BatchTestPanel.jsx
│   │   │   ├── AuditPanel.jsx
│   │   │   ├── CSVResults.jsx
│   │   │   ├── DomainSelector.jsx
│   │   │   └── WelcomeModal.jsx
│   │   ├── api.js              # Centralized API service
│   │   ├── App.jsx             # Main app shell
│   │   └── main.jsx            # React entry point
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── .env.example            # Frontend env variable template
│   └── .env                    # ⚠️ GITIGNORED — your local config
│
├── .gitignore                  # Root gitignore (Python + Node + .env)
└── README.md                   # This file
```

---

## 🚀 Local Development Setup

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** and **npm**
- A **Gemini API key** (free at [aistudio.google.com](https://aistudio.google.com/))

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/fairlens-ai.git
cd fairlens-ai
```

---

### Step 2 — Backend Setup

```bash
cd backend

# 1. Create and activate a virtual environment (recommended)
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set up your environment variables
copy .env.example .env         # Windows
# cp .env.example .env         # macOS/Linux

# 4. Open .env and paste your Gemini API key:
#    GEMINI_API_KEY=your_actual_key_here

# 5. Start the backend
python -m uvicorn main:app --reload --port 8000
```

> ⏳ **First startup takes ~15–30 seconds** — it trains 10 ML models (5 domains × biased/fair mode).

Backend is now live at: **http://localhost:8000**
Interactive API docs: **http://localhost:8000/docs**

---

### Step 3 — Frontend Setup

Open a **new terminal**:

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Set up environment variables
copy .env.example .env         # Windows
# cp .env.example .env         # macOS/Linux
# .env already contains: VITE_API_URL=http://localhost:8000

# 3. Start the dev server
npm run dev
```

Frontend is now live at: **http://localhost:5173**

---

## 🎯 Demo Walkthrough

1. Open **http://localhost:5173**
2. Click **"Try Live Demo"** in the welcome modal to auto-fill sample data
3. Select a **domain** (Loan, Hiring, Healthcare, etc.)
4. Fill in the **applicant form** or use the sample
5. Click **"Analyze Decision"** — see:
   - ✅ Prediction + confidence
   - 📊 SHAP feature importance chart
   - ⚖️ DPD / EOD fairness metrics
   - 🔄 Counterfactual bias test result
6. Toggle **Fair Mode** → compare standard vs. debiased model
7. Chat with **FairLens AI Assistant** for explanations
8. Use **Audit External AI** to paste any AI output for a bias check

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check (Render ping) |
| `GET` | `/health` | Detailed status + loaded domains |
| `GET` | `/domains` | All domains with feature schemas |
| `POST` | `/predict` | Predict + SHAP + bias report |
| `GET` | `/fairscore/{domain}` | FairScore™ 0–100 for a domain |
| `GET` | `/compare-domains` | DPD/EOD across all 5 domains |
| `GET` | `/batch-test/{domain}` | Batch stress test (N random cases) |
| `GET` | `/mitigate/{domain}` | Mitigation recommendations |
| `POST` | `/upload-csv` | Batch CSV analysis |
| `POST` | `/chat` | AI chatbot (Gemini) |
| `POST` | `/audit-ai` | External AI output bias audit |
| `GET` | `/sample-data/{domain}` | Sample inputs for a domain |

**Full interactive docs**: `http://localhost:8000/docs`

---

## 📦 CSV Upload Format

Your CSV must include the domain's required feature columns. Example for **Loan** domain:

```csv
age,income,credit_score,gender,education,employment
35,65000,720,0,1,2
28,48000,640,1,1,2
```

| Field | Values |
|---|---|
| `gender` | `0` = Female, `1` = Male |
| `education` | `0` = HighSchool, `1` = Bachelor, `2` = Master, `3` = PhD |
| `employment` | `0` = Unemployed, `1` = PartTime, `2` = FullTime, `3` = SelfEmployed |
| `race` | `0` = Black/Minority, `1` = White (Hiring/Housing domains) |

---

## 🌐 Deployment

### Frontend → Vercel

1. Push your code to GitHub (see [GitHub Setup](#-github-setup) below)
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import your repo
3. Set **Root Directory** to `frontend`
4. Add environment variable:
   - `VITE_API_URL` = `https://your-backend.onrender.com`
5. Click **Deploy** ✅

**Build settings** (Vercel auto-detects these):
- Framework: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

---

### Backend → Render

1. Go to [render.com](https://render.com) → **New Web Service** → Connect GitHub
2. Select your `fairlens-ai` repo
3. Configure:
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables:
   - `GEMINI_API_KEY` = `your_actual_key`
   - `FRONTEND_URL` = `https://your-app.vercel.app`
   - `ENVIRONMENT` = `production`
5. Instance type: **Free** → Click **Create Web Service** ✅

> ⚠️ **Note**: Render free tier spins down after 15 min of inactivity. The first request after sleep takes ~30s.

---

### Frontend → Netlify (Alternative)

1. Go to [netlify.com](https://netlify.com) → **Add New Site** → Import from Git
2. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
3. Add environment variable: `VITE_API_URL` = your Render backend URL
4. Click **Deploy** ✅

---

## 🔑 GitHub Setup

### First Time (initialize & push)

```powershell
# From d:\hackathon
git init
git branch -M main
git add .
git commit -m "feat: initial production-ready FairLens AI platform"

# Option A — GitHub CLI (recommended)
winget install GitHub.cli          # Install GitHub CLI (one-time)
gh auth login                       # Follow the browser auth flow
gh repo create fairlens-ai --public --description "AI bias detection platform" --source=. --remote=origin --push

# Option B — Manual (no CLI needed)
# 1. Go to https://github.com/new
# 2. Create repo "fairlens-ai" (do NOT initialize with README)
# 3. Copy the repo URL and run:
git remote add origin https://github.com/YOUR_USERNAME/fairlens-ai.git
git push -u origin main
```

### Personal Access Token (if password auth fails)

1. Go to **GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)**
2. Click **Generate new token (classic)**
3. Check: `repo`, `workflow`
4. Copy the token
5. Use it as your **password** when Git asks during `git push`
6. To avoid re-entering: `git config --global credential.helper manager`

### Future Pushes

```powershell
git add .
git commit -m "your descriptive commit message"
git push
```

---

## 🧠 How Bias is Injected (for Demo Transparency)

The synthetic datasets intentionally inject measurable bias to make the platform's detection reliably demonstrable:

| Domain | Protected Attribute | Bias Mechanism |
|--------|--------------------|----|
| Loan | Gender | Males get +20% income boost; +12% approval probability |
| Hiring | Gender | Females penalized on seniority scoring |
| Healthcare | Race | Minority groups receive lower risk score weights |
| Housing | Race | Minority applicants face stricter credit scoring |
| College | Gender | Female applicants penalized in test score weighting |

This simulates **real-world systemic bias** patterns documented in academic literature.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feat/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feat/amazing-feature`
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🙏 Acknowledgements

- [Google AI Studio](https://aistudio.google.com/) — Gemini API
- [SHAP](https://shap.readthedocs.io/) — Shapley Additive Explanations
- [FastAPI](https://fastapi.tiangolo.com/) — Modern Python API framework
- [scikit-learn](https://scikit-learn.org/) — Machine learning toolkit
- [Vite](https://vite.dev/) — Next-generation frontend tooling

---

<div align="center">
Built with ❤️ for a more equitable AI future
</div>

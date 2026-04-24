"""
FairLens AI — FastAPI Backend (Multi-Domain Edition)
Supports 5 domains: loan, hiring, healthcare, housing, college
+ AI chatbot powered by Gemini
+ External AI audit endpoint
"""
import io
import os
import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()  # Load .env file for local development

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from bias_detector import full_bias_report, demographic_parity_difference, equal_opportunity_difference
from domain_registry import DOMAIN_REGISTRY, DOMAIN_META, get_domain
from chatbot import get_chat_response, audit_ai_output

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Global model state — train all 5 domains × 2 modes = 10 models
# ---------------------------------------------------------------------------
models: dict = {}   # key: "loan_biased", "loan_fair", etc.

@asynccontextmanager
async def lifespan(app: FastAPI):
    global models
    for domain_name, DomainClass in DOMAIN_REGISTRY.items():
        for fair_mode in [False, True]:
            key = f"{domain_name}_{'fair' if fair_mode else 'biased'}"
            logger.info(f"Training {key}...")
            m = DomainClass(fair_mode=fair_mode)
            stats = m.train()
            models[key] = m
            logger.info(f"  ✓ {key} — accuracy: {stats['accuracy']}")
    logger.info("✅ All domain models ready!")
    yield


app = FastAPI(
    title="FairLens AI API",
    description="Multi-domain AI bias detection & mitigation platform",
    version="2.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS — configurable via FRONTEND_URL env var (defaults to * in dev)
# ---------------------------------------------------------------------------
_raw_origin = os.environ.get("FRONTEND_URL", "*")
_is_dev     = os.environ.get("ENVIRONMENT", "development") == "development"

if _raw_origin == "*" or _is_dev:
    _allowed_origins = ["*"]
else:
    # Support comma-separated list: "https://foo.vercel.app,https://www.foo.com"
    _allowed_origins = [o.strip() for o in _raw_origin.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class PredictRequest(BaseModel):
    domain: str = Field(default="loan", description="Domain: loan|hiring|healthcare|housing|college")
    fair_mode: bool = Field(default=False)
    inputs: dict = Field(..., description="Feature key-value pairs for the domain")


class ChatRequest(BaseModel):
    message: str
    context: dict | None = None
    history: list | None = None


class AuditRequest(BaseModel):
    ai_output: str = Field(..., description="The AI-generated text to audit")
    domain: str = Field(default="general", description="Domain context for the audit")
    context: str = Field(default="", description="Additional context about the AI system")


# ---------------------------------------------------------------------------
# Root (Render health check)
# ---------------------------------------------------------------------------
@app.get("/")
def root():
    return {"message": "FairLens AI API is running ✅", "version": "2.0.0", "docs": "/docs"}


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
@app.get("/health")
def health():
    return {
        "status": "ok",
        "domains_loaded": list(DOMAIN_REGISTRY.keys()),
        "models_ready": len(models),
    }


# ---------------------------------------------------------------------------
# Domain Metadata
# ---------------------------------------------------------------------------
@app.get("/domains")
def list_domains():
    """Return all available domains with metadata and feature schemas."""
    result = {}
    for domain_name, meta in DOMAIN_META.items():
        DomainClass = DOMAIN_REGISTRY[domain_name]
        instance = DomainClass(fair_mode=False)
        result[domain_name] = {
            **meta,
            "features": instance.get_feature_labels(),
            "sample_inputs": instance.sample_inputs(),
        }
    return result


# ---------------------------------------------------------------------------
# Predict (Multi-Domain)
# ---------------------------------------------------------------------------
@app.post("/predict")
def predict(req: PredictRequest):
    """
    Full prediction pipeline for any domain.
    """
    if req.domain not in DOMAIN_REGISTRY:
        raise HTTPException(status_code=400, detail=f"Unknown domain '{req.domain}'. Valid: {list(DOMAIN_REGISTRY)}")

    model_key = f"{req.domain}_{'fair' if req.fair_mode else 'biased'}"
    model = models.get(model_key)
    if model is None or not model.trained:
        raise HTTPException(status_code=503, detail=f"Model '{model_key}' not ready")

    # Prediction
    prediction = model.predict(req.inputs)

    # SHAP explanation (best-effort)
    explanation = {"feature_impacts": [], "base_value": 0.5}
    try:
        from explainer import Explainer
        exp_key = f"_exp_{model_key}"
        if exp_key not in models:
            models[exp_key] = Explainer(model)
        explanation = models[exp_key].explain(req.inputs)
    except Exception as e:
        logger.warning(f"SHAP skipped: {e}")

    # Bias report (only for biased mode)
    bias_report = {}
    if not req.fair_mode:
        try:
            bias_report = full_bias_report(model, req.inputs)
        except Exception as e:
            logger.warning(f"Bias report failed: {e}")

    return {
        "domain": req.domain,
        "domain_meta": DOMAIN_META[req.domain],
        "input": req.inputs,
        "prediction": prediction,
        "explanation": explanation,
        "bias": bias_report,
        "model_mode": "fair" if req.fair_mode else "standard",
    }


# ---------------------------------------------------------------------------
# Compare All Domains — side-by-side bias metrics
# ---------------------------------------------------------------------------
@app.get("/compare-domains")
def compare_domains():
    """Run DPD + EOD across all 5 biased models and return comparison."""
    results = {}
    for domain_name in DOMAIN_REGISTRY:
        model_key = f"{domain_name}_biased"
        model = models.get(model_key)
        if model is None or not model.trained:
            continue
        try:
            dpd = demographic_parity_difference(model)
            eod = equal_opportunity_difference(model)
            results[domain_name] = {
                "meta": DOMAIN_META[domain_name],
                "demographic_parity": dpd,
                "equal_opportunity": eod,
                "overall_level": dpd["classification"]["level"],
            }
        except Exception as e:
            logger.warning(f"Compare failed for {domain_name}: {e}")
            results[domain_name] = {"error": str(e)}
    return results


# ---------------------------------------------------------------------------
# FairScore — single 0-100 score for a domain
# ---------------------------------------------------------------------------
@app.get("/fairscore/{domain}")
def fairscore(domain: str):
    """Calculate a single FairScore (0-100) for a domain from DPD + EOD + counterfactual stats."""
    if domain not in DOMAIN_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Unknown domain '{domain}'")
    model_key = f"{domain}_biased"
    model = models.get(model_key)
    if model is None or not model.trained:
        raise HTTPException(status_code=503, detail="Model not ready")
    try:
        dpd = demographic_parity_difference(model)
        eod = equal_opportunity_difference(model)
        # Score: penalize by DPD and EOD (both as absolute % from 0-100)
        dpd_penalty = min(abs(dpd["dpd_pct"]), 50)   # max 50 points penalty
        eod_penalty = min(abs(eod["eod_pct"]), 30)   # max 30 points penalty
        # Run 50 counterfactual tests with sample data
        df = model.generate_data().head(50)
        feature_cols = model.get_feature_names()
        cf_bias_count = 0
        for _, row in df.iterrows():
            input_dict = row[feature_cols].to_dict()
            try:
                from bias_detector import counterfactual_test
                cf = counterfactual_test(model, input_dict)
                if cf.get("bias_detected"):
                    cf_bias_count += 1
            except Exception:
                pass
        cf_rate = cf_bias_count / 50  # 0.0 to 1.0
        cf_penalty = cf_rate * 20     # max 20 points penalty
        score = round(max(0, 100 - dpd_penalty - eod_penalty - cf_penalty))
        level = "Excellent" if score >= 85 else "Good" if score >= 70 else "Moderate" if score >= 50 else "Poor"
        color = "#10b981" if score >= 85 else "#3b82f6" if score >= 70 else "#f59e0b" if score >= 50 else "#ef4444"
        return {
            "domain": domain,
            "score": score,
            "level": level,
            "color": color,
            "breakdown": {
                "dpd_penalty": round(dpd_penalty, 1),
                "eod_penalty": round(eod_penalty, 1),
                "cf_penalty": round(cf_penalty, 1),
                "cf_bias_rate": round(cf_rate * 100, 1),
            },
            "dpd": dpd,
            "eod": eod,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Batch Stress Test — run N random cases and return distribution
# ---------------------------------------------------------------------------
@app.get("/batch-test/{domain}")
def batch_stress_test(domain: str, n: int = 100):
    """Run N random synthetic cases through the domain model and return approval rate distribution."""
    if domain not in DOMAIN_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Unknown domain '{domain}'")
    model_key = f"{domain}_biased"
    fair_key = f"{domain}_fair"
    model = models.get(model_key)
    fair_model = models.get(fair_key)
    if model is None or not model.trained:
        raise HTTPException(status_code=503, detail="Model not ready")
    try:
        df = model.generate_data().head(n)
        feature_cols = model.get_feature_names()
        protected = model.protected_attribute
        X = df[feature_cols].values
        X_scaled = model.scaler.transform(X)
        predictions = model.model.predict(X_scaled)
        probs = model.model.predict_proba(X_scaled)[:, 1]
        df["predicted"] = predictions
        df["prob"] = probs
        # Group stats
        stats = {"total": len(df), "approved": int(predictions.sum()), "approval_rate": round(float(predictions.mean()) * 100, 1)}
        group_stats = {}
        if protected == "gender":
            male_df = df[df["gender"] == 1]
            female_df = df[df["gender"] == 0]
            group_stats = {
                "group_a": {"label": "Male", "count": len(male_df), "approved": int(male_df["predicted"].sum()), "rate": round(float(male_df["predicted"].mean()) * 100, 1) if len(male_df) > 0 else 0},
                "group_b": {"label": "Female", "count": len(female_df), "approved": int(female_df["predicted"].sum()), "rate": round(float(female_df["predicted"].mean()) * 100, 1) if len(female_df) > 0 else 0},
            }
        elif protected == "race":
            white_df = df[df["race"] == 1]
            black_df = df[df["race"] == 0]
            group_stats = {
                "group_a": {"label": "White", "count": len(white_df), "approved": int(white_df["predicted"].sum()), "rate": round(float(white_df["predicted"].mean()) * 100, 1) if len(white_df) > 0 else 0},
                "group_b": {"label": "Black", "count": len(black_df), "approved": int(black_df["predicted"].sum()), "rate": round(float(black_df["predicted"].mean()) * 100, 1) if len(black_df) > 0 else 0},
            }
        # Probability distribution buckets (for histogram)
        import numpy as np
        hist, edges = np.histogram(probs, bins=10, range=(0, 1))
        histogram = [{"bucket": f"{edges[i]:.1f}-{edges[i+1]:.1f}", "count": int(hist[i])} for i in range(len(hist))]
        return {
            "domain": domain,
            "n": len(df),
            "stats": stats,
            "group_stats": group_stats,
            "protected_attribute": protected,
            "histogram": histogram,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Upload CSV (domain-aware)
# ---------------------------------------------------------------------------
@app.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...), domain: str = "loan"):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files accepted")

    if domain not in DOMAIN_REGISTRY:
        raise HTTPException(status_code=400, detail=f"Unknown domain '{domain}'")

    contents = await file.read()
    try:
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV parse error: {e}")

    model_key = f"{domain}_biased"
    model = models[model_key]
    required_cols = model.get_feature_names()
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing columns: {missing}")

    results = []
    for _, row in df.head(100).iterrows():
        input_dict = row[required_cols].to_dict()
        pred = model.predict(input_dict)
        results.append({**input_dict, **pred})

    result_df = pd.DataFrame(results)
    total = len(result_df)
    approved = int((result_df["prediction"] == 1).sum())
    protected = model.protected_attribute

    # Group stats
    group_stats = {}
    if protected == "gender" and "gender" in result_df.columns:
        group_stats["male_rate"] = round(float(result_df[result_df["gender"] == 1]["prediction"].mean() * 100), 1) if len(result_df[result_df["gender"] == 1]) > 0 else 0
        group_stats["female_rate"] = round(float(result_df[result_df["gender"] == 0]["prediction"].mean() * 100), 1) if len(result_df[result_df["gender"] == 0]) > 0 else 0
        group_stats["dpd"] = round((group_stats["male_rate"] - group_stats["female_rate"]) / 100, 4)
    elif protected == "race" and "race" in result_df.columns:
        group_stats["white_rate"] = round(float(result_df[result_df["race"] == 1]["prediction"].mean() * 100), 1) if len(result_df[result_df["race"] == 1]) > 0 else 0
        group_stats["black_rate"] = round(float(result_df[result_df["race"] == 0]["prediction"].mean() * 100), 1) if len(result_df[result_df["race"] == 0]) > 0 else 0
        group_stats["dpd"] = round((group_stats["white_rate"] - group_stats["black_rate"]) / 100, 4)

    return {
        "domain": domain,
        "total_records": total,
        "approved_count": approved,
        "rejection_count": total - approved,
        "approval_rate": round(approved / total * 100, 1),
        "group_stats": group_stats,
        "records": results[:10],
    }


# ---------------------------------------------------------------------------
# Mitigation Info
# ---------------------------------------------------------------------------
@app.get("/mitigate/{domain}")
def mitigate(domain: str):
    if domain not in DOMAIN_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Unknown domain '{domain}'")
    DomainClass = DOMAIN_REGISTRY[domain]
    instance = DomainClass(fair_mode=False)
    fair_instance = DomainClass(fair_mode=True)
    removed = [f for f in instance.feature_cols if f not in fair_instance.feature_cols_fair]
    return {
        "domain": domain,
        "message": f"Fair mode removes protected attributes from the {DOMAIN_META[domain]['label']} model.",
        "removed_features": removed,
        "recommendations": [
            f"❌ Removed protected attributes: {', '.join(removed)}",
            "⚖️  Model now trained on merit-based features only",
            "📊 Expected improvement in demographic parity difference",
            "🔄 Use fair_mode=true in /predict to compare results",
            "🔍 Re-run bias report to verify improvement",
        ],
    }


# ---------------------------------------------------------------------------
# Chatbot
# ---------------------------------------------------------------------------
@app.post("/chat")
async def chat(req: ChatRequest):
    """AI chatbot powered by Gemini. Falls back to FAQ if no API key."""
    try:
        response = await get_chat_response(
            message=req.message,
            context=req.context,
            history=req.history,
        )
        return {"response": response, "powered_by": "gemini" if True else "faq"}
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Audit External AI
# ---------------------------------------------------------------------------
@app.post("/audit-ai")
async def audit_ai(req: AuditRequest):
    """
    Paste any AI-generated output and get a bias audit verdict.
    Powered by Gemini — analyses text for discrimination signals.
    """
    if len(req.ai_output.strip()) < 10:
        raise HTTPException(status_code=400, detail="AI output text is too short to audit")
    try:
        verdict = await audit_ai_output(
            ai_text=req.ai_output,
            domain=req.domain,
            context=req.context,
        )
        return {"domain": req.domain, "audit": verdict}
    except Exception as e:
        logger.error(f"Audit error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Sample Data (per domain)
# ---------------------------------------------------------------------------
@app.get("/sample-data/{domain}")
def sample_data(domain: str):
    if domain not in DOMAIN_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Unknown domain '{domain}'")
    instance = DOMAIN_REGISTRY[domain](fair_mode=False)
    return {"domain": domain, "samples": instance.sample_inputs()}

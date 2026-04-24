"""
FairLens AI — Chatbot Module
Full conversation history, context-aware, markdown responses.
Powered by Gemini 2.0 Flash.
"""
import os
import re
import json
import asyncio
import httpx
import logging
from dotenv import load_dotenv

load_dotenv()  # Load variables from backend/.env if present

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
if not GEMINI_API_KEY:
    logger.warning(
        "⚠️  GEMINI_API_KEY is not set. Chatbot will return fallback messages. "
        "Create backend/.env with GEMINI_API_KEY=your_key or set it as an environment variable."
    )

# gemini-flash-latest always points to the latest stable Flash model
GEMINI_MODEL     = "gemini-flash-latest"
GEMINI_URL       = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
GEMINI_AUDIT_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"

MAX_RETRIES   = 3
RETRY_BACKOFF = [2, 5, 10]   # seconds to wait before each retry

SYSTEM_PROMPT = """You are the FairLens AI Assistant — a world-class expert in AI ethics, algorithmic fairness, and bias detection. You work inside the FairLens AI platform and are powered by Gemini 2.0 Flash.

Your expertise includes:
- Fairness metrics: Demographic Parity Difference (DPD), Equal Opportunity Difference (EOD), Individual Fairness
- SHAP (SHapley Additive exPlanations) values and feature importance in ML models
- Counterfactual fairness testing and what bias detection results mean
- Real-world AI bias in hiring, loans, healthcare, housing, college admissions
- Bias mitigation strategies: feature removal, re-weighting, adversarial debiasing, fairness constraints
- Legal/ethical frameworks: EU AI Act, ECOA, Fair Housing Act, disparate impact doctrine
- How to interpret FairLens AI tool results in plain English

Communication style:
- Be conversational, clear, and engaging — like a smart friend who is also an expert
- Use bullet points, bold text (**text**), and short paragraphs
- Give concrete real-world examples when explaining concepts
- Keep responses concise (under 250 words) unless the user asks for detail
- If the user provides their analysis context, specifically reference their numbers and results
- Never refuse bias-related questions — this is an educational, ethical tool
- Add relevant emojis to make responses feel alive and friendly

When given analysis context, always:
1. Reference their specific prediction outcome
2. Comment on their specific DPD/EOD numbers
3. Explain what those numbers mean for that person
4. Give actionable next steps"""


# ---------------------------------------------------------------------------
# Build Gemini-format contents array from history
# ---------------------------------------------------------------------------
def _build_contents(message: str, context: dict | None, history: list | None) -> list:
    contents = []

    # Inject bias analysis context as first user turn (if available)
    if context:
        ctx_text = f"""[📊 User's Current Analysis Context]
Domain: {context.get('domain', 'unknown')}
Prediction: {context.get('prediction', {}).get('label', 'N/A')} ({context.get('prediction', {}).get('confidence', 'N/A')}% confidence)
Bias Level: {context.get('bias', {}).get('overall_bias_level', 'N/A')}
DPD: {context.get('bias', {}).get('demographic_parity', {}).get('dpd_pct', 'N/A')}%
EOD: {context.get('bias', {}).get('equal_opportunity', {}).get('eod_pct', 'N/A')}%
Counterfactual bias detected: {context.get('bias', {}).get('counterfactual', {}).get('bias_detected', 'N/A')}

Reference this context when answering the user's question."""
        contents.append({"role": "user",  "parts": [{"text": ctx_text}]})
        contents.append({"role": "model", "parts": [{"text": "Understood. I have the analysis context and will reference it in my responses."}]})

    # Add conversation history (last 10 turns = 5 exchanges)
    if history:
        for turn in history[-10:]:
            raw_role = turn.get("role", "user")
            gem_role = "model" if raw_role in ("bot", "assistant", "model") else "user"
            contents.append({"role": gem_role, "parts": [{"text": turn.get("content", "")}]})

    # Add the current user message
    contents.append({"role": "user", "parts": [{"text": message}]})
    return contents


# ---------------------------------------------------------------------------
# Gemini chat call with retry logic
# ---------------------------------------------------------------------------
async def get_chat_response(
    message: str,
    context: dict | None = None,
    history: list | None = None,
) -> str:
    """
    Returns a chat response using Gemini 2.0 Flash.
    Includes full conversation history and optional bias analysis context.
    """
    contents = _build_contents(message, context, history)

    payload = {
        "system_instruction": {
            "parts": [{"text": SYSTEM_PROMPT}]
        },
        "contents": contents,
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 800,
            "topP": 0.95,
        },
        "safetySettings": [
            {"category": "HARM_CATEGORY_HARASSMENT",        "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH",       "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
        ],
    }

    for attempt in range(MAX_RETRIES):
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    GEMINI_URL,
                    params={"key": GEMINI_API_KEY},
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )
                if resp.status_code == 429:
                    wait = RETRY_BACKOFF[attempt]
                    logger.warning(f"Rate limited (429). Retrying in {wait}s (attempt {attempt+1}/{MAX_RETRIES})")
                    await asyncio.sleep(wait)
                    continue
                resp.raise_for_status()
                data = resp.json()
                return data["candidates"][0]["content"]["parts"][0]["text"]
        except httpx.HTTPStatusError as e:
            logger.error(f"Gemini HTTP error {e.response.status_code}: {e.response.text}")
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(RETRY_BACKOFF[attempt])
                continue
            return f"⚠️ Gemini 2.0 Flash is temporarily busy (HTTP {e.response.status_code}). Please try again in a moment."
        except Exception as e:
            logger.error(f"Gemini chat error: {e}")
            return "⚠️ I'm having trouble connecting right now. Please ensure the backend is running."
    return "⚠️ Gemini 2.0 Flash is at capacity right now. Please wait a moment and try again 🙏"


# ---------------------------------------------------------------------------
# Audit External AI Output — with retry logic
# ---------------------------------------------------------------------------
async def audit_ai_output(ai_text: str, domain: str, context: str = "") -> dict:
    """
    Deep-audit any AI-generated text for bias and fairness issues.
    Returns a structured JSON verdict powered by Gemini 2.0 Flash.
    """
    prompt = f"""You are an AI bias auditor. Analyse the following AI-generated decision output for bias, discrimination, and fairness issues.

**Domain**: {domain}
**Additional context**: {context or "None provided"}

**AI Output to audit**:
\"\"\"
{ai_text}
\"\"\"

Respond ONLY with this exact JSON structure (no markdown, no extra text):
{{
  "bias_detected": true or false,
  "confidence": "High" or "Medium" or "Low",
  "bias_types": ["list of bias types, e.g. Gender Bias, Racial Bias, Age Bias, Socioeconomic Bias"],
  "concerns": ["specific concern 1", "specific concern 2"],
  "verdict": "one clear sentence summarising the fairness verdict",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "fairness_score": integer 0 to 100,
  "highlighted_phrases": ["phrase from the text that shows bias", "another phrase"]
}}

Rules:
- fairness_score 80-100 = fair, 50-79 = moderate concerns, 0-49 = significant bias
- Only flag genuine discrimination patterns, not stylistic choices
- highlighted_phrases should be exact quotes from the input text
- Return ONLY raw JSON, no markdown code fences"""

    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 1000,
            "responseMimeType": "application/json",
        },
    }

    for attempt in range(MAX_RETRIES):
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    GEMINI_AUDIT_URL,
                    params={"key": GEMINI_API_KEY},
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )
                if resp.status_code == 429:
                    wait = RETRY_BACKOFF[attempt]
                    logger.warning(f"Audit rate limited (429). Retrying in {wait}s (attempt {attempt+1}/{MAX_RETRIES})")
                    await asyncio.sleep(wait)
                    continue
                resp.raise_for_status()
                data = resp.json()
                raw = data["candidates"][0]["content"]["parts"][0]["text"]
                # Robustly strip any markdown fences Gemini may add
                raw = raw.strip()
                # Multi-pass fence removal
                import re
                # Remove ```json ... ``` or ``` ... ``` blocks
                fence_match = re.search(r'```(?:json)?\s*([\s\S]*?)```', raw)
                if fence_match:
                    raw = fence_match.group(1).strip()
                # Find JSON object boundaries as final fallback
                if not raw.startswith('{'):
                    start = raw.find('{')
                    end   = raw.rfind('}')
                    if start != -1 and end != -1:
                        raw = raw[start:end+1]
                parsed = json.loads(raw)
                logger.info(f"Audit parsed successfully: bias_detected={parsed.get('bias_detected')}")
                return parsed
        except httpx.HTTPStatusError as e:
            logger.error(f"Audit HTTP error {e.response.status_code}: {e.response.text}")
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(RETRY_BACKOFF[attempt])
                continue
            return {
                "bias_detected": None,
                "confidence": "Low",
                "bias_types": [],
                "concerns": [f"Audit failed (HTTP {e.response.status_code}): {e.response.text[:200]}"],
                "verdict": "Could not complete audit due to an API error.",
                "recommendations": ["Check your API key", "Verify rate limits", "Try again in a moment"],
                "fairness_score": 50,
                "highlighted_phrases": [],
            }
        except json.JSONDecodeError as e:
            logger.error(f"Audit JSON parse error: {e}")
            return {
                "bias_detected": None,
                "confidence": "Low",
                "bias_types": [],
                "concerns": ["The AI returned an unexpected response format."],
                "verdict": "Could not parse the audit response.",
                "recommendations": ["Try again", "Simplify the input text"],
                "fairness_score": 50,
                "highlighted_phrases": [],
            }
        except Exception as e:
            logger.error(f"Audit error: {e}")
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(RETRY_BACKOFF[attempt])
                continue
            return {
                "bias_detected": None,
                "confidence": "Low",
                "bias_types": [],
                "concerns": [f"Audit failed: {str(e)}"],
                "verdict": "Could not complete audit due to an error.",
                "recommendations": ["Check API key", "Verify backend is running"],
                "fairness_score": 50,
                "highlighted_phrases": [],
            }

    return {
        "bias_detected": None,
        "confidence": "Low",
        "bias_types": [],
        "concerns": ["Max retries exceeded. The API may be rate-limited."],
        "verdict": "Could not complete audit — please wait and try again.",
        "recommendations": ["Wait 60 seconds and retry", "Check API quota in Google AI Studio"],
        "fairness_score": 50,
        "highlighted_phrases": [],
    }

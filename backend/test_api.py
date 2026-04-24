import urllib.request, json

payload = json.dumps({
    "age": 35, "income": 65000, "credit_score": 720,
    "gender": 0, "education": 1, "employment": 2, "fair_mode": False
}).encode()

req = urllib.request.Request(
    "http://localhost:8000/predict",
    data=payload,
    headers={"Content-Type": "application/json"},
    method="POST"
)
r = urllib.request.urlopen(req)
data = json.loads(r.read())

print("=== PREDICTION ===")
print(json.dumps(data["prediction"], indent=2))

print("\n=== TOP 3 SHAP FEATURES ===")
for f in data["explanation"]["feature_impacts"][:3]:
    print(f"  {f['label']}: {f['shap_value']}")

print("\n=== BIAS DETECTION ===")
cf = data["bias"]["counterfactual"]
print("Bias detected:", cf["bias_detected"])
orig = cf["original"]
counter = cf["counterfactual"]
print(f"  Original ({orig['gender']}): {orig['prediction']} ({orig['prob_approved']}%)")
print(f"  Counterfactual ({counter['gender']}): {counter['prediction']} ({counter['prob_approved']}%)")
print(f"  Confidence shift: {cf['confidence_shift']}%")

print("\n=== FAIRNESS METRICS ===")
dp = data["bias"]["demographic_parity"]
print(f"  Male approval: {dp['male_approval_rate']}%")
print(f"  Female approval: {dp['female_approval_rate']}%")
print(f"  DPD: {dp['dpd_pct']}% -> {dp['classification']['level']}")

eo = data["bias"]["equal_opportunity"]
print(f"  EOD: {eo['eod_pct']}% -> {eo['classification']['level']}")

print("\n=== ALL OK ===")

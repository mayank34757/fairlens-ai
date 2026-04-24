import urllib.request, json

# Test multiple profiles to find one where gender flips the outcome
profiles = [
    {"age": 32, "income": 75000, "credit_score": 690, "gender": 0, "education": 1, "employment": 2},
    {"age": 38, "income": 82000, "credit_score": 710, "gender": 0, "education": 2, "employment": 2},
    {"age": 29, "income": 68000, "credit_score": 700, "gender": 0, "education": 1, "employment": 2},
    {"age": 42, "income": 90000, "credit_score": 730, "gender": 0, "education": 2, "employment": 2},
    {"age": 35, "income": 78000, "credit_score": 680, "gender": 0, "education": 1, "employment": 2},
    {"age": 31, "income": 71000, "credit_score": 695, "gender": 0, "education": 1, "employment": 2},
]

for p in profiles:
    payload = json.dumps({**p, "fair_mode": False}).encode()
    req = urllib.request.Request(
        "http://localhost:8000/predict",
        data=payload, headers={"Content-Type": "application/json"}, method="POST"
    )
    data = json.loads(urllib.request.urlopen(req).read())
    cf = data["bias"]["counterfactual"]
    print(f"Age={p['age']}, Inc={p['income']}, Cr={p['credit_score']} → "
          f"{cf['original']['prediction']}({cf['original']['prob_approved']}%) vs "
          f"{cf['counterfactual']['prediction']}({cf['counterfactual']['prob_approved']}%) "
          f"FLIPPED={cf['bias_detected']}")

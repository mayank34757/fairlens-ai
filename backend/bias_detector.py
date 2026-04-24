"""
FairLens AI — Domain-Agnostic Bias Detector
Works with any BaseDomainModel. Supports gender, race, and age as protected attributes.
"""
import copy
import numpy as np
import pandas as pd


BIAS_THRESHOLDS = {"fair": 0.05, "moderate": 0.15}


def classify_bias(value: float) -> dict:
    abs_val = abs(value)
    if abs_val <= BIAS_THRESHOLDS["fair"]:
        return {"level": "Fair", "color": "green", "score": round(abs_val, 4)}
    elif abs_val <= BIAS_THRESHOLDS["moderate"]:
        return {"level": "Moderate Bias", "color": "amber", "score": round(abs_val, 4)}
    else:
        return {"level": "High Bias", "color": "red", "score": round(abs_val, 4)}


# ---------------------------------------------------------------------------
# Counterfactual Test — generic: flip the protected attribute value
# ---------------------------------------------------------------------------
def counterfactual_test(model, input_dict: dict) -> dict:
    """
    For each domain, detect the protected attribute and flip it.
    gender: 0↔1, race: 0↔1 (minority↔majority), age: shift ±10
    """
    protected = model.protected_attribute
    original = model.predict(input_dict)
    cf_input = copy.deepcopy(input_dict)

    # Determine flip
    if protected == "gender":
        cf_input["gender"] = 1 - int(input_dict.get("gender", 0))
        original_label = "Female" if int(input_dict.get("gender", 0)) == 0 else "Male"
        cf_label = "Male" if cf_input["gender"] == 1 else "Female"
        attr_display = "Gender"
    elif protected == "race":
        original_race = int(input_dict.get("race", 0))
        # Flip between minority (0=Black) and majority (1=White)
        cf_input["race"] = 1 if original_race != 1 else 0
        race_map = {0: "Black", 1: "White", 2: "Hispanic", 3: "Asian"}
        original_label = race_map.get(original_race, str(original_race))
        cf_label = race_map.get(cf_input["race"], str(cf_input["race"]))
        attr_display = "Race"
    elif protected == "age":
        original_age = int(input_dict.get("age", 35))
        cf_input["age"] = max(18, original_age - 20) if original_age > 40 else min(65, original_age + 20)
        original_label = f"Age {original_age}"
        cf_label = f"Age {cf_input['age']}"
        attr_display = "Age"
    else:
        return {"bias_detected": False, "explanation": "Protected attribute not supported for counterfactual."}

    counterfactual = model.predict(cf_input)
    bias_detected = original["prediction"] != counterfactual["prediction"]
    confidence_shift = round(abs(original["prob_approved"] - counterfactual["prob_approved"]), 1)

    return {
        "bias_detected": bias_detected,
        "protected_attribute": attr_display,
        "original": {
            "group": original_label,
            "prediction": original["label"],
            "confidence": original["confidence"],
            "prob_approved": original["prob_approved"],
        },
        "counterfactual": {
            "group": cf_label,
            "prediction": counterfactual["label"],
            "confidence": counterfactual["confidence"],
            "prob_approved": counterfactual["prob_approved"],
        },
        "confidence_shift": confidence_shift,
        "explanation": (
            f"Changing {attr_display} from '{original_label}' to '{cf_label}' "
            f"{'CHANGED' if bias_detected else 'did not change'} the outcome. "
            f"Approval probability shifted by {confidence_shift}%."
        ),
    }


# ---------------------------------------------------------------------------
# Demographic Parity — generic
# ---------------------------------------------------------------------------
def demographic_parity_difference(model) -> dict:
    df = model.generate_data()
    feature_cols = model.get_feature_names()
    X = df[feature_cols].values
    X_scaled = model.scaler.transform(X)
    predictions = model.model.predict(X_scaled)
    df["predicted"] = predictions
    protected = model.protected_attribute

    if protected == "gender":
        group_a = df[df["gender"] == 1]["predicted"].mean()   # Male
        group_b = df[df["gender"] == 0]["predicted"].mean()   # Female
        label_a, label_b = "Male", "Female"
    elif protected == "race":
        group_a = df[df["race"] == 1]["predicted"].mean()     # White
        group_b = df[df["race"] == 0]["predicted"].mean()     # Black
        label_a, label_b = "White", "Black"
    else:
        group_a = df[df[protected] >= df[protected].median()]["predicted"].mean()
        group_b = df[df[protected] <  df[protected].median()]["predicted"].mean()
        label_a, label_b = "High", "Low"

    dpd = round(float(group_a - group_b), 4)
    return {
        "group_a_label": label_a,
        "group_b_label": label_b,
        "group_a_rate": round(float(group_a) * 100, 1),
        "group_b_rate": round(float(group_b) * 100, 1),
        "dpd": dpd,
        "dpd_pct": round(dpd * 100, 1),
        "classification": classify_bias(dpd),
    }


# ---------------------------------------------------------------------------
# Equal Opportunity Difference — generic
# ---------------------------------------------------------------------------
def equal_opportunity_difference(model) -> dict:
    df = model.generate_data()
    feature_cols = model.get_feature_names()
    X = df[feature_cols].values
    X_scaled = model.scaler.transform(X)
    predictions = model.model.predict(X_scaled)
    df["predicted"] = predictions
    protected = model.protected_attribute

    truly_positive = df[df["outcome"] == 1]
    if len(truly_positive) == 0:
        return {"eod": 0, "classification": classify_bias(0)}

    if protected == "gender":
        tpr_a = truly_positive[truly_positive["gender"] == 1]["predicted"].mean() if len(truly_positive[truly_positive["gender"] == 1]) > 0 else 0
        tpr_b = truly_positive[truly_positive["gender"] == 0]["predicted"].mean() if len(truly_positive[truly_positive["gender"] == 0]) > 0 else 0
        label_a, label_b = "Male TPR", "Female TPR"
    elif protected == "race":
        tpr_a = truly_positive[truly_positive["race"] == 1]["predicted"].mean() if len(truly_positive[truly_positive["race"] == 1]) > 0 else 0
        tpr_b = truly_positive[truly_positive["race"] == 0]["predicted"].mean() if len(truly_positive[truly_positive["race"] == 0]) > 0 else 0
        label_a, label_b = "White TPR", "Black TPR"
    else:
        mid = df[protected].median()
        tpr_a = truly_positive[truly_positive[protected] >= mid]["predicted"].mean() if len(truly_positive[truly_positive[protected] >= mid]) > 0 else 0
        tpr_b = truly_positive[truly_positive[protected] < mid]["predicted"].mean()  if len(truly_positive[truly_positive[protected] < mid]) > 0 else 0
        label_a, label_b = "High Group TPR", "Low Group TPR"

    eod = round(float(tpr_a - tpr_b), 4)
    return {
        "group_a_label": label_a,
        "group_b_label": label_b,
        "group_a_tpr": round(float(tpr_a) * 100, 1),
        "group_b_tpr": round(float(tpr_b) * 100, 1),
        "eod": eod,
        "eod_pct": round(eod * 100, 1),
        "classification": classify_bias(eod),
    }


# ---------------------------------------------------------------------------
# Full Report
# ---------------------------------------------------------------------------
def full_bias_report(model, input_dict: dict) -> dict:
    cf  = counterfactual_test(model, input_dict)
    dpd = demographic_parity_difference(model)
    eod = equal_opportunity_difference(model)
    return {
        "counterfactual": cf,
        "demographic_parity": dpd,
        "equal_opportunity": eod,
        "overall_bias_level": dpd["classification"]["level"],
        "protected_attribute": model.protected_attribute,
    }

"""
SHAP-based explainability for FairLens AI — updated for multi-domain models.
Works with any BaseDomainModel by reading feature_cols from the model.
"""
import shap
import numpy as np


class Explainer:
    def __init__(self, model: object):
        self.model = model
        self._explainer = None

    def _get_explainer(self):
        if self._explainer is None:
            background = self.model.X_train[:100] if self.model.X_train is not None else None
            self._explainer = shap.TreeExplainer(
                self.model.model,
                data=background,
                feature_perturbation="interventional",
                check_additivity=False,   # suppress numerical precision warning
            )
        return self._explainer

    def explain(self, input_dict: dict) -> dict:
        feature_cols = self.model.get_feature_names()

        # Build human-readable labels — handle both dict and list formats
        feature_labels_raw = self.model.get_feature_labels()
        if isinstance(feature_labels_raw, dict):
            # domain model returns {col: {label: ..., ...}}
            human_labels = [feature_labels_raw.get(c, {}).get("label", c) for c in feature_cols]
        elif isinstance(feature_labels_raw, list):
            human_labels = feature_labels_raw
        else:
            human_labels = feature_cols

        row = [input_dict.get(c, 0) for c in feature_cols]
        X = np.array(row, dtype=float).reshape(1, -1)
        X_scaled = self.model.scaler.transform(X)

        explainer = self._get_explainer()
        shap_values = explainer.shap_values(X_scaled)

        # Handle different shap output shapes
        if isinstance(shap_values, list):
            values = shap_values[1][0]
        else:
            if shap_values.ndim == 3:
                values = shap_values[0, :, 1]
            else:
                values = shap_values[0]

        feature_impacts = []
        for i, col in enumerate(feature_cols):
            feature_impacts.append({
                "feature": col,
                "label": human_labels[i] if i < len(human_labels) else col,
                "value": float(row[i]),
                "shap_value": round(float(values[i]), 4),
                "impact": "positive" if values[i] > 0 else "negative",
            })

        feature_impacts.sort(key=lambda x: abs(x["shap_value"]), reverse=True)

        base = explainer.expected_value
        if isinstance(base, (list, np.ndarray)):
            base = base[1] if len(base) > 1 else base[0]

        return {
            "feature_impacts": feature_impacts,
            "base_value": round(float(base), 4),
        }

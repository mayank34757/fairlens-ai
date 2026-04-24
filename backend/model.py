"""
ML Model: Random Forest for loan approval prediction.
Supports two modes:
  - biased_model: trained with gender feature
  - fair_model: trained without gender feature
"""
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

from data_generator import generate_dataset

FEATURE_COLS_BIASED = ["age", "income", "credit_score", "gender", "education", "employment"]
FEATURE_COLS_FAIR   = ["age", "income", "credit_score", "education", "employment"]

FEATURE_LABELS = {
    "age": "Age",
    "income": "Annual Income",
    "credit_score": "Credit Score",
    "gender": "Gender",
    "education": "Education Level",
    "employment": "Employment Status",
}


class LoanModel:
    def __init__(self, fair_mode: bool = False):
        self.fair_mode = fair_mode
        self.feature_cols = FEATURE_COLS_FAIR if fair_mode else FEATURE_COLS_BIASED
        self.model = RandomForestClassifier(
            n_estimators=200,
            max_depth=8,
            random_state=42,
            class_weight="balanced",
        )
        self.scaler = StandardScaler()
        self.trained = False
        self.X_train = None
        self.y_train = None

    def train(self, df: pd.DataFrame | None = None):
        if df is None:
            df = generate_dataset()

        X = df[self.feature_cols].values
        y = df["approved"].values

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled  = self.scaler.transform(X_test)

        self.model.fit(X_train_scaled, y_train)
        self.X_train = X_train_scaled
        self.y_train = y_train
        self.trained = True

        accuracy = self.model.score(X_test_scaled, y_test)
        return {"accuracy": round(accuracy, 4), "n_train": len(X_train)}

    def predict(self, input_dict: dict) -> dict:
        """
        input_dict keys: age, income, credit_score, gender, education, employment
        Returns: {prediction, confidence, probabilities}
        """
        row = [input_dict.get(c, 0) for c in self.feature_cols]
        X = np.array(row).reshape(1, -1)
        X_scaled = self.scaler.transform(X)
        proba = self.model.predict_proba(X_scaled)[0]
        label = int(np.argmax(proba))
        return {
            "prediction": label,
            "label": "Approved" if label == 1 else "Rejected",
            "confidence": round(float(proba[label]) * 100, 1),
            "prob_approved": round(float(proba[1]) * 100, 1),
            "prob_rejected": round(float(proba[0]) * 100, 1),
        }

    def get_feature_names(self) -> list[str]:
        return self.feature_cols

    def get_feature_labels(self) -> list[str]:
        return [FEATURE_LABELS.get(c, c) for c in self.feature_cols]

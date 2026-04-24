"""
FairLens AI — Multi-Domain Models
Each domain has its own synthetic data generator and ML model.
Protected attributes and bias are intentionally injected for demo purposes.
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler


# ---------------------------------------------------------------------------
# Base Domain Model
# ---------------------------------------------------------------------------
class BaseDomainModel:
    """Generic model that any domain can inherit from."""

    domain_name: str = "base"
    label_positive: str = "Approved"
    label_negative: str = "Rejected"
    protected_attribute: str = "gender"  # primary protected attribute

    def __init__(self, fair_mode: bool = False):
        self.fair_mode = fair_mode
        self.trained = False
        self.model = RandomForestClassifier(
            n_estimators=200, max_depth=8, random_state=42, class_weight="balanced"
        )
        self.scaler = StandardScaler()
        self.X_train = None
        self.y_train = None

    def generate_data(self) -> pd.DataFrame:
        raise NotImplementedError

    @property
    def feature_cols(self) -> list[str]:
        raise NotImplementedError

    @property
    def feature_cols_fair(self) -> list[str]:
        """Columns without protected attributes."""
        raise NotImplementedError

    def get_feature_names(self) -> list[str]:
        return self.feature_cols_fair if self.fair_mode else self.feature_cols

    def get_feature_labels(self) -> dict:
        raise NotImplementedError

    def train(self, df: pd.DataFrame | None = None):
        if df is None:
            df = self.generate_data()
        cols = self.get_feature_names()
        X = df[cols].values
        y = df["outcome"].values
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        X_train_s = self.scaler.fit_transform(X_train)
        X_test_s = self.scaler.transform(X_test)
        self.model.fit(X_train_s, y_train)
        self.X_train = X_train_s
        self.y_train = y_train
        self.trained = True
        accuracy = self.model.score(X_test_s, y_test)
        return {"accuracy": round(accuracy, 4), "n_train": len(X_train)}

    def predict(self, input_dict: dict) -> dict:
        cols = self.get_feature_names()
        row = [input_dict.get(c, 0) for c in cols]
        X = np.array(row, dtype=float).reshape(1, -1)
        X_s = self.scaler.transform(X)
        proba = self.model.predict_proba(X_s)[0]
        label = int(np.argmax(proba))
        return {
            "prediction": label,
            "label": self.label_positive if label == 1 else self.label_negative,
            "confidence": round(float(proba[label]) * 100, 1),
            "prob_approved": round(float(proba[1]) * 100, 1),
            "prob_rejected": round(float(proba[0]) * 100, 1),
        }


# ---------------------------------------------------------------------------
# 1. LOAN APPROVAL (existing, refactored)
# ---------------------------------------------------------------------------
class LoanDomain(BaseDomainModel):
    domain_name = "loan"
    label_positive = "Approved"
    label_negative = "Rejected"
    protected_attribute = "gender"
    domain_label = "Loan Approval"
    domain_icon = "🏦"
    domain_description = "Bank loan approval decisions"

    _feature_cols = ["age", "income", "credit_score", "gender", "education", "employment"]
    _feature_cols_fair = ["age", "income", "credit_score", "education", "employment"]

    @property
    def feature_cols(self):
        return self._feature_cols

    @property
    def feature_cols_fair(self):
        return self._feature_cols_fair

    def get_feature_labels(self):
        return {
            "age": {"label": "Age", "type": "number", "min": 18, "max": 75, "example": 35},
            "income": {"label": "Annual Income ($)", "type": "number", "min": 15000, "max": 300000, "example": 60000},
            "credit_score": {"label": "Credit Score", "type": "number", "min": 300, "max": 850, "example": 680},
            "gender": {"label": "Gender", "type": "select", "options": [{"value": 0, "label": "Female"}, {"value": 1, "label": "Male"}], "example": 0},
            "education": {"label": "Education Level", "type": "select", "options": [{"value": 0, "label": "High School"}, {"value": 1, "label": "Bachelor's"}, {"value": 2, "label": "Master's"}, {"value": 3, "label": "PhD"}], "example": 1},
            "employment": {"label": "Employment Status", "type": "select", "options": [{"value": 0, "label": "Unemployed"}, {"value": 1, "label": "Part-Time"}, {"value": 2, "label": "Full-Time"}, {"value": 3, "label": "Self-Employed"}], "example": 2},
        }

    def generate_data(self) -> pd.DataFrame:
        rng = np.random.RandomState(42)
        n = 2000
        gender = rng.choice([0, 1], size=n, p=[0.5, 0.5])
        age = rng.randint(22, 65, size=n)
        education = rng.choice([0, 1, 2, 3], size=n, p=[0.2, 0.5, 0.2, 0.1])
        employment = rng.choice([0, 1, 2, 3], size=n, p=[0.1, 0.2, 0.6, 0.1])
        base_income = education * 15000 + employment * 12000 + age * 500 + rng.normal(0, 8000, n)
        income = np.clip(base_income + gender * base_income * 0.20, 15000, 300000).astype(int)
        credit_score = np.clip(300 + (income / 300000) * 550 + rng.normal(0, 60, n), 300, 850).astype(int)
        merit = (credit_score - 300) / 550 * 0.45 + (income - 15000) / 285000 * 0.35 + employment / 3 * 0.10 + education / 3 * 0.10
        outcome = (merit + gender * 0.12 + rng.normal(0, 0.05, n) > 0.50).astype(int)
        return pd.DataFrame({"age": age, "income": income, "credit_score": credit_score, "gender": gender, "education": education, "employment": employment, "outcome": outcome})

    def sample_inputs(self):
        return [
            {"age": 38, "income": 82000, "credit_score": 710, "gender": 0, "education": 2, "employment": 2},
            {"age": 34, "income": 95000, "credit_score": 760, "gender": 1, "education": 2, "employment": 2},
            {"age": 26, "income": 42000, "credit_score": 610, "gender": 0, "education": 0, "employment": 1},
        ]


# ---------------------------------------------------------------------------
# 2. JOB HIRING
# ---------------------------------------------------------------------------
class HiringDomain(BaseDomainModel):
    domain_name = "hiring"
    label_positive = "Hired"
    label_negative = "Rejected"
    protected_attribute = "gender"
    domain_label = "Job Hiring"
    domain_icon = "💼"
    domain_description = "AI resume screening & hiring decisions"

    _feature_cols = ["age", "experience_yrs", "skills_score", "gender", "race", "education"]
    _feature_cols_fair = ["age", "experience_yrs", "skills_score", "education"]

    @property
    def feature_cols(self):
        return self._feature_cols

    @property
    def feature_cols_fair(self):
        return self._feature_cols_fair

    def get_feature_labels(self):
        return {
            "age": {"label": "Age", "type": "number", "min": 18, "max": 60, "example": 28},
            "experience_yrs": {"label": "Years of Experience", "type": "number", "min": 0, "max": 35, "example": 5},
            "skills_score": {"label": "Skills Assessment Score (0-100)", "type": "number", "min": 0, "max": 100, "example": 72},
            "gender": {"label": "Gender", "type": "select", "options": [{"value": 0, "label": "Female"}, {"value": 1, "label": "Male"}], "example": 0},
            "race": {"label": "Race / Ethnicity", "type": "select", "options": [{"value": 0, "label": "Black"}, {"value": 1, "label": "White"}, {"value": 2, "label": "Hispanic"}, {"value": 3, "label": "Asian"}], "example": 0},
            "education": {"label": "Education Level", "type": "select", "options": [{"value": 0, "label": "High School"}, {"value": 1, "label": "Bachelor's"}, {"value": 2, "label": "Master's"}, {"value": 3, "label": "PhD"}], "example": 1},
        }

    def generate_data(self) -> pd.DataFrame:
        rng = np.random.RandomState(7)
        n = 2000
        gender = rng.choice([0, 1], size=n)  # 0=Female 1=Male
        race = rng.choice([0, 1, 2, 3], size=n, p=[0.2, 0.5, 0.2, 0.1])  # 0=Black 1=White 2=Hispanic 3=Asian
        age = rng.randint(21, 55, size=n)
        education = rng.choice([0, 1, 2, 3], size=n, p=[0.15, 0.5, 0.25, 0.1])
        experience_yrs = np.clip(rng.randint(0, 20, size=n) + education * 2, 0, 35)
        skills_score = np.clip(40 + experience_yrs * 2 + education * 8 + rng.normal(0, 10, n), 0, 100).astype(int)

        # Merit score
        merit = skills_score / 100 * 0.50 + experience_yrs / 35 * 0.30 + education / 3 * 0.20
        # BIAS: gender + race affect hiring probability
        bias = gender * 0.10 + (race == 1).astype(int) * 0.08  # males and white candidates favoured
        outcome = (merit + bias + rng.normal(0, 0.05, n) > 0.55).astype(int)

        return pd.DataFrame({"age": age, "experience_yrs": experience_yrs, "skills_score": skills_score, "gender": gender, "race": race, "education": education, "outcome": outcome})

    def sample_inputs(self):
        return [
            {"age": 29, "experience_yrs": 6, "skills_score": 78, "gender": 0, "race": 0, "education": 1},
            {"age": 29, "experience_yrs": 6, "skills_score": 78, "gender": 1, "race": 1, "education": 1},
            {"age": 35, "experience_yrs": 12, "skills_score": 88, "gender": 0, "race": 2, "education": 2},
        ]


# ---------------------------------------------------------------------------
# 3. HEALTHCARE — Treatment Recommendation
# ---------------------------------------------------------------------------
class HealthcareDomain(BaseDomainModel):
    domain_name = "healthcare"
    label_positive = "Treatment Recommended"
    label_negative = "Treatment Denied"
    protected_attribute = "race"
    domain_label = "Healthcare"
    domain_icon = "🏥"
    domain_description = "Medical treatment recommendation bias"

    _feature_cols = ["age", "income", "symptom_severity", "race", "insurance_type", "num_visits"]
    _feature_cols_fair = ["age", "income", "symptom_severity", "insurance_type", "num_visits"]

    @property
    def feature_cols(self):
        return self._feature_cols

    @property
    def feature_cols_fair(self):
        return self._feature_cols_fair

    def get_feature_labels(self):
        return {
            "age": {"label": "Patient Age", "type": "number", "min": 1, "max": 95, "example": 45},
            "income": {"label": "Annual Income ($)", "type": "number", "min": 0, "max": 300000, "example": 45000},
            "symptom_severity": {"label": "Symptom Severity (1-10)", "type": "number", "min": 1, "max": 10, "example": 6},
            "race": {"label": "Race / Ethnicity", "type": "select", "options": [{"value": 0, "label": "Black"}, {"value": 1, "label": "White"}, {"value": 2, "label": "Hispanic"}, {"value": 3, "label": "Asian"}], "example": 0},
            "insurance_type": {"label": "Insurance Type", "type": "select", "options": [{"value": 0, "label": "No Insurance"}, {"value": 1, "label": "Medicaid"}, {"value": 2, "label": "Private"}, {"value": 3, "label": "Premium"}], "example": 1},
            "num_visits": {"label": "Prior Hospital Visits", "type": "number", "min": 0, "max": 50, "example": 3},
        }

    def generate_data(self) -> pd.DataFrame:
        rng = np.random.RandomState(13)
        n = 2000
        race = rng.choice([0, 1, 2, 3], size=n, p=[0.2, 0.5, 0.2, 0.1])
        age = rng.randint(18, 80, size=n)
        income = np.clip(rng.normal(50000, 20000, n), 0, 300000).astype(int)
        insurance_type = rng.choice([0, 1, 2, 3], size=n, p=[0.15, 0.30, 0.40, 0.15])
        symptom_severity = rng.randint(1, 11, size=n)
        num_visits = rng.poisson(3, n)

        merit = symptom_severity / 10 * 0.40 + insurance_type / 3 * 0.30 + num_visits / 20 * 0.20 + income / 300000 * 0.10
        # BIAS: white patients get more treatment recommendations
        bias = (race == 1).astype(int) * 0.12
        outcome = (merit + bias + rng.normal(0, 0.05, n) > 0.50).astype(int)

        return pd.DataFrame({"age": age, "income": income, "symptom_severity": symptom_severity, "race": race, "insurance_type": insurance_type, "num_visits": num_visits, "outcome": outcome})

    def sample_inputs(self):
        return [
            {"age": 45, "income": 40000, "symptom_severity": 7, "race": 0, "insurance_type": 1, "num_visits": 4},
            {"age": 45, "income": 40000, "symptom_severity": 7, "race": 1, "insurance_type": 1, "num_visits": 4},
            {"age": 62, "income": 25000, "symptom_severity": 8, "race": 2, "insurance_type": 0, "num_visits": 6},
        ]


# ---------------------------------------------------------------------------
# 4. HOUSING / RENTAL
# ---------------------------------------------------------------------------
class HousingDomain(BaseDomainModel):
    domain_name = "housing"
    label_positive = "Approved"
    label_negative = "Denied"
    protected_attribute = "race"
    domain_label = "Housing / Rental"
    domain_icon = "🏠"
    domain_description = "Property rental & mortgage approval bias"

    _feature_cols = ["income", "credit_score", "debt_ratio", "race", "employment", "neighborhood_score"]
    _feature_cols_fair = ["income", "credit_score", "debt_ratio", "employment", "neighborhood_score"]

    @property
    def feature_cols(self):
        return self._feature_cols

    @property
    def feature_cols_fair(self):
        return self._feature_cols_fair

    def get_feature_labels(self):
        return {
            "income": {"label": "Annual Income ($)", "type": "number", "min": 10000, "max": 300000, "example": 55000},
            "credit_score": {"label": "Credit Score", "type": "number", "min": 300, "max": 850, "example": 650},
            "debt_ratio": {"label": "Debt-to-Income Ratio (%)", "type": "number", "min": 0, "max": 100, "example": 35},
            "race": {"label": "Race / Ethnicity", "type": "select", "options": [{"value": 0, "label": "Black"}, {"value": 1, "label": "White"}, {"value": 2, "label": "Hispanic"}, {"value": 3, "label": "Asian"}], "example": 0},
            "employment": {"label": "Employment Status", "type": "select", "options": [{"value": 0, "label": "Unemployed"}, {"value": 1, "label": "Part-Time"}, {"value": 2, "label": "Full-Time"}, {"value": 3, "label": "Self-Employed"}], "example": 2},
            "neighborhood_score": {"label": "Neighborhood Desirability Score (1-10)", "type": "number", "min": 1, "max": 10, "example": 6},
        }

    def generate_data(self) -> pd.DataFrame:
        rng = np.random.RandomState(99)
        n = 2000
        race = rng.choice([0, 1, 2, 3], size=n, p=[0.2, 0.5, 0.2, 0.1])
        income = np.clip(rng.normal(55000, 22000, n), 10000, 300000).astype(int)
        credit_score = np.clip(300 + (income / 300000) * 550 + rng.normal(0, 60, n), 300, 850).astype(int)
        debt_ratio = np.clip(rng.normal(35, 15, n), 0, 100).astype(int)
        employment = rng.choice([0, 1, 2, 3], n, p=[0.1, 0.2, 0.6, 0.1])
        neighborhood_score = rng.randint(1, 11, n)

        merit = (credit_score - 300) / 550 * 0.40 + income / 300000 * 0.30 + (1 - debt_ratio / 100) * 0.20 + employment / 3 * 0.10
        bias = (race == 1).astype(int) * 0.10 + (race == 3).astype(int) * 0.05  # white & Asian favoured
        outcome = (merit + bias + rng.normal(0, 0.05, n) > 0.50).astype(int)

        return pd.DataFrame({"income": income, "credit_score": credit_score, "debt_ratio": debt_ratio, "race": race, "employment": employment, "neighborhood_score": neighborhood_score, "outcome": outcome})

    def sample_inputs(self):
        return [
            {"income": 55000, "credit_score": 680, "debt_ratio": 30, "race": 0, "employment": 2, "neighborhood_score": 6},
            {"income": 55000, "credit_score": 680, "debt_ratio": 30, "race": 1, "employment": 2, "neighborhood_score": 6},
            {"income": 38000, "credit_score": 620, "debt_ratio": 45, "race": 2, "employment": 1, "neighborhood_score": 4},
        ]


# ---------------------------------------------------------------------------
# 5. COLLEGE ADMISSION
# ---------------------------------------------------------------------------
class CollegeDomain(BaseDomainModel):
    domain_name = "college"
    label_positive = "Admitted"
    label_negative = "Rejected"
    protected_attribute = "race"
    domain_label = "College Admission"
    domain_icon = "🎓"
    domain_description = "University admissions algorithm bias"

    _feature_cols = ["gpa", "test_score", "extracurricular", "race", "gender", "income"]
    _feature_cols_fair = ["gpa", "test_score", "extracurricular", "income"]

    @property
    def feature_cols(self):
        return self._feature_cols

    @property
    def feature_cols_fair(self):
        return self._feature_cols_fair

    def get_feature_labels(self):
        return {
            "gpa": {"label": "GPA (0.0 – 4.0)", "type": "number", "min": 0.0, "max": 4.0, "step": 0.1, "example": 3.5},
            "test_score": {"label": "SAT/ACT Score (400–1600)", "type": "number", "min": 400, "max": 1600, "example": 1200},
            "extracurricular": {"label": "Extracurricular Score (1-10)", "type": "number", "min": 1, "max": 10, "example": 6},
            "race": {"label": "Race / Ethnicity", "type": "select", "options": [{"value": 0, "label": "Black"}, {"value": 1, "label": "White"}, {"value": 2, "label": "Hispanic"}, {"value": 3, "label": "Asian"}], "example": 0},
            "gender": {"label": "Gender", "type": "select", "options": [{"value": 0, "label": "Female"}, {"value": 1, "label": "Male"}], "example": 0},
            "income": {"label": "Family Income ($)", "type": "number", "min": 0, "max": 500000, "example": 60000},
        }

    def generate_data(self) -> pd.DataFrame:
        rng = np.random.RandomState(55)
        n = 2000
        race = rng.choice([0, 1, 2, 3], size=n, p=[0.2, 0.5, 0.2, 0.1])
        gender = rng.choice([0, 1], n)
        income = np.clip(rng.normal(70000, 30000, n), 0, 500000).astype(int)
        gpa = np.clip(rng.normal(3.2, 0.5, n), 0.0, 4.0).round(2)
        test_score = np.clip(rng.normal(1100, 200, n), 400, 1600).astype(int)
        extracurricular = np.clip(rng.randint(1, 11, n), 1, 10)

        merit = gpa / 4.0 * 0.40 + (test_score - 400) / 1200 * 0.35 + extracurricular / 10 * 0.15 + income / 500000 * 0.10
        # BIAS: legacy admissions benefit white + higher income
        bias = (race == 1).astype(int) * 0.08 + income / 500000 * 0.08
        outcome = (merit + bias + rng.normal(0, 0.05, n) > 0.55).astype(int)

        return pd.DataFrame({"gpa": gpa, "test_score": test_score, "extracurricular": extracurricular, "race": race, "gender": gender, "income": income, "outcome": outcome})

    def sample_inputs(self):
        return [
            {"gpa": 3.8, "test_score": 1300, "extracurricular": 8, "race": 0, "gender": 1, "income": 50000},
            {"gpa": 3.8, "test_score": 1300, "extracurricular": 8, "race": 1, "gender": 1, "income": 50000},
            {"gpa": 3.4, "test_score": 1150, "extracurricular": 6, "race": 2, "gender": 0, "income": 35000},
        ]

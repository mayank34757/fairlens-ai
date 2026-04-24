"""
FairLens AI — Domain Registry
Central registry mapping domain names to model classes.
"""
from domain_models import (
    LoanDomain,
    HiringDomain,
    HealthcareDomain,
    HousingDomain,
    CollegeDomain,
)

DOMAIN_REGISTRY: dict[str, type] = {
    "loan":       LoanDomain,
    "hiring":     HiringDomain,
    "healthcare": HealthcareDomain,
    "housing":    HousingDomain,
    "college":    CollegeDomain,
}

DOMAIN_META = {
    "loan":       {"label": "Loan Approval",    "icon": "🏦", "desc": "Bank loan approval decisions",              "protected": "gender"},
    "hiring":     {"label": "Job Hiring",        "icon": "💼", "desc": "AI resume screening & hiring decisions",    "protected": "gender & race"},
    "healthcare": {"label": "Healthcare",        "icon": "🏥", "desc": "Medical treatment recommendation bias",     "protected": "race"},
    "housing":    {"label": "Housing / Rental",  "icon": "🏠", "desc": "Property rental & mortgage approval bias", "protected": "race"},
    "college":    {"label": "College Admission", "icon": "🎓", "desc": "University admissions algorithm bias",      "protected": "race & gender"},
}


def get_domain(name: str):
    cls = DOMAIN_REGISTRY.get(name)
    if cls is None:
        raise ValueError(f"Unknown domain '{name}'. Valid: {list(DOMAIN_REGISTRY)}")
    return cls

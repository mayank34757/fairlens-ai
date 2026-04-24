"""
Synthetic loan dataset generator with intentional gender bias injected
for demonstrating FairLens AI bias detection capabilities.
"""
import numpy as np
import pandas as pd


def generate_dataset(n_samples: int = 2000, random_state: int = 42) -> pd.DataFrame:
    rng = np.random.RandomState(random_state)

    # Demographics
    gender = rng.choice([0, 1], size=n_samples, p=[0.5, 0.5])  # 0=Female, 1=Male
    age = rng.randint(22, 65, size=n_samples)

    # Education: 0=HighSchool, 1=Bachelor, 2=Master, 3=PhD
    education = rng.choice([0, 1, 2, 3], size=n_samples, p=[0.2, 0.5, 0.2, 0.1])

    # Employment: 0=Unemployed, 1=PartTime, 2=FullTime, 3=SelfEmployed
    employment = rng.choice([0, 1, 2, 3], size=n_samples, p=[0.1, 0.2, 0.6, 0.1])

    # Income: influenced by gender (BIAS INJECTED HERE)
    base_income = (
        education * 15000
        + employment * 12000
        + age * 500
        + rng.normal(0, 8000, size=n_samples)
    )
    # Males get a 20% income boost to simulate systemic bias
    income = base_income + gender * base_income * 0.20
    income = np.clip(income, 15000, 300000).astype(int)

    # Credit score: slightly correlated with income
    credit_score = np.clip(
        300 + (income / 300000) * 550 + rng.normal(0, 60, size=n_samples),
        300,
        850,
    ).astype(int)

    # Fair approval logic (merit-based)
    merit_score = (
        (credit_score - 300) / 550 * 0.45
        + (income - 15000) / 285000 * 0.35
        + employment / 3 * 0.10
        + education / 3 * 0.10
    )

    # BIAS: add gender weight to approval probability (simulates biased model)
    biased_approval_prob = merit_score + gender * 0.12 + rng.normal(0, 0.05, n_samples)
    approved = (biased_approval_prob > 0.50).astype(int)

    df = pd.DataFrame(
        {
            "age": age,
            "income": income,
            "credit_score": credit_score,
            "gender": gender,  # 0=Female, 1=Male
            "education": education,
            "employment": employment,
            "approved": approved,
        }
    )
    return df


if __name__ == "__main__":
    df = generate_dataset()
    df.to_csv("sample_dataset.csv", index=False)
    print(f"Dataset generated: {len(df)} rows")
    print(df.head())
    print("\nApproval rates by gender:")
    print(df.groupby("gender")["approved"].mean())

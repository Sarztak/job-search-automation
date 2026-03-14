import pandas as pd
import os

# ── Input ──────────────────────────────────────────────────────────────────────
INPUT_CSV = "linkedin_profiles.csv"   # output from the Chrome extension
OUTPUT_DIR = "filtered"               # folder where bucket CSVs will be saved

os.makedirs(OUTPUT_DIR, exist_ok=True)

df = pd.read_csv(INPUT_CSV)

# Normalize headline to lowercase for case-insensitive matching
df["headline_lower"] = df["headline"].fillna("").str.lower()


# ── Bucket definitions ─────────────────────────────────────────────────────────

# Bucket 1 — Direct role match
# People whose headline signals they work in data / AI / ML directly
ROLE_KEYWORDS = [
    "data scientist", "data science",
    "machine learning", "\\bml\\b",
    "artificial intelligence", "\\bai\\b",
    "deep learning",
    "generative ai", "genai", "gen ai",
    "\\bllm\\b", "large language model",
    "\\bnlp\\b", "natural language",
    "computer vision",
    "data engineer", "data engineering",
    "data analyst", "data analysis",
    "analytics", "analytical",
    "bioinformatics",
    "computational",
    "quantitative", "\\bquant\\b",
    "research scientist", "research engineer",
    "applied scientist",
    "statistician", "statistics",
    "predictive",
    "agentic ai", "agentic",
    "recommender",
    "mlops", "productionizing ml",
]

# Bucket 2 — High-value connectors at top companies / institutions
CONNECTOR_KEYWORDS = [
    # Big tech
    "google", "meta", "microsoft", "amazon", "apple", "netflix",
    "openai", "anthropic", "deepmind", "nvidia", "databricks",
    "stripe", "uber", "pinterest", "shopify",
    # Finance / quant
    "goldman sachs", "two sigma", "citadel", "squarepoint", "mckinsey",
    # Top universities
    "mit ", "stanford", "harvard", "carnegie mellon", "\\bcmu\\b",
    "uc berkeley", "northwestern", "university of chicago",
    # Research labs
    "argonne", "intel labs", "ibm research", "jhu apl",
]

# Bucket 3 — Recruiters
RECRUITER_KEYWORDS = [
    "recruiter", "talent acquisition", "technical sourcer", "hiring manager",
]

# Bucket 4 — Academia (professors, PhD students, postdocs, researchers)
ACADEMIA_KEYWORDS = [
    "professor", "phd candidate", "phd student", "postdoc",
    "postdoctoral", "research associate", "research fellow",
    "assistant professor", "associate professor", "faculty",
]


# ── Matching helper ────────────────────────────────────────────────────────────

def matches_any(series, keywords):
    """Return a boolean Series — True if the value matches any keyword (regex)."""
    pattern = "|".join(keywords)
    return series.str.contains(pattern, regex=True, na=False)


# ── Apply buckets ──────────────────────────────────────────────────────────────

bucket1 = df[matches_any(df["headline_lower"], ROLE_KEYWORDS)].copy()
bucket2 = df[matches_any(df["headline_lower"], CONNECTOR_KEYWORDS)].copy()
bucket3 = df[matches_any(df["headline_lower"], RECRUITER_KEYWORDS)].copy()
bucket4 = df[matches_any(df["headline_lower"], ACADEMIA_KEYWORDS)].copy()

# Drop the helper column before saving
for bucket in [bucket1, bucket2, bucket3, bucket4]:
    bucket.drop(columns=["headline_lower"], inplace=True)


# ── Save CSVs ──────────────────────────────────────────────────────────────────

bucket1.to_csv(f"{OUTPUT_DIR}/bucket1_direct_roles.csv", index=False)
bucket2.to_csv(f"{OUTPUT_DIR}/bucket2_connectors.csv", index=False)
bucket3.to_csv(f"{OUTPUT_DIR}/bucket3_recruiters.csv", index=False)
bucket4.to_csv(f"{OUTPUT_DIR}/bucket4_academia.csv", index=False)

# ── Summary ────────────────────────────────────────────────────────────────────

print(f"Total profiles loaded       : {len(df)}")
print(f"Bucket 1 - Direct roles     : {len(bucket1)}")
print(f"Bucket 2 - Connectors       : {len(bucket2)}")
print(f"Bucket 3 - Recruiters       : {len(bucket3)}")
print(f"Bucket 4 - Academia         : {len(bucket4)}")
print(f"\nCSVs saved to: {OUTPUT_DIR}/")
import os
import joblib
import numpy as np
import pandas as pd

from lightgbm import LGBMRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


# ============================================================
# Configuration
# ============================================================

_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(_BASE_DIR, "website", "cairo Real-Estate-revised.csv")
MODEL_PATH = os.path.join(_BASE_DIR, "website", "lightgbm_model.pkl")

FEATURE_COLUMNS = [
    "Area",
    "Bedrooms",
    "Bathrooms",
    "Floor",
    "YearBuilt",
    "Payment",
    "Finishing",
    "Furnished",
    "Parking",
    "Security",

    "View_Garden",
    "View_Lake",
    "View_Other",
    "View_Pool",
    "View_Street",

    "Location_6th of October",
    "Location_Ain Shams",
    "Location_Al-Haram",
    "Location_Heliopolis",
    "Location_Maadi",
    "Location_Madinaty",
    "Location_Nasr City",
    "Location_New Cairo",
    "Location_Sheikh Zayed",
    "Location_Shubra"
]

TARGET_COLUMN = "Price"


# ============================================================
# Dataset preprocessing
# ============================================================

def prepare_dataset():
    df = pd.read_csv(DATASET_PATH)

    # Remove columns that are not part of the ML model
    df = df.drop(
        columns=[
            "ID",
            "City",
            "Seller",
            "SchoolDist",
            "Color"
        ],
        errors="ignore"
    )

    # --------------------------------------------------------
    # Clean categorical text
    # --------------------------------------------------------

    for column in ["Location", "View", "Payment", "Finishing",
                   "Furnished", "Parking", "Security"]:

        if column in df.columns:
            df[column] = (
                df[column]
                .astype("string")
                .str.strip()
            )

    # Normalize values that may have inconsistent capitalization
    if "Payment" in df.columns:
        df["Payment"] = df["Payment"].str.lower()

    if "Finishing" in df.columns:
        df["Finishing"] = df["Finishing"].str.lower()

    if "Furnished" in df.columns:
        df["Furnished"] = df["Furnished"].str.lower()

    if "Parking" in df.columns:
        df["Parking"] = df["Parking"].str.lower()

    if "Security" in df.columns:
        df["Security"] = df["Security"].str.lower()

    # --------------------------------------------------------
    # Numerical missing values
    # --------------------------------------------------------

    numerical_columns = [
        "Area",
        "Bedrooms",
        "Bathrooms",
        "Floor",
        "YearBuilt"
    ]

    for column in numerical_columns:
        if column in df.columns:
            df[column] = pd.to_numeric(
                df[column],
                errors="coerce"
            )

            # Use the training-data median for missing values
            df[column] = df[column].fillna(df[column].median())

    # --------------------------------------------------------
    # Binary encoding
    # --------------------------------------------------------

    if "Finishing" in df.columns:
        df["Finishing"] = df["Finishing"].map({
            "finished": 1,
            "unfinished": 0
        })

    if "Payment" in df.columns:
        df["Payment"] = df["Payment"].map({
            "cash": 1,
            "installments": 0
        })

    if "Furnished" in df.columns:
        df["Furnished"] = df["Furnished"].map({
            "furnished": 1,
            "unfurnished": 0
        })

    if "Parking" in df.columns:
        df["Parking"] = df["Parking"].map({
            "yes": 1,
            "no": 0
        })

    if "Security" in df.columns:
        df["Security"] = df["Security"].map({
            "yes": 1,
            "no": 0
        })

    # --------------------------------------------------------
    # One-hot encode View and Location
    # --------------------------------------------------------

    if "View" in df.columns:
        df = pd.get_dummies(
            df,
            columns=["View"],
            dtype=int
        )

    if "Location" in df.columns:
        df = pd.get_dummies(
            df,
            columns=["Location"],
            dtype=int
        )

    # --------------------------------------------------------
    # Make sure every expected feature exists
    # --------------------------------------------------------

    for column in FEATURE_COLUMNS:
        if column not in df.columns:
            df[column] = 0

    # Keep ONLY the features used by the model
    X = df[FEATURE_COLUMNS].copy()

    y = pd.to_numeric(
        df[TARGET_COLUMN],
        errors="coerce"
    )

    # Remove rows where target is missing
    valid_rows = y.notna()

    X = X.loc[valid_rows]
    y = y.loc[valid_rows]

    # Any remaining invalid feature values become NaN.
    # LightGBM can handle NaN values.
    X = X.apply(pd.to_numeric, errors="coerce")

    return X, y


# ============================================================
# Train model
# ============================================================

def train_model():
    X, y = prepare_dataset()

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42
    )

    model = LGBMRegressor(
        objective="regression",
        n_estimators=500,
        learning_rate=0.05,
        num_leaves=31,
        max_depth=-1,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        verbosity=-1
    )

    model.fit(
        X_train,
        y_train
    )

    # Evaluate model
    y_pred = model.predict(X_test)

    mae = mean_absolute_error(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_test, y_pred)

    print("\n===================================")
    print("LightGBM Model Evaluation")
    print("===================================")
    print(f"MAE:  {mae:.2f}")
    print(f"MSE:  {mse:.2f}")
    print(f"RMSE: {rmse:.2f}")
    print(f"R2:   {r2:.4f}")
    print("===================================\n")

    # Save model together with feature names
    model_data = {
        "model": model,
        "features": FEATURE_COLUMNS
    }

    joblib.dump(
        model_data,
        MODEL_PATH
    )

    return model_data


# ============================================================
# Train a new model every time
# ============================================================

model_data = train_model()

model = model_data["model"]
MODEL_FEATURES = model_data["features"]


# ============================================================
# Prediction
# ============================================================

def predict_price(data: dict) -> float:
    """
    Receive the 25 ML-ready features from the API.

    Missing values can be None.
    None is converted to NaN and LightGBM handles it.
    """

    # Create one-row DataFrame
    input_df = pd.DataFrame([data])

    # Make sure all expected columns exist
    for column in MODEL_FEATURES:
        if column not in input_df.columns:
            input_df[column] = np.nan

    # Ignore anything that is not an approved model feature
    input_df = input_df[MODEL_FEATURES]

    # Convert everything to numeric.
    # JSON null becomes NaN.
    input_df = input_df.apply(
        pd.to_numeric,
        errors="coerce"
    )

    prediction = model.predict(input_df)[0]

    # Prevent impossible negative property prices
    prediction = max(0, prediction)

    return float(prediction)

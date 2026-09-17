import numpy as np
import pandas as pd

from lightgbm import LGBMRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import r2_score


df = pd.read_csv("website/cairo Real-Estate-revised.csv")

numerical_columns = ["Area", "Bedrooms", "Bathrooms", "Floor"]

for col in numerical_columns:
    df[col] = df[col].fillna(df[col].median())

df = df.drop(columns=["ID", "City"], errors="ignore")

numerical_columns = [
    "Area",
    "Bedrooms",
    "Bathrooms",
    "Floor",
    "Price"
]

for col in numerical_columns:
    Q1 = df[col].quantile(0.25)
    Q3 = df[col].quantile(0.75)

    IQR = Q3 - Q1

    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR

    df = df[
        (df[col] >= lower_bound) &
        (df[col] <= upper_bound)
    ]

for col in [
    "Location",
    "View",
    "Payment",
    "Finishing",
    "Furnished",
    "Parking",
    "Security"
]:
    df[col] = df[col].astype("string").str.strip()

df["Payment"] = df["Payment"].str.lower()
df["Finishing"] = df["Finishing"].str.lower()
df["Furnished"] = df["Furnished"].str.lower()
df["Parking"] = df["Parking"].str.lower()
df["Security"] = df["Security"].str.lower()

numerical_columns = [
    "Area",
    "Bedrooms",
    "Bathrooms",
    "Floor",
    "YearBuilt"
]

for col in numerical_columns:
    df[col] = pd.to_numeric(df[col], errors="coerce")
    df[col] = df[col].fillna(df[col].median())

# Encode binary columns
df["Finishing"] = df["Finishing"].map({
    "finished": 1,
    "unfinished": 0
})

df["Payment"] = df["Payment"].map({
    "cash": 1,
    "installments": 0
})

df["Furnished"] = df["Furnished"].map({
    "furnished": 1,
    "unfurnished": 0
})

df["Parking"] = df["Parking"].map({
    "yes": 1,
    "no": 0
})

df["Security"] = df["Security"].map({
    "yes": 1,
    "no": 0
})

label_encoder = LabelEncoder()
df["Color"] = label_encoder.fit_transform(df["Color"]) + 1

label_encoder = LabelEncoder()
df["Seller"] = label_encoder.fit_transform(df["Seller"]) + 1

df = pd.get_dummies(df, columns=["View"], dtype=int)
df = pd.get_dummies(df, columns=["Location"], dtype=int)
df = df.dropna(subset=["Price"])

X = df.drop(columns=["Price"])
y = df["Price"]
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

model = LGBMRegressor(
    n_estimators=100,
    random_state=42,
    verbosity=-1
)

model.fit(X_train, y_train)
y_pred = model.predict(X_test)
r2 = r2_score(y_test, y_pred)

print(r2)
from flask import Flask, request, jsonify
import joblib
import numpy as np
import pandas as pd

from model import model


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

    "Seller",
    "SchoolDist",
    "Color",

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

joblib.dump({"model": model, "features": FEATURE_COLUMNS}, "website/lightgbm_model.pkl")


def predict_price(data: dict) -> float:
    input_df = pd.DataFrame([data])

    for col in FEATURE_COLUMNS:
        if col not in input_df.columns:
            input_df[col] = np.nan

    input_df = input_df[FEATURE_COLUMNS]
    input_df = input_df.apply(pd.to_numeric, errors="coerce")

    prediction = model.predict(input_df)[0]
    prediction = max(0, prediction)

    return float(prediction)


app = Flask(__name__)


@app.route('/predict', methods=['POST', 'OPTIONS'])
def predict():

    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add(
            'Access-Control-Allow-Origin',
            'http://localhost:3000'
        )
        response.headers.add(
            'Access-Control-Allow-Headers',
            'Content-Type, Accept'
        )
        response.headers.add(
            'Access-Control-Allow-Methods',
            'POST, OPTIONS'
        )
        return response

    try:
        data = request.get_json()

        if not data:
            return jsonify({
                'error': 'No prediction data received.'
            }), 400

        missing_features = [
            feature
            for feature in FEATURE_COLUMNS
            if feature not in data
        ]

        if missing_features:
            return jsonify({
                'error': 'Missing prediction features.',
                'missing_features': missing_features
            }), 400

        print("\n========== RECEIVED DATA ==========")

        received_df = pd.DataFrame([data])[FEATURE_COLUMNS]

        print(received_df.to_string(index=False))

        print("-----------------------------------")
        print("Feature count:", len(data))
        print("===================================\n")

        predicted_price = predict_price(data)

        print(
            f"Predicted price: {predicted_price:,.2f}"
        )

        # --------------------------------------------------
        # Response
        # --------------------------------------------------

        response = jsonify({
            'predicted_price': round(predicted_price, 2)
        })

        response.headers.add(
            'Access-Control-Allow-Origin',
            'http://localhost:3000'
        )

        return response

    except Exception as e:

        print("\nPrediction error:")
        print(str(e))

        return jsonify({
            'error': 'Prediction failed.'
        }), 500


if __name__ == '__main__':
    app.run(
        host='127.0.0.1',
        port=5000,
        debug=True
    )
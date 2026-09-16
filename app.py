from flask import Flask, request, jsonify
import pandas as pd

from model import predict_price, FEATURE_COLUMNS


app = Flask(__name__)


@app.route('/predict', methods=['POST', 'OPTIONS'])
def predict():

    # Handle browser CORS preflight request
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

        # --------------------------------------------------
        # Check that all 25 expected features were received
        # --------------------------------------------------

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

        # --------------------------------------------------
        # Display received data for testing
        # --------------------------------------------------

        print("\n========== RECEIVED DATA ==========")

        received_df = pd.DataFrame([data])[FEATURE_COLUMNS]

        print(received_df.to_string(index=False))

        print("-----------------------------------")
        print("Feature count:", len(data))
        print("===================================\n")

        # --------------------------------------------------
        # Predict using LightGBM
        # --------------------------------------------------

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
# Cairo Real Estate Price Predictor

A machine learning web application that predicts residential property prices in Cairo, Egypt.

## Project Overview

The project follows a complete machine learning workflow, starting with preparing and analyzing the dataset, comparing different regression models, training the selected model, and finally integrating it with a website.

### 1. Data Preprocessing

The real-estate dataset was prepared before training the models.

* Treated missing values
* Detected and treated outliers
* Cleaned and normalized string values
* Converted categorical features into numerical values
* Used binary encoding for features such as payment, finishing, furnishing, parking, and security
* Used one-hot encoding for location and view
* Checked feature correlations
* Removed irrelevant features and avoided target leakage
* Tested different feature combinations during the development process

### 2. Model Comparison

Different regression models were tested and compared using evaluation metrics.

The models were compared based on:

* MAE
* MSE
* RMSE
* R²

After comparing the results, **LightGBM Regression** was selected for the final model.

### 3. Splitting and Training

The dataset was split into training and testing sets using an 80/20 split.

The selected LightGBM model was then trained using the training data and evaluated on the test data.

The trained model was saved using Joblib so it could be used by the application.

### 4. Website Sends the Data

The website collects the property information and converts it into the feature format required by the machine learning model.

The website then sends the prepared data to the Python Flask API through:

```text
POST /predict
```

### 5. Prediction and Response

The Flask API receives the property data and passes it to the trained LightGBM model.

The model generates the estimated property price, which is returned by the API to the website.

```text
Dataset
   ↓
Data Preprocessing
   ↓
Model Comparison
   ↓
Model Selection
   ↓
Train / Test Split
   ↓
Model Training
   ↓
Website Sends Property Data
   ↓
Flask API
   ↓
LightGBM Prediction
   ↓
Prediction Sent Back
   ↓
Website Displays Price
```

## How to Run the Project

1. Get a Gemini API key from Google AI Studio.

2. Create a `.env` file in the main project folder and add:

```env
GEMINI_API_KEY="YOUR_GEMINI_API"
APP_URL="app.py"
```

3. Start the Python Flask API:

```bash
python app.py
```

4. In another terminal, go to the website folder:

```bash
cd website
```

5. Install the website dependencies:

```bash
npm install
```

6. Start the website:

```bash
npm run dev
```

7. Open the website in your browser:

```text
http://localhost:3000
```

8. Upload the property listing image and wait for the system to extract the property features and generate the estimated price.

from flask import Flask, render_template, request, jsonify
import pandas as pd
import numpy as np
import pickle
import os
from datetime import datetime
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

app = Flask(__name__)

# Global variables for data and models
df = None
city_yearly_data = None
rf_model = None
iso_model = None
scaler = None
feature_columns = None

def load_and_preprocess_data():
    """Load CSV and preprocess emissions data"""
    global df, city_yearly_data
    
    # Load data
    df = pd.read_csv('data/raw_emissions.csv', sep='|')
    
    # Clean data
    df['date'] = pd.to_datetime(df['date'])
    df['year'] = df['date'].dt.year
    df['month'] = df['date'].dt.month
    
    # Handle missing city values - use county as fallback
    df['city'] = df['city'].fillna(df['county'])
    
    # Group by city and year, sum the emissions values
    city_yearly_data = df.groupby(['city', 'year'])['value (KtCO2 per day)'].sum().reset_index()
    city_yearly_data.columns = ['city', 'year', 'total_emissions']
    
    return df, city_yearly_data

def get_city_list():
    """Get unique cities from data"""
    return sorted(df['city'].unique().tolist())

def get_years_for_city(city):
    """Get available years for a selected city"""
    city_data = city_yearly_data[city_yearly_data['city'] == city]
    return sorted(city_data['year'].unique().tolist())

def prepare_features_for_city(city):
    """Prepare features for ML model training"""
    city_data = df[df['city'] == city].copy()
    
    # Aggregate by date and sector
    city_data_agg = city_data.groupby(['date', 'sector']).agg({
        'value (KtCO2 per day)': 'sum'
    }).reset_index()
    
    # Create pivot table with sectors as columns
    pivot_data = city_data_agg.pivot_table(
        index='date',
        columns='sector',
        values='value (KtCO2 per day)',
        fill_value=0
    )
    
    # Add temporal features
    pivot_data['day_of_year'] = pivot_data.index.dayofyear
    pivot_data['month'] = pivot_data.index.month
    pivot_data['year'] = pivot_data.index.year
    
    # Sort by date
    pivot_data = pivot_data.sort_index()
    
    return pivot_data

def train_models(city):
    """Train Random Forest and Isolation Forest models for a city"""
    global rf_model, iso_model, scaler, feature_columns
    
    # Prepare features
    features_df = prepare_features_for_city(city)
    
    if len(features_df) < 3:
        return False, "Not enough data to train models"
    
    # Define feature columns (exclude target)
    feature_columns = [col for col in features_df.columns if col != 'total_emissions']
    X = features_df[feature_columns].fillna(0)
    y = features_df.sum(axis=1)  # Total emissions per day
    
    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Train Random Forest for emission prediction
    try:
        rf_model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )
        rf_model.fit(X_scaled, y)
    except Exception as e:
        return False, f"Error training Random Forest: {str(e)}"
    
    # Train Isolation Forest for anomaly detection
    try:
        iso_model = IsolationForest(
            contamination=0.1,
            random_state=42,
            n_jobs=-1
        )
        iso_model.fit(X_scaled)
    except Exception as e:
        return False, f"Error training Isolation Forest: {str(e)}"
    
    return True, "Models trained successfully"

def predict_emissions(city, year):
    """Predict emissions for a city and year"""
    global rf_model, iso_model, scaler, feature_columns
    
    if rf_model is None or iso_model is None:
        success, msg = train_models(city)
        if not success:
            return None, msg
    
    # Get city data for the selected year
    city_year_data = df[(df['city'] == city) & (df['year'] == year)].copy()
    
    if len(city_year_data) == 0:
        return None, f"No data available for {city} in {year}"
    
    # Prepare features for prediction
    city_year_data_agg = city_year_data.groupby(['date', 'sector']).agg({
        'value (KtCO2 per day)': 'sum'
    }).reset_index()
    
    pivot_data = city_year_data_agg.pivot_table(
        index='date',
        columns='sector',
        values='value (KtCO2 per day)',
        fill_value=0
    )
    
    # Add temporal features
    pivot_data['day_of_year'] = pivot_data.index.dayofyear
    pivot_data['month'] = pivot_data.index.month
    pivot_data['year'] = pivot_data.index.year
    
    # Prepare X for prediction
    X = pivot_data[feature_columns].fillna(0)
    X_scaled = scaler.transform(X)
    
    # Make predictions
    predicted_emissions = rf_model.predict(X_scaled)
    anomaly_flags = iso_model.predict(X_scaled)  # -1 for anomaly, 1 for normal
    
    # Calculate statistics
    actual_total = city_year_data['value (KtCO2 per day)'].sum()
    predicted_total = predicted_emissions.sum()
    anomaly_count = (anomaly_flags == -1).sum()
    
    results = {
        'city': city,
        'year': year,
        'actual_total_emissions': round(actual_total, 2),
        'predicted_total_emissions': round(predicted_total, 2),
        'anomaly_count': int(anomaly_count),
        'total_records': len(predicted_emissions),
        'anomaly_percentage': round((anomaly_count / len(predicted_emissions) * 100) if len(predicted_emissions) > 0 else 0, 2),
        'mean_predicted_emissions': round(predicted_emissions.mean(), 2),
        'std_predicted_emissions': round(predicted_emissions.std(), 2)
    }
    
    return results, "Prediction successful"

# Initialize data on startup
@app.before_request
def startup():
    global df, city_yearly_data
    if df is None:
        load_and_preprocess_data()

@app.route('/')
def index():
    """Main dashboard page"""
    return render_template('index.html')

@app.route('/api/cities', methods=['GET'])
def api_cities():
    """Get list of available cities"""
    cities = get_city_list()
    return jsonify({'cities': cities})

@app.route('/api/years/<city>', methods=['GET'])
def api_years(city):
    """Get available years for a city"""
    years = get_years_for_city(city)
    return jsonify({'years': years})

@app.route('/api/city-data/<city>', methods=['GET'])
def api_city_data(city):
    """Get yearly emissions data for a city"""
    city_data = city_yearly_data[city_yearly_data['city'] == city]
    data = city_data.to_dict('records')
    return jsonify({'data': data})

@app.route('/api/predict', methods=['POST'])
def api_predict():
    """Run prediction for selected city and year"""
    data = request.json
    city = data.get('city')
    year = int(data.get('year'))
    
    if not city or not year:
        return jsonify({'success': False, 'message': 'City and year are required'}), 400
    
    results, message = predict_emissions(city, year)
    
    if results is None:
        return jsonify({'success': False, 'message': message}), 400
    
    return jsonify({'success': True, 'data': results})

@app.route('/api/stats', methods=['GET'])
def api_stats():
    """Get overall statistics"""
    stats = {
        'total_cities': len(get_city_list()),
        'total_records': len(df),
        'date_range': {
            'start': df['date'].min().strftime('%Y-%m-%d'),
            'end': df['date'].max().strftime('%Y-%m-%d')
        },
        'total_emissions': round(df['value (KtCO2 per day)'].sum(), 2),
        'sectors': df['sector'].unique().tolist()
    }
    return jsonify(stats)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

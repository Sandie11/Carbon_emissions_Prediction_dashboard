# Emissions Prediction Dashboard

A Flask-based web application for analyzing and predicting CO2 emissions data using machine learning models. The application uses Random Forest for emission prediction and Isolation Forest for anomaly detection.

## Features

- **Data Loading & Preprocessing**: Automatically loads and cleans emissions data from CSV
- **City-wise Analysis**: Groups emissions data by city (combining all counties within each city)
- **Yearly Aggregation**: Displays yearly total emissions for each city
- **Interactive Dashboard**: User-friendly interface to select city and year
- **ML-based Predictions**: 
  - Random Forest model for emission value prediction
  - Isolation Forest model for anomaly detection
- **Visualization**: Charts and statistics for prediction results
- **Real-time Processing**: Trains models on-demand when predictions are requested

## Project Structure

```
emissions_dashboard/
├── app.py                      # Main Flask application
├── requirements.txt            # Python dependencies
├── README.md                   # This file
├── data/
│   └── raw_emissions.csv      # Emissions data (included)
├── templates/
│   └── index.html             # Main dashboard HTML
└── static/
    ├── css/
    │   └── style.css          # Dashboard styling
    └── js/
        └── script.js          # Dashboard interactivity
```

## Data Format

The application expects a CSV file with the following columns:
- `county`: County name
- `state`: State name
- `date`: Date in MM/DD/YYYY format
- `sector`: Emission sector (Power, Industry, Residential, Ground Transport, Aviation, etc.)
- `value (KtCO2 per day)`: Emission value in KtCO2 per day
- `timestamp`: Unix timestamp
- `city`: City name (optional, falls back to county if empty)
- `country`: Country name

## Installation

### Prerequisites
- Python 3.7 or higher
- pip (Python package manager)

### Setup Steps

1. **Extract the ZIP file**
   ```bash
   unzip emissions_dashboard.zip
   cd emissions_dashboard
   ```

2. **Create a virtual environment (optional but recommended)**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

## Running the Application

1. **Start the Flask server**
   ```bash
   python app.py
   ```

2. **Open your browser**
   Navigate to: `http://localhost:5000`

3. **Use the dashboard**
   - Select a city from the dropdown
   - View the yearly emissions data for that city
   - Select a year
   - Click "Run Prediction" to train models and get predictions

## How It Works

### Data Processing Pipeline

1. **Load Data**: Reads the CSV file into a Pandas DataFrame
2. **Clean Data**: Parses dates, extracts year/month information
3. **Group by City**: Combines all counties within each city
4. **Aggregate Yearly**: Sums emissions by city and year

### Prediction Pipeline

1. **Feature Engineering**: 
   - Creates pivot table with sectors as features
   - Adds temporal features (day of year, month, year)
   
2. **Model Training**:
   - **Random Forest Regressor**: Trained to predict total emissions
   - **Isolation Forest**: Trained to detect anomalies in the data
   
3. **Predictions**:
   - Predicts emission values for the selected city and year
   - Flags anomalous records
   - Calculates statistics (mean, std dev, anomaly percentage)

### Results Displayed

- **Actual vs Predicted Emissions**: Comparison of actual and predicted total emissions
- **Anomaly Detection**: Count and percentage of anomalies detected
- **Statistical Measures**: Mean and standard deviation of predictions
- **Charts**: Visual representation of results

## API Endpoints

### GET `/api/cities`
Returns list of available cities

**Response:**
```json
{
  "cities": ["Jefferson", "Cook", "Los Angeles", ...]
}
```

### GET `/api/years/<city>`
Returns available years for a specific city

**Response:**
```json
{
  "years": [2023, 2024, ...]
}
```

### GET `/api/city-data/<city>`
Returns yearly emissions data for a city

**Response:**
```json
{
  "data": [
    {"city": "Jefferson", "year": 2023, "total_emissions": 1234.56},
    ...
  ]
}
```

### POST `/api/predict`
Runs prediction for selected city and year

**Request:**
```json
{
  "city": "Jefferson",
  "year": 2023
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "city": "Jefferson",
    "year": 2023,
    "actual_total_emissions": 1234.56,
    "predicted_total_emissions": 1250.43,
    "anomaly_count": 5,
    "total_records": 50,
    "anomaly_percentage": 10.0,
    "mean_predicted_emissions": 24.51,
    "std_predicted_emissions": 5.23
  }
}
```

### GET `/api/stats`
Returns overall statistics

**Response:**
```json
{
  "total_cities": 50,
  "total_records": 5000,
  "date_range": {
    "start": "2023-01-01",
    "end": "2024-12-31"
  },
  "total_emissions": 50000.0,
  "sectors": ["Power", "Industry", "Residential", ...]
}
```

## Configuration

### Model Parameters

You can adjust the following parameters in `app.py`:

**Random Forest Regressor:**
```python
rf_model = RandomForestRegressor(
    n_estimators=100,      # Number of trees
    max_depth=10,          # Maximum tree depth
    random_state=42,       # Random seed
    n_jobs=-1             # Use all processors
)
```

**Isolation Forest:**
```python
iso_model = IsolationForest(
    contamination=0.1,     # Expected anomaly percentage
    random_state=42,       # Random seed
    n_jobs=-1             # Use all processors
)
```

## Troubleshooting

### Port Already in Use
If port 5000 is already in use, modify the last line in `app.py`:
```python
app.run(debug=True, host='0.0.0.0', port=5001)  # Change 5000 to 5001
```

### Missing Dependencies
If you get import errors, reinstall dependencies:
```bash
pip install --upgrade -r requirements.txt
```

### No Data Displayed
- Ensure `data/raw_emissions.csv` exists
- Check that the CSV format matches the expected structure
- Verify the file encoding is UTF-8

### Prediction Fails
- Ensure the selected city has sufficient data (at least 10 records)
- Check that the selected year has data available
- Review the Flask console for error messages

## Performance Notes

- Initial data loading may take a few seconds for large datasets
- Model training happens on-demand when predictions are requested
- First prediction for a city may take longer due to model training
- Subsequent predictions for the same city will be faster

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## License

This project is provided as-is for educational and analytical purposes.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the Flask console output for error messages
3. Verify the data format matches the expected structure
4. Ensure all dependencies are correctly installed

## Future Enhancements

- Export prediction results to CSV/PDF
- Historical prediction comparison
- Custom date range selection
- Additional ML models (LSTM, XGBoost)
- Real-time data updates
- User authentication
- Database integration for persistent storage
<img width="1315" height="681" alt="Screenshot (793)" src="https://github.com/user-attachments/assets/019bcc12-d6c8-47b8-86cb-17a65b6e3634" />

<img width="1366" height="677" alt="Screenshot (794)" src="https://github.com/user-attachments/assets/b45b203f-621d-405f-8d08-8d13f6acda71" />


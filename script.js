// Global variables
let cities = [];
let selectedCity = null;
let selectedYear = null;
let emissionsChart = null;
let anomalyChart = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadInitialData();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    document.getElementById('city-select').addEventListener('change', onCityChange);
    document.getElementById('year-select').addEventListener('change', onYearChange);
    document.getElementById('run-prediction').addEventListener('click', runPrediction);
}

// Load initial data (cities and stats)
async function loadInitialData() {
    try {
        // Load cities
        const citiesResponse = await fetch('/api/cities');
        const citiesData = await citiesResponse.json();
        cities = citiesData.cities;
        populateCitySelect(cities);

        // Load statistics
        const statsResponse = await fetch('/api/stats');
        const stats = await statsResponse.json();
        updateStatistics(stats);
    } catch (error) {
        console.error('Error loading initial data:', error);
        showError('Failed to load initial data');
    }
}

// Populate city select dropdown
function populateCitySelect(cityList) {
    const select = document.getElementById('city-select');
    select.innerHTML = '<option value="">-- Choose a city --</option>';
    
    cityList.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        select.appendChild(option);
    });
}

// Handle city selection change
async function onCityChange() {
    const select = document.getElementById('city-select');
    selectedCity = select.value;
    selectedYear = null;
    
    const yearSelect = document.getElementById('year-select');
    const runBtn = document.getElementById('run-prediction');
    
    if (!selectedCity) {
        yearSelect.disabled = true;
        yearSelect.innerHTML = '<option value="">-- Choose a year --</option>';
        runBtn.disabled = true;
        document.getElementById('city-data-section').style.display = 'block';
        document.getElementById('city-data-container').innerHTML = 
            '<p class="placeholder">Select a city to view yearly emissions data</p>';
        return;
    }
    
    try {
        // Load years for selected city
        const yearsResponse = await fetch(`/api/years/${selectedCity}`);
        const yearsData = await yearsResponse.json();
        populateYearSelect(yearsData.years);
        
        // Load city data
        const cityDataResponse = await fetch(`/api/city-data/${selectedCity}`);
        const cityData = await cityDataResponse.json();
        displayCityData(cityData.data);
        
        yearSelect.disabled = false;
    } catch (error) {
        console.error('Error loading city data:', error);
        showError('Failed to load city data');
    }
}

// Populate year select dropdown
function populateYearSelect(years) {
    const select = document.getElementById('year-select');
    select.innerHTML = '<option value="">-- Choose a year --</option>';
    
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        select.appendChild(option);
    });
}

// Handle year selection change
function onYearChange() {
    const select = document.getElementById('year-select');
    selectedYear = select.value;
    
    const runBtn = document.getElementById('run-prediction');
    runBtn.disabled = !selectedCity || !selectedYear;
}

// Display city yearly data in table
function displayCityData(data) {
    const container = document.getElementById('city-data-container');
    
    if (!data || data.length === 0) {
        container.innerHTML = '<p class="placeholder">No data available for this city</p>';
        return;
    }
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th>City</th>
                    <th>Year</th>
                    <th>Total Emissions (KtCO2/day)</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    data.forEach(row => {
        html += `
            <tr>
                <td>${row.city}</td>
                <td>${row.year}</td>
                <td>${parseFloat(row.total_emissions).toFixed(2)}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Update statistics panel
function updateStatistics(stats) {
    document.getElementById('stat-cities').textContent = stats.total_cities;
    document.getElementById('stat-records').textContent = stats.total_records.toLocaleString();
    document.getElementById('stat-range').textContent = 
        `${stats.date_range.start} to ${stats.date_range.end}`;
    document.getElementById('stat-emissions').textContent = 
        stats.total_emissions.toLocaleString();
}

// Run prediction
async function runPrediction() {
    if (!selectedCity || !selectedYear) {
        showError('Please select both city and year');
        return;
    }
    
    const loading = document.getElementById('loading');
    const runBtn = document.getElementById('run-prediction');
    
    loading.classList.remove('hidden');
    runBtn.disabled = true;
    
    try {
        const response = await fetch('/api/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                city: selectedCity,
                year: selectedYear
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayPredictionResults(result.data);
            displayCharts(result.data);
            document.getElementById('results-section').style.display = 'block';
            document.getElementById('charts-section').style.display = 'block';
        } else {
            showError(result.message);
        }
    } catch (error) {
        console.error('Error running prediction:', error);
        showError('Failed to run prediction');
    } finally {
        loading.classList.add('hidden');
        runBtn.disabled = false;
    }
}

// Display prediction results
function displayPredictionResults(data) {
    const container = document.getElementById('results-container');
    
    const results = [
        {
            label: 'City',
            value: data.city,
            type: 'info'
        },
        {
            label: 'Year',
            value: data.year,
            type: 'info'
        },
        {
            label: 'Actual Total Emissions',
            value: `${data.actual_total_emissions.toLocaleString()} KtCO2/day`,
            type: 'info'
        },
        {
            label: 'Predicted Total Emissions',
            value: `${data.predicted_total_emissions.toLocaleString()} KtCO2/day`,
            type: 'info'
        },
        {
            label: 'Mean Predicted Emissions',
            value: `${data.mean_predicted_emissions.toLocaleString()} KtCO2/day`,
            type: 'info'
        },
        {
            label: 'Std Dev Predicted Emissions',
            value: `${data.std_predicted_emissions.toLocaleString()} KtCO2/day`,
            type: 'info'
        },
        {
            label: 'Anomalies Detected',
            value: `${data.anomaly_count} (${data.anomaly_percentage}%)`,
            type: data.anomaly_percentage > 15 ? 'warning' : 'info'
        },
        {
            label: 'Total Records Analyzed',
            value: data.total_records,
            type: 'info'
        }
    ];
    
    let html = '';
    results.forEach(result => {
        html += `
            <div class="result-card ${result.type}">
                <h4>${result.label}</h4>
                <div class="value">${result.value}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Display charts
function displayCharts(data) {
    displayEmissionsChart(data);
    displayAnomalyChart(data);
}

// Display emissions comparison chart
function displayEmissionsChart(data) {
    const ctx = document.getElementById('emissionsChart').getContext('2d');
    
    if (emissionsChart) {
        emissionsChart.destroy();
    }
    
    emissionsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Actual', 'Predicted'],
            datasets: [{
                label: 'Total Emissions (KtCO2/day)',
                data: [data.actual_total_emissions, data.predicted_total_emissions],
                backgroundColor: [
                    'rgba(46, 204, 113, 0.7)',
                    'rgba(52, 152, 219, 0.7)'
                ],
                borderColor: [
                    'rgba(46, 204, 113, 1)',
                    'rgba(52, 152, 219, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Emissions (KtCO2/day)'
                    }
                }
            }
        }
    });
}

// Display anomaly detection chart
function displayAnomalyChart(data) {
    const ctx = document.getElementById('anomalyChart').getContext('2d');
    
    if (anomalyChart) {
        anomalyChart.destroy();
    }
    
    const normalCount = data.total_records - data.anomaly_count;
    
    anomalyChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Normal', 'Anomalies'],
            datasets: [{
                data: [normalCount, data.anomaly_count],
                backgroundColor: [
                    'rgba(46, 204, 113, 0.7)',
                    'rgba(231, 76, 60, 0.7)'
                ],
                borderColor: [
                    'rgba(46, 204, 113, 1)',
                    'rgba(231, 76, 60, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                }
            }
        }
    });
}

// Show error message
function showError(message) {
    alert('Error: ' + message);
}

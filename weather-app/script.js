const dom = {
  location: document.getElementById('location'),
  icon: document.getElementById('icon'),
  temperature: document.getElementById('temperature'),
  conditions: document.getElementById('conditions'),
  apparent: document.getElementById('apparent'),
  wind: document.getElementById('wind'),
  humidity: document.getElementById('humidity'),
  updated: document.getElementById('updated'),
  error: document.getElementById('error'),
  refreshBtn: document.getElementById('refreshBtn')
};

const WeatherCode = {
  0: { text: 'Clear sky', icon: '☀️' },
  1: { text: 'Mainly clear', icon: '🌤️' },
  2: { text: 'Partly cloudy', icon: '⛅' },
  3: { text: 'Overcast', icon: '☁️' },
  45: { text: 'Fog', icon: '🌫️' },
  48: { text: 'Rime fog', icon: '🌫️' },
  51: { text: 'Light drizzle', icon: '🌦️' },
  53: { text: 'Drizzle', icon: '🌦️' },
  55: { text: 'Dense drizzle', icon: '🌧️' },
  56: { text: 'Freezing drizzle', icon: '🌧️' },
  57: { text: 'Freezing drizzle', icon: '🌧️' },
  61: { text: 'Light rain', icon: '🌧️' },
  63: { text: 'Rain', icon: '🌧️' },
  65: { text: 'Heavy rain', icon: '🌧️' },
  66: { text: 'Freezing rain', icon: '🌧️' },
  67: { text: 'Freezing rain', icon: '🌧️' },
  71: { text: 'Light snow', icon: '🌨️' },
  73: { text: 'Snow', icon: '🌨️' },
  75: { text: 'Heavy snow', icon: '❄️' },
  77: { text: 'Snow grains', icon: '❄️' },
  80: { text: 'Light showers', icon: '🌦️' },
  81: { text: 'Showers', icon: '🌦️' },
  82: { text: 'Heavy showers', icon: '🌧️' },
  85: { text: 'Snow showers', icon: '🌨️' },
  86: { text: 'Heavy snow showers', icon: '❄️' },
  95: { text: 'Thunderstorm', icon: '⛈️' },
  96: { text: 'Thunderstorm with hail', icon: '⛈️' },
  99: { text: 'Thunderstorm with hail', icon: '⛈️' }
};

function formatTime(date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit', minute: '2-digit'
  }).format(date);
}

async function reverseGeocode(latitude, longitude) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
  const response = await fetch(url, { headers: { 'Accept-Language': navigator.language || 'en' } });
  if (!response.ok) throw new Error('Failed to resolve place name');
  const data = await response.json();
  return data.address?.city || data.address?.town || data.address?.village || data.address?.hamlet || data.display_name || 'Your location';
}

async function fetchWeather(latitude, longitude) {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current: ['temperature_2m','apparent_temperature','relative_humidity_2m','wind_speed_10m','weather_code'].join(','),
    wind_speed_unit: 'kmh',
    timezone: 'auto'
  });
  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch weather');
  return response.json();
}

function setBusy(isBusy) {
  const card = document.querySelector('.card');
  card?.setAttribute('aria-busy', String(isBusy));
}

function showError(message) {
  dom.error.textContent = message;
  dom.error.hidden = false;
}

function clearError() {
  dom.error.hidden = true;
  dom.error.textContent = '';
}

async function updateWeather() {
  setBusy(true);
  clearError();
  try {
    const position = await new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocation is not supported in this browser'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        maximumAge: 300000,
        timeout: 15000
      });
    });

    const { latitude, longitude } = position.coords;

    const [placeName, weather] = await Promise.all([
      reverseGeocode(latitude, longitude).catch(() => 'Your location'),
      fetchWeather(latitude, longitude)
    ]);

    dom.location.textContent = `${placeName} (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`;

    const cur = weather.current;
    const code = WeatherCode[cur.weather_code] || { text: '—', icon: '⛅' };
    dom.icon.textContent = code.icon;
    dom.temperature.textContent = `${Math.round(cur.temperature_2m)}°`;
    dom.conditions.textContent = code.text;
    dom.apparent.textContent = `${Math.round(cur.apparent_temperature)}°`;
    dom.wind.textContent = `${Math.round(cur.wind_speed_10m)} km/h`;
    dom.humidity.textContent = `${Math.round(cur.relative_humidity_2m)}%`;
    dom.updated.textContent = formatTime(new Date());
  } catch (err) {
    const message = err?.message || 'Unable to get weather. Check permissions and connectivity.';
    showError(message);
  } finally {
    setBusy(false);
  }
}

dom.refreshBtn.addEventListener('click', () => {
  updateWeather();
});

updateWeather();


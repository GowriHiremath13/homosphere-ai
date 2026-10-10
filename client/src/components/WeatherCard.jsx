import Icon from './Icon.jsx';
import Panel from './Panel.jsx';

export default function WeatherCard({ weather, loading, error }) {
  return (
    <Panel title="Weather" icon={<Icon name="cloud-sun" size={28} />} className="panel-weather">
      {loading && <p className="muted">Loading weather…</p>}
      {error && !loading && <p className="muted">Weather is unavailable right now.</p>}
      {weather && !loading && (
        <>
          <div className="weather-main">
            <Icon name={weather.icon} size={72} />
            <div>
              <div className="weather-temp">{weather.temperatureC}°</div>
              <div className="weather-condition">{weather.condition}</div>
            </div>
          </div>
          <div className="weather-stats">
            <div><Icon name="rain" size={20} /><span>{weather.rainProbability}% rain</span></div>
            <div><Icon name="wind" size={20} /><span>{weather.windKph} km/h</span></div>
            <div><Icon name="humidity" size={20} /><span>{weather.humidity}%</span></div>
          </div>
          <div className="weather-location">{weather.location}{weather.source === 'mock' ? ' · Demo data' : ''}</div>
        </>
      )}
    </Panel>
  );
}

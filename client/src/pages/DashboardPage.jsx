import { useEffect, useState } from 'react';
import { useTV } from '../context/TVContext.jsx';
import { useSocketCtx } from '../context/SocketContext.jsx';
import { api } from '../services/api.js';
import WeatherCard from '../components/WeatherCard.jsx';
import BriefingCard from '../components/BriefingCard.jsx';
import ScheduleCard from '../components/ScheduleCard.jsx';
import TaskListCard from '../components/TaskListCard.jsx';

export default function DashboardPage() {
  const { tasks, setScreen } = useTV();
  const { socket } = useSocketCtx();
  const [weather, setWeather] = useState(null);
  const [weatherState, setWeatherState] = useState('loading');
  const [schedule, setSchedule] = useState([]);
  const [briefing, setBriefing] = useState(null);
  const [briefingState, setBriefingState] = useState('loading');

  useEffect(() => { setScreen('dashboard'); }, [setScreen]);

  useEffect(() => {
    let live = true;
    api.weather().then((r) => live && (setWeather(r.weather), setWeatherState('ready'))).catch(() => live && setWeatherState('error'));
    api.schedule.list().then((r) => live && setSchedule(r.schedule)).catch(() => {});
    return () => { live = false; };
  }, []);

  useEffect(() => {
    const onSchedule = ({ schedule: s }) => setSchedule(s);
    socket.on('schedule:updated', onSchedule);
    return () => socket.off('schedule:updated', onSchedule);
  }, [socket]);

  const loadBriefing = () => {
    setBriefingState('loading');
    api.ai.briefing()
      .then((r) => { setBriefing(r.response); setBriefingState('ready'); })
      .catch(() => { setBriefing(null); setBriefingState('error'); });
  };
  useEffect(loadBriefing, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleTask = (task) => api.tasks.update(task.id, { status: task.status === 'done' ? 'pending' : 'done' }).catch(() => {});

  return (
    <div className="screen dashboard-grid" data-screen="dashboard">
      <div className="dash-left"><WeatherCard weather={weather} loading={weatherState === 'loading'} error={weatherState === 'error'} /></div>
      <div className="dash-center"><BriefingCard briefing={briefing} loading={briefingState === 'loading'} error={briefingState === 'error' ? 'Briefing unavailable right now.' : null} onRefresh={loadBriefing} /></div>
      <div className="dash-right"><ScheduleCard schedule={schedule} compact /></div>
      <div className="dash-bottom"><TaskListCard tasks={tasks} onToggle={toggleTask} compact /></div>
    </div>
  );
}

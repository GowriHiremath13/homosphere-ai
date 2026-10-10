import { useEffect, useState } from 'react';
import { useTV } from '../context/TVContext.jsx';
import { api } from '../services/api.js';
import Icon from '../components/Icon.jsx';
import FocusButton from '../components/FocusButton.jsx';
import QRCodePanel from '../components/QRCodePanel.jsx';

export default function SettingsPage() {
  const { setScreen, settings, device, status, simulatePhone, refreshSettings } = useTV();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { setScreen('settings'); }, [setScreen]);

  const toggleDemo = async () => {
    setBusy(true);
    try { await api.settings.update({ demoMode: !settings?.demoMode }); await refreshSettings(); }
    finally { setBusy(false); }
  };

  const resetDemo = async () => {
    setBusy(true); setMsg('');
    try { await api.demoReset(); setMsg('Demo data reset.'); }
    catch (err) { setMsg(err.message); }
    finally { setBusy(false); }
  };

  const doSimulate = async () => {
    try { await simulatePhone(); setMsg('Simulated phone connected — watch Tasks and AI Assistant.'); }
    catch (err) { setMsg(err.message); }
  };

  return (
    <div className="screen settings-screen" data-screen="settings">
      <h2 className="screen-title"><Icon name="settings" size={32} /> Settings</h2>

      <div className="settings-grid">
        <section className="settings-card">
          <h3>Demo Mode</h3>
          <p className="muted">Runs HomeSphere with mock weather and sample AI responses — no external APIs required. {settings?.aiConfigured ? '' : 'No AI key is configured, so Demo Mode is required for AI features.'}</p>
          <FocusButton focusId="settings-demo-toggle" autoFocus className={`btn ${settings?.demoMode ? 'btn-primary' : 'btn-ghost'}`} onSelect={toggleDemo} disabled={busy || (!settings?.aiConfigured && settings?.demoMode)}>
            <Icon name={settings?.demoMode ? 'check' : 'close'} size={20} />
            Demo Mode: {settings?.demoMode ? 'On' : 'Off'}
          </FocusButton>
          {settings?.demoMode && (
            <>
              <FocusButton focusId="settings-reset-demo" className="btn btn-ghost" onSelect={resetDemo} disabled={busy}>
                <Icon name="retry" size={20} /> Reset demo data
              </FocusButton>
              <FocusButton focusId="settings-simulate-phone" className="btn btn-ghost" onSelect={doSimulate} disabled={busy}>
                <Icon name="phone" size={20} /> Simulate phone connection
              </FocusButton>
            </>
          )}
          {msg && <p className="settings-msg">{msg}</p>}
        </section>

        <section className="settings-card">
          <h3>Pair a phone</h3>
          <p className="muted">Device: {status?.name || device?.name}</p>
          <QRCodePanel pairUrl={device?.pairUrl} code={device?.pairingCode} expiresAt={device?.pairingExpiresAt} />
          <p className="muted">{status?.phoneCount || 0} phone{(status?.phoneCount || 0) === 1 ? '' : 's'} connected</p>
        </section>

        <section className="settings-card">
          <h3>System</h3>
          <ul className="settings-list">
            <li>Storage: {settings?.storage === 'postgresql' ? 'PostgreSQL' : 'In-memory (volatile)'}</li>
            <li>AI: {settings?.aiConfigured ? 'Configured' : 'Not configured'}</li>
            <li>Weather source: {settings?.demoMode ? 'Mock' : settings?.weatherProvider}</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

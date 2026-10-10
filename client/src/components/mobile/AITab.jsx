import { useState } from 'react';
import Icon from '../Icon.jsx';
import AIResultView from '../AIResultView.jsx';

const PROMPTS = ['Plan my evening.', 'What should I do before the rain?', 'Summarize my day.'];

export default function AITab({ onAsk }) {
  const [message, setMessage] = useState('');
  const [state, setState] = useState('idle');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const ask = async (text) => {
    if (!text.trim()) return;
    setState('thinking'); setError('');
    try { const r = await onAsk(text.trim()); setResult(r.response); setState('ready'); }
    catch (err) { setError(err.message); setState('error'); }
  };

  const submit = (e) => { e.preventDefault(); ask(message); setMessage(''); };

  return (
    <div className="mobile-panel">
      <form onSubmit={submit} className="mobile-ai-form">
        <input placeholder="Ask HomeSphere…" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} />
        <button type="submit" className="mobile-btn mobile-btn-primary" disabled={!message.trim()}><Icon name="send" size={20} /></button>
      </form>
      <div className="mobile-prompt-chips">
        {PROMPTS.map((p) => <button key={p} className="mobile-chip" onClick={() => ask(p)}>{p}</button>)}
      </div>
      <div className="mobile-ai-answer">
        {state === 'idle' && <p className="mobile-muted">Answers also appear on the TV.</p>}
        {state === 'thinking' && <p className="mobile-muted">Thinking…</p>}
        {state === 'error' && <p className="mobile-error">{error}</p>}
        {state === 'ready' && <AIResultView result={result} />}
      </div>
    </div>
  );
}

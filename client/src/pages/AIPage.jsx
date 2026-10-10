import { useEffect, useRef, useState } from 'react';
import { useTV } from '../context/TVContext.jsx';
import { useSocketCtx } from '../context/SocketContext.jsx';
import { api } from '../services/api.js';
import Icon from '../components/Icon.jsx';
import FocusButton from '../components/FocusButton.jsx';
import AIResultView from '../components/AIResultView.jsx';

const PROMPTS = [
  'Plan my evening.',
  'What should I do before the rain?',
  'Organize today\u2019s unfinished tasks.',
  'Create a study schedule.',
  'Summarize my day.',
];

export default function AIPage() {
  const { setScreen } = useTV();
  const { socket } = useSocketCtx();
  const [state, setState] = useState('idle'); // idle | thinking | ready | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [lastRequest, setLastRequest] = useState('');
  const rootRef = useRef(null);

  useEffect(() => { setScreen('ai'); }, [setScreen]);

  useEffect(() => {
    const onThinking = (p) => { setState('thinking'); setLastRequest(p.message); };
    const onResponse = (r) => { setResult(r.response); setState('ready'); };
    const onError = (e) => { setError(e.message); setState('error'); };
    socket.on('ai:thinking', onThinking);
    socket.on('ai:response', onResponse);
    socket.on('ai:error', onError);
    return () => {
      socket.off('ai:thinking', onThinking);
      socket.off('ai:response', onResponse);
      socket.off('ai:error', onError);
    };
  }, [socket]);

  const ask = async (message) => {
    setState('thinking'); setError(''); setLastRequest(message);
    try { await api.ai.chat({ message, source: 'tv' }); } catch (err) { setError(err.message); setState('error'); }
  };

  return (
    <div className="screen ai-screen" data-screen="ai" ref={rootRef}>
      <div className="ai-header">
        <Icon name="ai" size={40} />
        <div>
          <h2>AI Assistant</h2>
          <p>What would you like help with?</p>
        </div>
      </div>

      <div className="ai-content">
        <div className="ai-prompts" data-scroll>
          {PROMPTS.map((p, i) => (
            <FocusButton key={p} focusId={`ai-prompt-${i}`} autoFocus={i === 0} className="ai-prompt-btn" onSelect={() => ask(p)}>
              {p}
            </FocusButton>
          ))}
          <p className="ai-hint">Typing is easier from the paired phone — ask a question there and the answer appears here.</p>
        </div>

        <div className="ai-answer">
          {state === 'idle' && <p className="muted">Choose a prompt, or ask a question from your phone.</p>}
          {state === 'thinking' && (
            <div className="ai-thinking">
              <div className="loading-spinner small" />
              <p>Thinking about “{lastRequest}”…</p>
            </div>
          )}
          {state === 'error' && (
            <div className="ai-error">
              <Icon name="warning" size={32} />
              <p>{error}</p>
            </div>
          )}
          {state === 'ready' && <AIResultView result={result} />}
        </div>
      </div>
    </div>
  );
}

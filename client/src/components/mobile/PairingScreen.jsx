import { useState } from 'react';
import Icon from '../Icon.jsx';

export default function PairingScreen({ initialCode, onPair, error, busy }) {
  const [code, setCode] = useState(initialCode || '');
  const [name, setName] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (code.trim().length === 6) onPair(code.trim().toUpperCase(), name.trim());
  };

  return (
    <div className="mobile-screen mobile-pairing">
      <Icon name="phone" size={48} />
      <h1>HomeSphere</h1>
      <p className="mobile-sub">Enter the 6-character code shown on your TV, or scan its QR code from Settings.</p>
      <form onSubmit={submit} className="mobile-pair-form">
        <input
          inputMode="text"
          autoCapitalize="characters"
          maxLength={6}
          placeholder="CODE"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          className="mobile-code-input"
        />
        <input placeholder="Your name (optional)" value={name} onChange={(e) => setName(e.target.value)} className="mobile-name-input" maxLength={40} />
        {error && <p className="mobile-error">{error}</p>}
        <button type="submit" className="mobile-btn mobile-btn-primary" disabled={busy || code.length !== 6}>
          {busy ? 'Connecting…' : 'Connect'}
        </button>
      </form>
    </div>
  );
}

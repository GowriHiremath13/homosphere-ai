import { QRCodeSVG } from 'qrcode.react';
import Icon from './Icon.jsx';

export default function QRCodePanel({ pairUrl, code, expiresAt }) {
  return (
    <div className="qr-panel">
      <div className="qr-code-box">
        {pairUrl ? <QRCodeSVG value={pairUrl} size={220} bgColor="#ffffff" fgColor="#0b1020" /> : <div className="qr-placeholder" />}
      </div>
      <div className="qr-meta">
        <div className="qr-label"><Icon name="qr" size={22} /> Scan with your phone</div>
        <div className="qr-code-text">{code || '------'}</div>
        {expiresAt && <div className="qr-expiry">Refreshes automatically before it expires</div>}
      </div>
    </div>
  );
}

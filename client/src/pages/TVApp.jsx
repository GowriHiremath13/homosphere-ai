import { useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { SocketProvider } from '../context/SocketContext.jsx';
import { TVProvider, useTV } from '../context/TVContext.jsx';
import { useTVNavigation } from '../hooks/useTVNavigation.js';
import { useStageScale } from '../hooks/useStageScale.js';
import NavRail from '../components/NavRail.jsx';
import HeaderBar from '../components/HeaderBar.jsx';
import NotificationTray from '../components/NotificationTray.jsx';
import LoadingScreen from '../components/LoadingScreen.jsx';
import ErrorScreen from '../components/ErrorScreen.jsx';

function TVShell() {
  const rootRef = useRef(null);
  const scale = useStageScale();
  const { connected, connectError, device } = useTV();
  useTVNavigation({ rootRef });

  return (
    <div className="tv-viewport">
      <div ref={rootRef} className="tv-stage" style={{ transform: `scale(${scale})` }}>
        {!connected && !device ? (
          <LoadingScreen message="Connecting to HomeSphere…" />
        ) : connectError && !device ? (
          <ErrorScreen detail={connectError} onRetry={() => window.location.reload()} />
        ) : (
          <div className="tv-layout">
            <HeaderBar />
            <div className="tv-body">
              <NavRail />
              <main className="tv-main">
                <Outlet />
              </main>
            </div>
          </div>
        )}
        <NotificationTray />
      </div>
    </div>
  );
}

export default function TVApp() {
  return (
    <SocketProvider role="tv">
      <TVProvider>
        <TVShell />
      </TVProvider>
    </SocketProvider>
  );
}

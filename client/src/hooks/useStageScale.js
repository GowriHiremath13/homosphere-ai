import { useEffect, useState } from 'react';

// The TV UI is authored on a fixed 1920x1080 canvas and scaled to whatever the WebView reports.
export function useStageScale(width = 1920, height = 1080) {
  const calc = () => Math.min(window.innerWidth / width, window.innerHeight / height);
  const [scale, setScale] = useState(calc);
  useEffect(() => {
    const on = () => setScale(calc());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return scale;
}

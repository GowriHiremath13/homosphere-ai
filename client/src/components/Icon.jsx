import {
  Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudSun, Wind, Droplets,
  CheckCircle2, Circle, Clock, ListTodo, Calendar, Sparkles, Timer as TimerIcon,
  Settings as SettingsIcon, Wifi, WifiOff, Smartphone, QrCode, ChevronLeft, ChevronRight,
  Play, Pause, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, CornerDownLeft,
  ArrowLeftCircle, AlertTriangle, RefreshCw, Plus, Trash2, Send, Check, X, Flame, Minus,
} from 'lucide-react';

const MAP = {
  sun: Sun, cloud: Cloud, rain: CloudRain, snow: CloudSnow, storm: CloudLightning, 'cloud-sun': CloudSun,
  wind: Wind, humidity: Droplets, done: CheckCircle2, pending: Circle, clock: Clock, tasks: ListTodo,
  calendar: Calendar, ai: Sparkles, timer: TimerIcon, settings: SettingsIcon, wifi: Wifi, 'wifi-off': WifiOff,
  phone: Smartphone, qr: QrCode, left: ChevronLeft, right: ChevronRight, play: Play, pause: Pause,
  reset: RotateCcw, up: ArrowUp, down: ArrowDown, arrowLeft: ArrowLeft, arrowRight: ArrowRight, enter: CornerDownLeft,
  back: ArrowLeftCircle, warning: AlertTriangle, retry: RefreshCw, add: Plus, trash: Trash2, send: Send,
  check: Check, close: X, high: Flame, remove: Minus,
};

export default function Icon({ name, size = 24, ...rest }) {
  const C = MAP[name] || Circle;
  return <C size={size} strokeWidth={2} aria-hidden="true" {...rest} />;
}

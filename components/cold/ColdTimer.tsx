import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
} from 'react';
import Button from '@/components/ui/Button';
import { getPreferences } from '@/lib/storage';
import { formatTime } from '@/lib/format';
import { strings } from '@/lib/i18n';
import { requestWakeLock, releaseWakeLock } from '@/lib/wakeLock';
import ColdSessionLog from './ColdSessionLog';

function formatLabel(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = seconds / 60;
  return Number.isInteger(m) ? `${m}min` : `${m.toFixed(1)}min`;
}

function CircularProgress({
  elapsed,
  target,
}: {
  elapsed: number;
  target: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [radius, setRadius] = useState(110);

  useLayoutEffect(() => {
    function measure() {
      if (containerRef.current) {
        setRadius(containerRef.current.offsetWidth / 2);
      }
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const progress = Math.min(elapsed / target, 1);
  const offset = circumference * (1 - progress);
  const exceeded = elapsed > target;

  return (
    <div
      ref={containerRef}
      style={{ width: 'min(220px, 44vw)', height: 'min(220px, 44vw)' }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${radius * 2} ${radius * 2}`}
        className="-rotate-90"
      >
        <circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-on-surface-light/20 dark:text-surface-overlay"
        />
        <circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`transition-[stroke-dashoffset] duration-normal ${
            exceeded ? 'text-success-light' : 'text-cold-light'
          }`}
        />
      </svg>
    </div>
  );
}

interface ColdTimerProps {
  target: number;
  onDone: () => void;
}

export default function ColdTimer({ target, onDone }: ColdTimerProps) {
  const [running, setRunning] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const alertedRef = useRef(false);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
    setFinished(true);
  }, []);

  useEffect(() => {
    startTimeRef.current = Date.now();
    if (getPreferences().wakeLockEnabled) {
      requestWakeLock();
    }
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const secs = Math.floor((now - startTimeRef.current) / 1000);
      setElapsed(secs);
    }, 250);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      releaseWakeLock();
    };
  }, []);

  useEffect(() => {
    if (running && elapsed >= target && !alertedRef.current) {
      alertedRef.current = true;
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }
    }
  }, [running, elapsed, target]);

  if (running) {
    const exceeded = elapsed > target;
    return (
      <div className="flex flex-col items-center gap-6 px-4 pt-8 pb-24">
        <h1 className="text-2xl font-bold text-on-surface-light dark:text-on-surface">
          {strings.cold.heading}
        </h1>

        <div
          className="relative"
          style={{ width: 'min(220px, 44vw)', height: 'min(220px, 44vw)' }}
        >
          <CircularProgress elapsed={elapsed} target={target} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="font-bold tabular-nums text-on-surface-light dark:text-on-surface"
              style={{ fontSize: 'min(2.25rem, 9vw)' }}
            >
              {formatTime(elapsed)}
            </span>
            <span
              className="text-on-surface-light-muted dark:text-on-surface-muted"
              style={{
                fontSize: 'min(0.875rem, 3vw)',
                marginTop: 'min(0.25rem, 0.5vw)',
              }}
            >
              {exceeded
                ? strings.cold.targetReached
                : strings.cold.targetLabel(formatLabel(target))}
            </span>
          </div>
        </div>

        <Button
          size="lg"
          variant="danger"
          className="w-full max-w-xs"
          onClick={stop}
        >
          {strings.cold.stop}
        </Button>
      </div>
    );
  }

  if (finished) {
    return <ColdSessionLog elapsed={elapsed} target={target} onDone={onDone} />;
  }

  return null;
}

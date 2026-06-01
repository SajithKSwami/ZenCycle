import { useCallback, useEffect, useRef, useState } from 'react';

interface TockState {
  time: number;       // milliseconds remaining
  isRunning: boolean;
}

interface TockControls {
  time: number;
  isRunning: boolean;
  start: (durationMs: number) => void;
  pause: () => void;
  stop: () => void;
  setTime: (ms: number) => void;
}

interface UseTockOptions {
  countdown?: boolean;
  interval?: number; // tick interval in ms, default 1000
}

export function useTock({ interval = 1000 }: UseTockOptions = {}): TockControls {
  const [state, setState] = useState<TockState>({ time: 0, isRunning: false });
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeRef = useRef(0);

  const clearTick = () => {
    if (tickRef.current !== null) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const start = useCallback((durationMs: number) => {
    clearTick();
    timeRef.current = durationMs;
    setState({ time: durationMs, isRunning: true });

    tickRef.current = setInterval(() => {
      timeRef.current = Math.max(0, timeRef.current - interval);
      setState({ time: timeRef.current, isRunning: timeRef.current > 0 });
      if (timeRef.current <= 0) clearTick();
    }, interval);
  }, [interval]);

  const pause = useCallback(() => {
    clearTick();
    setState(prev => ({ ...prev, isRunning: false }));
  }, []);

  const stop = useCallback(() => {
    clearTick();
    timeRef.current = 0;
    setState({ time: 0, isRunning: false });
  }, []);

  const setTime = useCallback((ms: number) => {
    timeRef.current = ms;
    setState(prev => ({ ...prev, time: ms }));
  }, []);

  // cleanup on unmount
  useEffect(() => () => clearTick(), []);

  return { time: state.time, isRunning: state.isRunning, start, pause, stop, setTime };
}

import { useEffect, useRef, useState } from 'react';

export function useCountdown(
  active: boolean,
  seconds: number,
  onExpire: () => void,
): number {
  const [remaining, setRemaining] = useState(seconds);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!active) return;
    setRemaining(seconds);
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          queueMicrotask(() => onExpireRef.current());
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [active, seconds]);

  return remaining;
}

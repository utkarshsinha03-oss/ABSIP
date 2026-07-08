import { useEffect, useRef, useState } from 'react';

/**
 * Animates a numeric value counting up from its previous value
 * to the target value whenever the target changes.
 * Non-numeric values (strings like "Nominal") are returned as-is.
 */
export function useAnimatedCounter(target, duration = 700) {
  const [display, setDisplay] = useState(typeof target === 'number' ? 0 : target);
  const fromRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (typeof target !== 'number' || Number.isNaN(target)) {
      setDisplay(target);
      return;
    }

    const from = fromRef.current;
    const to = target;
    const start = performance.now();

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = from + (to - from) * eased;
      setDisplay(Math.round(value));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return display;
}

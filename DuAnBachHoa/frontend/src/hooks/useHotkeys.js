import { useEffect } from 'react';

export default function useHotkeys(list = []) {
  useEffect(() => {
    const handler = (e) => {
      const key = e.key.toLowerCase();
      list.forEach(({ combo, handler }) => {
        const expect = combo.map(c => c.toLowerCase());
        if (expect.length === 1 && expect[0] === key) {
          handler();
        }
        if (expect.length === 2 && expect[0] === 'g' && expect[1] === key && e.key.toLowerCase() !== 'g') {
          // allow g then p/o within a short time
          // naive implementation: we rely on OS key repeat; for robust impl add state machine
        }
      });
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [list]);
}

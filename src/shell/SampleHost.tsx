import { useEffect, useRef, useState } from 'react';
import type { Cleanup, SampleEntry } from '../types';

export function SampleHost({ entry }: { entry: SampleEntry }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    // Each mount attempt gets its own stage so overlapping async mounts
    // (StrictMode, fast hash switching) never touch each other's DOM.
    const stage = document.createElement('div');
    stage.className = 'stage';
    hostRef.current!.append(stage);

    let disposed = false;
    let cleanup: Cleanup | void;
    setError(null);

    entry
      .load()
      .then((mod) => mod.mount(stage))
      .then((c) => {
        if (disposed) c?.();
        else cleanup = c;
      })
      .catch((e) => {
        console.error(e);
        if (!disposed) setError(e);
      });

    return () => {
      disposed = true;
      cleanup?.();
      stage.remove();
    };
  }, [entry]);

  return (
    <div className="host" ref={hostRef}>
      {error != null && <pre className="error">{String(error)}</pre>}
    </div>
  );
}

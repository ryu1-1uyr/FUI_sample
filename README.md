# FUI Samples

A collection of FUI (Fictional User Interface) experiments built with React, WebGPU, HTML-in-Canvas, shaders, and other graphics APIs. Each piece lives in its own `sampleN` directory and is reachable at `<pages-url>/#sampleN`.

## Development

```bash
pnpm install
pnpm dev
```

## Adding a sample

```bash
pnpm new "Sample Title"
```

This copies `src/samples/_template` to the next free `src/samples/sampleN`. Any `sampleN` directory containing `meta.ts` and `index.ts(x)` is picked up automatically.

```
src/samples/sampleN/
├─ meta.ts    # default export: { title, description?, tags? }
└─ index.ts   # export const mount: Mount
```

`mount(el)` renders into `el` and returns a cleanup function. The cleanup runs when navigating away, so it must release everything the sample created (animation frames, listeners, observers, GPU devices, React roots).

React sample:

```tsx
import { createRoot } from 'react-dom/client';
import type { Mount } from '../../types';

export const mount: Mount = (el) => {
  const root = createRoot(el);
  root.render(<Scene />);
  return () => root.unmount();
};
```

Shader sources can be imported as strings with Vite's `?raw` suffix:

```ts
import shader from './shader.wgsl?raw';
```

## Deployment

Pushing to `main` builds and deploys via GitHub Actions (`.github/workflows/deploy.yml`). In the repository settings, set **Pages → Source** to **GitHub Actions**.

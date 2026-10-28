import type { SampleEntry, SampleMeta, SampleModule } from './types';

// Any directory named `sampleN` under src/samples is picked up automatically.
const metas = import.meta.glob<SampleMeta>('./samples/sample*/meta.ts', {
  eager: true,
  import: 'default',
});
const loaders = import.meta.glob<SampleModule>('./samples/sample*/index.{ts,tsx}');

const idOf = (path: string) => path.split('/')[2];
const numOf = (id: string) => Number(id.replace('sample', ''));

const loaderById = new Map(Object.entries(loaders).map(([path, load]) => [idOf(path), load]));

export const samples: SampleEntry[] = Object.entries(metas)
  .flatMap(([path, meta]) => {
    const id = idOf(path);
    const load = loaderById.get(id);
    return load ? [{ ...meta, id, load }] : [];
  })
  .sort((a, b) => numOf(a.id) - numOf(b.id));

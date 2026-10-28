import { samples } from '../registry';
import { SampleHost } from './SampleHost';
import { useHash } from './useHash';

export function App() {
  const hash = useHash();
  const index = samples.findIndex((s) => s.id === hash);

  if (index < 0) return <SampleList />;

  const entry = samples[index];
  const prev = samples[index - 1];
  const next = samples[index + 1];

  return (
    <div className="viewer">
      <nav className="bar">
        <a href="#">INDEX</a>
        <span className="title">
          <span className="id">{entry.id}</span> {entry.title}
        </span>
        <span className="pager">
          {prev ? <a href={`#${prev.id}`}>PREV</a> : <span />}
          {next ? <a href={`#${next.id}`}>NEXT</a> : <span />}
        </span>
      </nav>
      <SampleHost key={entry.id} entry={entry} />
    </div>
  );
}

function SampleList() {
  return (
    <main className="list">
      <h1>FUI SAMPLES</h1>
      {samples.length === 0 ? (
        <p className="empty">
          No samples yet. Run <code>pnpm new "Title"</code> to create one.
        </p>
      ) : (
        <ul>
          {samples.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`}>
                <span className="id">{s.id}</span>
                <span className="title">{s.title}</span>
                {s.tags?.map((t) => (
                  <span key={t} className="tag">
                    {t}
                  </span>
                ))}
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

import { useState } from 'react';

interface LogLine {
  id: string;
  level: string;
  message: string;
  timestamp: string;
}

interface Stage {
  id: string;
  name: string;
  order: number;
  status: string;
  durationMs: number | null;
  errorMessage: string | null;
  logs?: LogLine[];
}

const DOT_STYLES: Record<string, string> = {
  PASSED: 'bg-success border-success',
  RUNNING: 'bg-warning border-warning animate-pulse',
  FAILED: 'bg-danger border-danger',
  WAITING: 'bg-transparent border-border',
  SKIPPED: 'bg-transparent border-skip',
};

const TEXT_STYLES: Record<string, string> = {
  PASSED: 'text-text',
  RUNNING: 'text-warning',
  FAILED: 'text-danger',
  WAITING: 'text-muted',
  SKIPPED: 'text-skip',
};

const LOG_LEVEL_COLOR: Record<string, string> = {
  INFO: 'text-muted',
  SUCCESS: 'text-success',
  WARNING: 'text-warning',
  ERROR: 'text-danger',
};

function formatDuration(ms: number | null) {
  if (!ms) return '';
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export function PipelineVisualization({ stages }: { stages: Stage[] }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function toggle(id: string) {
    setExpanded((e) => ({ ...e, [id]: !e[id] }));
  }

  return (
    <div className="relative">
      {stages
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((stage, i, arr) => {
          const isLast = i === arr.length - 1;
          const hasLogs = stage.logs && stage.logs.length > 0;
          const isOpen = !!expanded[stage.id];
          return (
            <div key={stage.id} className="relative pl-8">
              {!isLast && <div className="absolute left-[7px] top-4 h-full w-px bg-border" />}
              <div
                className={`absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2 ${
                  DOT_STYLES[stage.status] || DOT_STYLES.WAITING
                }`}
              />
              <button
                onClick={() => hasLogs && toggle(stage.id)}
                className={`flex w-full items-center justify-between rounded-md py-1.5 text-left ${
                  hasLogs ? 'hover:bg-surface-2' : ''
                } ${isLast ? '' : 'mb-1'}`}
              >
                <span className={`text-sm font-medium ${TEXT_STYLES[stage.status] || TEXT_STYLES.WAITING}`}>
                  {stage.name}
                </span>
                <span className="flex items-center gap-2 font-mono text-xs text-muted">
                  {formatDuration(stage.durationMs)}
                  {hasLogs && <span>{isOpen ? '▾' : '▸'}</span>}
                </span>
              </button>
              {stage.errorMessage && (
                <p className="mb-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-1.5 text-xs text-danger">
                  {stage.errorMessage}
                </p>
              )}
              {isOpen && hasLogs && (
                <div className="mb-3 rounded-md border border-border bg-bg p-3 font-mono text-xs leading-relaxed">
                  {stage.logs!.map((l) => (
                    <div key={l.id} className={LOG_LEVEL_COLOR[l.level] || 'text-muted'}>
                      <span className="text-skip">{new Date(l.timestamp).toLocaleTimeString()} </span>
                      {l.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}

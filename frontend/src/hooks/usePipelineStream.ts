import { useEffect, useRef } from 'react';
import { API_BASE_URL, getAuthToken } from '../api/client';

/**
 * Subscribes to GET /api/pipelines/runs/:id/stream (Server-Sent Events) while
 * `active` is true, calling `onUpdate` with each fresh run snapshot the
 * backend pushes and `onDone` once the run reaches a terminal status. This
 * replaces polling: the browser holds one open connection per in-progress
 * run instead of re-fetching on an interval.
 *
 * Falls back gracefully if the connection drops — onerror just closes the
 * stream; the caller's existing "activeRun.status" state won't advance
 * further until the next explicit action, same as if polling had stopped.
 */
export function usePipelineStream<T>(
  runId: string | undefined,
  active: boolean,
  onUpdate: (run: T) => void,
  onDone: () => void
) {
  const onUpdateRef = useRef(onUpdate);
  const onDoneRef = useRef(onDone);
  onUpdateRef.current = onUpdate;
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!runId || !active) return;
    const token = getAuthToken() || '';
    const es = new EventSource(`${API_BASE_URL}/api/pipelines/runs/${runId}/stream?token=${encodeURIComponent(token)}`);

    es.onmessage = (ev) => {
      try {
        onUpdateRef.current(JSON.parse(ev.data) as T);
      } catch {
        // Malformed frame — ignore and wait for the next one.
      }
    };

    es.addEventListener('done', () => {
      es.close();
      onDoneRef.current();
    });

    es.onerror = () => {
      es.close();
    };

    return () => es.close();
  }, [runId, active]);
}

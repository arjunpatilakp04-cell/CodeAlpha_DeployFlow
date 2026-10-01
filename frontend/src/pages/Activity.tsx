import { useEffect, useState } from 'react';
import { api } from '../api/client';

interface ActivityEvent {
  id: string;
  action: string;
  resource: string;
  result: string;
  timestamp: string;
  user: { name: string; email: string };
}

export function Activity() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    api.get<ActivityEvent[]>('/api/activity').then(setEvents);
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Organization-wide audit log of the last 50 actions.</p>
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-xs text-muted">
            <tr>
              <th className="px-4 py-2">Time</th>
              <th className="px-4 py-2">User</th>
              <th className="px-4 py-2">Action</th>
              <th className="px-4 py-2">Resource</th>
              <th className="px-4 py-2">Result</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-t border-border">
                <td className="px-4 py-2 font-mono text-xs text-muted">
                  {new Date(e.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-2 text-xs">{e.user.name}</td>
                <td className="px-4 py-2 text-xs">{e.action}</td>
                <td className="px-4 py-2 font-mono text-xs text-muted">{e.resource}</td>
                <td className="px-4 py-2">
                  <span className={`text-xs ${e.result === 'success' ? 'text-success' : 'text-danger'}`}>
                    {e.result}
                  </span>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted">
                  No activity recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

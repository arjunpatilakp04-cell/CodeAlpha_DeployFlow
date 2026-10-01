import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useProjects } from '../context/ProjectContext';

interface Variable {
  id: string;
  key: string;
  value: string;
  isSecret: boolean;
}

export function Variables() {
  const { selectedProject } = useProjects();
  const [variables, setVariables] = useState<Variable[]>([]);
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ key: '', value: '', isSecret: true });

  async function load() {
    if (!selectedProject) return;
    const data = await api.get<Variable[]>(`/api/variables/project/${selectedProject.id}`);
    setVariables(data);
  }

  useEffect(() => {
    load();
    setRevealed({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject]);

  async function reveal(id: string) {
    const { value } = await api.get<{ value: string }>(`/api/variables/${id}/reveal`);
    setRevealed((r) => ({ ...r, [id]: value }));
  }

  async function handleCreate() {
    if (!selectedProject || !form.key) return;
    await api.post(`/api/variables/project/${selectedProject.id}`, form);
    setForm({ key: '', value: '', isSecret: true });
    setShowCreate(false);
    await load();
  }

  async function handleDelete(id: string) {
    await api.delete(`/api/variables/${id}`);
    await load();
  }

  if (!selectedProject) return <div className="text-sm text-muted">Select a project to see its variables.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{variables.length} variable{variables.length === 1 ? '' : 's'}</p>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90"
        >
          New variable
        </button>
      </div>

      {showCreate && (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-4">
          <input
            placeholder="KEY"
            value={form.key}
            onChange={(e) => setForm({ ...form, key: e.target.value.toUpperCase() })}
            className="rounded-md border border-border bg-surface-2 px-3 py-2 font-mono text-sm"
          />
          <input
            placeholder="value"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            className="flex-1 rounded-md border border-border bg-surface-2 px-3 py-2 font-mono text-sm"
          />
          <label className="flex items-center gap-1.5 text-xs text-muted">
            <input
              type="checkbox"
              checked={form.isSecret}
              onChange={(e) => setForm({ ...form, isSecret: e.target.checked })}
            />
            Secret
          </label>
          <button onClick={handleCreate} className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white">
            Add
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-xs text-muted">
            <tr>
              <th className="px-4 py-2">Key</th>
              <th className="px-4 py-2">Value</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {variables.map((v) => (
              <tr key={v.id} className="border-t border-border">
                <td className="px-4 py-2 font-mono text-xs">{v.key}</td>
                <td className="px-4 py-2 font-mono text-xs text-muted">
                  {v.isSecret ? revealed[v.id] || v.value : v.value}
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex justify-end gap-2">
                    {v.isSecret && !revealed[v.id] && (
                      <button onClick={() => reveal(v.id)} className="text-xs text-accent hover:underline">
                        Reveal
                      </button>
                    )}
                    <button onClick={() => handleDelete(v.id)} className="text-xs text-danger hover:underline">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {variables.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-sm text-muted">
                  No variables set for this project yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const STYLES: Record<string, string> = {
  PASSED: 'bg-success/10 text-success border-success/30',
  LIVE: 'bg-success/10 text-success border-success/30',
  RUNNING: 'bg-warning/10 text-warning border-warning/30',
  DEPLOYING: 'bg-warning/10 text-warning border-warning/30',
  WAITING: 'bg-accent/10 text-accent border-accent/30',
  FAILED: 'bg-danger/10 text-danger border-danger/30',
  ROLLED_BACK: 'bg-danger/10 text-danger border-danger/30',
  SUPERSEDED: 'bg-skip/10 text-skip border-skip/30',
  CANCELLED: 'bg-skip/10 text-skip border-skip/30',
  SKIPPED: 'bg-skip/10 text-skip border-skip/30',
};

const LABELS: Record<string, string> = {
  PASSED: 'Passed',
  LIVE: 'Live',
  RUNNING: 'Running',
  DEPLOYING: 'Deploying',
  WAITING: 'Waiting',
  FAILED: 'Failed',
  ROLLED_BACK: 'Rolled back',
  SUPERSEDED: 'Superseded',
  CANCELLED: 'Cancelled',
  SKIPPED: 'Skipped',
};

export function StatusBadge({ status }: { status: string }) {
  const style = STYLES[status] || 'bg-skip/10 text-skip border-skip/30';
  const label = LABELS[status] || status;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${style}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

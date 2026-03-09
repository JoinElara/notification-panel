import type { NotificationStatus } from '@/data/mockData';

const configs: Record<NotificationStatus, { label: string; dot: string; pill: string }> = {
  draft:      { label: 'Draft',      dot: 'bg-muted-foreground',    pill: 'bg-muted/60 text-muted-foreground' },
  scheduled:  { label: 'Scheduled',  dot: 'bg-status-scheduled',   pill: 'bg-status-scheduled/10 text-status-scheduled' },
  processing: { label: 'Processing', dot: 'bg-status-processing',  pill: 'bg-status-processing/10 text-status-processing' },
  completed:  { label: 'Completed',  dot: 'bg-status-completed',   pill: 'bg-status-completed/10 text-status-completed' },
  failed:     { label: 'Failed',     dot: 'bg-status-failed',      pill: 'bg-status-failed/10 text-status-failed' },
  cancelled:  { label: 'Cancelled',  dot: 'bg-status-cancelled',   pill: 'bg-muted/60 text-muted-foreground' },
};

export function StatusBadge({ status }: { status: NotificationStatus }) {
  const cfg = configs[status] ?? configs.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${cfg.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

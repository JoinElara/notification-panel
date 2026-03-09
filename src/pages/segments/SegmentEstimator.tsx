import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { segmentsApi } from '@/services/api';
import type { SegmentOverview } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { SegmentEstimatorSkeleton } from '@/components/shared/Skeletons';
import { Users, UserCheck, Star, Zap, Clock, RefreshCw } from 'lucide-react';

interface SegmentFilter {
  key: keyof SegmentOverview;
  filterKey: 'inactiveUsers' | 'premiumUsers' | 'newUsers' | 'trialUsers';
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const SEGMENT_FILTERS: SegmentFilter[] = [
  { key: 'inactiveUsers', filterKey: 'inactiveUsers', label: 'Inactive Users', description: 'No login in the past 30 days',   icon: Clock,       color: 'text-status-scheduled' },
  { key: 'premiumUsers',  filterKey: 'premiumUsers',  label: 'Premium Users',  description: 'Active paid subscribers',         icon: Star,        color: 'text-status-completed' },
  { key: 'newUsers',      filterKey: 'newUsers',      label: 'New Users',      description: 'Signed up in the last 7 days',    icon: Zap,         color: 'text-status-processing' },
  { key: 'trialUsers',    filterKey: 'trialUsers',    label: 'Trial Users',    description: 'Currently on a free trial',       icon: UserCheck,   color: 'text-status-draft' },
];

export default function SegmentEstimator() {
  const [overview, setOverview]     = useState<SegmentOverview | null>(null);
  const [selected, setSelected]     = useState<Record<string, boolean>>({});
  const [estimate, setEstimate]     = useState<number | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    segmentsApi.overview().then((data) => {
      setOverview(data);
      setLoading(false);
    });
  }, []);

  const toggle = (key: string) => {
    setSelected((prev) => ({ ...prev, [key]: !prev[key] }));
    setEstimate(null);
  };

  const handleEstimate = async () => {
    const anySelected = Object.values(selected).some(Boolean);
    if (!anySelected) return;
    setEstimating(true);
    try {
      const segment = Object.fromEntries(
        SEGMENT_FILTERS.map((f) => [f.filterKey, selected[f.filterKey] ?? false])
      );
      const res = await segmentsApi.estimate(segment);
      setEstimate(res.estimatedCount);
    } finally {
      setEstimating(false);
    }
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;

  if (loading) return <SegmentEstimatorSkeleton />;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Segment Estimator</h2>
          <p className="text-sm text-muted-foreground">Estimate your audience size before sending</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="bg-card border border-border rounded-lg p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
            <Users className="w-4 h-4 text-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Registered Users</p>
            <p className="text-2xl font-bold text-foreground">{overview?.totalUsers.toLocaleString()}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SEGMENT_FILTERS.map(({ key, label, icon: Icon, color }) => (
            <div key={key} className="bg-secondary/50 rounded-md p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className={`w-3.5 h-3.5 ${color}`} />
                <p className="text-[10px] text-muted-foreground font-medium">{label}</p>
              </div>
              <p className="text-lg font-bold text-foreground">
                {overview?.[key as keyof SegmentOverview]?.toLocaleString() ?? 0}
              </p>
              {overview && (
                <p className="text-[10px] text-muted-foreground">
                  {(((overview[key as keyof SegmentOverview] as number) / overview.totalUsers) * 100).toFixed(1)}% of total
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Segment Builder */}
      <div className="bg-card border border-border rounded-lg p-5 mb-4">
        <h3 className="text-sm font-semibold text-foreground mb-1">Build Your Segment</h3>
        <p className="text-xs text-muted-foreground mb-4">Select one or more filters to estimate your audience</p>

        <div className="grid md:grid-cols-2 gap-3">
          {SEGMENT_FILTERS.map(({ filterKey, label, description, icon: Icon, color }, i) => {
            const active = selected[filterKey] ?? false;
            return (
              <motion.button
                key={filterKey}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                type="button"
                onClick={() => toggle(filterKey)}
                className={`flex items-start gap-3 p-4 rounded-lg border text-left transition-all ${
                  active
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/40 hover:bg-secondary/50'
                }`}
              >
                <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${active ? 'bg-primary' : 'bg-secondary'}`}>
                  <Icon className={`w-4 h-4 ${active ? 'text-primary-foreground' : color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                  <p className={`text-xs font-bold mt-1 ${color}`}>
                    {overview?.[filterKey as keyof SegmentOverview]?.toLocaleString() ?? 0} users
                  </p>
                </div>
                <div className={`w-4 h-4 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                  active ? 'bg-primary border-primary' : 'border-border'
                }`}>
                  {active && <div className="w-1.5 h-1.5 bg-primary-foreground rounded-sm" />}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Estimate */}
      <div className="flex items-center gap-4">
        <Button
          onClick={handleEstimate}
          disabled={selectedCount === 0 || estimating}
          className="gap-2 min-w-40"
        >
          {estimating ? (
            <div className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {estimating ? 'Estimating...' : `Estimate Audience${selectedCount > 0 ? ` (${selectedCount} filter${selectedCount > 1 ? 's' : ''})` : ''}`}
        </Button>

        {estimate !== null && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-2.5"
          >
            <Users className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Estimated Reach</p>
              <p className="text-xl font-bold text-foreground">{estimate.toLocaleString()}</p>
            </div>
            {overview && (
              <div className="border-l border-border pl-3">
                <p className="text-xs text-muted-foreground">of total</p>
                <p className="text-sm font-semibold text-muted-foreground">
                  {((estimate / overview.totalUsers) * 100).toFixed(1)}%
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

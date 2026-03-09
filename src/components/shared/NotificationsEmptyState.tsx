import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface Props {
  hasFilters: boolean;
  onClear?: () => void;
}

export function NotificationsEmptyState({ hasFilters, onClear }: Props) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center py-20 px-6"
    >
      {/* Illustration */}
      <div className="relative mb-7">
        <svg
          width="180"
          height="140"
          viewBox="0 0 180 140"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-muted-foreground"
        >
          {/* Background blob */}
          <ellipse cx="90" cy="115" rx="64" ry="12" fill="currentColor" fillOpacity="0.07" />

          {/* Main notification card — back */}
          <rect x="36" y="28" width="108" height="72" rx="10" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.14" strokeWidth="1.5" />

          {/* Main notification card — front */}
          <rect x="26" y="20" width="108" height="72" rx="10" fill="hsl(var(--card))" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1.5" />

          {/* Bell icon circle */}
          <circle cx="50" cy="44" r="12" fill="currentColor" fillOpacity="0.08" />
          <path
            d="M50 36.5c-.55 0-1 .45-1 1v.57A5.5 5.5 0 0 0 44.5 43.5v3l-1.5 2V50h14v-1.5l-1.5-2v-3A5.5 5.5 0 0 0 51 38.07V37.5c0-.55-.45-1-1-1Zm0 14a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2Z"
            fill="currentColor"
            fillOpacity="0.35"
          />

          {/* Text lines */}
          <rect x="68" y="37" width="50" height="6" rx="3" fill="currentColor" fillOpacity="0.2" />
          <rect x="68" y="49" width="36" height="4.5" rx="2.25" fill="currentColor" fillOpacity="0.12" />

          {/* Bottom row */}
          <rect x="38" y="67" width="24" height="4" rx="2" fill="currentColor" fillOpacity="0.1" />
          <rect x="68" y="67" width="16" height="4" rx="2" fill="currentColor" fillOpacity="0.1" />
          <rect x="118" y="65" width="8" height="8" rx="4" fill="currentColor" fillOpacity="0.15" />

          {/* Small floating plus badge */}
          <circle cx="148" cy="26" r="14" fill="hsl(var(--primary))" fillOpacity="0.1" stroke="hsl(var(--primary))" strokeOpacity="0.3" strokeWidth="1.5" />
          <path d="M148 20v12M142 26h12" stroke="hsl(var(--primary))" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" />

          {/* Sparkle dots */}
          <circle cx="22" cy="50" r="3" fill="currentColor" fillOpacity="0.15" />
          <circle cx="16" cy="68" r="2" fill="currentColor" fillOpacity="0.1" />
          <circle cx="158" cy="72" r="2.5" fill="currentColor" fillOpacity="0.1" />

          {/* Dashed lines across middle — "no results" feel */}
          <line x1="38" y1="57" x2="122" y2="57" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" strokeDasharray="4 3" />
        </svg>
      </div>

      {/* Heading */}
      <h3 className="text-base font-semibold text-foreground mb-1.5">
        {hasFilters ? 'No notifications match your filters' : 'No notifications yet'}
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-xs mb-6">
        {hasFilters
          ? 'Try adjusting your search or status filter to find what you\'re looking for.'
          : 'Get started by creating your first push or email notification to reach your users.'}
      </p>

      {/* CTA */}
      {hasFilters ? (
        <Button variant="outline" size="sm" onClick={onClear} className="gap-2">
          Clear filters
        </Button>
      ) : (
        <Button size="sm" onClick={() => navigate('/notifications/create')} className="gap-2">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Create your first notification
        </Button>
      )}
    </motion.div>
  );
}

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { notificationsApi } from '@/services/api';
import type { Notification, Platform } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AppleIcon, AndroidIcon, WebIcon, EmailIcon } from '@/components/shared/PlatformIcons';
import { ArrowLeft, Save } from 'lucide-react';

const schema = z.object({
  title: z.string().min(1, 'Title required'),
  body: z.string().min(1, 'Body required'),
  platforms: z.array(z.enum(['ios', 'android', 'web', 'email'])).min(1, 'Select at least one platform'),
  targetType: z.enum(['all_users', 'specific_users', 'segment']),
  specificUserIds: z.string().optional(),
  segmentInactive: z.boolean().optional(),
  segmentPremium: z.boolean().optional(),
  segmentNew: z.boolean().optional(),
  segmentTrial: z.boolean().optional(),
  scheduledAt: z.string().optional(),
  link: z.string().optional().refine(val => !val || !val.includes('[id]'), {
    message: 'Direct ID is required (remove [id] and specify a real ID)'
  }),
});

type FormValues = z.infer<typeof schema>;

const PLATFORMS: { id: Platform; label: string; Icon: React.ElementType }[] = [
  { id: 'ios',     label: 'iOS',     Icon: AppleIcon },
  { id: 'android', label: 'Android', Icon: AndroidIcon },
  { id: 'web',     label: 'Web',     Icon: WebIcon },
  { id: 'email',   label: 'Email',   Icon: EmailIcon },
];

export default function EditNotification() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [notif, setNotif] = useState<Notification | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const targetType = watch('targetType');

  useEffect(() => {
    if (!id) return;
    notificationsApi.getById(id).then((n) => {
      setNotif(n);
      if (n) {
        reset({
          title: n.title,
          body: n.body,
          platforms: n.platforms as any,
          targetType: n.targetType as any,
          specificUserIds: n.specificUserIds?.join(', ') || '',
          segmentInactive: n.segment?.inactiveUsers || false,
          segmentPremium: n.segment?.premiumUsers || false,
          segmentNew: n.segment?.newUsers || false,
          segmentTrial: n.segment?.trialUsers || false,
          scheduledAt: n.scheduledAt,
          link: n.link,
        });
      }
    });
  }, [id, reset]);

  const onSubmit = async (data: FormValues) => {
    if (!notif) return;
    setSaving(true);
    try {
      const userIds = data.specificUserIds
        ? data.specificUserIds.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      await notificationsApi.update(notif.id, {
        title: data.title,
        body: data.body,
        platforms: data.platforms as Platform[],
        targetType: data.targetType,
        specificUserIds: data.targetType === 'specific_users' ? userIds : undefined,
        segment: data.targetType === 'segment' ? {
          inactiveUsers: data.segmentInactive,
          premiumUsers: data.segmentPremium,
          newUsers: data.segmentNew,
          trialUsers: data.segmentTrial,
        } : undefined,
        scheduledAt: data.scheduledAt,
        link: data.link,
      });
      toast.success('Saved successfully');
      navigate(`/notifications/${notif.id}`);
    } catch (e) {
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (!notif) {
    return <div className="flex items-center justify-center py-24"><div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" /></div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-secondary transition-colors text-muted-foreground">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-foreground">Edit Notification</h2>
          <p className="text-sm text-muted-foreground truncate max-w-sm">{notif.title}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-foreground">Content</h3>
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Title</Label>
            <Input {...register('title')} className="bg-background" />
            {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Body</Label>
            <Textarea {...register('body')} rows={4} className="bg-background resize-none" />
            {errors.body && <p className="text-xs text-destructive mt-1">{errors.body.message}</p>}
          </div>
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Deep Link (Internal path)</Label>
            <Input {...register('link')} placeholder="e.g. /chat or /wardrobe/123" className="bg-background" />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[
                { label: 'Home', path: '/' },
                { label: 'Wardrobe', path: '/wardrobe' },
                { label: 'Playground', path: '/wardrobe/playground' },
                { label: 'Chat', path: '/chat' },
                { label: 'Search', path: '/search-chats' },
                { label: 'Wishlist', path: '/wishlist' },
                { label: 'Saved Outfits', path: '/saved-outfits' },
                { label: 'Notifications', path: '/notifications' },
                { label: 'Outfit Detail', path: '/outfit-detail' },
                { label: 'Virtual Try-On', path: '/try-on' },
                { label: 'Forgot PW', path: '/forgot-password' },
                { label: 'Onboarding', path: '/onboarding' },
                { label: 'Walkthrough', path: '/walkthrough' },
              ].map((s) => (
                <button
                  key={s.path}
                  type="button"
                  onClick={() => setValue('link', s.path)}
                  className="px-2 py-0.5 rounded border border-border bg-secondary/50 text-[10px] font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
            {errors.link && <p className="text-xs text-destructive mt-1">{errors.link.message}</p>}
            <p className="text-[10px] text-muted-foreground mt-2">Specify direct IDs for dynamic routes (e.g., /wardrobe/69c7...).</p>
          </div>
        </div>

        {/* Platforms */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Platforms <span className="text-destructive">*</span></h3>
          <Controller
            name="platforms"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(({ id, label, Icon }) => {
                  const active = field.value?.includes(id);
                  return (
                    <button key={id} type="button"
                      onClick={() => {
                        const next = active ? field.value.filter((p) => p !== id) : [...(field.value || []), id];
                        field.onChange(next);
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                        active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />{label}
                    </button>
                  );
                })}
              </div>
            )}
          />
          {errors.platforms && <p className="text-xs text-destructive mt-1">{errors.platforms.message}</p>}
        </div>

        {/* Target */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Target Audience</h3>
          <div className="flex gap-2 mb-4">
            {(['all_users', 'specific_users', 'segment'] as const).map((t) => (
              <button key={t} type="button"
                onClick={() => setValue('targetType', t)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all border ${
                  targetType === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50 bg-background'
                }`}
              >
                {t === 'all_users' ? 'All Users' : t === 'specific_users' ? 'Specific Users' : 'Segment'}
              </button>
            ))}
          </div>

          {targetType === 'specific_users' && (
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">User IDs (comma-separated)</Label>
              <Input {...register('specificUserIds')} placeholder="usr-1a2b, usr-3c4d, ..." className="bg-background" />
            </div>
          )}

          {targetType === 'segment' && (
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'segmentInactive', label: 'Inactive Users' },
                { key: 'segmentPremium', label: 'Premium Users' },
                { key: 'segmentNew', label: 'New Users' },
                { key: 'segmentTrial', label: 'Trial Users' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2.5 p-3 rounded-lg border border-border hover:bg-secondary cursor-pointer transition-colors">
                  <input type="checkbox" {...register(key as keyof FormValues)} className="rounded" />
                  <span className="text-sm font-medium text-foreground">{label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {notif.sendMode === 'scheduled' && (
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Schedule</h3>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Scheduled Date & Time (UTC)</Label>
              <Input type="datetime-local" {...register('scheduledAt')} className="bg-background" min={new Date().toISOString().slice(0, 16)} />
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">Cancel</Button>
          <Button type="submit" disabled={saving} className="flex-1 gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}

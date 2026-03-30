import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { notificationsApi, templatesApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AppleIcon, AndroidIcon, WebIcon, EmailIcon } from '@/components/shared/PlatformIcons';
import { ArrowLeft, Send, Clock, Sparkles, X } from 'lucide-react';
import type { Platform } from '@/data/mockData';
import { useEffect } from 'react';
import type { Template } from '@/data/mockData';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  body: z.string().min(1, 'Body is required').max(300),
  platforms: z.array(z.enum(['ios', 'android', 'web', 'email'])).min(1, 'Select at least one platform'),
  targetType: z.enum(['all_users', 'specific_users', 'segment']),
  specificUserIds: z.string().optional(),
  segmentInactive: z.boolean().optional(),
  segmentPremium: z.boolean().optional(),
  segmentNew: z.boolean().optional(),
  segmentTrial: z.boolean().optional(),
  sendMode: z.enum(['instant', 'scheduled']),
  scheduledAt: z.string().optional(),
  templateId: z.string().optional(),
  link: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type PlatformEntry = { id: Platform; label: string; Icon: React.ElementType };

const PLATFORMS: PlatformEntry[] = [
  { id: 'ios',     label: 'iOS',     Icon: AppleIcon },
  { id: 'android', label: 'Android', Icon: AndroidIcon },
  { id: 'web',     label: 'Web',     Icon: WebIcon },
  { id: 'email',   label: 'Email',   Icon: EmailIcon },
];


export default function CreateNotification() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplatePanel, setShowTemplatePanel] = useState(false);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      platforms: ['ios', 'android'],
      targetType: 'all_users',
      sendMode: 'instant',
    },
  });

  const targetType = watch('targetType');
  const sendMode = watch('sendMode');
  const selectedTemplateId = watch('templateId');

  useEffect(() => {
    templatesApi.list().then(setTemplates);
  }, []);

  const applyTemplate = (tpl: Template) => {
    setValue('title', tpl.title);
    setValue('body', tpl.body);
    setValue('link', tpl.linkTemplate || '');
    setValue('templateId', tpl.id);
    setShowTemplatePanel(false);
    toast.success('Template applied', { description: tpl.name });
  };

  const onSubmit = async (data: FormValues) => {
    if (data.sendMode === 'scheduled' && !data.scheduledAt) {
      toast.error('Schedule time required');
      return;
    }

    setIsSubmitting(true);
    try {
      const userIds = data.specificUserIds
        ? data.specificUserIds.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      if (data.targetType === 'specific_users' && userIds.length === 0) {
        toast.error('Add at least one user ID');
        setIsSubmitting(false);
        return;
      }

      const payload = {
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
        sendMode: data.sendMode,
        scheduledAt: data.sendMode === 'scheduled' ? data.scheduledAt : undefined,
        templateId: data.templateId || undefined,
        link: data.link || undefined,
      };

      const notif = await notificationsApi.create(payload);

      if (data.sendMode === 'instant') {
        await notificationsApi.sendNow(notif.id);
        toast.success('Notification sent!', { description: "It's now processing." });
      } else {
        toast.success('Notification scheduled', { description: `Set for ${data.scheduledAt}` });
      }

      navigate(`/notifications/${notif.id}`);
    } catch (e) {
      toast.error('Failed to create');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-secondary transition-colors text-muted-foreground">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-foreground">New Notification</h2>
          <p className="text-sm text-muted-foreground">Compose and send or schedule a notification</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {/* Template Selector */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Use a Template</span>
              <span className="text-xs text-muted-foreground">(optional)</span>
            </div>
            <button type="button" onClick={() => setShowTemplatePanel(!showTemplatePanel)} className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium">
              {showTemplatePanel ? 'Hide' : 'Browse templates →'}
            </button>
          </div>
          {selectedTemplateId && (
            <div className="flex items-center gap-2 bg-secondary rounded-md px-3 py-2">
              <span className="text-xs font-medium text-foreground">
                {templates.find((t) => t.id === selectedTemplateId)?.name ?? selectedTemplateId}
              </span>
              <button type="button" onClick={() => setValue('templateId', undefined)} className="ml-auto text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {showTemplatePanel && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-2 gap-2 mt-3 overflow-hidden">
              {templates.filter((t) => t.isActive).map((t) => (
                <button key={t.id} type="button" onClick={() => applyTemplate(t)}
                  className="text-left p-3 rounded-md border border-border hover:border-primary hover:bg-secondary/50 transition-all">
                  <p className="text-xs font-semibold text-foreground">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{t.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Variables: {t.variables.join(', ')}</p>
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Content */}
        <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-foreground">Content</h3>
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Title <span className="text-destructive">*</span></Label>
            <Input {...register('title')} placeholder="e.g. Your order has shipped! 🚀" className="bg-background" />
            {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <Label className="text-xs font-semibold mb-1.5 block">Body <span className="text-destructive">*</span></Label>
            <Textarea {...register('body')} placeholder="Write your notification message..." rows={3} className="bg-background resize-none" />
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
                  const active = field.value.includes(id);
                  return (
                    <button key={id} type="button"
                      onClick={() => {
                        const next = active ? field.value.filter((p) => p !== id) : [...field.value, id];
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

        {/* Send Mode */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Send Mode</h3>
          <div className="flex gap-3 mb-4">
            <button type="button" onClick={() => setValue('sendMode', 'instant')}
              className={`flex items-center gap-2 flex-1 justify-center py-2.5 rounded-lg border text-sm font-medium transition-all ${
                sendMode === 'instant' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50 bg-background'
              }`}
            >
              <Send className="w-4 h-4" /> Send Now
            </button>
            <button type="button" onClick={() => setValue('sendMode', 'scheduled')}
              className={`flex items-center gap-2 flex-1 justify-center py-2.5 rounded-lg border text-sm font-medium transition-all ${
                sendMode === 'scheduled' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50 bg-background'
              }`}
            >
              <Clock className="w-4 h-4" /> Schedule
            </button>
          </div>
          {sendMode === 'scheduled' && (
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Schedule Date & Time (UTC)</Label>
              <Input type="datetime-local" {...register('scheduledAt')} className="bg-background" min={new Date().toISOString().slice(0, 16)} />
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-2 gap-2 min-w-32">
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>{sendMode === 'instant' ? <Send className="w-4 h-4" /> : <Clock className="w-4 h-4" />}</>
            )}
            {isSubmitting ? 'Sending...' : sendMode === 'instant' ? 'Send Now' : 'Schedule'}
          </Button>
        </div>
      </form>
    </div>
  );
}

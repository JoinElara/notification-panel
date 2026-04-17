import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { notificationsApi, templatesApi, usersApi, type UserSearchHit } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AppleIcon, AndroidIcon, WebIcon, EmailIcon } from '@/components/shared/PlatformIcons';
import { ArrowLeft, Send, Clock, Sparkles, X, Search, Loader2 } from 'lucide-react';
import type { Platform } from '@/data/mockData';
import type { Template } from '@/data/mockData';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  body: z.string().min(1, 'Body is required').max(300),
  platforms: z.array(z.enum(['ios', 'android', 'web', 'email'])).min(1, 'Select at least one platform'),
  targetType: z.enum(['all_users', 'specific_users', 'segment']),
  /** Comma-separated MongoDB user IDs (optional fallback) */
  manualUserIds: z.string().optional(),
  segmentInactive: z.boolean().optional(),
  segmentPremium: z.boolean().optional(),
  segmentNew: z.boolean().optional(),
  segmentTrial: z.boolean().optional(),
  sendMode: z.enum(['instant', 'scheduled']),
  scheduledAt: z.string().optional(),
  templateId: z.string().optional(),
  link: z.string().optional(),
  templateVariables: z.record(z.string()).optional(),
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
  const [emailSearchQuery, setEmailSearchQuery] = useState('');
  const [emailSearchResults, setEmailSearchResults] = useState<UserSearchHit[]>([]);
  const [emailSearchLoading, setEmailSearchLoading] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<{ id: string; email: string }[]>([]);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      platforms: ['ios', 'android', 'email'],
      targetType: 'all_users',
      sendMode: 'instant',
      templateVariables: {},
    },
  });

  const targetType = watch('targetType');
  const sendMode = watch('sendMode');
  const selectedTemplateId = watch('templateId');
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  useEffect(() => {
    templatesApi.list().then(setTemplates);
  }, []);

  useEffect(() => {
    if (targetType !== 'specific_users') return;
    const q = emailSearchQuery.trim();
    if (q.length < 2) {
      setEmailSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setEmailSearchLoading(true);
      usersApi
        .search(q)
        .then((hits) => {
          setEmailSearchResults(hits);
        })
        .catch(() => {
          setEmailSearchResults([]);
        })
        .finally(() => setEmailSearchLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [emailSearchQuery, targetType]);

  const addRecipient = useCallback((hit: UserSearchHit) => {
    setSelectedRecipients((prev) => {
      if (prev.some((r) => r.id === hit.id)) return prev;
      return [...prev, { id: hit.id, email: hit.email }];
    });
    setEmailSearchQuery('');
    setEmailSearchResults([]);
  }, []);

  const removeRecipient = useCallback((id: string) => {
    setSelectedRecipients((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const applyTemplate = (tpl: Template) => {
    setValue('title', tpl.title);
    setValue('body', tpl.body);
    setValue('link', tpl.linkTemplate || '');
    setValue('templateId', tpl.id);
    const existingVariables = watch('templateVariables') || {};
    const nextVariables = tpl.variables.reduce<Record<string, string>>((acc, variableName) => {
      acc[variableName] = existingVariables[variableName] ?? '';
      return acc;
    }, {});
    setValue('templateVariables', nextVariables, { shouldValidate: true });
    const currentPlatforms = watch('platforms') || [];
    if (tpl.htmlTemplate && !currentPlatforms.includes('email')) {
      setValue('platforms', [...currentPlatforms, 'email'], { shouldValidate: true });
    }
    setShowTemplatePanel(false);
    toast.success('Template applied', {
      description: tpl.htmlTemplate
        ? `${tpl.name} (email platform enabled)`
        : tpl.name,
    });
  };

  const onSubmit = async (data: FormValues) => {
    if (data.sendMode === 'scheduled' && !data.scheduledAt) {
      toast.error('Schedule time required');
      return;
    }

    setIsSubmitting(true);
    try {
      const fromEmail = selectedRecipients.map((r) => r.id);
      const fromManual = data.manualUserIds
        ? data.manualUserIds.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      const userIds = [...new Set([...fromEmail, ...fromManual])];

      if (data.targetType === 'specific_users' && userIds.length === 0) {
        toast.error('Search by email and select at least one user, or paste user IDs');
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
        templateData: data.templateId
          ? Object.fromEntries(
              Object.entries(data.templateVariables || {}).filter(([, value]) => value.trim().length > 0)
            )
          : undefined,
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
            <Input {...register('link')} placeholder="e.g. /(tabs)/chat or /try-on" className="bg-background" />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[
                { label: 'Chat', path: '/(tabs)/chat' },
                { label: 'Wardrobe', path: '/(tabs)/wardrobe' },
                { label: 'Try-On', path: '/try-on' },
                { label: 'Notifications', path: '/notifications' },
                { label: 'Settings', path: '/settings' },
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
            <p className="text-[10px] text-muted-foreground mt-2">Leave empty for default app opening behavior.</p>
          </div>
        </div>

        {selectedTemplate && selectedTemplate.variables.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-5 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-foreground">Template Variables</h3>
            <p className="text-xs text-muted-foreground">
              Fill optional values for template placeholders. Leave empty to keep default placeholders.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedTemplate.variables.map((variableName) => (
                <div key={variableName}>
                  <Label className="text-xs font-semibold mb-1.5 block">
                    {variableName}
                  </Label>
                  <Input
                    {...register(`templateVariables.${variableName}` as const)}
                    placeholder={`Value for {{${variableName}}}`}
                    className="bg-background"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

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
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Label className="text-xs font-semibold mb-1.5 block">Find by email</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    value={emailSearchQuery}
                    onChange={(e) => setEmailSearchQuery(e.target.value)}
                    placeholder="Type an email address…"
                    className="bg-background pl-9"
                    autoComplete="off"
                  />
                  {emailSearchLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
                  )}
                </div>
                {emailSearchQuery.trim().length >= 2 && emailSearchResults.length > 0 && (
                  <ul
                    className="absolute z-10 mt-1 w-full max-h-48 overflow-auto rounded-md border border-border bg-popover text-popover-foreground shadow-md"
                    role="listbox"
                  >
                    {emailSearchResults
                      .filter((h) => !selectedRecipients.some((r) => r.id === h.id))
                      .map((hit) => (
                        <li key={hit.id}>
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => addRecipient(hit)}
                          >
                            <span className="font-medium">{hit.email}</span>
                            {hit.firstName ? (
                              <span className="text-muted-foreground ml-2">{hit.firstName}</span>
                            ) : null}
                          </button>
                        </li>
                      ))}
                  </ul>
                )}
                {emailSearchQuery.trim().length >= 2 && !emailSearchLoading && emailSearchResults.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">No users match that search.</p>
                )}
              </div>

              {selectedRecipients.length > 0 && (
                <div>
                  <Label className="text-xs font-semibold mb-1.5 block">Selected recipients</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecipients.map((r) => (
                      <span
                        key={r.id}
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary px-2 py-1 text-xs"
                      >
                        <span className="truncate max-w-[220px]" title={r.email}>{r.email}</span>
                        <button
                          type="button"
                          onClick={() => removeRecipient(r.id)}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={`Remove ${r.email}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-xs font-semibold mb-1.5 block text-muted-foreground">
                  Or paste user IDs (comma-separated, optional)
                </Label>
                <Input
                  {...register('manualUserIds')}
                  placeholder="MongoDB ObjectIds if you already have them"
                  className="bg-background font-mono text-xs"
                />
              </div>
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

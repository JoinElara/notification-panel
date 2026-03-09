import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { notificationsApi } from '@/services/api';
import type { Notification, Platform } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';

const schema = z.object({
  title: z.string().min(1, 'Title required'),
  body: z.string().min(1, 'Body required'),
  scheduledAt: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function EditNotification() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [notif, setNotif] = useState<Notification | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!id) return;
    notificationsApi.getById(id).then((n) => {
      setNotif(n);
      if (n) reset({ title: n.title, body: n.body, scheduledAt: n.scheduledAt });
    });
  }, [id, reset]);

  const onSubmit = async (data: FormValues) => {
    if (!notif) return;
    setSaving(true);
    try {
      await notificationsApi.update(notif.id, {
        title: data.title,
        body: data.body,
        scheduledAt: data.scheduledAt,
      });
      toast.success('Saved successfully');
      navigate(`/notifications/${notif.id}`);
    } finally {
      setSaving(false);
    }
  };

  if (!notif) {
    return <div className="flex items-center justify-center py-24"><div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" /></div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
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

        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Read-only Fields</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 block">Platforms</Label>
              <p className="text-sm text-foreground capitalize">{notif.platforms.join(', ')}</p>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 block">Target Type</Label>
              <p className="text-sm text-foreground capitalize">{notif.targetType.replace('_', ' ')}</p>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 block">Send Mode</Label>
              <p className="text-sm text-foreground capitalize">{notif.sendMode}</p>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 block">Status</Label>
              <p className="text-sm text-foreground capitalize">{notif.status}</p>
            </div>
          </div>
        </div>

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

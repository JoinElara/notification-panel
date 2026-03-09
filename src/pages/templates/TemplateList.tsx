import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { templatesApi } from '@/services/api';
import type { Template } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { TemplateListSkeleton } from '@/components/shared/Skeletons';
import { toast } from 'sonner';
import { Plus, Trash2, Eye, Tag, X, Check } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

interface PreviewResult {
  title: string;
  body: string;
}

export default function TemplateList() {
  const [templates, setTemplates]               = useState<Template[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [createOpen, setCreateOpen]             = useState(false);
  const [previewOpen, setPreviewOpen]           = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [previewVars, setPreviewVars]           = useState<Record<string, string>>({});
  const [previewResult, setPreviewResult]       = useState<PreviewResult | null>(null);
  const [previewing, setPreviewing]             = useState(false);

  const [form, setForm]       = useState({ name: '', title: '', body: '' });
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await templatesApi.list();
    setTemplates(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.title || !form.body) {
      toast.error('All fields required');
      return;
    }
    const matches = [...form.title.matchAll(/{{(\w+)}}/g), ...form.body.matchAll(/{{(\w+)}}/g)];
    const variables = [...new Set(matches.map((m) => m[1]))];

    setCreating(true);
    try {
      await templatesApi.create({ ...form, variables });
      toast.success('Template created');
      setCreateOpen(false);
      setForm({ name: '', title: '', body: '' });
      load();
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (tpl: Template) => {
    await templatesApi.update(tpl.id, { isActive: !tpl.isActive });
    load();
  };

  const handleDelete = async (id: string) => {
    await templatesApi.remove(id);
    toast.success('Deleted');
    load();
  };

  const openPreview = (tpl: Template) => {
    setSelectedTemplate(tpl);
    const vars: Record<string, string> = {};
    tpl.variables.forEach((v) => (vars[v] = ''));
    setPreviewVars(vars);
    setPreviewResult(null);
    setPreviewOpen(true);
  };

  const handlePreview = async () => {
    if (!selectedTemplate) return;
    setPreviewing(true);
    try {
      const res = await templatesApi.preview(selectedTemplate.id, previewVars);
      setPreviewResult(res);
    } finally {
      setPreviewing(false);
    }
  };

  if (loading) return <TemplateListSkeleton />;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Templates</h2>
          <p className="text-sm text-muted-foreground">Reusable notification templates with dynamic variables</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Template
        </Button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {templates.map((tpl, i) => (
            <motion.div
              key={tpl.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.04 }}
              className={`bg-card border rounded-lg p-4 flex flex-col gap-3 ${tpl.isActive ? 'border-border' : 'border-border opacity-60'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{tpl.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {format(new Date(tpl.createdAt), 'MMM d, yyyy')} · {tpl.usageCount.toLocaleString()} uses
                  </p>
                </div>
                <Switch checked={tpl.isActive} onCheckedChange={() => handleToggleActive(tpl)} />
              </div>

              <div className="bg-secondary/50 rounded-md p-3">
                <p className="text-xs font-semibold text-foreground mb-1 truncate">{tpl.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{tpl.body}</p>
              </div>

              {tpl.variables.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tpl.variables.map((v) => (
                    <span key={v} className="flex items-center gap-1 text-[10px] font-mono bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">
                      <Tag className="w-2.5 h-2.5" />{v}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 mt-auto pt-1 border-t border-border">
                <button
                  onClick={() => openPreview(tpl)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
                <div className="ml-auto flex items-center gap-1">
                  <button
                    onClick={() => handleDelete(tpl.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Template</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <p className="text-xs text-muted-foreground">Use <code className="bg-secondary px-1 py-0.5 rounded text-xs">{'{{variable}}'}</code> in title/body to define dynamic variables.</p>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Template Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Order Shipped" className="bg-background" />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Title</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Hi {{name}}, your order is shipped!" className="bg-background" />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Body</Label>
              <Textarea value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} placeholder="Message body with {{variables}}..." rows={4} className="bg-background resize-none" />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={() => setCreateOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleCreate} disabled={creating} className="flex-1 gap-2">
                {creating ? <div className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Preview: {selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="flex flex-col gap-4 mt-2">
              {selectedTemplate.variables.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fill Variables</p>
                  {selectedTemplate.variables.map((v) => (
                    <div key={v} className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground w-24 flex-shrink-0">{`{{${v}}}`}</span>
                      <Input
                        value={previewVars[v] ?? ''}
                        onChange={(e) => setPreviewVars((prev) => ({ ...prev, [v]: e.target.value }))}
                        placeholder={`Enter ${v}...`}
                        className="h-8 text-xs bg-background"
                      />
                    </div>
                  ))}
                </div>
              )}
              <Button size="sm" onClick={handlePreview} disabled={previewing} className="gap-2">
                {previewing ? <div className="w-3.5 h-3.5 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                Generate Preview
              </Button>
              {previewResult && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-secondary rounded-lg p-4 border border-border">
                  <p className="text-xs text-muted-foreground mb-2 font-semibold">PREVIEW</p>
                  <p className="text-sm font-bold text-foreground mb-1">{previewResult.title}</p>
                  <p className="text-xs text-muted-foreground">{previewResult.body}</p>
                </motion.div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { api, setAuthToken } from '@/lib/api';
import type {
  Notification,
  Template,
  Segment,
  DeliveryLog,
  SegmentOverview,
  DashboardStats,
} from '@/data/mockData';

export { setAuthToken };

function toId(obj: { _id?: string; id?: string }): string {
  return (obj?.id ?? obj?._id ?? '')?.toString();
}

function normalizeNotification(raw: Record<string, unknown>): Notification {
  return {
    id: toId(raw as { _id?: string; id?: string }),
    title: String(raw.title ?? ''),
    body: String(raw.body ?? ''),
    platforms: Array.isArray(raw.platforms) ? raw.platforms : ['ios'],
    targetType: (raw.targetType as Notification['targetType']) ?? 'all_users',
    specificUserIds: Array.isArray(raw.specificUserIds) ? raw.specificUserIds : undefined,
    segment: raw.segment as Notification['segment'],
    sendMode: (raw.sendMode as Notification['sendMode']) ?? 'instant',
    scheduledAt: raw.scheduledAt as string | undefined,
    status: (raw.status as Notification['status']) ?? 'draft',
    templateId: raw.templateId as string | undefined,
    templateData: raw.templateData as Record<string, string> | undefined,
    link: raw.link as string | undefined,
    createdAt: String(raw.createdAt ?? ''),
    sentAt: raw.sentAt as string | undefined,
    stats: raw.stats as Notification['stats'],
  };
}

function normalizeTemplate(raw: Record<string, unknown>): Template {
  return {
    id: toId(raw as { _id?: string; id?: string }),
    name: String(raw.name ?? ''),
    title: String(raw.titleTemplate ?? raw.title ?? ''),
    body: String(raw.bodyTemplate ?? raw.body ?? ''),
    htmlTemplate: (raw.htmlTemplate as string | undefined) ?? undefined,
    linkTemplate: raw.linkTemplate as string | undefined,
    variables: Array.isArray(raw.variables) ? raw.variables : [],
    isActive: Boolean(raw.isActive ?? true),
    createdAt: String(raw.createdAt ?? ''),
    usageCount: Number(raw.usageCount ?? 0),
  };
}

function toTemplatePayload(payload: Partial<Template>): Record<string, unknown> {
  const { title, body, linkTemplate, ...rest } = payload;
  return {
    ...rest,
    titleTemplate: title ?? (payload as Record<string, unknown>).titleTemplate ?? '',
    bodyTemplate: body ?? (payload as Record<string, unknown>).bodyTemplate ?? '',
    linkTemplate: linkTemplate ?? (payload as Record<string, unknown>).linkTemplate,
  };
}

// --- Notifications ---
export const notificationsApi = {
  list: async (filters?: { status?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters?.search) params.set('search', filters.search);
    const res = await api.get<{ data: Record<string, unknown>[]; meta?: unknown }>(
      `/admin/notifications?${params.toString()}`
    );
    const list = Array.isArray(res?.data) ? res.data : [];
    return list.map((n) => normalizeNotification(n));
  },

  getById: async (id: string) => {
    const res = await api.get<{ data: Record<string, unknown> }>(
      `/admin/notifications/${id}`
    );
    return res?.data ? normalizeNotification(res.data) : null;
  },

  create: async (payload: Partial<Notification>) => {
    const res = await api.post<{ data: Record<string, unknown> }>(
      '/admin/notifications',
      payload
    );
    return res?.data ? normalizeNotification(res.data) : (null as Notification);
  },

  update: async (id: string, payload: Partial<Notification>) => {
    const res = await api.put<{ data: Record<string, unknown> }>(
      `/admin/notifications/${id}`,
      payload
    );
    return res?.data ? normalizeNotification(res.data) : (null as Notification);
  },

  sendNow: async (id: string): Promise<Notification> => {
    const res = await api.post<{ data: Record<string, unknown> }>(
      `/admin/notifications/${id}/send`
    );
    if (!res?.data) throw new Error('Failed to send notification');
    return normalizeNotification(res.data);
  },

  cancel: async (id: string) => {
    const res = await api.post<{ data: Record<string, unknown> }>(
      `/admin/notifications/${id}/cancel`
    );
    return res?.data ? normalizeNotification(res.data) : (null as Notification);
  },

  duplicate: async (id: string) => {
    const res = await api.post<{ data: Record<string, unknown> }>(
      `/admin/notifications/${id}/duplicate`
    );
    if (!res?.data) throw new Error('Failed to duplicate');
    return normalizeNotification(res.data);
  },

  remove: async (id: string) => {
    await api.delete(`/admin/notifications/${id}`);
  },

  logs: async (id: string, page = 1, limit = 10) => {
    const res = await api.get<{ data: Record<string, unknown>[]; meta?: { total: number } }>(
      `/admin/notifications/${id}/logs?page=${page}&limit=${limit}`
    );
    const list = Array.isArray(res?.data) ? res.data : [];
    const total = res?.meta?.total ?? list.length;
    return {
      data: list.map((l) => ({
        id: toId(l as { _id?: string; id?: string }),
        notificationId: String(l.notificationId ?? id),
        userId: String(l.userId ?? ''),
        platform: (l.platform as DeliveryLog['platform']) ?? 'ios',
        status: (l.status === 'sent' || l.status === 'delivered' ? 'delivered' : l.status === 'failed' ? 'failed' : 'pending') as DeliveryLog['status'],
        timestamp: String(l.createdAt ?? l.sentAt ?? ''),
        deviceToken: String(l.deviceToken ?? ''),
        error: l.errorMessage as string | undefined,
      })),
      total,
      page,
      limit,
    };
  },

  deliveryStats: async (id: string) => {
    const res = await api.get<Record<string, number>>(
      `/admin/notifications/${id}/delivery-stats`
    );
    const d = res?.data ?? res;
    if (!d || typeof d !== 'object') {
      return { total: 0, delivered: 0, failed: 0, pending: 0 };
    }
    const total = Number(d.total ?? d.sent ?? d.delivered ?? d.queued ?? 0) +
      Number(d.failed ?? 0) + Number(d.queued ?? 0);
    return {
      total: total || (Number(d.delivered ?? 0) + Number(d.failed ?? 0) + Number(d.queued ?? 0)),
      delivered: Number(d.delivered ?? d.sent ?? 0),
      failed: Number(d.failed ?? 0),
      pending: Number(d.queued ?? d.pending ?? 0),
    };
  },

  stats: async () => {
    const res = await api.get<{ data: any }>(
      '/admin/notifications/stats'
    );
    const d = res?.data ?? res;
    if (!d || typeof d !== 'object') {
      return {
        totalSent: 0,
        delivered: 0,
        failed: 0,
        scheduled: 0,
        deliveryRate: 0,
        activeTemplates: 0,
      };
    }
    const completed = Number(d.completed ?? d.totalSent ?? 0);
    const failed = Number(d.failed ?? 0);
    const total = completed + failed || 1;
    return {
      totalSent: completed,
      delivered: completed,
      failed,
      scheduled: Number(d.scheduled ?? 0),
      deliveryRate: total ? Math.round((completed / total) * 1000) / 10 : 0,
      activeTemplates: Number(d.activeTemplates ?? 0),
    } as DashboardStats;
  },
};

// --- Templates ---
export const templatesApi = {
  list: async () => {
    const res = await api.get<{ data: Record<string, unknown>[] }>(
      '/admin/notification-templates'
    );
    const list = Array.isArray(res?.data) ? res.data : [];
    return list.map((t) => normalizeTemplate(t));
  },

  getById: async (id: string) => {
    const res = await api.get<{ data: Record<string, unknown> }>(
      `/admin/notification-templates/${id}`
    );
    return res?.data ? normalizeTemplate(res.data) : null;
  },

  create: async (payload: Partial<Template>) => {
    const res = await api.post<{ data: Record<string, unknown> }>(
      '/admin/notification-templates',
      toTemplatePayload(payload)
    );
    return res?.data ? normalizeTemplate(res.data) : (null as Template);
  },

  update: async (id: string, payload: Partial<Template>) => {
    const res = await api.put<{ data: Record<string, unknown> }>(
      `/admin/notification-templates/${id}`,
      toTemplatePayload(payload)
    );
    return res?.data ? normalizeTemplate(res.data) : (null as Template);
  },

  preview: async (id: string, data: Record<string, string>) => {
    const res = await api.post<any>(
      `/admin/notification-templates/${id}/preview`,
      data
    );
    const d = res?.data ?? res;
    if (!d) throw new Error('Template not found');
    return {
      title: String(d.title ?? ''),
      body: String(d.body ?? ''),
      html: d.html ? String(d.html) : undefined,
    };
  },

  upsert: async (payload: {
    name: string;
    titleTemplate?: string;
    bodyTemplate?: string;
    htmlTemplate?: string;
    variables?: string[];
    isActive?: boolean;
  }) => {
    const res = await api.post<{ data: Record<string, unknown> }>(
      '/admin/notification-templates/upsert',
      payload
    );
    return res?.data ? normalizeTemplate(res.data) : (null as Template);
  },

  importEmailTemplates: async () => {
    const res = await api.post<{ data?: { imported: number; updated: number; total: number } }>(
      '/admin/notification-templates/import-email-templates'
    );
    return res?.data ?? { imported: 0, updated: 0, total: 0 };
  },

  remove: async (id: string) => {
    await api.delete(`/admin/notification-templates/${id}`);
  },
};

// --- Segments ---
export const segmentsApi = {
  overview: async (): Promise<SegmentOverview> => {
    const res = await api.get<{ data: any }>(
      '/admin/notification-segments/overview'
    );
    const d = res?.data ?? res;
    if (!d || typeof d !== 'object') {
      return {
        totalUsers: 0,
        inactiveUsers: 0,
        premiumUsers: 0,
        newUsers: 0,
        trialUsers: 0,
      };
    }
    return {
      totalUsers: Number(d.totalUsers ?? 0),
      inactiveUsers: Number(d.inactiveUsers ?? 0),
      premiumUsers: Number(d.premiumUsers ?? 0),
      newUsers: Number(d.newUsers ?? 0),
      trialUsers: Number(d.trialUsers ?? 0),
    };
  },

  estimate: async (segment: Segment) => {
    const res = await api.post<any>('/admin/notification-segments/estimate', segment);
    const d = res?.data ?? res;
    const count = Number(d?.estimatedAudience ?? d?.estimatedCount ?? 0);
    return { estimatedCount: count, breakdown: segment };
  },
};

// --- Device tokens (admin + user registration) — uses same `api` + VITE_API_URL as rest of app
export const deviceTokensApi = {
  register: async (payload: {
    platform: 'ios' | 'android' | 'web';
    token: string;
    appVersion?: string;
  }) => {
    const res = await api.post<{ data?: unknown }>('/device-tokens', payload);
    return res?.data;
  },

  unregister: async (token: string) => {
    await api.delete(`/device-tokens/${encodeURIComponent(token)}`);
  },

  myTokens: async () => {
    const res = await api.get<{ data?: unknown[] }>('/device-tokens/me');
    return res?.data ?? [];
  },

  stats: async () => {
    const res = await api.get<{
      data?: { total: number; byPlatform: Array<{ _id: string; count: number }> };
    }>('/admin/device-tokens/stats');
    return res?.data ?? { total: 0, byPlatform: [] };
  },

  byUser: async (userId: string) => {
    const res = await api.get<{ data?: unknown[] }>(`/admin/device-tokens/user/${userId}`);
    return res?.data ?? [];
  },
};

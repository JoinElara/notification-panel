import {
  mockNotifications,
  mockTemplates,
  mockDeliveryLogs,
  mockSegmentOverview,
  mockDashboardStats,
  type Notification,
  type Template,
  type Segment,
} from '@/data/mockData';

const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms));

// --- Notifications ---
export const notificationsApi = {
  list: async (filters?: { status?: string; search?: string }) => {
    await delay();
    let results = [...mockNotifications];
    if (filters?.status && filters.status !== 'all') {
      results = results.filter((n) => n.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)
      );
    }
    return results;
  },

  getById: async (id: string) => {
    await delay();
    return mockNotifications.find((n) => n.id === id) ?? null;
  },

  create: async (payload: Partial<Notification>) => {
    await delay(800);
    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      title: payload.title ?? '',
      body: payload.body ?? '',
      platforms: payload.platforms ?? ['ios'],
      targetType: payload.targetType ?? 'all_users',
      sendMode: payload.sendMode ?? 'instant',
      status: payload.sendMode === 'scheduled' ? 'scheduled' : 'draft',
      createdAt: new Date().toISOString(),
      scheduledAt: payload.scheduledAt,
      specificUserIds: payload.specificUserIds,
      segment: payload.segment,
      templateId: payload.templateId,
      templateData: payload.templateData,
      stats: { total: 0, delivered: 0, failed: 0, pending: 0 },
    };
    mockNotifications.unshift(newNotif);
    return newNotif;
  },

  update: async (id: string, payload: Partial<Notification>) => {
    await delay(600);
    const idx = mockNotifications.findIndex((n) => n.id === id);
    if (idx === -1) throw new Error('Notification not found');
    mockNotifications[idx] = { ...mockNotifications[idx], ...payload };
    return mockNotifications[idx];
  },

  sendNow: async (id: string): Promise<Notification> => {
    await delay(1000);
    const idx = mockNotifications.findIndex((n) => n.id === id);
    if (idx === -1) throw new Error('Not found');
    mockNotifications[idx] = {
      ...mockNotifications[idx],
      status: 'processing',
      sentAt: new Date().toISOString(),
    };
    return mockNotifications[idx];
  },

  cancel: async (id: string) => {
    await delay();
    const idx = mockNotifications.findIndex((n) => n.id === id);
    if (idx !== -1) mockNotifications[idx].status = 'cancelled';
    return mockNotifications[idx];
  },

  duplicate: async (id: string) => {
    await delay();
    const original = mockNotifications.find((n) => n.id === id);
    if (!original) throw new Error('Not found');
    const copy: Notification = {
      ...original,
      id: `notif-${Date.now()}`,
      title: `${original.title} (Copy)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      sentAt: undefined,
      stats: { total: 0, delivered: 0, failed: 0, pending: 0 },
    };
    mockNotifications.unshift(copy);
    return copy;
  },

  remove: async (id: string) => {
    await delay();
    const idx = mockNotifications.findIndex((n) => n.id === id);
    if (idx !== -1) mockNotifications.splice(idx, 1);
  },

  logs: async (id: string, page = 1, limit = 10) => {
    await delay();
    const allLogs = mockDeliveryLogs.filter((l) => l.notificationId === id);
    const start = (page - 1) * limit;
    return {
      data: allLogs.slice(start, start + limit),
      total: allLogs.length,
      page,
      limit,
    };
  },

  deliveryStats: async (id: string) => {
    await delay();
    const notif = mockNotifications.find((n) => n.id === id);
    return notif?.stats ?? { total: 0, delivered: 0, failed: 0, pending: 0 };
  },

  stats: async () => {
    await delay();
    return mockDashboardStats;
  },
};

// --- Templates ---
export const templatesApi = {
  list: async () => {
    await delay();
    return [...mockTemplates];
  },

  getById: async (id: string) => {
    await delay();
    return mockTemplates.find((t) => t.id === id) ?? null;
  },

  create: async (payload: Partial<Template>) => {
    await delay(800);
    const t: Template = {
      id: `tpl-${Date.now()}`,
      name: payload.name ?? '',
      title: payload.title ?? '',
      body: payload.body ?? '',
      variables: payload.variables ?? [],
      isActive: true,
      createdAt: new Date().toISOString(),
      usageCount: 0,
    };
    mockTemplates.unshift(t);
    return t;
  },

  update: async (id: string, payload: Partial<Template>) => {
    await delay();
    const idx = mockTemplates.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Template not found');
    mockTemplates[idx] = { ...mockTemplates[idx], ...payload };
    return mockTemplates[idx];
  },

  preview: async (id: string, data: Record<string, string>) => {
    await delay(400);
    const tpl = mockTemplates.find((t) => t.id === id);
    if (!tpl) throw new Error('Template not found');
    let title = tpl.title;
    let body = tpl.body;
    Object.entries(data).forEach(([k, v]) => {
      title = title.replace(new RegExp(`{{${k}}}`, 'g'), v);
      body = body.replace(new RegExp(`{{${k}}}`, 'g'), v);
    });
    return { title, body };
  },

  remove: async (id: string) => {
    await delay();
    const idx = mockTemplates.findIndex((t) => t.id === id);
    if (idx !== -1) mockTemplates.splice(idx, 1);
  },
};

// --- Segments ---
export const segmentsApi = {
  overview: async () => {
    await delay();
    return mockSegmentOverview;
  },

  estimate: async (segment: Segment) => {
    await delay(800);
    const overview = mockSegmentOverview;
    let count = 0;
    if (segment.inactiveUsers) count += overview.inactiveUsers;
    if (segment.premiumUsers) count += overview.premiumUsers;
    if (segment.newUsers) count += overview.newUsers;
    if (segment.trialUsers) count += overview.trialUsers;
    // Deduplicate overlap by ~15%
    count = Math.floor(count * 0.87);
    return { estimatedCount: count, breakdown: segment };
  },
};

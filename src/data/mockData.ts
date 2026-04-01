export type Platform = 'ios' | 'android' | 'web' | 'email';
export type TargetType = 'all_users' | 'specific_users' | 'segment';
export type SendMode = 'instant' | 'scheduled';
export type NotificationStatus = 'draft' | 'scheduled' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface Segment {
  inactiveUsers?: boolean;
  premiumUsers?: boolean;
  newUsers?: boolean;
  trialUsers?: boolean;
}

export interface DeliveryStats {
  total: number;
  delivered: number;
  failed: number;
  pending: number;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  platforms: Platform[];
  targetType: TargetType;
  specificUserIds?: string[];
  segment?: Segment;
  sendMode: SendMode;
  scheduledAt?: string;
  link?: string;
  status: NotificationStatus;
  templateId?: string;
  templateData?: Record<string, string>;
  createdAt: string;
  sentAt?: string;
  stats?: DeliveryStats;
}

export interface Template {
  id: string;
  name: string;
  title: string;
  body: string;
  htmlTemplate?: string;
  linkTemplate?: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  usageCount: number;
}

export interface DeliveryLog {
  id: string;
  notificationId: string;
  userId: string;
  platform: Platform;
  status: 'delivered' | 'failed' | 'pending';
  timestamp: string;
  deviceToken: string;
  error?: string;
}

export interface SegmentOverview {
  totalUsers: number;
  inactiveUsers: number;
  premiumUsers: number;
  newUsers: number;
  trialUsers: number;
}

export interface DashboardStats {
  totalSent: number;
  delivered: number;
  failed: number;
  scheduled: number;
  deliveryRate: number;
  activeTemplates: number;
}

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: 'notif-001',
    title: 'Your order has been shipped! 🚀',
    body: 'Track your package from the Ulara app. Estimated delivery in 2–3 business days.',
    platforms: ['ios', 'android', 'email'],
    targetType: 'specific_users',
    specificUserIds: ['usr-1a2b', 'usr-3c4d', 'usr-5e6f'],
    sendMode: 'instant',
    status: 'completed',
    createdAt: '2026-03-01T10:00:00Z',
    sentAt: '2026-03-01T10:02:00Z',
    stats: { total: 3, delivered: 3, failed: 0, pending: 0 },
  },
  {
    id: 'notif-002',
    title: 'Big Spring Update — New Features Inside!',
    body: 'We just shipped 12 new features you asked for. Check them out now!',
    platforms: ['ios', 'android', 'web'],
    targetType: 'all_users',
    sendMode: 'instant',
    status: 'completed',
    createdAt: '2026-03-03T09:00:00Z',
    sentAt: '2026-03-03T09:01:00Z',
    stats: { total: 18430, delivered: 17289, failed: 1141, pending: 0 },
  },
  {
    id: 'notif-003',
    title: 'We miss you — Special offer inside',
    body: 'It\'s been 30 days since your last login. Come back and discover what\'s new.',
    platforms: ['ios', 'android', 'email'],
    targetType: 'segment',
    segment: { inactiveUsers: true },
    sendMode: 'scheduled',
    scheduledAt: '2026-03-10T09:30:00Z',
    status: 'scheduled',
    createdAt: '2026-03-05T14:20:00Z',
    stats: { total: 0, delivered: 0, failed: 0, pending: 4210 },
  },
  {
    id: 'notif-004',
    title: 'Premium plan renewing tomorrow',
    body: 'Your premium subscription renews on March 15. Make sure your card is up to date.',
    platforms: ['ios', 'android', 'web', 'email'],
    targetType: 'segment',
    segment: { premiumUsers: true },
    sendMode: 'scheduled',
    scheduledAt: '2026-03-14T08:00:00Z',
    status: 'scheduled',
    createdAt: '2026-03-06T11:00:00Z',
    stats: { total: 0, delivered: 0, failed: 0, pending: 2341 },
  },
  {
    id: 'notif-005',
    title: 'Welcome to Elara Premium ✨',
    body: 'Thanks for upgrading! Enjoy unlimited access and priority support.',
    platforms: ['ios', 'android'],
    targetType: 'specific_users',
    specificUserIds: ['usr-7g8h'],
    sendMode: 'instant',
    status: 'completed',
    templateId: 'tpl-001',
    templateData: { name: 'Harpreet', plan: 'Premium' },
    createdAt: '2026-03-02T16:00:00Z',
    sentAt: '2026-03-02T16:01:00Z',
    stats: { total: 1, delivered: 1, failed: 0, pending: 0 },
  },
  {
    id: 'notif-006',
    title: 'Server maintenance scheduled',
    body: 'We\'ll be performing maintenance on March 8 from 2–4 AM UTC. Expect brief downtime.',
    platforms: ['web', 'email'],
    targetType: 'all_users',
    sendMode: 'instant',
    status: 'failed',
    createdAt: '2026-03-07T20:00:00Z',
    sentAt: '2026-03-07T20:01:00Z',
    stats: { total: 18430, delivered: 0, failed: 18430, pending: 0 },
  },
  {
    id: 'notif-007',
    title: 'New trial started for your team',
    body: 'Your 14-day team trial is now active. Explore all Pro features free.',
    platforms: ['ios', 'android', 'email'],
    targetType: 'segment',
    segment: { newUsers: true, trialUsers: true },
    sendMode: 'instant',
    status: 'processing',
    createdAt: '2026-03-08T07:30:00Z',
    stats: { total: 892, delivered: 543, failed: 12, pending: 337 },
  },
  {
    id: 'notif-008',
    title: 'Flash sale — 40% off today only!',
    body: 'Use code ELARA40 at checkout. Offer expires midnight.',
    platforms: ['ios', 'android', 'web', 'email'],
    targetType: 'all_users',
    sendMode: 'scheduled',
    scheduledAt: '2026-03-15T06:00:00Z',
    status: 'draft',
    createdAt: '2026-03-08T08:00:00Z',
    stats: { total: 0, delivered: 0, failed: 0, pending: 0 },
  },
  {
    id: 'notif-009',
    title: 'Your invoice is ready',
    body: 'Invoice #INV-2026-0341 is available for download in your account.',
    platforms: ['email'],
    targetType: 'specific_users',
    specificUserIds: ['usr-9i0j', 'usr-1k2l'],
    sendMode: 'instant',
    status: 'cancelled',
    createdAt: '2026-03-04T12:00:00Z',
    stats: { total: 2, delivered: 0, failed: 0, pending: 0 },
  },
  {
    id: 'notif-010',
    title: 'Security alert: New login detected',
    body: 'We detected a new login to your account from Chrome on Windows. Not you? Secure your account now.',
    platforms: ['ios', 'android', 'email'],
    targetType: 'specific_users',
    specificUserIds: ['usr-3m4n'],
    sendMode: 'instant',
    status: 'completed',
    createdAt: '2026-03-07T15:30:00Z',
    sentAt: '2026-03-07T15:30:05Z',
    stats: { total: 1, delivered: 1, failed: 0, pending: 0 },
  },
];

// Mock Templates
export const mockTemplates: Template[] = [
  {
    id: 'tpl-001',
    name: 'Welcome Premium',
    title: 'Welcome to Elara {{plan}} ✨',
    body: 'Hi {{name}}, thanks for upgrading! Enjoy unlimited access and priority support.',
    variables: ['name', 'plan'],
    isActive: true,
    createdAt: '2026-01-15T10:00:00Z',
    usageCount: 847,
  },
  {
    id: 'tpl-002',
    name: 'Order Shipped',
    title: 'Your order #{{orderId}} is on its way! 🚀',
    body: 'Hi {{name}}, your order has been shipped. Track it in the app. ETA: {{eta}}.',
    variables: ['name', 'orderId', 'eta'],
    isActive: true,
    createdAt: '2026-01-20T11:00:00Z',
    usageCount: 2341,
  },
  {
    id: 'tpl-003',
    name: 'Re-engagement',
    title: 'We miss you, {{name}}! 👋',
    body: 'It\'s been {{days}} days. Come back and see what\'s new — we have {{feature}} waiting for you.',
    variables: ['name', 'days', 'feature'],
    isActive: true,
    createdAt: '2026-02-01T09:00:00Z',
    usageCount: 1205,
  },
  {
    id: 'tpl-004',
    name: 'Invoice Ready',
    title: 'Invoice #{{invoiceId}} is ready',
    body: 'Your invoice for {{amount}} is available. Due date: {{dueDate}}.',
    variables: ['invoiceId', 'amount', 'dueDate'],
    isActive: true,
    createdAt: '2026-02-10T14:00:00Z',
    usageCount: 618,
  },
  {
    id: 'tpl-005',
    name: 'Trial Expiry Warning',
    title: 'Your trial ends in {{days}} days',
    body: 'Don\'t lose access to {{plan}} features. Upgrade now and keep everything.',
    variables: ['days', 'plan'],
    isActive: false,
    createdAt: '2026-02-15T10:00:00Z',
    usageCount: 92,
  },
  {
    id: 'tpl-006',
    name: 'Security Alert',
    title: 'New login to your Elara account',
    body: 'Hi {{name}}, we detected a new login from {{device}} on {{date}}. Not you? Secure your account.',
    variables: ['name', 'device', 'date'],
    isActive: true,
    createdAt: '2026-02-20T09:00:00Z',
    usageCount: 334,
  },
];

// Mock Delivery Logs
export const mockDeliveryLogs: DeliveryLog[] = [
  { id: 'log-001', notificationId: 'notif-002', userId: 'usr-1a2b', platform: 'ios', status: 'delivered', timestamp: '2026-03-03T09:01:12Z', deviceToken: 'tkn_abc123' },
  { id: 'log-002', notificationId: 'notif-002', userId: 'usr-3c4d', platform: 'android', status: 'delivered', timestamp: '2026-03-03T09:01:13Z', deviceToken: 'tkn_def456' },
  { id: 'log-003', notificationId: 'notif-002', userId: 'usr-5e6f', platform: 'web', status: 'failed', timestamp: '2026-03-03T09:01:14Z', deviceToken: 'tkn_ghi789', error: 'Device token expired' },
  { id: 'log-004', notificationId: 'notif-002', userId: 'usr-7g8h', platform: 'ios', status: 'delivered', timestamp: '2026-03-03T09:01:15Z', deviceToken: 'tkn_jkl012' },
  { id: 'log-005', notificationId: 'notif-002', userId: 'usr-9i0j', platform: 'android', status: 'delivered', timestamp: '2026-03-03T09:01:16Z', deviceToken: 'tkn_mno345' },
  { id: 'log-006', notificationId: 'notif-002', userId: 'usr-1k2l', platform: 'email', status: 'failed', timestamp: '2026-03-03T09:01:17Z', deviceToken: 'tkn_pqr678', error: 'Mailbox full' },
  { id: 'log-007', notificationId: 'notif-002', userId: 'usr-3m4n', platform: 'ios', status: 'delivered', timestamp: '2026-03-03T09:01:18Z', deviceToken: 'tkn_stu901' },
  { id: 'log-008', notificationId: 'notif-002', userId: 'usr-5o6p', platform: 'web', status: 'delivered', timestamp: '2026-03-03T09:01:19Z', deviceToken: 'tkn_vwx234' },
  { id: 'log-009', notificationId: 'notif-002', userId: 'usr-7q8r', platform: 'android', status: 'delivered', timestamp: '2026-03-03T09:01:20Z', deviceToken: 'tkn_yz0123' },
  { id: 'log-010', notificationId: 'notif-002', userId: 'usr-9s0t', platform: 'ios', status: 'failed', timestamp: '2026-03-03T09:01:21Z', deviceToken: 'tkn_abc456', error: 'App uninstalled' },
];

// Mock Segment Overview
export const mockSegmentOverview: SegmentOverview = {
  totalUsers: 24891,
  inactiveUsers: 4210,
  premiumUsers: 2341,
  newUsers: 1876,
  trialUsers: 892,
};

// Mock Dashboard Stats
export const mockDashboardStats: DashboardStats = {
  totalSent: 21830,
  delivered: 20462,
  failed: 1368,
  scheduled: 3,
  deliveryRate: 93.7,
  activeTemplates: 5,
};

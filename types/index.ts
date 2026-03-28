export type OrderStatus = 'request' | 'accepted' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  price: number; // per unit
}

// ─── Inventory ──────────────────────────────────────────────────
export interface InventoryMaterial {
  id: string;
  name: string;          // e.g. "Red Yarn"
  quantity: number;      // amount used per product
  unit: string;          // "grams" | "meters" | "pieces" | "skeins" | etc.
  costPerUnit: number;   // cost per 1 unit
  currency: string;
}

export interface InventoryProduct {
  id: string;
  name: string;          // e.g. "Rope Lamp"
  description?: string;
  category?: string;
  emoji?: string;
  materials: InventoryMaterial[];
  totalMaterialCost: number; // auto-calculated
  markup: number;            // e.g. 1.5 = 50% markup over material cost
  suggestedPrice: number;    // totalMaterialCost * markup
  notes?: string;
  remindInterval?: number;   // numeric part (e.g. 2)
  remindUnit?: 'days' | 'weeks' | 'months';
  nextReminderDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  // Core Info
  orderName: string;
  description: string;
  photos: string[];
  sourceLink?: string;

  // Multiple items
  orderItems?: OrderItem[];

  // Customer
  customerName: string;
  customerAddress: string;
  deliveryTime: string;
  customerPhone?: string;
  customerInstagram?: string;

  // Financials
  askingPrice: number;
  currency: string;
  isPaid: boolean;
  paymentNotes?: string;

  // Dates
  dueDate: Date;
  createdAt: Date;
  acceptedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;

  // Status
  status: OrderStatus;
  shipmentId?: string;
  carrier?: string;
  invoiceNumber?: string;

  // Categorization
  tags: string[];
  craftCategory: string;

  // Completion tracking (0-100)
  completionPercent?: number;

  // Notes
  internalNotes?: string;
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  phone?: string;
  instagram?: string;
  totalOrders: number;
  totalSpent: number;
  orderIds: string[];
  createdAt: Date;
}

export interface CraftCategory {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description?: string;
}

export interface NotificationPrefs {
  enabled: boolean;
  dueSoonAlerts: {
    enabled: boolean;
    intervals: number[];
    time: string;
  };
  dailyDigest: {
    enabled: boolean;
    time: string;
  };
  weeklySummary: {
    enabled: boolean;
    dayOfWeek: number;
    time: string;
  };
  shippingReminder: {
    enabled: boolean;
    daysAfterAccepted: number;
  };
  paymentReminder: {
    enabled: boolean;
    daysAfterDelivery: number;
  };
}

export interface BusinessProfile {
  name: string;
  tagline?: string;
  logoUrl?: string;
  address?: string;
  gstNumber?: string;
  currency: string;
  timezone: string;
  theme: AppTheme;
}

export type AppTheme = 'warm-cream' | 'dark-walnut' | 'soft-sage' | 'lavender' | 'system';

export interface WeeklyReport {
  period: { start: Date; end: Date };
  totalRevenue: number;
  ordersCompleted: number;
  ordersAccepted: number;
  ordersShipped: number;
  averageOrderValue: number;
  topCategory: string;
  topCustomer: { name: string; spent: number };
  revenueByCategory: Record<string, number>;
  revenueByDay: { date: string; amount: number }[];
  unpaidTotal: number;
}

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export interface OrderFormData {
  orderName: string;
  description: string;
  photos: string[];
  sourceLink?: string;
  orderItems?: OrderItem[];
  customerName: string;
  customerAddress: string;
  deliveryTime: string;
  customerPhone?: string;
  customerInstagram?: string;
  askingPrice: number;
  currency: string;
  isPaid: boolean;
  paymentNotes?: string;
  dueDate: Date;
  tags: string[];
  craftCategory: string;
  completionPercent?: number;
  internalNotes?: string;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  enabled: true,
  dueSoonAlerts: {
    enabled: true,
    intervals: [1, 3, 7],
    time: '09:00',
  },
  dailyDigest: {
    enabled: true,
    time: '08:00',
  },
  weeklySummary: {
    enabled: true,
    dayOfWeek: 1,
    time: '09:00',
  },
  shippingReminder: {
    enabled: true,
    daysAfterAccepted: 3,
  },
  paymentReminder: {
    enabled: true,
    daysAfterDelivery: 2,
  },
};

export const DEFAULT_BUSINESS_PROFILE: BusinessProfile = {
  name: 'Sofi Dream',
  tagline: 'Handmade with love ✦',
  currency: 'EUR',
  timezone: 'Europe/Berlin',
  theme: 'warm-cream',
};

export const DEFAULT_CATEGORIES: CraftCategory[] = [
  { id: '1', name: 'Custom Embroidery', emoji: '✦', color: '#B8A4C8' },
  { id: '2', name: 'Clothes', emoji: '◆', color: '#C97B5A' },
  { id: '3', name: 'Accessories', emoji: '◇', color: '#D4A853' },
  { id: '4', name: 'Home Goods', emoji: '⌂', color: '#8BAF8D' },
  { id: '5', name: 'Custom Art', emoji: '✧', color: '#A3C4D4' },
];

export interface User {
  id: string;
  name: string;
  email: string;
  partnerId?: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  endDate?: string; // 連日予定の終了日
  time?: string;
  endTime?: string; // 終了時刻
  isAllDay?: boolean; // 終日予定フラグ
  category: EventCategory;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export const DEFAULT_CATEGORIES: EventCategory[] = [
  { id: 'date', name: 'デート', color: '#ff6b6b', icon: '💕' },
  { id: 'work', name: '仕事', color: '#4ecdc4', icon: '💼' },
  { id: 'personal', name: '個人', color: '#45b7d1', icon: '👤' },
  { id: 'anniversary', name: '記念日', color: '#f9ca24', icon: '🎉' },
  { id: 'travel', name: '旅行', color: '#6c5ce7', icon: '✈️' },
  { id: 'health', name: '健康', color: '#a29bfe', icon: '💊' },
];

export interface Anniversary {
  id: string;
  title: string;
  date: string;
  description?: string;
  isRecurring: boolean;
  daysUntil?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
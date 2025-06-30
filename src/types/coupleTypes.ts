// カップル用カレンダーの型定義

export type EventOwnerType = 'mine' | 'partner' | 'shared';

export interface UserProfile {
  id: string;
  name: string;
  initial: string;
  color: string;
  displayName: string;
}

export type SwipeDirection = 'horizontal' | 'vertical';

export interface SwipeSettings {
  direction: SwipeDirection;
  sensitivity: number; // 1-5 の感度設定
}

export interface CoupleSettings {
  user: UserProfile;
  partner: UserProfile;
  sharedColor: string;
  defaultEventType: EventOwnerType;
  showOwnerInitials: boolean;
  showOwnerNames: boolean;
  swipeSettings: SwipeSettings;
}

export interface EventOwnership {
  type: EventOwnerType;
  owner?: UserProfile;
  sharedWith?: UserProfile;
}

// 拡張されたイベント型
export interface CoupleEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  endDate?: string;
  time?: string;
  endTime?: string;
  isAllDay: boolean;
  category: {
    id: string;
    name: string;
    color: string;
    icon: string;
  };
  ownership: EventOwnership;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  recurringRule?: any;
  recurringId?: string;
}

// カラーテーマ
export const COUPLE_COLORS = {
  mine: {
    primary: '#ff6b9d',
    light: '#ffb3d1',
    dark: '#e91e63',
    gradient: ['#ff6b9d', '#ff8a95'],
  },
  partner: {
    primary: '#4ecdc4',
    light: '#a7e6e0',
    dark: '#26a69a',
    gradient: ['#4ecdc4', '#6fd5d2'],
  },
  shared: {
    primary: '#ff8787',
    light: '#ffb3b3',
    dark: '#f44336',
    gradient: ['#ff6b9d', '#4ecdc4'], // 両者の色のグラデーション
  },
} as const;

// アクセシビリティ対応パターン
export const ACCESSIBILITY_PATTERNS = {
  mine: '●●●', // ドット
  partner: '▲▲▲', // 三角
  shared: '♡♡♡', // ハート
} as const;

// フィルター状態
export interface FilterState {
  mine: boolean;
  partner: boolean;
  shared: boolean;
}

export const DEFAULT_FILTER_STATE: FilterState = {
  mine: true,
  partner: true,
  shared: true,
};

// デフォルト設定
export const DEFAULT_COUPLE_SETTINGS: CoupleSettings = {
  user: {
    id: 'user1',
    name: 'あなた',
    initial: 'A',
    color: COUPLE_COLORS.mine.primary,
    displayName: 'あなた',
  },
  partner: {
    id: 'partner1',
    name: 'パートナー',
    initial: 'P',
    color: COUPLE_COLORS.partner.primary,
    displayName: 'パートナー',
  },
  sharedColor: COUPLE_COLORS.shared.primary,
  defaultEventType: 'shared',
  showOwnerInitials: true,
  showOwnerNames: false,
  swipeSettings: {
    direction: 'horizontal',
    sensitivity: 3,
  },
};
// 最適化されたカレンダー処理ユーティリティ

import { Event } from '../types';
import { getDateColor, DATE_COLORS } from './dateUtils';
import { performanceTracker } from './performanceTracker';
import { calendarCache } from './calendarCache';

export interface DateRange {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

export interface OptimizedMarkedDate {
  customTextStyle?: {
    color: string;
    fontWeight: string;
  };
  dots?: Array<{ color: string }>;
  selected?: boolean;
  selectedColor?: string;
  selectedTextColor?: string;
}

export interface CalendarProcessingResult {
  markedDates: Record<string, OptimizedMarkedDate>;
  processedEventCount: number;
  processingTime: number;
  dateRange: DateRange;
}

/**
 * 現在の表示月から表示範囲を計算
 */
export function calculateVisibleDateRange(referenceDate: Date = new Date()): DateRange {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  // 前月・今月・来月の3ヶ月分
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month + 2, 0); // 来月の最終日

  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0],
  };
}

/**
 * 日付範囲内のイベントのみをフィルタリング
 */
export function filterEventsByDateRange(events: Event[], dateRange: DateRange): Event[] {
  if (!Array.isArray(events)) return [];

  return events.filter(event => {
    if (!event?.date) return false;

    // イベントの終了日を考慮
    const eventStart = event.date;
    const eventEnd = event.endDate || event.date;

    // イベントが範囲と重複するかチェック
    return eventStart <= dateRange.end && eventEnd >= dateRange.start;
  });
}

/**
 * 土日祝の色分けマーキングを生成（全日付対応・軽量化）
 */
export function generateWeekendHolidayMarking(dateRange: DateRange): Record<string, OptimizedMarkedDate> {
  const dates: Record<string, OptimizedMarkedDate> = {};
  
  const startDate = new Date(dateRange.start + 'T00:00:00');
  const endDate = new Date(dateRange.end + 'T00:00:00');
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateString = currentDate.toISOString().split('T')[0];
    const dateColor = getDateColor(dateString);
    
    // すべての日付に色分けを適用
    dates[dateString] = {
      customTextStyle: {
        color: dateColor,
        fontWeight: dateColor !== DATE_COLORS.weekday ? 'bold' : 'normal'
      }
    };

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

/**
 * イベントマーキングを効率的に処理（軽量化版）
 */
export function processEventMarkings(
  events: Event[], 
  dateRange: DateRange,
  baseMarkings: Record<string, OptimizedMarkedDate> = {}
): Record<string, OptimizedMarkedDate> {
  const dates = { ...baseMarkings };

  for (const event of events) {
    if (!event?.date || !event.category?.color) continue;

    if (event.endDate) {
      // 連日予定の処理（最適化版）
      const startDate = new Date(event.date + 'T00:00:00');
      const endDate = new Date(event.endDate + 'T00:00:00');

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        continue;
      }

      // 範囲外の日付をスキップして効率化
      const rangeStart = new Date(dateRange.start + 'T00:00:00');
      const rangeEnd = new Date(dateRange.end + 'T00:00:00');

      const processStart = startDate < rangeStart ? rangeStart : startDate;
      const processEnd = endDate > rangeEnd ? rangeEnd : endDate;

      const currentDate = new Date(processStart);
      while (currentDate <= processEnd) {
        const dateString = currentDate.toISOString().split('T')[0];
        
        if (!dates[dateString]) {
          dates[dateString] = {};
        }
        
        if (!dates[dateString].dots) {
          dates[dateString].dots = [];
        }
        
        dates[dateString].dots!.push({ color: event.category.color });
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else {
      // 単日予定の処理
      if (event.date >= dateRange.start && event.date <= dateRange.end) {
        if (!dates[event.date]) {
          dates[event.date] = {};
        }
        
        if (!dates[event.date].dots) {
          dates[event.date].dots = [];
        }
        
        dates[event.date].dots!.push({ color: event.category.color });
      }
    }
  }

  return dates;
}

/**
 * 選択された日付のマーキングを追加
 */
export function applySelectedDateMarking(
  dates: Record<string, OptimizedMarkedDate>,
  selectedDate: string | null
): Record<string, OptimizedMarkedDate> {
  if (!selectedDate) return dates;

  const updatedDates = { ...dates };
  
  if (!updatedDates[selectedDate]) {
    updatedDates[selectedDate] = {};
  }

  updatedDates[selectedDate] = {
    ...updatedDates[selectedDate],
    selected: true,
    selectedColor: '#007AFF',
    selectedTextColor: '#FFFFFF',
    customTextStyle: {
      ...updatedDates[selectedDate].customTextStyle,
      color: '#FFFFFF',
    }
  };

  return updatedDates;
}

/**
 * 最適化されたカレンダーマーキング処理のメイン関数（大幅軽量化版）
 */
export function generateOptimizedMarkedDates(
  events: Event[],
  selectedDate: string | null = null,
  referenceDate: Date = new Date()
): CalendarProcessingResult {
  const calculationStart = performance.now();

  try {
    // 1. 表示範囲を計算
    const dateRange = calculateVisibleDateRange(referenceDate);

    // 2. キャッシュから結果を取得を試行（簡素化）
    const cacheKey = `${events.length}_${dateRange.start}_${dateRange.end}_${selectedDate || 'none'}_v2`; // v2でキャッシュ無効化
    if (typeof window !== 'undefined' && (window as any).__calendarCache) {
      const cached = (window as any).__calendarCache[cacheKey];
      if (cached && (Date.now() - cached.timestamp) < 30000) { // 30秒キャッシュ
        return cached.result;
      }
    }

    // 3. 範囲内のイベントのみをフィルタリング
    const filteredEvents = filterEventsByDateRange(events, dateRange);

    // 4. 土日祝の基本マーキングを生成（軽量化）
    const baseMarkings = generateWeekendHolidayMarking(dateRange);

    // 5. イベントマーキングを追加（軽量化）
    const eventMarkings = processEventMarkings(filteredEvents, dateRange, baseMarkings);

    // 6. 選択日マーキングを適用
    const finalMarkings = applySelectedDateMarking(eventMarkings, selectedDate);

    // デバッグ情報（開発環境のみ）
    if (__DEV__) {
      const weekendDays = Object.keys(baseMarkings).filter(date => {
        const color = baseMarkings[date].customTextStyle?.color;
        return color === '#0066cc' || color === '#dc143c'; // 土曜・日曜・祝日
      });
      if (weekendDays.length > 0) {
        console.log('📅 Weekend/Holiday markings:', weekendDays.slice(0, 5));
      }
    }

    const calculationTime = performance.now() - calculationStart;

    const result: CalendarProcessingResult = {
      markedDates: finalMarkings,
      processedEventCount: filteredEvents.length,
      processingTime: calculationTime,
      dateRange,
    };

    // 7. 簡素化されたキャッシュに保存
    if (typeof window !== 'undefined') {
      if (!(window as any).__calendarCache) {
        (window as any).__calendarCache = {};
      }
      (window as any).__calendarCache[cacheKey] = {
        result,
        timestamp: Date.now()
      };
    }

    return result;
  } catch (error) {
    if (__DEV__) {
      console.error('Error in generateOptimizedMarkedDates:', error);
    }
    
    // エラー時のフォールバック
    return {
      markedDates: {},
      processedEventCount: 0,
      processingTime: 0,
      dateRange: calculateVisibleDateRange(referenceDate),
    };
  }
}

/**
 * 日付範囲の文字列表現を生成（デバッグ用）
 */
export function formatDateRange(dateRange: DateRange): string {
  return `${dateRange.start} to ${dateRange.end}`;
}
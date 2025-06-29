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
 * 土日祝の色分けマーキングを生成（範囲限定版）
 */
export function generateWeekendHolidayMarking(dateRange: DateRange): Record<string, OptimizedMarkedDate> {
  const operationId = performanceTracker.startOperation('generateWeekendHolidayMarking', {
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  const dates: Record<string, OptimizedMarkedDate> = {};
  
  try {
    const startDate = new Date(dateRange.start + 'T00:00:00');
    const endDate = new Date(dateRange.end + 'T00:00:00');
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      const dateColor = getDateColor(dateString);
      
      dates[dateString] = {
        customTextStyle: {
          color: dateColor,
          fontWeight: dateColor !== DATE_COLORS.weekday ? 'bold' : 'normal'
        }
      };

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  } finally {
    performanceTracker.endOperation(operationId);
  }
}

/**
 * イベントマーキングを効率的に処理
 */
export function processEventMarkings(
  events: Event[], 
  dateRange: DateRange,
  baseMarkings: Record<string, OptimizedMarkedDate> = {}
): Record<string, OptimizedMarkedDate> {
  const operationId = performanceTracker.startOperation('processEventMarkings', {
    eventCount: events.length,
    dateRange,
  });

  const dates = { ...baseMarkings };
  let processedEventCount = 0;

  try {
    for (const event of events) {
      if (!event?.date) continue;

      processedEventCount++;

      if (event.endDate) {
        // 連日予定の処理（最適化版）
        const startDate = new Date(event.date + 'T00:00:00');
        const endDate = new Date(event.endDate + 'T00:00:00');

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.warn('Invalid date in event:', event);
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
          
          dates[dateString].dots = [
            ...(dates[dateString].dots || []),
            { color: event.category.color }
          ];

          currentDate.setDate(currentDate.getDate() + 1);
        }
      } else {
        // 単日予定の処理
        if (event.date >= dateRange.start && event.date <= dateRange.end) {
          if (!dates[event.date]) {
            dates[event.date] = {};
          }
          
          dates[event.date].dots = [
            ...(dates[event.date].dots || []),
            { color: event.category.color }
          ];
        }
      }
    }

    return dates;
  } catch (error) {
    console.error('Error processing event markings:', error);
    return dates;
  } finally {
    const metric = performanceTracker.endOperation(operationId);
    if (metric) {
      metric.metadata = {
        ...metric.metadata,
        processedEventCount,
      };
    }
  }
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
 * 最適化されたカレンダーマーキング処理のメイン関数（キャッシュ対応）
 */
export function generateOptimizedMarkedDates(
  events: Event[],
  selectedDate: string | null = null,
  referenceDate: Date = new Date()
): CalendarProcessingResult {
  const operationId = performanceTracker.startOperation('generateOptimizedMarkedDates', {
    totalEvents: events?.length || 0,
    selectedDate,
  });

  try {
    // 1. 表示範囲を計算
    const dateRange = calculateVisibleDateRange(referenceDate);

    // 2. キャッシュから結果を取得を試行
    const cachedResult = calendarCache.get(events, dateRange, selectedDate);
    if (cachedResult) {
      performanceTracker.endOperation(operationId);
      return cachedResult;
    }

    // 3. キャッシュミス - 新しく計算
    const calculationStart = performance.now();

    // 4. 範囲内のイベントのみをフィルタリング
    const filteredEvents = filterEventsByDateRange(events, dateRange);

    // 5. 土日祝の基本マーキングを生成
    const baseMarkings = generateWeekendHolidayMarking(dateRange);

    // 6. イベントマーキングを追加
    const eventMarkings = processEventMarkings(filteredEvents, dateRange, baseMarkings);

    // 7. 選択日マーキングを適用
    const finalMarkings = applySelectedDateMarking(eventMarkings, selectedDate);

    const calculationTime = performance.now() - calculationStart;
    const metric = performanceTracker.endOperation(operationId);

    const result: CalendarProcessingResult = {
      markedDates: finalMarkings,
      processedEventCount: filteredEvents.length,
      processingTime: calculationTime,
      dateRange,
    };

    // 8. 結果をキャッシュに保存
    calendarCache.set(events, dateRange, selectedDate, result);

    return result;
  } catch (error) {
    performanceTracker.endOperation(operationId);
    console.error('Error in generateOptimizedMarkedDates:', error);
    
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
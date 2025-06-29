// カレンダー処理のキャッシュシステム

import { Event } from '../types';
import { CalendarProcessingResult, DateRange, formatDateRange } from './optimizedCalendarUtils';
import { performanceTracker } from './performanceTracker';

interface CacheEntry {
  key: string;
  result: CalendarProcessingResult;
  timestamp: number;
  eventsHash: string;
  selectedDate: string | null;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

class CalendarCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize = 50; // 最大キャッシュサイズ
  private maxAge = 5 * 60 * 1000; // 5分間有効
  private stats = { hits: 0, misses: 0 };

  /**
   * イベント配列のハッシュを生成（変更検知用）
   */
  private generateEventsHash(events: Event[]): string {
    if (!Array.isArray(events) || events.length === 0) {
      return 'empty';
    }

    // イベントの重要な属性のみを使ってハッシュ生成
    const hashData = events
      .map(event => ({
        id: event.id,
        date: event.date,
        endDate: event.endDate,
        title: event.title,
        category: event.category?.color || '',
      }))
      .sort((a, b) => a.id.localeCompare(b.id)); // IDでソートして一貫性を保つ

    return btoa(JSON.stringify(hashData));
  }

  /**
   * キャッシュキーを生成
   */
  private generateCacheKey(
    dateRange: DateRange,
    selectedDate: string | null,
    eventsHash: string
  ): string {
    return `${formatDateRange(dateRange)}_${selectedDate || 'none'}_${eventsHash}`;
  }

  /**
   * 期限切れのエントリを削除
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
  }

  /**
   * キャッシュサイズ制限を適用（LRU: Least Recently Used）
   */
  private enforceMaxSize(): void {
    if (this.cache.size <= this.maxSize) return;

    // 最も古いエントリを削除
    const sortedEntries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toDelete = sortedEntries.slice(0, this.cache.size - this.maxSize);
    toDelete.forEach(([key]) => this.cache.delete(key));
  }

  /**
   * キャッシュから結果を取得
   */
  get(
    events: Event[],
    dateRange: DateRange,
    selectedDate: string | null
  ): CalendarProcessingResult | null {
    const operationId = performanceTracker.startOperation('cacheGet');

    try {
      this.cleanupExpiredEntries();

      const eventsHash = this.generateEventsHash(events);
      const cacheKey = this.generateCacheKey(dateRange, selectedDate, eventsHash);

      const entry = this.cache.get(cacheKey);

      if (entry) {
        // ヒット時は更新時刻を更新（LRU対応）
        entry.timestamp = Date.now();
        this.stats.hits++;

        if (__DEV__) {
          console.log('🎯 Cache HIT:', {
            key: cacheKey.substring(0, 50) + '...',
            age: `${(Date.now() - entry.timestamp) / 1000}s`,
          });
        }

        return entry.result;
      } else {
        this.stats.misses++;

        if (__DEV__) {
          console.log('❌ Cache MISS:', {
            key: cacheKey.substring(0, 50) + '...',
            reason: 'Not found',
          });
        }

        return null;
      }
    } finally {
      performanceTracker.endOperation(operationId);
    }
  }

  /**
   * 結果をキャッシュに保存
   */
  set(
    events: Event[],
    dateRange: DateRange,
    selectedDate: string | null,
    result: CalendarProcessingResult
  ): void {
    const operationId = performanceTracker.startOperation('cacheSet');

    try {
      const eventsHash = this.generateEventsHash(events);
      const cacheKey = this.generateCacheKey(dateRange, selectedDate, eventsHash);

      const entry: CacheEntry = {
        key: cacheKey,
        result: { ...result }, // Deep copy
        timestamp: Date.now(),
        eventsHash,
        selectedDate,
      };

      this.cache.set(cacheKey, entry);

      // サイズ制限を適用
      this.enforceMaxSize();

      if (__DEV__) {
        console.log('💾 Cache SET:', {
          key: cacheKey.substring(0, 50) + '...',
          cacheSize: this.cache.size,
          processingTime: `${result.processingTime.toFixed(2)}ms`,
        });
      }
    } finally {
      performanceTracker.endOperation(operationId);
    }
  }

  /**
   * イベントデータの変更時にキャッシュを無効化
   */
  invalidateByEvents(oldEvents: Event[], newEvents: Event[]): void {
    const oldHash = this.generateEventsHash(oldEvents);
    const newHash = this.generateEventsHash(newEvents);

    if (oldHash !== newHash) {
      this.clear();
      
      if (__DEV__) {
        console.log('🗑️  Cache invalidated due to event changes');
      }
    }
  }

  /**
   * 特定の日付範囲のキャッシュを無効化
   */
  invalidateByDateRange(dateRange: DateRange): void {
    const toDelete: string[] = [];
    const rangeKey = formatDateRange(dateRange);

    for (const [key, entry] of this.cache.entries()) {
      if (key.includes(rangeKey)) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => this.cache.delete(key));

    if (__DEV__ && toDelete.length > 0) {
      console.log(`🗑️  Invalidated ${toDelete.length} cache entries for range:`, rangeKey);
    }
  }

  /**
   * キャッシュをクリア
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * キャッシュ統計を取得
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  /**
   * キャッシュの詳細情報を取得（デバッグ用）
   */
  getDebugInfo(): {
    entries: Array<{
      key: string;
      age: number;
      eventsHash: string;
      selectedDate: string | null;
      processingTime: number;
    }>;
    stats: CacheStats;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key: key.substring(0, 80) + (key.length > 80 ? '...' : ''),
      age: Math.round((now - entry.timestamp) / 1000),
      eventsHash: entry.eventsHash.substring(0, 10) + '...',
      selectedDate: entry.selectedDate,
      processingTime: entry.result.processingTime,
    }));

    return {
      entries,
      stats: this.getStats(),
    };
  }
}

// グローバルインスタンス
export const calendarCache = new CalendarCache();

// React Hook
export const useCalendarCache = () => {
  return {
    get: calendarCache.get.bind(calendarCache),
    set: calendarCache.set.bind(calendarCache),
    invalidateByEvents: calendarCache.invalidateByEvents.bind(calendarCache),
    invalidateByDateRange: calendarCache.invalidateByDateRange.bind(calendarCache),
    clear: calendarCache.clear.bind(calendarCache),
    getStats: calendarCache.getStats.bind(calendarCache),
    getDebugInfo: calendarCache.getDebugInfo.bind(calendarCache),
  };
};
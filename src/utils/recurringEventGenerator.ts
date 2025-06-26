import { RecurringRule, Event } from '../types';

export interface RecurringEventData {
  title: string;
  description?: string;
  time?: string;
  endTime?: string;
  isAllDay?: boolean;
  category: any;
  createdBy: string;
}

export function generateRecurringEvents(
  baseEvent: RecurringEventData,
  startDate: string,
  recurringRule: RecurringRule,
  recurringId: string
): Array<Omit<Event, 'id' | 'createdAt' | 'updatedAt'>> {
  const events: Array<Omit<Event, 'id' | 'createdAt' | 'updatedAt'>> = [];
  const start = new Date(startDate);
  
  // 最大生成数の制限（無限ループ防止）
  const maxEvents = 366; // 最大1年分
  let eventCount = 0;
  
  let currentDate = new Date(start);
  
  while (eventCount < maxEvents) {
    // 終了条件チェック
    if (recurringRule.endType === 'date' && recurringRule.endDate) {
      const endDate = new Date(recurringRule.endDate);
      if (currentDate > endDate) break;
    }
    
    if (recurringRule.endType === 'count' && recurringRule.endCount) {
      if (eventCount >= recurringRule.endCount) break;
    }
    
    // イベント作成
    const eventDate = currentDate.toISOString().split('T')[0];
    events.push({
      ...baseEvent,
      date: eventDate,
      isRecurring: true,
      recurringId,
      recurringRule,
    });
    
    eventCount++;
    
    // 次の日付を計算
    switch (recurringRule.type) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + recurringRule.interval);
        break;
        
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + (7 * recurringRule.interval));
        break;
        
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + recurringRule.interval);
        break;
        
      case 'yearly':
        currentDate.setFullYear(currentDate.getFullYear() + recurringRule.interval);
        break;
    }
    
    // 最大制限に達した場合の追加チェック
    if (eventCount >= maxEvents) {
      console.warn('Maximum recurring events limit reached:', maxEvents);
      break;
    }
  }
  
  return events;
}

export function getRecurringEventSummary(recurringRule: RecurringRule): string {
  const { type, interval, endType, endDate, endCount } = recurringRule;
  
  let pattern = '';
  switch (type) {
    case 'daily':
      pattern = interval === 1 ? '毎日' : `${interval}日ごと`;
      break;
    case 'weekly':
      pattern = interval === 1 ? '毎週' : `${interval}週間ごと`;
      break;
    case 'monthly':
      pattern = interval === 1 ? '毎月' : `${interval}ヶ月ごと`;
      break;
    case 'yearly':
      pattern = interval === 1 ? '毎年' : `${interval}年ごと`;
      break;
  }
  
  let endCondition = '';
  switch (endType) {
    case 'date':
      endCondition = endDate ? ` (${endDate}まで)` : '';
      break;
    case 'count':
      endCondition = ` (${endCount}回)`;
      break;
    case 'never':
      endCondition = ' (終了しない)';
      break;
  }
  
  return pattern + endCondition;
}

export function generateRecurringId(): string {
  return 'recurring_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
}
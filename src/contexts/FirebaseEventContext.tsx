import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Event, EventCategory, DEFAULT_CATEGORIES } from '../types';
import { firebaseDataService } from '../services/firebaseDataService';
import { useFirebaseAuth } from './FirebaseAuthContext';

interface EventContextType {
  events: Event[];
  loading: boolean;
  error: string | null;
  createEvent: (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Event>;
  updateEvent: (id: string, eventData: Partial<Event>) => Promise<Event | null>;
  deleteEvent: (id: string) => Promise<boolean>;
  getEventsByDate: (date: string) => Event[];
  refreshEvents: () => Promise<void>;
}

const FirebaseEventContext = createContext<EventContextType | undefined>(undefined);

export const useFirebaseEvents = () => {
  const context = useContext(FirebaseEventContext);
  if (!context) {
    throw new Error('useFirebaseEvents must be used within a FirebaseEventProvider');
  }
  return context;
};

interface FirebaseEventProviderProps {
  children: ReactNode;
}

export const FirebaseEventProvider: React.FC<FirebaseEventProviderProps> = ({ children }) => {
  const { user, userProfile } = useFirebaseAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // リアルタイムイベント監視
  useEffect(() => {
    if (!user || !userProfile) {
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = firebaseDataService.onEventsSnapshot(
      user.uid,
      userProfile.coupleId,
      (newEvents) => {
        setEvents(newEvents);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user, userProfile]);

  const createEvent = async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> => {
    try {
      setError(null);
      
      if (!user) {
        throw new Error('ユーザーがログインしていません');
      }

      const firebaseEvent = await firebaseDataService.createEvent(
        user.uid,
        userProfile?.coupleId,
        eventData.title,
        eventData.date,
        eventData.time,
        eventData.description,
        eventData.category.id as string,
        eventData.endDate,
        eventData.endTime,
        eventData.isAllDay,
        eventData.isRecurring,
        eventData.recurringId,
        eventData.recurringRule
      );
      
      // リアルタイム更新により自動的にeventsが更新される
      const newEvent: Event = {
        id: firebaseEvent.id,
        title: firebaseEvent.title,
        description: firebaseEvent.description || '',
        date: firebaseEvent.date,
        endDate: firebaseEvent.endDate,
        time: firebaseEvent.time || '',
        endTime: firebaseEvent.endTime,
        isAllDay: firebaseEvent.isAllDay || false,
        category: eventData.category,
        createdBy: firebaseEvent.createdBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isRecurring: firebaseEvent.isRecurring,
        recurringId: firebaseEvent.recurringId,
        recurringRule: firebaseEvent.recurringRule,
      };
      
      return newEvent;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create event';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateEvent = async (id: string, eventData: Partial<Event>): Promise<Event | null> => {
    try {
      setError(null);
      
      if (!user) {
        throw new Error('ユーザーがログインしていません');
      }

      const updates: any = {};
      if (eventData.title !== undefined) updates.title = eventData.title;
      if (eventData.description !== undefined) updates.description = eventData.description;
      if (eventData.date !== undefined) updates.date = eventData.date;
      if (eventData.endDate !== undefined) updates.endDate = eventData.endDate;
      if (eventData.time !== undefined) updates.time = eventData.time;
      if (eventData.endTime !== undefined) updates.endTime = eventData.endTime;
      if (eventData.isAllDay !== undefined) updates.isAllDay = eventData.isAllDay;
      if (eventData.category !== undefined) updates.category = eventData.category.id;

      await firebaseDataService.updateEvent(id, user.uid, updates);
      
      // 更新されたイベントを返す（リアルタイム更新により自動的にeventsが更新される）
      const updatedEvent = events.find(event => event.id === id);
      return updatedEvent || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update event';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteEvent = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      
      if (!user) {
        throw new Error('ユーザーがログインしていません');
      }

      await firebaseDataService.deleteEvent(id, user.uid);
      // リアルタイム更新により自動的にeventsが更新される
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete event';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getEventsByDate = (date: string): Event[] => {
    return events.filter(event => {
      if (event.endDate) {
        // 連日予定の場合、期間内の日付をチェック
        try {
          const startDate = new Date(event.date);
          const endDate = new Date(event.endDate);
          const targetDate = new Date(date);
          
          // 無効な日付をチェック
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || isNaN(targetDate.getTime())) {
            console.warn('Invalid date detected:', { event: event.date, endDate: event.endDate, target: date });
            return false;
          }
          
          return targetDate >= startDate && targetDate <= endDate;
        } catch (error) {
          console.error('Date processing error:', error);
          return false;
        }
      }
      return event.date === date;
    });
  };

  const refreshEvents = async (): Promise<void> => {
    // リアルタイム更新を使用しているため、手動リフレッシュは不要
    // 必要に応じて実装可能
  };

  const value: EventContextType = {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventsByDate,
    refreshEvents,
  };

  return (
    <FirebaseEventContext.Provider value={value}>
      {children}
    </FirebaseEventContext.Provider>
  );
};
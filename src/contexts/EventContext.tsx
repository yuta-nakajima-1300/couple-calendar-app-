import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Event, EventCategory, DEFAULT_CATEGORIES } from '../types';
import { SimpleDataService, SimpleEvent } from '../services/dataService.simple';

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

const EventContext = createContext<EventContextType | undefined>(undefined);

export const useEvents = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
};

interface EventProviderProps {
  children: ReactNode;
}

export const EventProvider: React.FC<EventProviderProps> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      // デモユーザーIDを使用
      const demoUserId = 'demo-user-1';
      const loadedEvents = await SimpleDataService.getUserEvents(demoUserId);
      // SimpleEventをEventに変換
      const convertedEvents: Event[] = loadedEvents.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description || '',
        date: event.date,
        endDate: event.endDate,
        time: event.time || '',
        endTime: event.endTime,
        isAllDay: event.isAllDay || false,
        category: DEFAULT_CATEGORIES.find(cat => cat.id === (event.category || 'personal')) || DEFAULT_CATEGORIES[2],
        createdBy: 'demo-user-1',
        createdAt: event.createdAt,
        updatedAt: event.createdAt
      }));
      setEvents(convertedEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> => {
    try {
      setError(null);
      const demoUserId = 'demo-user-1';
      const newSimpleEvent = await SimpleDataService.createEvent(
        demoUserId,
        eventData.title,
        eventData.date,
        eventData.time,
        eventData.description,
        eventData.category.id as 'date' | 'work' | 'personal',
        eventData.endDate,
        eventData.endTime,
        eventData.isAllDay
      );
      
      const newEvent: Event = {
        id: newSimpleEvent.id,
        title: newSimpleEvent.title,
        description: newSimpleEvent.description || '',
        date: newSimpleEvent.date,
        endDate: eventData.endDate,
        time: newSimpleEvent.time || '',
        endTime: eventData.endTime,
        isAllDay: eventData.isAllDay || false,
        category: eventData.category,
        createdBy: eventData.createdBy,
        createdAt: newSimpleEvent.createdAt,
        updatedAt: newSimpleEvent.createdAt
      };
      
      setEvents(prev => [...prev, newEvent]);
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
      const demoUserId = 'demo-user-1';
      const simpleEventData: Partial<SimpleEvent> = {
        title: eventData.title,
        date: eventData.date,
        time: eventData.time,
        description: eventData.description,
        category: eventData.category?.id as 'date' | 'work' | 'personal',
      };
      
      const updatedSimpleEvent = await SimpleDataService.updateEvent(demoUserId, id, simpleEventData);
      
      if (updatedSimpleEvent) {
        const updatedEvent: Event = {
          id: updatedSimpleEvent.id,
          title: updatedSimpleEvent.title,
          description: updatedSimpleEvent.description || '',
          date: updatedSimpleEvent.date,
          endDate: eventData.endDate,
          time: updatedSimpleEvent.time || '',
          endTime: eventData.endTime,
          isAllDay: eventData.isAllDay || false,
          category: eventData.category || DEFAULT_CATEGORIES[2],
          createdBy: 'demo-user-1',
          createdAt: updatedSimpleEvent.createdAt,
          updatedAt: new Date().toISOString()
        };
        
        setEvents(prev => prev.map(event => 
          event.id === id ? updatedEvent : event
        ));
        return updatedEvent;
      }
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update event';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteEvent = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const demoUserId = 'demo-user-1';
      await SimpleDataService.deleteEvent(demoUserId, id);
      setEvents(prev => prev.filter(event => event.id !== id));
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
    await loadEvents();
  };

  useEffect(() => {
    loadEvents();
  }, []);

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
    <EventContext.Provider value={value}>
      {children}
    </EventContext.Provider>
  );
};
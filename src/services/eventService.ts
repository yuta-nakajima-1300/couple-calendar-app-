import AsyncStorage from '@react-native-async-storage/async-storage';
import { Event } from '../types';

const EVENTS_STORAGE_KEY = '@couple_calendar_events';

export class EventService {
  
  static async getAllEvents(): Promise<Event[]> {
    try {
      const eventsJson = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
      return eventsJson ? JSON.parse(eventsJson) : [];
    } catch (error) {
      console.error('Failed to load events:', error);
      return [];
    }
  }

  static async getEventById(id: string): Promise<Event | null> {
    try {
      const events = await this.getAllEvents();
      return events.find(event => event.id === id) || null;
    } catch (error) {
      console.error('Failed to get event by id:', error);
      return null;
    }
  }

  static async createEvent(eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
    try {
      const events = await this.getAllEvents();
      const now = new Date().toISOString();
      
      const newEvent: Event = {
        ...eventData,
        id: Date.now().toString(),
        createdAt: now,
        updatedAt: now,
      };

      events.push(newEvent);
      await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
      
      return newEvent;
    } catch (error) {
      console.error('Failed to create event:', error);
      throw error;
    }
  }

  static async updateEvent(id: string, eventData: Partial<Event>): Promise<Event | null> {
    try {
      const events = await this.getAllEvents();
      const eventIndex = events.findIndex(event => event.id === id);
      
      if (eventIndex === -1) {
        throw new Error('Event not found');
      }

      const updatedEvent: Event = {
        ...events[eventIndex],
        ...eventData,
        id, // Ensure ID doesn't change
        updatedAt: new Date().toISOString(),
      };

      events[eventIndex] = updatedEvent;
      await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
      
      return updatedEvent;
    } catch (error) {
      console.error('Failed to update event:', error);
      throw error;
    }
  }

  static async deleteEvent(id: string): Promise<boolean> {
    try {
      const events = await this.getAllEvents();
      const filteredEvents = events.filter(event => event.id !== id);
      
      if (filteredEvents.length === events.length) {
        throw new Error('Event not found');
      }

      await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(filteredEvents));
      return true;
    } catch (error) {
      console.error('Failed to delete event:', error);
      throw error;
    }
  }

  static async getEventsByDate(date: string): Promise<Event[]> {
    try {
      const events = await this.getAllEvents();
      return events.filter(event => event.date === date);
    } catch (error) {
      console.error('Failed to get events by date:', error);
      return [];
    }
  }

  static async getEventsInDateRange(startDate: string, endDate: string): Promise<Event[]> {
    try {
      const events = await this.getAllEvents();
      return events.filter(event => 
        event.date >= startDate && event.date <= endDate
      );
    } catch (error) {
      console.error('Failed to get events in date range:', error);
      return [];
    }
  }
}
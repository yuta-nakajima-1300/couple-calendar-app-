import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SimpleEvent {
  id: string;
  userId: string;
  title: string;
  date: string;
  endDate?: string;
  time?: string;
  endTime?: string;
  isAllDay?: boolean;
  description?: string;
  category?: 'date' | 'work' | 'personal';
  createdAt: string;
}

export interface SimpleAnniversary {
  id: string;
  coupleId: string;
  title: string;
  date: string;
  createdAt: string;
}

const EVENTS_STORAGE_KEY = '@couple_calendar_events';
const ANNIVERSARIES_STORAGE_KEY = '@couple_calendar_anniversaries';

export class SimpleDataService {
  // Event CRUD (simplified)
  static async createEvent(
    userId: string, 
    title: string, 
    date: string, 
    time?: string, 
    description?: string, 
    category: 'date' | 'work' | 'personal' = 'personal',
    endDate?: string,
    endTime?: string,
    isAllDay?: boolean
  ): Promise<SimpleEvent> {
    try {
      const events = await this.getUserEvents(userId);
      const event: SimpleEvent = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        userId,
        title,
        date,
        endDate,
        time,
        endTime,
        isAllDay,
        description,
        category,
        createdAt: new Date().toISOString(),
      };
      
      events.push(event);
      await AsyncStorage.setItem(`${EVENTS_STORAGE_KEY}_${userId}`, JSON.stringify(events));
      return event;
    } catch (error) {
      console.error('Failed to create event:', error);
      throw error;
    }
  }
  
  static async getUserEvents(userId: string): Promise<SimpleEvent[]> {
    try {
      const eventsJson = await AsyncStorage.getItem(`${EVENTS_STORAGE_KEY}_${userId}`);
      if (!eventsJson) return [];
      
      try {
        const parsed = JSON.parse(eventsJson);
        // 配列かどうかチェック
        if (!Array.isArray(parsed)) {
          console.warn('Events data is not an array, resetting to empty array');
          await AsyncStorage.removeItem(`${EVENTS_STORAGE_KEY}_${userId}`);
          return [];
        }
        return parsed;
      } catch (parseError) {
        console.error('Failed to parse events JSON, resetting data:', parseError);
        await AsyncStorage.removeItem(`${EVENTS_STORAGE_KEY}_${userId}`);
        return [];
      }
    } catch (error) {
      console.error('Failed to load events:', error);
      return [];
    }
  }

  static async updateEvent(userId: string, eventId: string, updates: Partial<SimpleEvent>): Promise<SimpleEvent | null> {
    try {
      const events = await this.getUserEvents(userId);
      const eventIndex = events.findIndex(e => e.id === eventId);
      
      if (eventIndex === -1) {
        return null;
      }
      
      events[eventIndex] = { ...events[eventIndex], ...updates };
      await AsyncStorage.setItem(`${EVENTS_STORAGE_KEY}_${userId}`, JSON.stringify(events));
      return events[eventIndex];
    } catch (error) {
      console.error('Failed to update event:', error);
      throw error;
    }
  }
  
  static async deleteEvent(userId: string, eventId: string): Promise<void> {
    try {
      const events = await this.getUserEvents(userId);
      const filteredEvents = events.filter(e => e.id !== eventId);
      await AsyncStorage.setItem(`${EVENTS_STORAGE_KEY}_${userId}`, JSON.stringify(filteredEvents));
    } catch (error) {
      console.error('Failed to delete event:', error);
      throw error;
    }
  }
  
  // Anniversary CRUD (simplified)
  static async createAnniversary(coupleId: string, title: string, date: string): Promise<SimpleAnniversary> {
    try {
      const anniversaries = await this.getCoupleAnniversaries(coupleId);
      const anniversary: SimpleAnniversary = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        coupleId,
        title,
        date,
        createdAt: new Date().toISOString(),
      };
      
      anniversaries.push(anniversary);
      await AsyncStorage.setItem(`${ANNIVERSARIES_STORAGE_KEY}_${coupleId}`, JSON.stringify(anniversaries));
      return anniversary;
    } catch (error) {
      console.error('Failed to create anniversary:', error);
      throw error;
    }
  }
  
  static async getCoupleAnniversaries(coupleId: string): Promise<SimpleAnniversary[]> {
    try {
      const anniversariesJson = await AsyncStorage.getItem(`${ANNIVERSARIES_STORAGE_KEY}_${coupleId}`);
      if (!anniversariesJson) return [];
      
      try {
        const parsed = JSON.parse(anniversariesJson);
        // 配列かどうかチェック
        if (!Array.isArray(parsed)) {
          console.warn('Anniversaries data is not an array, resetting to empty array');
          await AsyncStorage.removeItem(`${ANNIVERSARIES_STORAGE_KEY}_${coupleId}`);
          return [];
        }
        return parsed;
      } catch (parseError) {
        console.error('Failed to parse anniversaries JSON, resetting data:', parseError);
        await AsyncStorage.removeItem(`${ANNIVERSARIES_STORAGE_KEY}_${coupleId}`);
        return [];
      }
    } catch (error) {
      console.error('Failed to load anniversaries:', error);
      return [];
    }
  }

  static async updateAnniversary(coupleId: string, anniversaryId: string, updates: Partial<SimpleAnniversary>): Promise<SimpleAnniversary | null> {
    try {
      const anniversaries = await this.getCoupleAnniversaries(coupleId);
      const anniversaryIndex = anniversaries.findIndex(a => a.id === anniversaryId);
      
      if (anniversaryIndex === -1) {
        return null;
      }
      
      anniversaries[anniversaryIndex] = { ...anniversaries[anniversaryIndex], ...updates };
      await AsyncStorage.setItem(`${ANNIVERSARIES_STORAGE_KEY}_${coupleId}`, JSON.stringify(anniversaries));
      return anniversaries[anniversaryIndex];
    } catch (error) {
      console.error('Failed to update anniversary:', error);
      throw error;
    }
  }

  static async deleteAnniversary(coupleId: string, anniversaryId: string): Promise<void> {
    try {
      const anniversaries = await this.getCoupleAnniversaries(coupleId);
      const filteredAnniversaries = anniversaries.filter(a => a.id !== anniversaryId);
      await AsyncStorage.setItem(`${ANNIVERSARIES_STORAGE_KEY}_${coupleId}`, JSON.stringify(filteredAnniversaries));
    } catch (error) {
      console.error('Failed to delete anniversary:', error);
      throw error;
    }
  }
  
  // Utility
  static generateCoupleId(user1Id: string, user2Id: string): string {
    return [user1Id, user2Id].sort().join('_');
  }
}
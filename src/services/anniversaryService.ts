import AsyncStorage from '@react-native-async-storage/async-storage';
import { Anniversary } from '../types';

const ANNIVERSARIES_STORAGE_KEY = '@couple_calendar_anniversaries';

export class AnniversaryService {
  
  static async getAllAnniversaries(): Promise<Anniversary[]> {
    try {
      const anniversariesJson = await AsyncStorage.getItem(ANNIVERSARIES_STORAGE_KEY);
      return anniversariesJson ? JSON.parse(anniversariesJson) : [];
    } catch (error) {
      console.error('Failed to load anniversaries:', error);
      return [];
    }
  }

  static async getAnniversaryById(id: string): Promise<Anniversary | null> {
    try {
      const anniversaries = await this.getAllAnniversaries();
      return anniversaries.find(anniversary => anniversary.id === id) || null;
    } catch (error) {
      console.error('Failed to get anniversary by id:', error);
      return null;
    }
  }

  static async createAnniversary(anniversaryData: Omit<Anniversary, 'id' | 'createdAt' | 'updatedAt'>): Promise<Anniversary> {
    try {
      const anniversaries = await this.getAllAnniversaries();
      const now = new Date().toISOString();
      
      const newAnniversary: Anniversary = {
        ...anniversaryData,
        id: Date.now().toString(),
        createdAt: now,
        updatedAt: now,
      };

      anniversaries.push(newAnniversary);
      await AsyncStorage.setItem(ANNIVERSARIES_STORAGE_KEY, JSON.stringify(anniversaries));
      
      return newAnniversary;
    } catch (error) {
      console.error('Failed to create anniversary:', error);
      throw error;
    }
  }

  static async updateAnniversary(id: string, anniversaryData: Partial<Anniversary>): Promise<Anniversary | null> {
    try {
      const anniversaries = await this.getAllAnniversaries();
      const anniversaryIndex = anniversaries.findIndex(anniversary => anniversary.id === id);
      
      if (anniversaryIndex === -1) {
        throw new Error('Anniversary not found');
      }

      const updatedAnniversary: Anniversary = {
        ...anniversaries[anniversaryIndex],
        ...anniversaryData,
        id, // Ensure ID doesn't change
        updatedAt: new Date().toISOString(),
      };

      anniversaries[anniversaryIndex] = updatedAnniversary;
      await AsyncStorage.setItem(ANNIVERSARIES_STORAGE_KEY, JSON.stringify(anniversaries));
      
      return updatedAnniversary;
    } catch (error) {
      console.error('Failed to update anniversary:', error);
      throw error;
    }
  }

  static async deleteAnniversary(id: string): Promise<boolean> {
    try {
      const anniversaries = await this.getAllAnniversaries();
      const filteredAnniversaries = anniversaries.filter(anniversary => anniversary.id !== id);
      
      if (filteredAnniversaries.length === anniversaries.length) {
        throw new Error('Anniversary not found');
      }

      await AsyncStorage.setItem(ANNIVERSARIES_STORAGE_KEY, JSON.stringify(filteredAnniversaries));
      return true;
    } catch (error) {
      console.error('Failed to delete anniversary:', error);
      throw error;
    }
  }

  static calculateDaysUntil(date: string, isRecurring: boolean): number {
    const today = new Date();
    const anniversaryDate = new Date(date);
    
    if (isRecurring) {
      // For recurring anniversaries, calculate next occurrence
      const currentYear = today.getFullYear();
      const thisYearDate = new Date(currentYear, anniversaryDate.getMonth(), anniversaryDate.getDate());
      
      if (thisYearDate < today) {
        // If this year's date has passed, calculate for next year
        const nextYearDate = new Date(currentYear + 1, anniversaryDate.getMonth(), anniversaryDate.getDate());
        return Math.ceil((nextYearDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        return Math.ceil((thisYearDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      }
    } else {
      // For non-recurring anniversaries, calculate from original date
      return Math.ceil((anniversaryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  static async getUpcomingAnniversaries(limit: number = 5): Promise<Anniversary[]> {
    try {
      const anniversaries = await this.getAllAnniversaries();
      
      // Calculate days until for each anniversary and sort
      const anniversariesWithDays = anniversaries.map(anniversary => ({
        ...anniversary,
        daysUntil: this.calculateDaysUntil(anniversary.date, anniversary.isRecurring)
      }));

      // Filter and sort upcoming anniversaries
      return anniversariesWithDays
        .filter(anniversary => anniversary.daysUntil >= 0)
        .sort((a, b) => a.daysUntil - b.daysUntil)
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get upcoming anniversaries:', error);
      return [];
    }
  }
}
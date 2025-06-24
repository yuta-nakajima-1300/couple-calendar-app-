import { Event, DEFAULT_CATEGORIES } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EVENTS_STORAGE_KEY = '@couple_calendar_events';

export const sampleEvents: Event[] = [
  {
    id: '1',
    title: 'デート - 映画館',
    description: '新作映画を見に行く',
    date: '2025-06-25',
    time: '19:00',
    isAllDay: false,
    category: DEFAULT_CATEGORIES[0], // date
    createdBy: 'demo-user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'ディナー',
    description: 'お気に入りのレストランで食事',
    date: '2025-06-26',
    time: '18:30',
    isAllDay: false,
    category: DEFAULT_CATEGORIES[0], // date
    createdBy: 'demo-user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: '仕事の会議',
    description: 'プロジェクトミーティング',
    date: '2025-06-24',
    time: '14:00',
    isAllDay: false,
    category: DEFAULT_CATEGORIES[1], // work
    createdBy: 'demo-user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const loadSampleData = async () => {
  try {
    // Check if data already exists
    const existingData = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
    
    if (!existingData || JSON.parse(existingData).length === 0) {
      // Load sample data
      await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(sampleEvents));
      console.log('Sample data loaded successfully');
      return true;
    }
    
    console.log('Data already exists, skipping sample data load');
    return false;
  } catch (error) {
    console.error('Failed to load sample data:', error);
    return false;
  }
};

export const clearAllData = async () => {
  try {
    await AsyncStorage.removeItem(EVENTS_STORAGE_KEY);
    console.log('All data cleared');
    return true;
  } catch (error) {
    console.error('Failed to clear data:', error);
    return false;
  }
};
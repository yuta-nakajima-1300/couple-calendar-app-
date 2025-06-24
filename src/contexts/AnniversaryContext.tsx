import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Anniversary } from '../types';
import { AnniversaryService } from '../services/anniversaryService';

interface AnniversaryContextType {
  anniversaries: Anniversary[];
  loading: boolean;
  error: string | null;
  createAnniversary: (anniversaryData: Omit<Anniversary, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Anniversary>;
  updateAnniversary: (id: string, anniversaryData: Partial<Anniversary>) => Promise<Anniversary | null>;
  deleteAnniversary: (id: string) => Promise<boolean>;
  getUpcomingAnniversaries: (limit?: number) => Promise<Anniversary[]>;
  refreshAnniversaries: () => Promise<void>;
}

const AnniversaryContext = createContext<AnniversaryContextType | undefined>(undefined);

export const useAnniversaries = () => {
  const context = useContext(AnniversaryContext);
  if (!context) {
    throw new Error('useAnniversaries must be used within an AnniversaryProvider');
  }
  return context;
};

interface AnniversaryProviderProps {
  children: ReactNode;
}

export const AnniversaryProvider: React.FC<AnniversaryProviderProps> = ({ children }) => {
  const [anniversaries, setAnniversaries] = useState<Anniversary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnniversaries = async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedAnniversaries = await AnniversaryService.getAllAnniversaries();
      
      // Add calculated daysUntil for each anniversary
      const anniversariesWithDays = loadedAnniversaries.map(anniversary => ({
        ...anniversary,
        daysUntil: AnniversaryService.calculateDaysUntil(anniversary.date, anniversary.isRecurring)
      }));
      
      setAnniversaries(anniversariesWithDays);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load anniversaries');
    } finally {
      setLoading(false);
    }
  };

  const createAnniversary = async (anniversaryData: Omit<Anniversary, 'id' | 'createdAt' | 'updatedAt'>): Promise<Anniversary> => {
    try {
      setError(null);
      const newAnniversary = await AnniversaryService.createAnniversary(anniversaryData);
      const anniversaryWithDays = {
        ...newAnniversary,
        daysUntil: AnniversaryService.calculateDaysUntil(newAnniversary.date, newAnniversary.isRecurring)
      };
      setAnniversaries(prev => [...prev, anniversaryWithDays]);
      return newAnniversary;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create anniversary';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateAnniversary = async (id: string, anniversaryData: Partial<Anniversary>): Promise<Anniversary | null> => {
    try {
      setError(null);
      const updatedAnniversary = await AnniversaryService.updateAnniversary(id, anniversaryData);
      if (updatedAnniversary) {
        const anniversaryWithDays = {
          ...updatedAnniversary,
          daysUntil: AnniversaryService.calculateDaysUntil(updatedAnniversary.date, updatedAnniversary.isRecurring)
        };
        setAnniversaries(prev => prev.map(anniversary => 
          anniversary.id === id ? anniversaryWithDays : anniversary
        ));
      }
      return updatedAnniversary;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update anniversary';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteAnniversary = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const success = await AnniversaryService.deleteAnniversary(id);
      if (success) {
        setAnniversaries(prev => prev.filter(anniversary => anniversary.id !== id));
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete anniversary';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getUpcomingAnniversaries = async (limit: number = 5): Promise<Anniversary[]> => {
    try {
      return await AnniversaryService.getUpcomingAnniversaries(limit);
    } catch (err) {
      console.error('Failed to get upcoming anniversaries:', err);
      return [];
    }
  };

  const refreshAnniversaries = async (): Promise<void> => {
    await loadAnniversaries();
  };

  useEffect(() => {
    loadAnniversaries();
  }, []);

  const value: AnniversaryContextType = {
    anniversaries,
    loading,
    error,
    createAnniversary,
    updateAnniversary,
    deleteAnniversary,
    getUpcomingAnniversaries,
    refreshAnniversaries,
  };

  return (
    <AnniversaryContext.Provider value={value}>
      {children}
    </AnniversaryContext.Provider>
  );
};
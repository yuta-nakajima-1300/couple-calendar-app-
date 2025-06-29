// カップル用カレンダーのコンテキスト

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CoupleSettings,
  UserProfile,
  EventOwnerType,
  FilterState,
  DEFAULT_COUPLE_SETTINGS,
  DEFAULT_FILTER_STATE,
} from '../types/coupleTypes';

interface CoupleContextType {
  settings: CoupleSettings;
  filterState: FilterState;
  isLoading: boolean;
  
  // 設定更新
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  updatePartnerProfile: (profile: Partial<UserProfile>) => Promise<void>;
  updateSharedColor: (color: string) => Promise<void>;
  updateDefaultEventType: (type: EventOwnerType) => Promise<void>;
  updateDisplaySettings: (showInitials: boolean, showNames: boolean) => Promise<void>;
  
  // フィルター操作
  toggleFilter: (type: EventOwnerType) => void;
  setAllFilters: (state: boolean) => void;
  resetFilters: () => void;
  
  // ユーティリティ
  getEventColor: (ownerType: EventOwnerType) => string;
  getEventOwnerName: (ownerType: EventOwnerType) => string;
  getEventOwnerInitial: (ownerType: EventOwnerType) => string;
  isEventVisible: (ownerType: EventOwnerType) => boolean;
  
  // リセット
  resetToDefaults: () => Promise<void>;
}

const CoupleContext = createContext<CoupleContextType | undefined>(undefined);

const STORAGE_KEYS = {
  COUPLE_SETTINGS: '@couple_calendar_settings',
  FILTER_STATE: '@couple_calendar_filters',
};

interface CoupleProviderProps {
  children: ReactNode;
}

export function CoupleProvider({ children }: CoupleProviderProps) {
  const [settings, setSettings] = useState<CoupleSettings>(DEFAULT_COUPLE_SETTINGS);
  const [filterState, setFilterState] = useState<FilterState>(DEFAULT_FILTER_STATE);
  const [isLoading, setIsLoading] = useState(true);

  // 初期化時にストレージから読み込み
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      // 設定を読み込み
      const savedSettings = await AsyncStorage.getItem(STORAGE_KEYS.COUPLE_SETTINGS);
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_COUPLE_SETTINGS, ...parsedSettings });
      }

      // フィルター状態を読み込み
      const savedFilters = await AsyncStorage.getItem(STORAGE_KEYS.FILTER_STATE);
      if (savedFilters) {
        const parsedFilters = JSON.parse(savedFilters);
        setFilterState({ ...DEFAULT_FILTER_STATE, ...parsedFilters });
      }
    } catch (error) {
      console.error('Failed to load couple settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: CoupleSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.COUPLE_SETTINGS, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save couple settings:', error);
    }
  };

  const saveFilterState = async (newFilterState: FilterState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FILTER_STATE, JSON.stringify(newFilterState));
      setFilterState(newFilterState);
    } catch (error) {
      console.error('Failed to save filter state:', error);
    }
  };

  // 設定更新メソッド
  const updateUserProfile = async (profile: Partial<UserProfile>) => {
    const newSettings = {
      ...settings,
      user: { ...settings.user, ...profile },
    };
    await saveSettings(newSettings);
  };

  const updatePartnerProfile = async (profile: Partial<UserProfile>) => {
    const newSettings = {
      ...settings,
      partner: { ...settings.partner, ...profile },
    };
    await saveSettings(newSettings);
  };

  const updateSharedColor = async (color: string) => {
    const newSettings = {
      ...settings,
      sharedColor: color,
    };
    await saveSettings(newSettings);
  };

  const updateDefaultEventType = async (type: EventOwnerType) => {
    const newSettings = {
      ...settings,
      defaultEventType: type,
    };
    await saveSettings(newSettings);
  };

  const updateDisplaySettings = async (showInitials: boolean, showNames: boolean) => {
    const newSettings = {
      ...settings,
      showOwnerInitials: showInitials,
      showOwnerNames: showNames,
    };
    await saveSettings(newSettings);
  };

  // フィルター操作メソッド（メモ化）
  const toggleFilter = useCallback((type: EventOwnerType) => {
    const newFilterState = {
      ...filterState,
      [type]: !filterState[type],
    };
    saveFilterState(newFilterState);
  }, [filterState]);

  const setAllFilters = useCallback((state: boolean) => {
    const newFilterState = {
      mine: state,
      partner: state,
      shared: state,
    };
    saveFilterState(newFilterState);
  }, []);

  const resetFilters = useCallback(() => {
    saveFilterState(DEFAULT_FILTER_STATE);
  }, []);

  // ユーティリティメソッド
  const getEventColor = (ownerType: EventOwnerType): string => {
    switch (ownerType) {
      case 'mine':
        return settings.user.color;
      case 'partner':
        return settings.partner.color;
      case 'shared':
        return settings.sharedColor;
      default:
        return settings.sharedColor;
    }
  };

  const getEventOwnerName = (ownerType: EventOwnerType): string => {
    switch (ownerType) {
      case 'mine':
        return settings.user.displayName;
      case 'partner':
        return settings.partner.displayName;
      case 'shared':
        return '二人の予定';
      default:
        return '共通';
    }
  };

  const getEventOwnerInitial = (ownerType: EventOwnerType): string => {
    switch (ownerType) {
      case 'mine':
        return settings.user.initial;
      case 'partner':
        return settings.partner.initial;
      case 'shared':
        return '♡';
      default:
        return '?';
    }
  };

  const isEventVisible = (ownerType: EventOwnerType): boolean => {
    return filterState[ownerType];
  };

  const resetToDefaults = async () => {
    await saveSettings(DEFAULT_COUPLE_SETTINGS);
    await saveFilterState(DEFAULT_FILTER_STATE);
  };

  const contextValue: CoupleContextType = {
    settings,
    filterState,
    isLoading,
    
    updateUserProfile,
    updatePartnerProfile,
    updateSharedColor,
    updateDefaultEventType,
    updateDisplaySettings,
    
    toggleFilter,
    setAllFilters,
    resetFilters,
    
    getEventColor,
    getEventOwnerName,
    getEventOwnerInitial,
    isEventVisible,
    
    resetToDefaults,
  };

  return (
    <CoupleContext.Provider value={contextValue}>
      {children}
    </CoupleContext.Provider>
  );
}

export function useCouple(): CoupleContextType {
  const context = useContext(CoupleContext);
  if (context === undefined) {
    throw new Error('useCouple must be used within a CoupleProvider');
  }
  return context;
}
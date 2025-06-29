// イベントフィルターバーコンポーネント

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { EventOwnerType } from '../types/coupleTypes';
import { useCouple } from '../contexts/CoupleContext';

interface EventFilterBarProps {
  style?: any;
  showLabels?: boolean;
  compact?: boolean;
}

export default function EventFilterBar({ 
  style, 
  showLabels = true, 
  compact = false 
}: EventFilterBarProps) {
  const {
    filterState,
    settings,
    toggleFilter,
    setAllFilters,
    resetFilters,
    getEventColor,
    getEventOwnerName,
    getEventOwnerInitial,
  } = useCouple();

  const filters: Array<{
    type: EventOwnerType;
    label: string;
    shortLabel: string;
    icon: string;
  }> = [
    {
      type: 'mine',
      label: settings.user.displayName,
      shortLabel: settings.user.initial,
      icon: settings.user.initial,
    },
    {
      type: 'partner',
      label: settings.partner.displayName,
      shortLabel: settings.partner.initial,
      icon: settings.partner.initial,
    },
    {
      type: 'shared',
      label: '二人の予定',
      shortLabel: '♡',
      icon: '♡',
    },
  ];

  const activeFiltersCount = Object.values(filterState).filter(Boolean).length;
  const allActive = activeFiltersCount === 3;
  const noneActive = activeFiltersCount === 0;

  const handleToggleAll = () => {
    if (allActive) {
      // 全て選択されている場合は全て解除
      setAllFilters(false);
    } else {
      // 一部または全て解除されている場合は全て選択
      setAllFilters(true);
    }
  };

  return (
    <View style={[styles.container, compact && styles.compactContainer, style]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 全て表示/非表示ボタン */}
        <TouchableOpacity
          style={[
            styles.filterButton,
            styles.allButton,
            compact && styles.compactButton,
            allActive && styles.allActiveButton,
            noneActive && styles.noneActiveButton,
          ]}
          onPress={handleToggleAll}
          accessibilityLabel={allActive ? '全て非表示' : '全て表示'}
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.allButtonIcon,
              allActive && styles.allActiveIcon,
              noneActive && styles.noneActiveIcon,
            ]}
          >
            {allActive ? '👁️' : noneActive ? '🙈' : '👀'}
          </Text>
          {!compact && showLabels && (
            <Text
              style={[
                styles.allButtonText,
                allActive && styles.allActiveText,
                noneActive && styles.noneActiveText,
              ]}
            >
              {allActive ? '全て' : noneActive ? '全て表示' : '選択表示'}
            </Text>
          )}
        </TouchableOpacity>

        {/* 個別フィルターボタン */}
        {filters.map((filter) => {
          const isActive = filterState[filter.type];
          const color = getEventColor(filter.type);
          
          return (
            <TouchableOpacity
              key={filter.type}
              style={[
                styles.filterButton,
                compact && styles.compactButton,
                isActive && styles.activeButton,
                isActive && { borderColor: color },
                !isActive && styles.inactiveButton,
              ]}
              onPress={() => toggleFilter(filter.type)}
              accessibilityLabel={`${filter.label}の予定を${isActive ? '非表示' : '表示'}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              {/* アイコン */}
              <View
                style={[
                  styles.iconContainer,
                  compact && styles.compactIconContainer,
                  { backgroundColor: isActive ? color : 'transparent' },
                  isActive && styles.activeIconContainer,
                ]}
              >
                <Text
                  style={[
                    styles.iconText,
                    compact && styles.compactIconText,
                    { color: isActive ? '#fff' : color },
                    !isActive && styles.inactiveIconText,
                  ]}
                >
                  {compact ? filter.shortLabel : filter.icon}
                </Text>
              </View>

              {/* ラベル */}
              {!compact && showLabels && (
                <Text
                  style={[
                    styles.buttonText,
                    isActive && styles.activeText,
                    isActive && { color },
                    !isActive && styles.inactiveText,
                  ]}
                  numberOfLines={1}
                >
                  {filter.label.length > 8 ? filter.shortLabel : filter.label}
                </Text>
              )}

              {/* アクティブインジケーター */}
              {isActive && (
                <View style={[styles.activeIndicator, { backgroundColor: color }]} />
              )}
            </TouchableOpacity>
          );
        })}

        {/* リセットボタン */}
        {!allActive && (
          <TouchableOpacity
            style={[
              styles.resetButton,
              compact && styles.compactButton,
            ]}
            onPress={resetFilters}
            accessibilityLabel="フィルターをリセット"
            accessibilityRole="button"
          >
            <Text style={styles.resetIcon}>🔄</Text>
            {!compact && showLabels && (
              <Text style={styles.resetText}>リセット</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* フィルター状態表示 */}
      {!compact && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {activeFiltersCount === 3 
              ? '全ての予定を表示中' 
              : activeFiltersCount === 0
              ? '予定を非表示中'
              : `${activeFiltersCount}種類の予定を表示中`
            }
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  compactContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  scrollContent: {
    alignItems: 'center',
    paddingRight: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    position: 'relative',
  },
  compactButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeButton: {
    borderWidth: 2,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inactiveButton: {
    backgroundColor: '#f0f0f0',
    opacity: 0.6,
  },
  allButton: {
    borderColor: '#666',
  },
  allActiveButton: {
    borderColor: '#007AFF',
    backgroundColor: '#e6f3ff',
  },
  noneActiveButton: {
    borderColor: '#ff4444',
    backgroundColor: '#ffe6e6',
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  compactIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 0,
  },
  activeIconContainer: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 1,
  },
  iconText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  compactIconText: {
    fontSize: 10,
  },
  inactiveIconText: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeText: {
    fontWeight: '600',
  },
  inactiveText: {
    opacity: 0.5,
  },
  allButtonIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  allActiveIcon: {
    color: '#007AFF',
  },
  noneActiveIcon: {
    color: '#ff4444',
  },
  allButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  allActiveText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  noneActiveText: {
    color: '#ff4444',
    fontWeight: '600',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  resetIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  resetText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fff',
  },
  statusContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});
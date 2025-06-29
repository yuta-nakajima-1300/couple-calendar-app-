// 予定の所有者タイプを選択するコンポーネント

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { EventOwnerType, COUPLE_COLORS, ACCESSIBILITY_PATTERNS } from '../types/coupleTypes';
import { useCouple } from '../contexts/CoupleContext';

interface EventOwnershipPickerProps {
  selectedType: EventOwnerType;
  onTypeChange: (type: EventOwnerType) => void;
  style?: any;
  disabled?: boolean;
}

export default function EventOwnershipPicker({
  selectedType,
  onTypeChange,
  style,
  disabled = false,
}: EventOwnershipPickerProps) {
  const { settings, getEventColor, getEventOwnerName, getEventOwnerInitial } = useCouple();

  const options: Array<{
    type: EventOwnerType;
    label: string;
    icon: string;
    description: string;
  }> = [
    {
      type: 'mine',
      label: settings.user.displayName,
      icon: settings.user.initial,
      description: '自分だけの予定',
    },
    {
      type: 'partner',
      label: settings.partner.displayName,
      icon: settings.partner.initial,
      description: 'パートナーの予定',
    },
    {
      type: 'shared',
      label: '二人の予定',
      icon: '♡',
      description: '共通の予定・デート',
    },
  ];

  const handlePress = (type: EventOwnerType) => {
    if (!disabled) {
      onTypeChange(type);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>予定の種類</Text>
      <View style={styles.optionsContainer}>
        {options.map((option) => {
          const isSelected = selectedType === option.type;
          const color = getEventColor(option.type);
          
          return (
            <TouchableOpacity
              key={option.type}
              style={[
                styles.option,
                isSelected && styles.selectedOption,
                isSelected && { borderColor: color },
                disabled && styles.disabledOption,
              ]}
              onPress={() => handlePress(option.type)}
              activeOpacity={disabled ? 1 : 0.7}
              accessibilityLabel={`${option.label}の予定`}
              accessibilityHint={option.description}
              accessibilityState={{ selected: isSelected, disabled }}
            >
              {/* アイコン部分 */}
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: isSelected ? color : 'transparent' },
                  isSelected && styles.selectedIconContainer,
                ]}
              >
                <Text
                  style={[
                    styles.iconText,
                    { color: isSelected ? '#fff' : color },
                    disabled && styles.disabledText,
                  ]}
                >
                  {option.icon}
                </Text>
              </View>

              {/* ラベル部分 */}
              <View style={styles.labelContainer}>
                <Text
                  style={[
                    styles.optionLabel,
                    isSelected && styles.selectedLabel,
                    isSelected && { color },
                    disabled && styles.disabledText,
                  ]}
                  numberOfLines={1}
                >
                  {option.label}
                </Text>
                <Text
                  style={[
                    styles.optionDescription,
                    disabled && styles.disabledText,
                  ]}
                  numberOfLines={1}
                >
                  {option.description}
                </Text>
              </View>

              {/* 選択インジケーター */}
              {isSelected && (
                <View style={styles.checkmarkContainer}>
                  <Text style={[styles.checkmark, { color }]}>✓</Text>
                </View>
              )}

              {/* アクセシビリティ用パターン（色覚多様性対応） */}
              {isSelected && (
                <View style={styles.patternContainer}>
                  <Text style={[styles.pattern, { color }]}>
                    {ACCESSIBILITY_PATTERNS[option.type]}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  optionsContainer: {
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
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
  selectedOption: {
    borderWidth: 2,
    backgroundColor: '#f8f9fa',
    shadowOpacity: 0.15,
    elevation: 3,
  },
  disabledOption: {
    opacity: 0.5,
    backgroundColor: '#f5f5f5',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedIconContainer: {
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  iconText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  labelContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  selectedLabel: {
    fontWeight: '700',
  },
  optionDescription: {
    fontSize: 12,
    color: '#666',
  },
  checkmarkContainer: {
    marginLeft: 8,
  },
  checkmark: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  patternContainer: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  pattern: {
    fontSize: 8,
    opacity: 0.3,
  },
  disabledText: {
    color: '#999',
  },
});
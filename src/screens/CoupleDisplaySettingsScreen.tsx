// カップル表示設定画面

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Switch,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCouple } from '../contexts/CoupleContext';
import EventOwnershipPicker from '../components/EventOwnershipPicker';
import { EventOwnerType, COUPLE_COLORS } from '../types/coupleTypes';

const PRESET_COLORS = [
  COUPLE_COLORS.mine.primary,
  COUPLE_COLORS.partner.primary,
  COUPLE_COLORS.shared.primary,
  '#ff9800', // Orange
  '#9c27b0', // Purple
  '#3f51b5', // Indigo
  '#009688', // Teal
  '#8bc34a', // Light Green
];

export default function CoupleDisplaySettingsScreen() {
  const navigation = useNavigation();
  const {
    settings,
    updateUserProfile,
    updatePartnerProfile,
    updateSharedColor,
    updateDefaultEventType,
    updateDisplaySettings,
    resetToDefaults,
  } = useCouple();

  const [userForm, setUserForm] = useState({
    name: settings.user.displayName,
    initial: settings.user.initial,
    color: settings.user.color,
  });

  const [partnerForm, setPartnerForm] = useState({
    name: settings.partner.displayName,
    initial: settings.partner.initial,
    color: settings.partner.color,
  });

  const [sharedColor, setSharedColorLocal] = useState(settings.sharedColor);
  const [defaultEventType, setDefaultEventType] = useState(settings.defaultEventType);
  const [showInitials, setShowInitials] = useState(settings.showOwnerInitials);
  const [showNames, setShowNames] = useState(settings.showOwnerNames);

  const handleSave = async () => {
    try {
      // バリデーション
      if (!userForm.name.trim() || !userForm.initial.trim()) {
        Alert.alert('エラー', 'あなたの名前とイニシャルを入力してください');
        return;
      }
      if (!partnerForm.name.trim() || !partnerForm.initial.trim()) {
        Alert.alert('エラー', 'パートナーの名前とイニシャルを入力してください');
        return;
      }
      if (userForm.initial.length > 2 || partnerForm.initial.length > 2) {
        Alert.alert('エラー', 'イニシャルは2文字以内で入力してください');
        return;
      }

      // 設定を保存
      await Promise.all([
        updateUserProfile({
          displayName: userForm.name.trim(),
          initial: userForm.initial.trim().toUpperCase(),
          color: userForm.color,
        }),
        updatePartnerProfile({
          displayName: partnerForm.name.trim(),
          initial: partnerForm.initial.trim().toUpperCase(),
          color: partnerForm.color,
        }),
        updateSharedColor(sharedColor),
        updateDefaultEventType(defaultEventType),
        updateDisplaySettings(showInitials, showNames),
      ]);

      Alert.alert('成功', '設定を保存しました', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Failed to save settings:', error);
      Alert.alert('エラー', '設定の保存に失敗しました');
    }
  };

  const handleReset = () => {
    Alert.alert(
      '設定をリセット',
      'すべての設定をデフォルトに戻しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'リセット',
          style: 'destructive',
          onPress: async () => {
            await resetToDefaults();
            Alert.alert('完了', '設定をリセットしました', [
              { text: 'OK', onPress: () => navigation.goBack() }
            ]);
          },
        },
      ]
    );
  };

  const ColorPicker = ({ selectedColor, onColorChange, title }: {
    selectedColor: string;
    onColorChange: (color: string) => void;
    title: string;
  }) => (
    <View style={styles.colorPickerContainer}>
      <Text style={styles.colorPickerTitle}>{title}</Text>
      <View style={styles.colorGrid}>
        {PRESET_COLORS.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorButton,
              { backgroundColor: color },
              selectedColor === color && styles.selectedColor,
            ]}
            onPress={() => onColorChange(color)}
            accessibilityLabel={`${title} - 色を${color}に設定`}
          >
            {selectedColor === color && (
              <Text style={styles.colorCheckmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.title}>表示設定</Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>保存</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* あなたの設定 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>あなたの設定</Text>
          <View style={styles.formGroup}>
            <Text style={styles.label}>表示名</Text>
            <TextInput
              style={styles.input}
              value={userForm.name}
              onChangeText={(text) => setUserForm({ ...userForm, name: text })}
              placeholder="あなたの名前"
              maxLength={20}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>イニシャル</Text>
            <TextInput
              style={[styles.input, styles.initialInput]}
              value={userForm.initial}
              onChangeText={(text) => setUserForm({ ...userForm, initial: text })}
              placeholder="A"
              maxLength={2}
              autoCapitalize="characters"
            />
          </View>
          <ColorPicker
            selectedColor={userForm.color}
            onColorChange={(color) => setUserForm({ ...userForm, color })}
            title="あなたの色"
          />
        </View>

        {/* パートナーの設定 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>パートナーの設定</Text>
          <View style={styles.formGroup}>
            <Text style={styles.label}>表示名</Text>
            <TextInput
              style={styles.input}
              value={partnerForm.name}
              onChangeText={(text) => setPartnerForm({ ...partnerForm, name: text })}
              placeholder="パートナーの名前"
              maxLength={20}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>イニシャル</Text>
            <TextInput
              style={[styles.input, styles.initialInput]}
              value={partnerForm.initial}
              onChangeText={(text) => setPartnerForm({ ...partnerForm, initial: text })}
              placeholder="P"
              maxLength={2}
              autoCapitalize="characters"
            />
          </View>
          <ColorPicker
            selectedColor={partnerForm.color}
            onColorChange={(color) => setPartnerForm({ ...partnerForm, color })}
            title="パートナーの色"
          />
        </View>

        {/* 共通設定 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>共通設定</Text>
          <ColorPicker
            selectedColor={sharedColor}
            onColorChange={setSharedColorLocal}
            title="二人の予定の色"
          />
          
          <EventOwnershipPicker
            selectedType={defaultEventType}
            onTypeChange={setDefaultEventType}
            style={styles.ownershipPicker}
          />
          
          <View style={styles.switchGroup}>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>イニシャルを表示</Text>
              <Switch
                value={showInitials}
                onValueChange={setShowInitials}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={showInitials ? '#f5dd4b' : '#f4f3f4'}
              />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>名前を表示</Text>
              <Switch
                value={showNames}
                onValueChange={setShowNames}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={showNames ? '#f5dd4b' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* リセットボタン */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>設定をリセット</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  initialInput: {
    width: 80,
    textAlign: 'center',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  colorPickerContainer: {
    marginBottom: 16,
  },
  colorPickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  selectedColor: {
    borderColor: '#333',
    borderWidth: 3,
  },
  colorCheckmark: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  ownershipPicker: {
    marginBottom: 16,
  },
  switchGroup: {
    gap: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  resetButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
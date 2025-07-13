import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCouple } from '../contexts/CoupleContext';

export default function CalendarSettingsScreen() {
  const navigation = useNavigation();
  const { settings, updateCalendarSettings, updateDisplaySettings } = useCouple();
  const { calendarSettings } = settings;
  
  const handleMonthFormatChange = () => {
    Alert.alert(
      '月表示形式',
      '月の表示形式を選択してください',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '2024年1月', onPress: () => updateCalendarSettings({ monthFormat: 'japanese' }) },
        { text: 'January 2024', onPress: () => updateCalendarSettings({ monthFormat: 'english' }) },
        { text: '1月', onPress: () => updateCalendarSettings({ monthFormat: 'short' }) },
      ]
    );
  };

  const handleDefaultDurationChange = () => {
    Alert.alert(
      'デフォルトイベント時間',
      '新規イベントのデフォルト時間を選択してください',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '30分', onPress: () => updateCalendarSettings({ defaultEventDuration: '30' }) },
        { text: '60分', onPress: () => updateCalendarSettings({ defaultEventDuration: '60' }) },
        { text: '90分', onPress: () => updateCalendarSettings({ defaultEventDuration: '90' }) },
        { text: '120分', onPress: () => updateCalendarSettings({ defaultEventDuration: '120' }) },
        { text: '終日', onPress: () => updateCalendarSettings({ defaultEventDuration: 'all-day' }) },
      ]
    );
  };

  const SettingItem = ({ 
    title, 
    subtitle, 
    rightComponent, 
    onPress, 
    showArrow = false 
  }: {
    title: string;
    subtitle?: string;
    rightComponent?: React.ReactNode;
    onPress?: () => void;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingItemLeft}>
        <Text style={styles.settingItemTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingItemSubtitle}>{subtitle}</Text>}
      </View>
      {rightComponent || (showArrow && <Text style={styles.arrow}>›</Text>)}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹ 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.title}>カレンダー設定</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* 表示設定 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>表示設定</Text>
          
          <SettingItem
            title="週の開始日"
            subtitle={calendarSettings.weekStartsOnMonday ? "月曜日" : "日曜日"}
            rightComponent={
              <Switch
                value={calendarSettings.weekStartsOnMonday}
                onValueChange={(value) => updateCalendarSettings({ weekStartsOnMonday: value })}
                trackColor={{ false: '#767577', true: '#ff6b6b' }}
                thumbColor={calendarSettings.weekStartsOnMonday ? '#fff' : '#f4f3f4'}
              />
            }
          />
          
          <SettingItem
            title="週番号を表示"
            subtitle="カレンダーに週番号を表示します"
            rightComponent={
              <Switch
                value={calendarSettings.showWeekNumbers}
                onValueChange={(value) => updateCalendarSettings({ showWeekNumbers: value })}
                trackColor={{ false: '#767577', true: '#ff6b6b' }}
                thumbColor={calendarSettings.showWeekNumbers ? '#fff' : '#f4f3f4'}
              />
            }
          />

          <SettingItem
            title="月表示形式"
            subtitle={
              calendarSettings.monthFormat === 'japanese' ? '2024年1月' :
              calendarSettings.monthFormat === 'english' ? 'January 2024' : '1月'
            }
            showArrow
            onPress={handleMonthFormatChange}
          />
          
          <SettingItem
            title="祝日を表示"
            subtitle="日本の祝日をカレンダーに表示します"
            rightComponent={
              <Switch
                value={calendarSettings.showHolidays}
                onValueChange={(value) => updateCalendarSettings({ showHolidays: value })}
                trackColor={{ false: '#767577', true: '#ff6b6b' }}
                thumbColor={calendarSettings.showHolidays ? '#fff' : '#f4f3f4'}
              />
            }
          />
        </View>

        {/* イベント設定 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>イベント設定</Text>
          
          <SettingItem
            title="デフォルトイベント時間"
            subtitle={calendarSettings.defaultEventDuration === 'all-day' ? '終日' : `${calendarSettings.defaultEventDuration}分`}
            showArrow
            onPress={handleDefaultDurationChange}
          />
          
          <SettingItem
            title="辞退したイベントを表示"
            subtitle="招待を辞退したイベントも表示します"
            rightComponent={
              <Switch
                value={calendarSettings.showDeclinedEvents}
                onValueChange={(value) => updateCalendarSettings({ showDeclinedEvents: value })}
                trackColor={{ false: '#767577', true: '#ff6b6b' }}
                thumbColor={calendarSettings.showDeclinedEvents ? '#fff' : '#f4f3f4'}
              />
            }
          />
        </View>

        {/* オーナー表示設定 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>オーナー表示</Text>
          
          <SettingItem
            title="イニシャルを表示"
            subtitle="イベントにオーナーのイニシャルを表示"
            rightComponent={
              <Switch
                value={settings.showOwnerInitials}
                onValueChange={(value) => updateDisplaySettings(value, settings.showOwnerNames)}
                trackColor={{ false: '#767577', true: '#ff6b6b' }}
                thumbColor={settings.showOwnerInitials ? '#fff' : '#f4f3f4'}
              />
            }
          />
          
          <SettingItem
            title="名前を表示"
            subtitle="イベントにオーナーの名前を表示"
            rightComponent={
              <Switch
                value={settings.showOwnerNames}
                onValueChange={(value) => updateDisplaySettings(settings.showOwnerInitials, value)}
                trackColor={{ false: '#767577', true: '#ff6b6b' }}
                thumbColor={settings.showOwnerNames ? '#fff' : '#f4f3f4'}
              />
            }
          />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#ff6b6b',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginVertical: 8,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginLeft: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  settingItemLeft: {
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 16,
    color: '#333',
  },
  settingItemSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  arrow: {
    fontSize: 20,
    color: '#999',
  },
});
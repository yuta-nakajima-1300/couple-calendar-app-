import React from 'react';
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

export default function NotificationSettingsScreen() {
  const navigation = useNavigation();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [eventReminders, setEventReminders] = React.useState(true);
  const [anniversaryNotifications, setAnniversaryNotifications] = React.useState(true);
  const [partnerEventNotifications, setPartnerEventNotifications] = React.useState(true);
  const [reminderTiming, setReminderTiming] = React.useState('1day');
  const [anniversaryTiming, setAnniversaryTiming] = React.useState('morning');

  const handleReminderTimingChange = () => {
    Alert.alert(
      'リマインダータイミング',
      '予定のリマインダーをいつ受け取りますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '当日', onPress: () => setReminderTiming('same-day') },
        { text: '1時間前', onPress: () => setReminderTiming('1hour') },
        { text: '1日前', onPress: () => setReminderTiming('1day') },
        { text: '3日前', onPress: () => setReminderTiming('3days') },
        { text: '1週間前', onPress: () => setReminderTiming('1week') },
      ]
    );
  };

  const handleAnniversaryTimingChange = () => {
    Alert.alert(
      '記念日通知タイミング',
      '記念日の通知をいつ受け取りますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '朝9時', onPress: () => setAnniversaryTiming('morning') },
        { text: '正午12時', onPress: () => setAnniversaryTiming('noon') },
        { text: '夕方18時', onPress: () => setAnniversaryTiming('evening') },
        { text: '夜21時', onPress: () => setAnniversaryTiming('night') },
      ]
    );
  };

  const getTimingText = (timing: string, type: 'reminder' | 'anniversary') => {
    if (type === 'reminder') {
      switch (timing) {
        case 'same-day': return '当日';
        case '1hour': return '1時間前';
        case '1day': return '1日前';
        case '3days': return '3日前';
        case '1week': return '1週間前';
        default: return '1日前';
      }
    } else {
      switch (timing) {
        case 'morning': return '朝9時';
        case 'noon': return '正午12時';
        case 'evening': return '夕方18時';
        case 'night': return '夜21時';
        default: return '朝9時';
      }
    }
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
        <Text style={styles.title}>通知設定</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* 基本設定 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本設定</Text>
          
          <SettingItem
            title="プッシュ通知"
            subtitle="アプリからの通知を受け取る"
            rightComponent={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#767577', true: '#ff6b6b' }}
                thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
              />
            }
          />
        </View>

        {/* 予定リマインダー */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>予定リマインダー</Text>
          
          <SettingItem
            title="予定リマインダー"
            subtitle="予定の前にリマインダーを受け取る"
            rightComponent={
              <Switch
                value={eventReminders}
                onValueChange={setEventReminders}
                trackColor={{ false: '#767577', true: '#ff6b6b' }}
                thumbColor={eventReminders ? '#fff' : '#f4f3f4'}
              />
            }
          />
          
          {eventReminders && (
            <SettingItem
              title="リマインダータイミング"
              subtitle={getTimingText(reminderTiming, 'reminder')}
              showArrow
              onPress={handleReminderTimingChange}
            />
          )}
        </View>

        {/* 記念日通知 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>記念日通知</Text>
          
          <SettingItem
            title="記念日通知"
            subtitle="記念日当日に通知を受け取る"
            rightComponent={
              <Switch
                value={anniversaryNotifications}
                onValueChange={setAnniversaryNotifications}
                trackColor={{ false: '#767577', true: '#ff6b6b' }}
                thumbColor={anniversaryNotifications ? '#fff' : '#f4f3f4'}
              />
            }
          />
          
          {anniversaryNotifications && (
            <SettingItem
              title="通知時刻"
              subtitle={getTimingText(anniversaryTiming, 'anniversary')}
              showArrow
              onPress={handleAnniversaryTimingChange}
            />
          )}
        </View>

        {/* パートナー通知 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>パートナー通知</Text>
          
          <SettingItem
            title="パートナーのイベント追加"
            subtitle="パートナーが新しい予定を追加したときに通知"
            rightComponent={
              <Switch
                value={partnerEventNotifications}
                onValueChange={setPartnerEventNotifications}
                trackColor={{ false: '#767577', true: '#ff6b6b' }}
                thumbColor={partnerEventNotifications ? '#fff' : '#f4f3f4'}
              />
            }
          />
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            通知機能を使用するには、デバイスの設定でアプリの通知を許可してください。
          </Text>
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
  infoSection: {
    backgroundColor: '#f8f9fa',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'center',
  },
});
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Switch, 
  Alert,
  ScrollView,
  SafeAreaView 
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsScreen() {
  const { logout, user } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderDays, setReminderDays] = useState(1);
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: 'ログアウト', 
          style: 'destructive',
          onPress: () => {
            logout();
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '危険',
      'アカウントを削除すると、すべてのデータが失われます。この操作は元に戻せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: 'アカウント削除', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              '最終確認',
              '本当にアカウントを削除しますか？',
              [
                { text: 'キャンセル', style: 'cancel' },
                { 
                  text: '削除する', 
                  style: 'destructive',
                  onPress: () => {
                    // TODO: アカウント削除処理を実装
                    Alert.alert('アカウントが削除されました');
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const SettingItem = ({ 
    title, 
    subtitle, 
    onPress, 
    rightComponent,
    showArrow = false 
  }: {
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        {showArrow && <Text style={styles.arrow}>›</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>設定</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* プロフィール設定 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>プロフィール</Text>
          
          <SettingItem
            title="アカウント情報"
            subtitle={`${user?.name} (${user?.email})`}
            showArrow
            onPress={() => {
              // TODO: プロフィール編集画面への遷移
            }}
          />

          <SettingItem
            title="パートナー設定"
            subtitle="パートナーとの連携設定"
            showArrow
            onPress={() => {
              // TODO: パートナー設定画面への遷移
            }}
          />
        </View>

        {/* 通知設定 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>通知</Text>
          
          <SettingItem
            title="プッシュ通知"
            subtitle="記念日や予定の通知を受け取る"
            rightComponent={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#767577', true: '#ff6b6b' }}
                thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
              />
            }
          />

          <SettingItem
            title="リマインダー設定"
            subtitle={`${reminderDays}日前に通知`}
            showArrow
            onPress={() => {
              // TODO: リマインダー設定画面への遷移
            }}
          />
        </View>

        {/* 表示設定 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>表示</Text>
          
          <SettingItem
            title="ダークモード"
            subtitle="暗いテーマを使用する"
            rightComponent={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#767577', true: '#ff6b6b' }}
                thumbColor={darkMode ? '#fff' : '#f4f3f4'}
              />
            }
          />

          <SettingItem
            title="カレンダー設定"
            subtitle="表示形式、週の開始日など"
            showArrow
            onPress={() => {
              // TODO: カレンダー設定画面への遷移
            }}
          />
        </View>

        {/* データ管理 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>データ</Text>
          
          <SettingItem
            title="データのエクスポート"
            subtitle="予定と記念日をバックアップ"
            showArrow
            onPress={() => {
              // TODO: データエクスポート処理
              Alert.alert('準備中', 'この機能は準備中です');
            }}
          />

          <SettingItem
            title="データのインポート"
            subtitle="他のアプリからデータを取り込み"
            showArrow
            onPress={() => {
              // TODO: データインポート処理
              Alert.alert('準備中', 'この機能は準備中です');
            }}
          />
        </View>

        {/* サポート */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>サポート</Text>
          
          <SettingItem
            title="ヘルプ"
            subtitle="使い方とよくある質問"
            showArrow
            onPress={() => {
              // TODO: ヘルプ画面への遷移
            }}
          />

          <SettingItem
            title="お問い合わせ"
            subtitle="フィードバックやサポート"
            showArrow
            onPress={() => {
              // TODO: お問い合わせ画面への遷移
            }}
          />

          <SettingItem
            title="プライバシーポリシー"
            showArrow
            onPress={() => {
              // TODO: プライバシーポリシー表示
            }}
          />

          <SettingItem
            title="利用規約"
            showArrow
            onPress={() => {
              // TODO: 利用規約表示
            }}
          />
        </View>

        {/* アカウント操作 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アカウント</Text>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>ログアウト</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
            <Text style={styles.deleteText}>アカウント削除</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.version}>
          <Text style={styles.versionText}>バージョン 1.0.0</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
    marginHorizontal: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrow: {
    fontSize: 20,
    color: '#ccc',
    marginLeft: 8,
  },
  logoutButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logoutText: {
    fontSize: 16,
    color: '#ff6b6b',
    textAlign: 'left',
  },
  deleteButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  deleteText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'left',
  },
  version: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#999',
  },
});
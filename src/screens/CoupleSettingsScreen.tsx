import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  ScrollView,
  Share,
} from 'react-native';
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext';
import { useNavigation } from '@react-navigation/native';

export default function CoupleSettingsScreen() {
  const { userProfile, linkCouple, unlinkCouple, signOut, loading } = useFirebaseAuth();
  const navigation = useNavigation();
  const [inviteCode, setInviteCode] = useState('');
  const [linking, setLinking] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  const handleLinkCouple = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('エラー', '招待コードを入力してください');
      return;
    }

    try {
      setLinking(true);
      await linkCouple(inviteCode.trim());
      setInviteCode('');
      Alert.alert('成功', 'パートナーとの連携が完了しました！');
    } catch (error: any) {
      Alert.alert('連携エラー', error.message || '連携に失敗しました');
    } finally {
      setLinking(false);
    }
  };

  const handleUnlinkCouple = () => {
    Alert.alert(
      '連携解除の確認',
      'パートナーとの連携を解除しますか？\n共有していた予定は削除されませんが、今後の同期は停止されます。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '解除する',
          style: 'destructive',
          onPress: async () => {
            try {
              setUnlinking(true);
              await unlinkCouple();
              Alert.alert('完了', 'パートナーとの連携を解除しました');
            } catch (error: any) {
              Alert.alert('エラー', error.message || '連携解除に失敗しました');
            } finally {
              setUnlinking(false);
            }
          },
        },
      ]
    );
  };

  const handleShareInviteCode = async () => {
    if (!userProfile?.inviteCode) return;

    try {
      await Share.share({
        message: `カップルカレンダーアプリで一緒にカレンダーを管理しませんか？\n\n招待コード: ${userProfile.inviteCode}\n\nアプリをダウンロードして、この招待コードを入力してください！`,
        title: 'カップルカレンダー招待',
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'ログアウト確認',
      'ログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: signOut,
        },
      ]
    );
  };

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b6b" />
        </View>
      </SafeAreaView>
    );
  }

  // ユーザープロファイルが読み込めない場合の緊急ログアウト
  if (!userProfile && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emergencyContainer}>
          <Text style={styles.emergencyTitle}>設定画面にアクセスできません</Text>
          <Text style={styles.emergencyText}>ユーザープロファイルの読み込みに失敗しました</Text>
          <TouchableOpacity style={styles.emergencyButton} onPress={signOut}>
            <Text style={styles.emergencyButtonText}>ログアウト</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* ユーザー情報 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アカウント情報</Text>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userProfile?.displayName}</Text>
            <Text style={styles.userEmail}>{userProfile?.email}</Text>
          </View>
        </View>

        {/* カップル連携状態 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>カップル連携</Text>
          
          {userProfile.coupleId ? (
            // 連携済み
            <View style={styles.linkedContainer}>
              <View style={styles.statusContainer}>
                <Text style={styles.statusEmoji}>💕</Text>
                <Text style={styles.statusText}>パートナーと連携中</Text>
              </View>
              
              <TouchableOpacity
                style={styles.unlinkButton}
                onPress={handleUnlinkCouple}
                disabled={unlinking}
              >
                {unlinking ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.unlinkButtonText}>連携を解除</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            // 未連携
            <View style={styles.unlinkContainer}>
              {/* 自分の招待コード */}
              <View style={styles.inviteCodeContainer}>
                <Text style={styles.label}>あなたの招待コード</Text>
                <View style={styles.codeContainer}>
                  <Text style={styles.inviteCodeText}>{userProfile.inviteCode}</Text>
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={handleShareInviteCode}
                  >
                    <Text style={styles.shareButtonText}>共有</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.codeDescription}>
                  パートナーにこのコードを共有して、連携してもらいましょう
                </Text>
              </View>

              {/* パートナーの招待コード入力 */}
              <View style={styles.linkContainer}>
                <Text style={styles.label}>パートナーの招待コード</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="招待コードを入力"
                    value={inviteCode}
                    onChangeText={setInviteCode}
                    autoCapitalize="characters"
                    maxLength={6}
                  />
                  <TouchableOpacity
                    style={styles.linkButton}
                    onPress={handleLinkCouple}
                    disabled={linking || !inviteCode.trim()}
                  >
                    {linking ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.linkButtonText}>連携</Text>
                    )}
                  </TouchableOpacity>
                </View>
                <Text style={styles.inputDescription}>
                  パートナーから受け取った招待コードを入力してください
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* セキュリティ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>セキュリティ</Text>
          <TouchableOpacity 
            style={styles.securityButton} 
            onPress={() => navigation.navigate('SecurityDiagnostics' as never)}
          >
            <Text style={styles.securityButtonText}>セキュリティ診断</Text>
            <Text style={styles.securityButtonSubtext}>アプリのセキュリティ状態を確認</Text>
          </TouchableOpacity>
        </View>

        {/* アカウント */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アカウント</Text>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutButtonText}>ログアウト</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  userInfo: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  linkedContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  unlinkButton: {
    backgroundColor: '#ff4757',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  unlinkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  unlinkContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inviteCodeContainer: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inviteCodeText: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b6b',
    fontFamily: 'monospace',
  },
  shareButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  codeDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  linkContainer: {
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
  },
  linkButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 12,
  },
  linkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  signOutButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  signOutButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  emergencyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emergencyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  emergencyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  emergencyButton: {
    backgroundColor: '#ff4757',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  emergencyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  securityButton: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  securityButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  securityButtonSubtext: {
    fontSize: 14,
    color: '#666',
  },
});
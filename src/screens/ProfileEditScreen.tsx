import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext';
import { authService } from '../services/authService';

export default function ProfileEditScreen() {
  const navigation = useNavigation();
  const { user, userProfile, refreshUserProfile } = useFirebaseAuth();
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
    }
  }, [userProfile]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('エラー', '表示名を入力してください');
      return;
    }

    if (!user) {
      Alert.alert('エラー', 'ログインが必要です');
      return;
    }

    setLoading(true);
    try {
      // ユーザープロフィールを更新
      await authService.updateUserProfile(user.uid, {
        displayName: displayName.trim()
      });

      await refreshUserProfile();
      Alert.alert('完了', 'プロフィールを更新しました');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('エラー', `更新に失敗しました: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backButtonText}>キャンセル</Text>
            </TouchableOpacity>
            <Text style={styles.title}>プロフィール編集</Text>
            <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#ff6b6b" />
              ) : (
                <Text style={styles.saveButtonText}>保存</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {userProfile?.photoURL && (
              <View style={styles.photoSection}>
                <Image source={{ uri: userProfile.photoURL }} style={styles.photo} />
                <Text style={styles.photoHint}>※ プロフィール写真はGoogleアカウントから取得されます</Text>
              </View>
            )}

            <View style={styles.inputSection}>
              <Text style={styles.label}>表示名</Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="表示名を入力"
                autoFocus
                maxLength={30}
              />
              <Text style={styles.hint}>{displayName.length}/30</Text>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>メールアドレス</Text>
              <Text style={styles.infoValue}>{userProfile?.email || '-'}</Text>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>招待コード</Text>
              <Text style={styles.infoValue}>{userProfile?.inviteCode || '-'}</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    color: '#ff6b6b',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e0e0e0',
  },
  photoHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  hint: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  infoSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
});
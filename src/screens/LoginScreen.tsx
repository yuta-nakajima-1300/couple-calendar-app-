import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      Alert.alert('エラー', 'パスワードが一致しません');
      return;
    }

    if (!isLogin && !name) {
      Alert.alert('エラー', '名前を入力してください');
      return;
    }

    if (isLogin) {
      // ログイン処理
      const success = await login(email, password);
      
      if (success) {
        // ログイン成功時は自動的に画面が切り替わります
      } else {
        Alert.alert('エラー', 'メールアドレスまたはパスワードが間違っています');
      }
    } else {
      // 新規登録処理（サンプル）
      Alert.alert('成功', `${name}さん、アカウントを作成しました！`);
      // TODO: 実際のアカウント作成処理
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>カップル カレンダー</Text>
        <Text style={styles.subtitle}>
          {isLogin ? 'ログイン' : '新規登録'}
        </Text>

        {isLogin && (
          <View style={styles.sampleInfo}>
            <Text style={styles.sampleTitle}>📝 サンプルアカウント</Text>
            <Text style={styles.sampleText}>test@example.com / password123</Text>
            <Text style={styles.sampleText}>demo@example.com / demo123</Text>
            <Text style={styles.sampleText}>sample@example.com / sample123</Text>
          </View>
        )}

        <View style={styles.form}>
          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="お名前"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          )}
          
          <TextInput
            style={styles.input}
            placeholder="メールアドレス"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="パスワード"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="パスワード確認"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          )}

          <TouchableOpacity style={styles.button} onPress={handleAuth}>
            <Text style={styles.buttonText}>
              {isLogin ? 'ログイン' : 'アカウント作成'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.switchButton}
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text style={styles.switchText}>
            {isLogin 
              ? 'アカウントをお持ちでない方は新規登録' 
              : 'すでにアカウントをお持ちの方はログイン'
            }
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#ff6b6b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
  },
  form: {
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    alignItems: 'center',
  },
  switchText: {
    color: '#ff6b6b',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  sampleInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 24,
  },
  sampleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sampleText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});
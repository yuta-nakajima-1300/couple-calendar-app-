import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { checkSecureStorageHealth, SecureKeys, getSecureItem } from '../utils/secureStorage';
import { rateLimiter } from '../utils/rateLimiter';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface SecurityCheckResult {
  name: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
  details?: string;
}

export function SecurityDiagnosticsScreen() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<SecurityCheckResult[]>([]);

  const runSecurityDiagnostics = async () => {
    setIsRunning(true);
    const newResults: SecurityCheckResult[] = [];

    try {
      // 1. セキュアストレージの健全性チェック
      const storageHealth = await checkSecureStorageHealth();
      newResults.push({
        name: 'セキュアストレージ',
        status: storageHealth.available ? 'pass' : 'fail',
        message: storageHealth.available 
          ? 'セキュアストレージは正常に動作しています' 
          : 'セキュアストレージに問題があります',
        details: storageHealth.warning || `プラットフォーム: ${storageHealth.platform}`,
      });

      // 2. 暗号化キーの存在確認
      try {
        const encryptionKey = await getSecureItem(SecureKeys.ENCRYPTION_KEY);
        newResults.push({
          name: '暗号化キー',
          status: encryptionKey ? 'pass' : 'warning',
          message: encryptionKey 
            ? '暗号化キーが設定されています' 
            : '暗号化キーが未設定です',
        });
      } catch (error) {
        newResults.push({
          name: '暗号化キー',
          status: 'fail',
          message: '暗号化キーの確認に失敗しました',
          details: error instanceof Error ? error.message : '不明なエラー',
        });
      }

      // 3. プラットフォーム別セキュリティチェック
      if (Platform.OS === 'web') {
        newResults.push({
          name: 'プラットフォームセキュリティ',
          status: 'warning',
          message: 'Web環境では一部のセキュリティ機能が制限されます',
          details: 'モバイルアプリでは完全な暗号化が利用可能です',
        });
      } else {
        // モバイル環境でのSecureStore利用可能性
        try {
          const testKey = 'security_test_' + Date.now();
          await SecureStore.setItemAsync(testKey, 'test');
          await SecureStore.deleteItemAsync(testKey);
          newResults.push({
            name: 'プラットフォームセキュリティ',
            status: 'pass',
            message: 'ネイティブセキュアストレージが利用可能です',
          });
        } catch (error) {
          newResults.push({
            name: 'プラットフォームセキュリティ',
            status: 'fail',
            message: 'ネイティブセキュアストレージにアクセスできません',
            details: error instanceof Error ? error.message : '不明なエラー',
          });
        }
      }

      // 4. レート制限の動作確認
      const testKey = 'security_test_rate_limit';
      rateLimiter.reset(testKey); // テスト前にリセット
      
      let rateLimitWorking = true;
      for (let i = 0; i < 6; i++) {
        const allowed = rateLimiter.checkLimit(testKey, 5, 1000);
        if (i === 5 && allowed) {
          rateLimitWorking = false;
        }
      }
      
      newResults.push({
        name: 'レート制限',
        status: rateLimitWorking ? 'pass' : 'fail',
        message: rateLimitWorking 
          ? 'レート制限は正常に動作しています' 
          : 'レート制限に問題があります',
      });

      // 5. 保存されている認証トークンの確認
      try {
        const token = await getSecureItem(SecureKeys.USER_TOKEN);
        newResults.push({
          name: '認証トークン',
          status: token ? 'pass' : 'warning',
          message: token 
            ? '認証トークンが暗号化されて保存されています' 
            : '認証トークンが保存されていません',
          details: token ? 'トークンは暗号化済み' : 'ログイン後に自動的に保存されます',
        });
      } catch (error) {
        newResults.push({
          name: '認証トークン',
          status: 'fail',
          message: '認証トークンの確認に失敗しました',
          details: error instanceof Error ? error.message : '不明なエラー',
        });
      }

      // 6. HTTPSの確認（Web環境のみ）
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const isHttps = window.location.protocol === 'https:';
        newResults.push({
          name: 'HTTPS接続',
          status: isHttps ? 'pass' : 'warning',
          message: isHttps 
            ? 'HTTPS接続で保護されています' 
            : 'HTTP接続を使用しています',
          details: isHttps 
            ? undefined 
            : '本番環境では必ずHTTPSを使用してください',
        });
      }

    } catch (error) {
      console.error('Security diagnostics error:', error);
      Alert.alert(
        'エラー',
        'セキュリティ診断中にエラーが発生しました'
      );
    } finally {
      setIsRunning(false);
      setResults(newResults);
    }
  };

  useEffect(() => {
    runSecurityDiagnostics();
  }, []);

  const getStatusIcon = (status: SecurityCheckResult['status']) => {
    switch (status) {
      case 'pass':
        return <MaterialIcons name="check-circle" size={24} color="#4CAF50" />;
      case 'warning':
        return <MaterialIcons name="warning" size={24} color="#FF9800" />;
      case 'fail':
        return <MaterialIcons name="error" size={24} color="#F44336" />;
    }
  };

  const getStatusColor = (status: SecurityCheckResult['status']) => {
    switch (status) {
      case 'pass':
        return '#E8F5E9';
      case 'warning':
        return '#FFF3E0';
      case 'fail':
        return '#FFEBEE';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>セキュリティ診断</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={runSecurityDiagnostics}
          disabled={isRunning}
        >
          <MaterialIcons name="refresh" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {isRunning && results.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>診断を実行中...</Text>
          </View>
        ) : (
          <>
            {results.map((result, index) => (
              <View
                key={index}
                style={[
                  styles.resultCard,
                  { backgroundColor: getStatusColor(result.status) },
                ]}
              >
                <View style={styles.resultHeader}>
                  {getStatusIcon(result.status)}
                  <Text style={styles.resultName}>{result.name}</Text>
                </View>
                <Text style={styles.resultMessage}>{result.message}</Text>
                {result.details && (
                  <Text style={styles.resultDetails}>{result.details}</Text>
                )}
              </View>
            ))}

            {results.length > 0 && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>診断サマリー</Text>
                <Text style={styles.summaryText}>
                  合計: {results.length}項目
                </Text>
                <Text style={[styles.summaryText, { color: '#4CAF50' }]}>
                  合格: {results.filter(r => r.status === 'pass').length}項目
                </Text>
                <Text style={[styles.summaryText, { color: '#FF9800' }]}>
                  警告: {results.filter(r => r.status === 'warning').length}項目
                </Text>
                <Text style={[styles.summaryText, { color: '#F44336' }]}>
                  失敗: {results.filter(r => r.status === 'fail').length}項目
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  resultCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  resultMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  resultDetails: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
});
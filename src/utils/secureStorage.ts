import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * セキュアストレージユーティリティ
 * 機密データの暗号化保存を提供
 */

// Web環境ではSecureStoreが使えないため、フォールバック実装
const isSecureStoreAvailable = Platform.OS !== 'web';

/**
 * UTF-8文字列をBase64エンコード
 */
function utf8ToBase64(str: string): string {
  // UTF-8文字列をバイト配列に変換
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  // バイト配列をバイナリ文字列に変換
  const binString = Array.from(data, (byte) =>
    String.fromCodePoint(byte)
  ).join('');
  // Base64エンコード
  return btoa(binString);
}

/**
 * Base64文字列をUTF-8デコード
 */
function base64ToUtf8(base64: string): string {
  // Base64デコード
  const binString = atob(base64);
  // バイナリ文字列をバイト配列に変換
  const bytes = Uint8Array.from(binString, (char) =>
    char.codePointAt(0)!
  );
  // UTF-8デコード
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}

/**
 * セキュアにデータを保存
 */
export async function setSecureItem(key: string, value: string): Promise<void> {
  try {
    if (isSecureStoreAvailable) {
      // モバイル環境: 暗号化して保存
      await SecureStore.setItemAsync(key, value);
    } else {
      // Web環境: 警告を出しつつ通常のストレージに保存
      console.warn('SecureStore is not available on web. Using AsyncStorage as fallback.');
      // UTF-8対応Base64エンコードで軽微な難読化
      const encoded = utf8ToBase64(value);
      await AsyncStorage.setItem(`secure_${key}`, encoded);
    }
  } catch (error) {
    console.error('Failed to save secure item:', error);
    throw error;
  }
}

/**
 * セキュアにデータを取得
 */
export async function getSecureItem(key: string): Promise<string | null> {
  try {
    if (isSecureStoreAvailable) {
      // モバイル環境: 暗号化されたデータを復号
      return await SecureStore.getItemAsync(key);
    } else {
      // Web環境: UTF-8対応Base64デコード
      const encoded = await AsyncStorage.getItem(`secure_${key}`);
      if (encoded) {
        return base64ToUtf8(encoded);
      }
      return null;
    }
  } catch (error) {
    console.error('Failed to get secure item:', error);
    return null;
  }
}

/**
 * セキュアにデータを削除
 */
export async function deleteSecureItem(key: string): Promise<void> {
  try {
    if (isSecureStoreAvailable) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await AsyncStorage.removeItem(`secure_${key}`);
    }
  } catch (error) {
    console.error('Failed to delete secure item:', error);
    throw error;
  }
}

/**
 * 機密データの暗号化キー
 */
const ENCRYPTION_KEY_NAME = 'app_encryption_key';

/**
 * 暗号化キーの生成または取得
 */
export async function getOrCreateEncryptionKey(): Promise<string> {
  let key = await getSecureItem(ENCRYPTION_KEY_NAME);
  
  if (!key) {
    // 新しい暗号化キーを生成
    const array = new Uint8Array(32);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      // フォールバック: Math.randomを使用（セキュリティ低下）
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    
    key = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    await setSecureItem(ENCRYPTION_KEY_NAME, key);
  }
  
  return key;
}

/**
 * 簡易的な暗号化（XOR）
 * 注: 本番環境ではより強力な暗号化アルゴリズムを使用すべき
 */
export function simpleEncrypt(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return utf8ToBase64(result); // UTF-8対応Base64エンコード
}

/**
 * 簡易的な復号化（XOR）
 */
export function simpleDecrypt(encrypted: string, key: string): string {
  const decoded = base64ToUtf8(encrypted); // UTF-8対応Base64デコード
  let result = '';
  for (let i = 0; i < decoded.length; i++) {
    result += String.fromCharCode(
      decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return result;
}

/**
 * 機密データ保存用のキー
 */
export const SecureKeys = {
  USER_TOKEN: 'user_token',
  REFRESH_TOKEN: 'refresh_token',
  COUPLE_CODE: 'couple_code',
  ENCRYPTION_KEY: 'encryption_key',
  BIOMETRIC_ENABLED: 'biometric_enabled',
} as const;

/**
 * セキュアストレージのヘルスチェック
 */
export async function checkSecureStorageHealth(): Promise<{
  available: boolean;
  platform: string;
  warning?: string;
}> {
  try {
    const testKey = 'health_check_test';
    const testValue = 'test_' + Date.now();
    
    await setSecureItem(testKey, testValue);
    const retrieved = await getSecureItem(testKey);
    await deleteSecureItem(testKey);
    
    const success = retrieved === testValue;
    
    return {
      available: success,
      platform: Platform.OS,
      warning: !isSecureStoreAvailable ? 
        'SecureStore not available on web. Using fallback storage.' : 
        undefined
    };
  } catch (error) {
    return {
      available: false,
      platform: Platform.OS,
      warning: `Health check failed: ${error}`
    };
  }
}
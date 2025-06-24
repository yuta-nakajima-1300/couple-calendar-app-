import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

// Web環境の型定義
declare global {
  interface HTMLInputElement {
    capture?: string;
  }
}

export class PhotoService {
  
  static async requestPermission(): Promise<boolean> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        '権限が必要です',
        '写真を選択するには、フォトライブラリへのアクセス権限が必要です。設定から権限を許可してください。'
      );
      return false;
    }
    
    return true;
  }

  static async selectPhoto(): Promise<string | null> {
    try {
      // Web環境の場合は、HTML input要素を使用
      if (Platform.OS === 'web') {
        return new Promise((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = (event: any) => {
            const file = event.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (e: any) => {
                resolve(e.target.result);
              };
              reader.readAsDataURL(file);
            } else {
              resolve(null);
            }
          };
          input.click();
        });
      }

      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }

      return null;
    } catch (error) {
      console.error('Failed to select photo:', error);
      Alert.alert('エラー', '写真の選択に失敗しました');
      return null;
    }
  }

  static async takePhoto(): Promise<string | null> {
    try {
      // Web環境の場合は、カメラ機能を使用
      if (Platform.OS === 'web') {
        return new Promise((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.capture = 'environment'; // カメラを起動
          input.onchange = (event: any) => {
            const file = event.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (e: any) => {
                resolve(e.target.result);
              };
              reader.readAsDataURL(file);
            } else {
              resolve(null);
            }
          };
          input.click();
        });
      }

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          '権限が必要です',
          '写真を撮影するには、カメラへのアクセス権限が必要です。設定から権限を許可してください。'
        );
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }

      return null;
    } catch (error) {
      console.error('Failed to take photo:', error);
      Alert.alert('エラー', '写真の撮影に失敗しました');
      return null;
    }
  }

  static showPhotoOptions(
    onSelectFromLibrary: () => void,
    onTakePhoto: () => void,
    onRemovePhoto?: () => void
  ): void {
    // Web環境では、シンプルにファイル選択のみ実行
    if (Platform.OS === 'web') {
      onSelectFromLibrary();
      return;
    }

    const options = [
      { text: 'フォトライブラリから選択', onPress: onSelectFromLibrary },
      { text: '写真を撮影', onPress: onTakePhoto },
    ];

    if (onRemovePhoto) {
      options.push({ text: '写真を削除', onPress: onRemovePhoto });
    }

    options.push({ text: 'キャンセル', onPress: () => {} });

    Alert.alert('写真を選択', '', options);
  }
}
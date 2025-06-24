import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext';
import AppNavigator from './AppNavigator';
import AuthLoginScreen from '../screens/AuthLoginScreen';

export default function MainAppNavigator() {
  const { user, loading } = useFirebaseAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ff6b6b" />
      </View>
    );
  }

  // ユーザーがログインしていない場合はログイン画面を表示
  if (!user) {
    return <AuthLoginScreen />;
  }

  // ログイン済みの場合はメインアプリを表示
  return <AppNavigator />;
}
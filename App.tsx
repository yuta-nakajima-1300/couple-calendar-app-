import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { FirebaseAuthProvider } from './src/contexts/FirebaseAuthContext';
import { FirebaseEventProvider } from './src/contexts/FirebaseEventContext';
import { AnniversaryProvider } from './src/contexts/AnniversaryContext';
import MainAppNavigator from './src/navigation/MainAppNavigator';

export default function App() {
  return (
    <FirebaseAuthProvider>
      <FirebaseEventProvider>
        <AnniversaryProvider>
          <MainAppNavigator />
          <StatusBar style="auto" />
        </AnniversaryProvider>
      </FirebaseEventProvider>
    </FirebaseAuthProvider>
  );
}

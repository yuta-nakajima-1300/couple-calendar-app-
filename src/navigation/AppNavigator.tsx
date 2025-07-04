import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import CalendarScreen from '../screens/CalendarScreen';
import AnniversariesScreen from '../screens/AnniversariesScreen';
import AnniversaryCreateScreen from '../screens/AnniversaryCreateScreen';
import CoupleSettingsScreen from '../screens/CoupleSettingsScreen';
import EventCreateScreen from '../screens/EventCreateScreen';
import EventEditScreen from '../screens/EventEditScreen';
import { SecurityDiagnosticsScreen } from '../screens/SecurityDiagnosticsScreen';

import { RootStackParamList, MainTabParamList, CalendarStackParamList, AnniversaryStackParamList } from '../types/navigation';

const RootStack = createStackNavigator<RootStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const CalendarStack = createStackNavigator<CalendarStackParamList>();
const AnniversaryStack = createStackNavigator<AnniversaryStackParamList>();
const SettingsStack = createStackNavigator();

function CalendarNavigator() {
  return (
    <CalendarStack.Navigator>
      <CalendarStack.Screen 
        name="CalendarHome" 
        component={CalendarScreen}
        options={{ title: 'カレンダー' }}
      />
      <CalendarStack.Screen 
        name="EventCreate" 
        component={EventCreateScreen}
        options={{ title: '予定作成' }}
      />
      <CalendarStack.Screen 
        name="EventEdit" 
        component={EventEditScreen}
        options={{ title: '予定編集' }}
      />
    </CalendarStack.Navigator>
  );
}

function AnniversaryNavigator() {
  return (
    <AnniversaryStack.Navigator>
      <AnniversaryStack.Screen 
        name="AnniversaryHome" 
        component={AnniversariesScreen}
        options={{ title: '記念日' }}
      />
      <AnniversaryStack.Screen 
        name="AnniversaryCreate" 
        component={AnniversaryCreateScreen}
        options={{ title: '記念日作成' }}
      />
    </AnniversaryStack.Navigator>
  );
}

function SettingsNavigator() {
  return (
    <SettingsStack.Navigator>
      <SettingsStack.Screen 
        name="SettingsHome" 
        component={CoupleSettingsScreen}
        options={{ title: '設定' }}
      />
      <SettingsStack.Screen 
        name="SecurityDiagnostics" 
        component={SecurityDiagnosticsScreen}
        options={{ title: 'セキュリティ診断' }}
      />
    </SettingsStack.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#ff6b6b',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <MainTab.Screen 
        name="Calendar" 
        component={CalendarNavigator}
        options={{ 
          title: 'カレンダー',
          headerShown: false 
        }}
      />
      <MainTab.Screen 
        name="Anniversaries" 
        component={AnniversaryNavigator}
        options={{ 
          title: '記念日',
          headerShown: false 
        }}
      />
      <MainTab.Screen 
        name="Settings" 
        component={SettingsNavigator}
        options={{ 
          title: '設定',
          headerShown: false 
        }}
      />
    </MainTab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Main" component={MainNavigator} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
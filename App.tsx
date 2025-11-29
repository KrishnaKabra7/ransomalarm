import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AlarmProvider, useAlarm } from './src/context/AlarmContext';
import { RootStackParamList } from './src/types';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import CreateAlarmScreen from './src/screens/CreateAlarmScreen';
import AlarmRingingScreen from './src/screens/AlarmRingingScreen';
import GenerateQRScreen from './src/screens/GenerateQRScreen';
import ScanQRScreen from './src/screens/ScanQRScreen';
import FriendCodeScreen from './src/screens/FriendCodeScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  const { user, loading: authLoading } = useAuth();
  const { alarmState, loading: alarmLoading } = useAlarm();
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Login');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!authLoading && !alarmLoading) {
      // Anti-cheat: Check if there's an active alarm on app start
      if (user && alarmState.isAlarmActive && alarmState.alarmId) {
        setInitialRoute('AlarmRinging');
      } else if (user) {
        setInitialRoute('Home');
      } else {
        setInitialRoute('Login');
      }
      setIsReady(true);
    }
  }, [authLoading, alarmLoading, user, alarmState]);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#1a1a2e' },
      }}
    >
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="CreateAlarm" component={CreateAlarmScreen} />
          <Stack.Screen 
            name="AlarmRinging" 
            component={AlarmRingingScreen}
            options={{
              gestureEnabled: false, // Disable swipe back
              headerShown: false,
            }}
            initialParams={alarmState.alarmId ? { alarmId: alarmState.alarmId } : undefined}
          />
          <Stack.Screen name="GenerateQR" component={GenerateQRScreen} />
          <Stack.Screen name="ScanQR" component={ScanQRScreen} />
          <Stack.Screen name="FriendCode" component={FriendCodeScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AlarmProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <AppNavigator />
          </NavigationContainer>
        </AlarmProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

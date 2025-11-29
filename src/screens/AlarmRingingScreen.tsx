import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
  Alert,
  Vibration,
} from 'react-native';
import { useRoute, useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Audio } from 'expo-av';
import { useAlarm } from '../context/AlarmContext';
import { RootStackParamList, Alarm } from '../types';
import { validateCode } from '../services/totp';
import { getAlarm } from '../services/storage';

type AlarmRingingRouteProp = RouteProp<RootStackParamList, 'AlarmRinging'>;
type AlarmRingingNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AlarmRinging'>;

export default function AlarmRingingScreen() {
  const route = useRoute<AlarmRingingRouteProp>();
  const navigation = useNavigation<AlarmRingingNavigationProp>();
  const { dismissAlarm, alarmState } = useAlarm();
  
  const [code, setCode] = useState('');
  const [alarm, setAlarm] = useState<Alarm | null>(null);
  const [error, setError] = useState('');
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const vibrationInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load alarm data
  useEffect(() => {
    const loadAlarm = async () => {
      const alarmData = await getAlarm(route.params.alarmId);
      setAlarm(alarmData);
    };
    loadAlarm();
  }, [route.params.alarmId]);

  // Alarm alert with vibration as the primary mechanism
  // Sound support can be added by placing alarm.mp3 in assets folder
  useEffect(() => {
    let isMounted = true;
    
    const setupAlarm = async () => {
      try {
        // Configure audio mode for alarm
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: false,
        });
        
        // Note: To add custom alarm sound:
        // 1. Add alarm.mp3 to assets folder
        // 2. Uncomment the code below:
        // const { sound: alarmSound } = await Audio.Sound.createAsync(
        //   require('../../assets/alarm.mp3'),
        //   { isLooping: true, volume: 1.0 }
        // );
        // if (isMounted) {
        //   setSound(alarmSound);
        //   await alarmSound.playAsync();
        // }
        
      } catch (error) {
        console.error('Error setting up audio mode:', error);
      }
    };

    setupAlarm();

    // Start continuous vibration - primary alert mechanism
    // Works reliably offline without any external dependencies
    Vibration.vibrate([500, 200, 500, 200, 500], false);
    vibrationInterval.current = setInterval(() => {
      Vibration.vibrate([500, 200, 500, 200, 500], false);
    }, 2500);

    return () => {
      isMounted = false;
      if (vibrationInterval.current) {
        clearInterval(vibrationInterval.current);
      }
      Vibration.cancel();
    };
  }, []);

  // Cleanup sound when component unmounts
  useEffect(() => {
    return () => {
      if (sound) {
        sound.stopAsync();
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Disable back button and navigation (The Lock feature)
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Prevent back navigation
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => {
        subscription.remove();
      };
    }, [])
  );

  // Prevent gesture navigation
  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
      gestureEnabled: false,
    });
  }, [navigation]);

  const stopAlarm = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
    }
    if (vibrationInterval.current) {
      clearInterval(vibrationInterval.current);
    }
    Vibration.cancel();
  };

  const handleDismiss = async () => {
    if (!alarm?.linkedSecret) {
      Alert.alert('Error', 'This alarm is not linked to a friend');
      return;
    }

    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    const isValid = validateCode(alarm.linkedSecret, code);
    
    if (isValid) {
      await stopAlarm();
      await dismissAlarm();
      navigation.navigate('Home');
    } else {
      setError('Invalid code. Ask your friend for the current code!');
      setCode('');
      // Provide haptic feedback for wrong code
      Vibration.vibrate(200);
    }
  };

  const handleCodeChange = (text: string) => {
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 6) {
      setCode(numericText);
      setError('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.alarmIcon}>🔔</Text>
        <Text style={styles.title}>ALARM!</Text>
        <Text style={styles.time}>{alarm?.time || '--:--'}</Text>
        
        <View style={styles.codeSection}>
          <Text style={styles.instruction}>
            Enter the code from {alarm?.linkedFriendName || 'your friend'}
          </Text>
          
          <TextInput
            style={styles.codeInput}
            value={code}
            onChangeText={handleCodeChange}
            placeholder="000000"
            placeholderTextColor="#444"
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <TouchableOpacity
            style={[
              styles.dismissButton,
              code.length !== 6 && styles.dismissButtonDisabled,
            ]}
            onPress={handleDismiss}
            disabled={code.length !== 6}
          >
            <Text style={styles.dismissButtonText}>Dismiss Alarm</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Call your friend to get the code!
          </Text>
          <Text style={styles.infoSubtext}>
            The code changes every 30 seconds
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e94560',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  alarmIcon: {
    fontSize: 80,
    marginBottom: 10,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  time: {
    fontSize: 36,
    color: '#fff',
    marginBottom: 40,
  },
  codeSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  instruction: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  codeInput: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    fontSize: 40,
    fontWeight: 'bold',
    color: '#1a1a2e',
    width: '100%',
    textAlign: 'center',
    letterSpacing: 15,
    marginBottom: 15,
  },
  errorText: {
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    marginBottom: 15,
    fontSize: 14,
  },
  dismissButton: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    paddingVertical: 18,
    paddingHorizontal: 40,
    width: '100%',
  },
  dismissButtonDisabled: {
    opacity: 0.5,
  },
  dismissButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  infoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 5,
  },
});

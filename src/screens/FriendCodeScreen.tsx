import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { generateCode, getTimeRemaining } from '../services/totp';
import { saveLinkedSecret, deleteLinkedSecret } from '../services/storage';

type FriendCodeRouteProp = RouteProp<RootStackParamList, 'FriendCode'>;
type FriendCodeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'FriendCode'>;

export default function FriendCodeScreen() {
  const navigation = useNavigation<FriendCodeNavigationProp>();
  const route = useRoute<FriendCodeRouteProp>();
  const { secret, friendName } = route.params;

  const [currentCode, setCurrentCode] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Update code every second
    const interval = setInterval(() => {
      setCurrentCode(generateCode(secret));
      setTimeRemaining(getTimeRemaining());
    }, 1000);

    // Initial values
    setCurrentCode(generateCode(secret));
    setTimeRemaining(getTimeRemaining());

    return () => clearInterval(interval);
  }, [secret]);

  const handleSave = async () => {
    try {
      await saveLinkedSecret(secret, friendName);
      setIsSaved(true);
      Alert.alert(
        'Friend Linked!',
        `You can now help ${friendName} dismiss their alarms.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save friend link');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Remove Friend?',
      `Are you sure you want to unlink ${friendName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await deleteLinkedSecret(secret);
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔗 {friendName}'s Code</Text>
      <Text style={styles.subtitle}>
        Share this code when {friendName} needs to dismiss their alarm
      </Text>

      <View style={styles.codeContainer}>
        <Text style={styles.codeLabel}>Current Code</Text>
        <Text style={styles.code}>{currentCode}</Text>
        <View style={styles.timerContainer}>
          <View style={[styles.timerBar, { width: `${(timeRemaining / 30) * 100}%` }]} />
        </View>
        <Text style={styles.timerText}>Changes in {timeRemaining}s</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>💡 How it works</Text>
        <Text style={styles.infoText}>
          When {friendName}'s alarm goes off, they need YOUR code to dismiss it!
        </Text>
        <Text style={styles.infoText}>
          • The code changes every 30 seconds
        </Text>
        <Text style={styles.infoText}>
          • They'll call/text you for the current code
        </Text>
        <Text style={styles.infoText}>
          • Without it, they can't turn off the alarm!
        </Text>
      </View>

      {!isSaved && (
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>💾 Save Friend Link</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>🗑️ Remove Friend</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.backButtonText}>← Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
  },
  codeContainer: {
    backgroundColor: '#16213e',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 25,
  },
  codeLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 10,
  },
  code: {
    color: '#fff',
    fontSize: 56,
    fontWeight: 'bold',
    letterSpacing: 10,
    marginBottom: 20,
  },
  timerContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#0f3460',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  timerBar: {
    height: '100%',
    backgroundColor: '#e94560',
  },
  timerText: {
    color: '#888',
    fontSize: 14,
  },
  infoCard: {
    backgroundColor: '#16213e',
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
  },
  infoTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  infoText: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: '#4ade80',
    borderRadius: 10,
    paddingVertical: 15,
    marginBottom: 15,
  },
  saveButtonText: {
    color: '#1a1a2e',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    paddingVertical: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e94560',
  },
  deleteButtonText: {
    color: '#e94560',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backButton: {
    padding: 15,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#e94560',
    fontSize: 16,
  },
});

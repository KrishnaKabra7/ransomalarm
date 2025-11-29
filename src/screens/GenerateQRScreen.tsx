import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Share,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { generateSecret, generateTOTPUri, generateCode, getTimeRemaining } from '../services/totp';
import { useAuth } from '../context/AuthContext';

type GenerateQRNavigationProp = NativeStackNavigationProp<RootStackParamList, 'GenerateQR'>;

export default function GenerateQRScreen() {
  const navigation = useNavigation<GenerateQRNavigationProp>();
  const { user } = useAuth();
  
  const [secret, setSecret] = useState('');
  const [label, setLabel] = useState('');
  const [qrValue, setQrValue] = useState('');
  const [currentCode, setCurrentCode] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [isGenerated, setIsGenerated] = useState(false);

  useEffect(() => {
    // Set default label using user email
    if (user?.email) {
      setLabel(user.email.split('@')[0]);
    }
  }, [user]);

  useEffect(() => {
    if (!secret) return;

    // Update current code every second
    const interval = setInterval(() => {
      setCurrentCode(generateCode(secret));
      setTimeRemaining(getTimeRemaining());
    }, 1000);

    // Initial values
    setCurrentCode(generateCode(secret));
    setTimeRemaining(getTimeRemaining());

    return () => clearInterval(interval);
  }, [secret]);

  const handleGenerateQR = () => {
    if (!label.trim()) {
      Alert.alert('Error', 'Please enter a name for your friend to identify you');
      return;
    }

    const newSecret = generateSecret();
    const uri = generateTOTPUri(newSecret, label.trim());
    
    setSecret(newSecret);
    setQrValue(uri);
    setIsGenerated(true);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Scan this with Social Alarm app to link with me!\n\n${qrValue}\n\nOr use this secret: ${secret}`,
        title: 'Social Alarm - Link with me!',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Generate New Code?',
      'This will create a new QR code. The old code will no longer work for linked friends.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate New',
          onPress: () => {
            setSecret('');
            setQrValue('');
            setIsGenerated(false);
          },
        },
      ]
    );
  };

  if (!isGenerated) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>📤 Share Your Code</Text>
        <Text style={styles.subtitle}>
          Let your friend scan this QR code. They'll get a rotating code to help dismiss your alarms.
        </Text>

        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Your Name (for friend)</Text>
          <TextInput
            style={styles.input}
            value={label}
            onChangeText={setLabel}
            placeholder="e.g., John"
            placeholderTextColor="#666"
            maxLength={20}
          />
        </View>

        <TouchableOpacity style={styles.generateButton} onPress={handleGenerateQR}>
          <Text style={styles.generateButtonText}>Generate QR Code</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📤 Your QR Code</Text>
      <Text style={styles.subtitle}>
        Have your friend scan this code with their Social Alarm app
      </Text>

      <View style={styles.qrContainer}>
        <QRCode
          value={qrValue}
          size={200}
          backgroundColor="#fff"
          color="#1a1a2e"
        />
      </View>

      <View style={styles.codeDisplay}>
        <Text style={styles.codeLabel}>Current Code:</Text>
        <Text style={styles.codeValue}>{currentCode}</Text>
        <View style={styles.timerContainer}>
          <View style={[styles.timerBar, { width: `${(timeRemaining / 30) * 100}%` }]} />
        </View>
        <Text style={styles.timerText}>Refreshes in {timeRemaining}s</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>📤 Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetButtonText}>🔄 New Code</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
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
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  inputSection: {
    width: '100%',
    marginBottom: 30,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 15,
    fontSize: 18,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  generateButton: {
    backgroundColor: '#e94560',
    borderRadius: 10,
    paddingVertical: 18,
    paddingHorizontal: 40,
    width: '100%',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  qrContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    marginBottom: 30,
  },
  codeDisplay: {
    backgroundColor: '#16213e',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  codeLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 5,
  },
  codeValue: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
    letterSpacing: 8,
    marginBottom: 15,
  },
  timerContainer: {
    width: '100%',
    height: 6,
    backgroundColor: '#0f3460',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  timerBar: {
    height: '100%',
    backgroundColor: '#e94560',
  },
  timerText: {
    color: '#888',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#0f3460',
    borderRadius: 10,
    paddingVertical: 15,
    marginRight: 10,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#16213e',
    borderRadius: 10,
    paddingVertical: 15,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backButton: {
    padding: 15,
  },
  backButtonText: {
    color: '#e94560',
    fontSize: 16,
  },
});

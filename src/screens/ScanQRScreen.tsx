import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { parseTOTPUri } from '../services/totp';
import { saveLinkedSecret } from '../services/storage';

type ScanQRNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ScanQR'>;

export default function ScanQRScreen() {
  const navigation = useNavigation<ScanQRNavigationProp>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [manualSecret, setManualSecret] = useState('');
  const [friendName, setFriendName] = useState('');

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    const totpData = parseTOTPUri(data);
    
    if (totpData) {
      // Navigate to friend code screen with the scanned secret
      navigation.navigate('FriendCode', {
        secret: totpData.secret,
        friendName: totpData.label || 'Friend',
      });
    } else {
      Alert.alert(
        'Invalid QR Code',
        'This QR code is not a valid Social Alarm code. Please scan a code from your friend\'s Social Alarm app.',
        [
          {
            text: 'Try Again',
            onPress: () => setScanned(false),
          },
        ]
      );
    }
  };

  const handleManualSubmit = async () => {
    if (!manualSecret.trim() || !friendName.trim()) {
      Alert.alert('Error', 'Please enter both the secret and your friend\'s name');
      return;
    }

    try {
      await saveLinkedSecret(manualSecret.trim(), friendName.trim());
      navigation.navigate('FriendCode', {
        secret: manualSecret.trim(),
        friendName: friendName.trim(),
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to save the secret. Please try again.');
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>📷 Camera Permission</Text>
        <Text style={styles.permissionText}>
          We need camera access to scan QR codes from your friends
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.manualButton}
          onPress={() => setManualEntry(true)}
        >
          <Text style={styles.manualButtonText}>Enter Code Manually</Text>
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

  if (manualEntry) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>📝 Enter Code Manually</Text>
        <Text style={styles.subtitle}>
          Enter the secret code shared by your friend
        </Text>

        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Friend's Name</Text>
          <TextInput
            style={styles.input}
            value={friendName}
            onChangeText={setFriendName}
            placeholder="e.g., John"
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Secret Code</Text>
          <TextInput
            style={styles.input}
            value={manualSecret}
            onChangeText={setManualSecret}
            placeholder="Enter the secret"
            placeholderTextColor="#666"
            autoCapitalize="characters"
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleManualSubmit}>
          <Text style={styles.submitButtonText}>Link Friend</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setManualEntry(false)}
        >
          <Text style={styles.switchButtonText}>📷 Scan QR Instead</Text>
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
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>📷 Scan Friend's QR</Text>
        <Text style={styles.instructionText}>
          Point your camera at your friend's QR code to link with them
        </Text>
      </View>

      <TouchableOpacity
        style={styles.manualButton}
        onPress={() => setManualEntry(true)}
      >
        <Text style={styles.manualButtonText}>📝 Enter Code Manually</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    paddingTop: 60,
  },
  cameraContainer: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#e94560',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  instructions: {
    padding: 20,
    alignItems: 'center',
  },
  instructionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  instructionText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  permissionText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 30,
  },
  permissionButton: {
    backgroundColor: '#e94560',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 30,
    marginHorizontal: 20,
    marginBottom: 15,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  manualButton: {
    backgroundColor: '#16213e',
    borderRadius: 10,
    paddingVertical: 15,
    marginHorizontal: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  manualButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backButton: {
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    color: '#e94560',
    fontSize: 16,
  },
  inputSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
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
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  submitButton: {
    backgroundColor: '#e94560',
    borderRadius: 10,
    paddingVertical: 15,
    marginHorizontal: 20,
    marginBottom: 15,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  switchButton: {
    backgroundColor: '#16213e',
    borderRadius: 10,
    paddingVertical: 15,
    marginHorizontal: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  switchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

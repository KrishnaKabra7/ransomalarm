import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAlarm } from '../context/AlarmContext';
import { RootStackParamList, Alarm } from '../types';
import { getLinkedSecrets } from '../services/storage';

type CreateAlarmNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateAlarm'>;

interface LinkedFriend {
  secret: string;
  friendName: string;
  addedAt: number;
}

export default function CreateAlarmScreen() {
  const navigation = useNavigation<CreateAlarmNavigationProp>();
  const { addAlarm } = useAlarm();
  
  const [hours, setHours] = useState(7);
  const [minutes, setMinutes] = useState(0);
  const [linkedFriends, setLinkedFriends] = useState<LinkedFriend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<LinkedFriend | null>(null);

  useEffect(() => {
    loadLinkedFriends();
  }, []);

  const loadLinkedFriends = async () => {
    const secrets = await getLinkedSecrets();
    setLinkedFriends(secrets);
  };

  const formatTime = (h: number, m: number): string => {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const incrementHours = () => setHours((h) => (h + 1) % 24);
  const decrementHours = () => setHours((h) => (h - 1 + 24) % 24);
  const incrementMinutes = () => setMinutes((m) => (m + 1) % 60);
  const decrementMinutes = () => setMinutes((m) => (m - 1 + 60) % 60);

  const handleCreateAlarm = async () => {
    if (!selectedFriend) {
      Alert.alert(
        'No Friend Selected',
        'You must link this alarm to a friend. Scan a friend\'s QR code first, then select them here.',
        [{ text: 'OK' }]
      );
      return;
    }

    const alarm: Alarm = {
      id: Date.now().toString(),
      time: formatTime(hours, minutes),
      enabled: true,
      linkedSecret: selectedFriend.secret,
      linkedFriendName: selectedFriend.friendName,
      createdAt: Date.now(),
    };

    await addAlarm(alarm);
    Alert.alert('Success', `Alarm set for ${alarm.time}`, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Create Alarm</Text>

      <View style={styles.timePicker}>
        <View style={styles.timeColumn}>
          <TouchableOpacity onPress={incrementHours} style={styles.arrowButton}>
            <Text style={styles.arrowText}>▲</Text>
          </TouchableOpacity>
          <Text style={styles.timeText}>{hours.toString().padStart(2, '0')}</Text>
          <TouchableOpacity onPress={decrementHours} style={styles.arrowButton}>
            <Text style={styles.arrowText}>▼</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.timeSeparator}>:</Text>

        <View style={styles.timeColumn}>
          <TouchableOpacity onPress={incrementMinutes} style={styles.arrowButton}>
            <Text style={styles.arrowText}>▲</Text>
          </TouchableOpacity>
          <Text style={styles.timeText}>{minutes.toString().padStart(2, '0')}</Text>
          <TouchableOpacity onPress={decrementMinutes} style={styles.arrowButton}>
            <Text style={styles.arrowText}>▼</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.friendSection}>
        <Text style={styles.sectionTitle}>🔗 Link to Friend</Text>
        <Text style={styles.sectionSubtitle}>
          Select a friend whose code you'll need to dismiss this alarm
        </Text>

        {linkedFriends.length === 0 ? (
          <View style={styles.noFriends}>
            <Text style={styles.noFriendsText}>No linked friends yet</Text>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => navigation.navigate('ScanQR')}
            >
              <Text style={styles.scanButtonText}>📷 Scan Friend's QR</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.friendList}>
            {linkedFriends.map((friend) => (
              <TouchableOpacity
                key={friend.secret}
                style={[
                  styles.friendCard,
                  selectedFriend?.secret === friend.secret && styles.friendCardSelected,
                ]}
                onPress={() => setSelectedFriend(friend)}
              >
                <Text style={styles.friendName}>{friend.friendName}</Text>
                {selectedFriend?.secret === friend.secret && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.createButton} onPress={handleCreateAlarm}>
        <Text style={styles.createButtonText}>Create Alarm</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
  },
  timePicker: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
  },
  timeColumn: {
    alignItems: 'center',
  },
  arrowButton: {
    padding: 10,
  },
  arrowText: {
    color: '#e94560',
    fontSize: 24,
  },
  timeText: {
    color: '#fff',
    fontSize: 60,
    fontWeight: 'bold',
    width: 90,
    textAlign: 'center',
  },
  timeSeparator: {
    color: '#fff',
    fontSize: 60,
    fontWeight: 'bold',
    marginHorizontal: 10,
  },
  friendSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  sectionSubtitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 15,
  },
  noFriends: {
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  noFriendsText: {
    color: '#888',
    fontSize: 16,
    marginBottom: 15,
  },
  scanButton: {
    backgroundColor: '#0f3460',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  scanButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  friendList: {
    gap: 10,
  },
  friendCard: {
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 10,
  },
  friendCardSelected: {
    borderColor: '#e94560',
  },
  friendName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkmark: {
    color: '#e94560',
    fontSize: 20,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#e94560',
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    marginBottom: 15,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#888',
    fontSize: 16,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useAlarm } from '../context/AlarmContext';
import { RootStackParamList, Alarm } from '../types';

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProp>();
  const { user, signOut } = useAuth();
  const { alarms, alarmState, updateAlarm, deleteAlarm, triggerAlarm, refreshAlarms } = useAlarm();

  // Check if alarm should be shown (anti-cheat)
  useEffect(() => {
    if (alarmState.isAlarmActive && alarmState.alarmId) {
      navigation.navigate('AlarmRinging', { alarmId: alarmState.alarmId });
    }
  }, [alarmState, navigation]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleToggleAlarm = async (alarm: Alarm) => {
    await updateAlarm(alarm.id, { enabled: !alarm.enabled });
  };

  const handleDeleteAlarm = (alarm: Alarm) => {
    Alert.alert(
      'Delete Alarm',
      `Are you sure you want to delete the alarm at ${alarm.time}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteAlarm(alarm.id);
          },
        },
      ]
    );
  };

  const handleTestAlarm = async (alarm: Alarm) => {
    if (!alarm.linkedSecret) {
      Alert.alert(
        'No Link',
        'This alarm is not linked to a friend. Link a friend first!',
        [{ text: 'OK' }]
      );
      return;
    }
    await triggerAlarm(alarm.id);
    navigation.navigate('AlarmRinging', { alarmId: alarm.id });
  };

  const renderAlarm = ({ item }: { item: Alarm }) => (
    <TouchableOpacity
      style={styles.alarmCard}
      onLongPress={() => handleDeleteAlarm(item)}
    >
      <View style={styles.alarmInfo}>
        <Text style={styles.alarmTime}>{item.time}</Text>
        {item.linkedFriendName ? (
          <Text style={styles.linkedFriend}>🔗 {item.linkedFriendName}</Text>
        ) : (
          <Text style={styles.noLink}>⚠️ Not linked to friend</Text>
        )}
      </View>
      <View style={styles.alarmActions}>
        <TouchableOpacity
          style={styles.testButton}
          onPress={() => handleTestAlarm(item)}
        >
          <Text style={styles.testButtonText}>Test</Text>
        </TouchableOpacity>
        <Switch
          value={item.enabled}
          onValueChange={() => handleToggleAlarm(item)}
          trackColor={{ false: '#333', true: '#e94560' }}
          thumbColor="#fff"
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔔 Social Alarm</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.welcome}>Welcome, {user?.email}</Text>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('GenerateQR')}
        >
          <Text style={styles.actionButtonText}>📤 Share QR</Text>
          <Text style={styles.actionButtonSubtext}>Let friend scan your code</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('ScanQR')}
        >
          <Text style={styles.actionButtonText}>📷 Scan QR</Text>
          <Text style={styles.actionButtonSubtext}>Scan friend's code</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.alarmSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Alarms</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateAlarm')}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {alarms.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No alarms yet</Text>
            <Text style={styles.emptySubtext}>
              Create an alarm and link it to a friend
            </Text>
          </View>
        ) : (
          <FlatList
            data={alarms}
            renderItem={renderAlarm}
            keyExtractor={(item) => item.id}
            style={styles.alarmList}
          />
        )}
      </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  signOutText: {
    color: '#e94560',
    fontSize: 14,
  },
  welcome: {
    color: '#888',
    fontSize: 14,
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionButtonSubtext: {
    color: '#888',
    fontSize: 12,
    marginTop: 5,
  },
  alarmSection: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#e94560',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  alarmList: {
    flex: 1,
  },
  alarmCard: {
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  alarmInfo: {
    flex: 1,
  },
  alarmTime: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  linkedFriend: {
    color: '#4ade80',
    fontSize: 12,
    marginTop: 4,
  },
  noLink: {
    color: '#f59e0b',
    fontSize: 12,
    marginTop: 4,
  },
  alarmActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#0f3460',
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 18,
    marginBottom: 10,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
});

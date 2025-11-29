import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alarm, AlarmState } from '../types';

const ALARMS_KEY = 'social_alarm_alarms';
const ALARM_STATE_KEY = 'social_alarm_active_state';
const SECRETS_KEY = 'social_alarm_linked_secrets';

/**
 * Save alarms to storage
 */
export async function saveAlarms(alarms: Alarm[]): Promise<void> {
  try {
    await AsyncStorage.setItem(ALARMS_KEY, JSON.stringify(alarms));
  } catch (error) {
    console.error('Error saving alarms:', error);
    throw error;
  }
}

/**
 * Load alarms from storage
 */
export async function loadAlarms(): Promise<Alarm[]> {
  try {
    const data = await AsyncStorage.getItem(ALARMS_KEY);
    if (data) {
      return JSON.parse(data) as Alarm[];
    }
    return [];
  } catch (error) {
    console.error('Error loading alarms:', error);
    return [];
  }
}

/**
 * Add a new alarm
 */
export async function addAlarm(alarm: Alarm): Promise<void> {
  const alarms = await loadAlarms();
  alarms.push(alarm);
  await saveAlarms(alarms);
}

/**
 * Update an existing alarm
 */
export async function updateAlarm(alarmId: string, updates: Partial<Alarm>): Promise<void> {
  const alarms = await loadAlarms();
  const index = alarms.findIndex((a) => a.id === alarmId);
  if (index >= 0) {
    alarms[index] = { ...alarms[index], ...updates };
    await saveAlarms(alarms);
  }
}

/**
 * Delete an alarm
 */
export async function deleteAlarm(alarmId: string): Promise<void> {
  const alarms = await loadAlarms();
  const filtered = alarms.filter((a) => a.id !== alarmId);
  await saveAlarms(filtered);
}

/**
 * Get alarm by ID
 */
export async function getAlarm(alarmId: string): Promise<Alarm | null> {
  const alarms = await loadAlarms();
  return alarms.find((a) => a.id === alarmId) || null;
}

// Anti-cheat: Persist alarm active state

/**
 * Set alarm active state (Anti-cheat feature)
 */
export async function setAlarmActive(state: AlarmState): Promise<void> {
  try {
    await AsyncStorage.setItem(ALARM_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error setting alarm state:', error);
    throw error;
  }
}

/**
 * Get alarm active state (Anti-cheat feature)
 */
export async function getAlarmState(): Promise<AlarmState> {
  try {
    const data = await AsyncStorage.getItem(ALARM_STATE_KEY);
    if (data) {
      return JSON.parse(data) as AlarmState;
    }
    return { isAlarmActive: false };
  } catch (error) {
    console.error('Error getting alarm state:', error);
    return { isAlarmActive: false };
  }
}

/**
 * Clear alarm active state
 */
export async function clearAlarmState(): Promise<void> {
  try {
    await AsyncStorage.setItem(
      ALARM_STATE_KEY,
      JSON.stringify({ isAlarmActive: false })
    );
  } catch (error) {
    console.error('Error clearing alarm state:', error);
    throw error;
  }
}

// Linked secrets management (for friend codes)

interface LinkedSecret {
  secret: string;
  friendName: string;
  addedAt: number;
}

/**
 * Save a linked secret (scanned from friend's QR)
 */
export async function saveLinkedSecret(
  secret: string,
  friendName: string
): Promise<void> {
  try {
    const secrets = await getLinkedSecrets();
    const existing = secrets.findIndex((s) => s.secret === secret);
    if (existing >= 0) {
      secrets[existing].friendName = friendName;
    } else {
      secrets.push({ secret, friendName, addedAt: Date.now() });
    }
    await AsyncStorage.setItem(SECRETS_KEY, JSON.stringify(secrets));
  } catch (error) {
    console.error('Error saving linked secret:', error);
    throw error;
  }
}

/**
 * Get all linked secrets
 */
export async function getLinkedSecrets(): Promise<LinkedSecret[]> {
  try {
    const data = await AsyncStorage.getItem(SECRETS_KEY);
    if (data) {
      return JSON.parse(data) as LinkedSecret[];
    }
    return [];
  } catch (error) {
    console.error('Error getting linked secrets:', error);
    return [];
  }
}

/**
 * Delete a linked secret
 */
export async function deleteLinkedSecret(secret: string): Promise<void> {
  try {
    const secrets = await getLinkedSecrets();
    const filtered = secrets.filter((s) => s.secret !== secret);
    await AsyncStorage.setItem(SECRETS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting linked secret:', error);
    throw error;
  }
}

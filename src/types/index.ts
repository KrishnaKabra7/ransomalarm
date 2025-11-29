// User types
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

// Alarm types
export interface Alarm {
  id: string;
  time: string; // HH:mm format
  enabled: boolean;
  linkedSecret?: string; // Secret for TOTP verification
  linkedFriendName?: string;
  createdAt: number;
}

// TOTP types
export interface TOTPSecret {
  secret: string;
  label: string;
  issuer: string;
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: number;
  period: number;
}

// Alarm state for anti-cheat
export interface AlarmState {
  isAlarmActive: boolean;
  alarmId?: string;
  triggeredAt?: number;
}

// Navigation types
export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  CreateAlarm: undefined;
  AlarmRinging: { alarmId: string };
  GenerateQR: undefined;
  ScanQR: undefined;
  FriendCode: { secret: string; friendName: string };
};

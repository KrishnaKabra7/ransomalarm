import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Alarm, AlarmState } from '../types';
import {
  loadAlarms,
  saveAlarms,
  addAlarm as addAlarmStorage,
  updateAlarm as updateAlarmStorage,
  deleteAlarm as deleteAlarmStorage,
  getAlarmState,
  setAlarmActive,
  clearAlarmState,
} from '../services/storage';

interface AlarmContextType {
  alarms: Alarm[];
  alarmState: AlarmState;
  loading: boolean;
  addAlarm: (alarm: Alarm) => Promise<void>;
  updateAlarm: (alarmId: string, updates: Partial<Alarm>) => Promise<void>;
  deleteAlarm: (alarmId: string) => Promise<void>;
  triggerAlarm: (alarmId: string) => Promise<void>;
  dismissAlarm: () => Promise<void>;
  refreshAlarms: () => Promise<void>;
}

const AlarmContext = createContext<AlarmContextType | undefined>(undefined);

interface AlarmProviderProps {
  children: ReactNode;
}

export function AlarmProvider({ children }: AlarmProviderProps) {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [alarmState, setAlarmState] = useState<AlarmState>({ isAlarmActive: false });
  const [loading, setLoading] = useState(true);

  const refreshAlarms = useCallback(async () => {
    try {
      const [loadedAlarms, state] = await Promise.all([
        loadAlarms(),
        getAlarmState(),
      ]);
      setAlarms(loadedAlarms);
      setAlarmState(state);
    } catch (error) {
      console.error('Error refreshing alarms:', error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await refreshAlarms();
      setLoading(false);
    };
    init();
  }, [refreshAlarms]);

  const addAlarm = async (alarm: Alarm): Promise<void> => {
    await addAlarmStorage(alarm);
    setAlarms((prev) => [...prev, alarm]);
  };

  const updateAlarm = async (alarmId: string, updates: Partial<Alarm>): Promise<void> => {
    await updateAlarmStorage(alarmId, updates);
    setAlarms((prev) =>
      prev.map((a) => (a.id === alarmId ? { ...a, ...updates } : a))
    );
  };

  const deleteAlarm = async (alarmId: string): Promise<void> => {
    await deleteAlarmStorage(alarmId);
    setAlarms((prev) => prev.filter((a) => a.id !== alarmId));
  };

  const triggerAlarm = async (alarmId: string): Promise<void> => {
    const state: AlarmState = {
      isAlarmActive: true,
      alarmId,
      triggeredAt: Date.now(),
    };
    await setAlarmActive(state);
    setAlarmState(state);
  };

  const dismissAlarm = async (): Promise<void> => {
    await clearAlarmState();
    setAlarmState({ isAlarmActive: false });
  };

  return (
    <AlarmContext.Provider
      value={{
        alarms,
        alarmState,
        loading,
        addAlarm,
        updateAlarm,
        deleteAlarm,
        triggerAlarm,
        dismissAlarm,
        refreshAlarms,
      }}
    >
      {children}
    </AlarmContext.Provider>
  );
}

export function useAlarm(): AlarmContextType {
  const context = useContext(AlarmContext);
  if (context === undefined) {
    throw new Error('useAlarm must be used within an AlarmProvider');
  }
  return context;
}

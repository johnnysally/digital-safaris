import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './constants';

const isWeb = Platform.OS === 'web';

const get = async (key: string): Promise<string | null> => {
  try {
    if (isWeb) return await AsyncStorage.getItem(key);
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
};

const set = async (key: string, value: string): Promise<void> => {
  try {
    if (isWeb) await AsyncStorage.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  } catch {}
};

const remove = async (key: string): Promise<void> => {
  try {
    if (isWeb) await AsyncStorage.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
  } catch {}
};

const storage = {
  getAccessToken: () => get(STORAGE_KEYS.ACCESS_TOKEN),
  setAccessToken: (t: string) => set(STORAGE_KEYS.ACCESS_TOKEN, t),

  getRefreshToken: () => get(STORAGE_KEYS.REFRESH_TOKEN),
  setRefreshToken: (t: string) => set(STORAGE_KEYS.REFRESH_TOKEN, t),

  clearSession: async () => {
    await remove(STORAGE_KEYS.ACCESS_TOKEN);
    await remove(STORAGE_KEYS.REFRESH_TOKEN);
  },
};

export default storage;
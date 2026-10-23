import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_API_URL = '@miniledger_api_url';

// Default host configurations:
// - Android Emulator: 10.0.2.2 points to host computer's localhost
// - Physical Phone: Use local machine Wi-Fi IP (e.g. 10.46.182.243)
// - iOS Simulator / Web: localhost
export const DEFAULT_PHYSICAL_IP = '10.46.182.243';
export const DEFAULT_PORT = '5000';

export const getDefaultApiUrl = (): string => {
  if (Platform.OS === 'android') {
    // Default to Android Emulator loopback
    return `http://10.0.2.2:${DEFAULT_PORT}/api`;
  }
  return `http://localhost:${DEFAULT_PORT}/api`;
};

let cachedApiUrl: string | null = null;

export const getApiBaseUrl = async (): Promise<string> => {
  if (cachedApiUrl) return cachedApiUrl;
  try {
    const custom = await AsyncStorage.getItem(STORAGE_KEY_API_URL);
    if (custom && custom.trim().length > 0) {
      cachedApiUrl = custom.trim();
      return cachedApiUrl;
    }
  } catch (err) {
    console.warn('Could not read custom API URL from storage:', err);
  }
  cachedApiUrl = getDefaultApiUrl();
  return cachedApiUrl;
};

export const setApiBaseUrl = async (url: string): Promise<void> => {
  const cleanUrl = url.trim().replace(/\/+$/, '');
  cachedApiUrl = cleanUrl;
  await AsyncStorage.setItem(STORAGE_KEY_API_URL, cleanUrl);
};

export const resetApiBaseUrl = async (): Promise<string> => {
  cachedApiUrl = getDefaultApiUrl();
  await AsyncStorage.removeItem(STORAGE_KEY_API_URL);
  return cachedApiUrl;
};

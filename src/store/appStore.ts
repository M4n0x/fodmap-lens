import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/src/i18n';
import type { FodmapAnalysis } from '@/src/types/fodmap';

const LANGUAGE_KEY = 'app_language';

interface AppState {
  language: string;
  hasSeenOnboarding: boolean;
  ocrResults: Record<string, FodmapAnalysis>;
  setLanguage: (lang: string) => void;
  setHasSeenOnboarding: (seen: boolean) => void;
  setOcrResult: (barcode: string, analysis: FodmapAnalysis) => void;
  restoreLanguage: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  language: i18n.language,
  hasSeenOnboarding: false,
  ocrResults: {},
  setLanguage: (lang: string) => {
    i18n.changeLanguage(lang);
    AsyncStorage.setItem(LANGUAGE_KEY, lang).catch(() => {});
    set({ language: lang });
  },
  setHasSeenOnboarding: (seen: boolean) => set({ hasSeenOnboarding: seen }),
  setOcrResult: (barcode: string, analysis: FodmapAnalysis) =>
    set((state) => ({ ocrResults: { ...state.ocrResults, [barcode]: analysis } })),
  restoreLanguage: async () => {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY).catch(() => null);
    if (saved) {
      i18n.changeLanguage(saved);
      set({ language: saved });
    }
  },
}));

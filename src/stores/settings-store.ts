// src/stores/settings-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage, PersistListener } from 'zustand/middleware';
import { useState, useEffect } from 'react';

// --- Type Definitions ---

export interface GeneralSettings {
  appName: string;
  defaultCurrency: 'INR' | 'USD' | 'EUR';
  timezone: string; // e.g., 'Asia/Kolkata', 'America/New_York'
}

export interface NotificationSettings {
  enableEmail: boolean;
  enableSMS: boolean;
  adminEmail: string; // Email to receive admin notifications
  twilioSid?: string; // Optional API keys
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
  sendgridApiKey?: string;
}

export interface PricingSettings {
  baseRateKg: number;
  baseRateM3: number;
  distanceMultiplier: number;
  multiItemSurcharge: number;
  perishableSurchargePercent: number;
  hazardousSurchargePercent: number;
  fragileSurchargePercent: number;
  oversizedSurchargePercent: number;
}

// Simplified Role/Permission settings for now
export interface RoleSettings {
  adminCanDeleteBookings: boolean;
  customerCanCancelPending: boolean;
}

export interface AppSettings {
  general: GeneralSettings;
  notifications: NotificationSettings;
  pricing: PricingSettings;
  roles: RoleSettings;
}

// --- Store State and Actions ---

interface SettingsState extends AppSettings {
  updateGeneralSettings: (settings: GeneralSettings) => void;
  updateNotificationSettings: (settings: NotificationSettings) => void;
  updatePricingSettings: (settings: PricingSettings) => void;
  updateRoleSettings: (settings: RoleSettings) => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

// --- Initial State ---

const initialSettings: AppSettings = {
  general: {
    appName: 'PICK PACK SERVICES',
    defaultCurrency: 'INR',
    timezone: 'Asia/Kolkata',
  },
  notifications: {
    enableEmail: true,
    enableSMS: false,
    adminEmail: 'admin@pickpack.example.com',
    // Initialize API keys as empty strings or undefined
    twilioSid: '',
    twilioAuthToken: '',
    twilioPhoneNumber: '',
    sendgridApiKey: '',
  },
  // Match initial pricing logic from lib/pricing.ts
  pricing: {
    baseRateKg: 50,
    baseRateM3: 2000,
    distanceMultiplier: 1.1,
    multiItemSurcharge: 50,
    perishableSurchargePercent: 20, // Store as percentage (e.g., 20 for 20%)
    hazardousSurchargePercent: 50,
    fragileSurchargePercent: 15,
    oversizedSurchargePercent: 30,
  },
  roles: {
    adminCanDeleteBookings: true,
    customerCanCancelPending: true,
  },
};

// --- Store Definition ---

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...initialSettings,
      _hasHydrated: false,

      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },

      updateGeneralSettings: (settings) => {
        set({ general: settings });
        console.log("General settings updated in store:", settings);
      },
      updateNotificationSettings: (settings) => {
        set({ notifications: settings });
         console.log("Notification settings updated in store:", settings);
      },
      updatePricingSettings: (settings) => {
        set({ pricing: settings });
         console.log("Pricing settings updated in store:", settings);
      },
      updateRoleSettings: (settings) => {
        set({ roles: settings });
        console.log("Role settings updated in store:", settings);
      },
    }),
    {
      name: 'app-settings-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state, error) => {
        console.log("Settings store: Attempting rehydration...");
        if (error) {
          console.error("Settings store: Failed to rehydrate:", error);
        } else if (state) {
          console.log("Settings store: Rehydration successful.");
        } else {
          console.log("Settings store: No stored state found, using initial state.");
        }
        state?.setHasHydrated(true);
      },
       partialize: (state) => ({ // Persist only the settings objects
         general: state.general,
         notifications: state.notifications,
         pricing: state.pricing,
         roles: state.roles,
       }),
        version: 1, // Increment if schema changes significantly
    }
  )
);

// Hook to ensure hydration is complete before using the store state
export const useIsSettingsStoreHydrated = () => {
  const isHydrated = useSettingsStore((state) => state._hasHydrated);
  const [clientReady, setClientReady] = useState(false);

  useEffect(() => {
    if (isHydrated) {
        console.log("Settings store isHydrated flag is true, setting clientReady.");
       setClientReady(true);
    } else {
        console.log("Settings store isHydrated flag is false.");
    }
  }, [isHydrated]);

  return clientReady;
};

// Function to get current settings (useful outside React components if needed)
export const getAppSettings = (): AppSettings => {
    const state = useSettingsStore.getState();
    return {
        general: state.general,
        notifications: state.notifications,
        pricing: state.pricing,
        roles: state.roles,
    };
};

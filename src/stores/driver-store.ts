// src/stores/driver-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage, PersistListener } from 'zustand/middleware';
import type { Driver, DriverStatus } from '@/types/driver-types';
import { useState, useEffect } from 'react';

// Mock Driver Data (Initial state if localStorage is empty)
const initialMockDrivers: Driver[] = [
  {
    id: 'DRV001',
    name: 'John Doe',
    contactPhone: '555-123-4567',
    contactEmail: 'john.doe@example.com',
    licenseNumber: 'DL12345678',
    licenseExpiry: new Date(2025, 11, 31), // Dec 31, 2025
    status: 'Active',
    assignedVehicleId: 'TRK001',
  },
  {
    id: 'DRV002',
    name: 'Jane Smith',
    contactPhone: '555-987-6543',
    licenseNumber: 'DL87654321',
    licenseExpiry: new Date(2026, 5, 15), // June 15, 2026
    status: 'Active',
    assignedVehicleId: 'VAN002',
  },
  {
    id: 'DRV003',
    name: 'Mike Lee',
    contactPhone: '555-111-2222',
    contactEmail: 'mike.lee@sample.net',
    licenseNumber: 'DL55555555',
    licenseExpiry: new Date(2024, 9, 1), // Oct 1, 2024 (Example near expiry)
    status: 'Active',
    assignedVehicleId: 'TRK003', // Assigned even if vehicle is in maintenance
  },
   {
    id: 'DRV004',
    name: 'Sarah Chen',
    contactPhone: '555-333-4444',
    licenseNumber: 'DL99887766',
    licenseExpiry: new Date(2027, 2, 20), // Mar 20, 2027
    status: 'On Leave',
    assignedVehicleId: null,
     notes: 'Maternity leave until Aug 2024',
  },
];


interface DriverState {
  drivers: Driver[];
  addDriver: (newDriverData: Omit<Driver, 'id'>) => string;
  updateDriver: (driverId: string, updatedData: Partial<Omit<Driver, 'id'>>) => void;
  deleteDriver: (driverId: string) => void;
  getDriverById: (driverId: string) => Driver | undefined;
  getDrivers: () => Driver[];
  _hasHydrated: boolean;
  _datesProcessed: boolean;
  setHasHydrated: (hydrated: boolean) => void;
  setDatesProcessed: (processed: boolean) => void;
}

// Helper function to safely parse dates
const parseDriverDates = (drivers: any[]): Driver[] => {
     if (!Array.isArray(drivers)) {
        console.warn("Invalid drivers data received for parsing, returning initial mock data.");
        return initialMockDrivers; // Use initial mock data as fallback
    }
    try {
        return drivers.map(driver => {
             if (!driver || typeof driver !== 'object') {
                 console.warn("Found invalid driver item during parsing:", driver);
                 return null; // Skip invalid items
             }
            return {
                ...driver,
                licenseExpiry: driver.licenseExpiry ? new Date(driver.licenseExpiry) : new Date(), // Handle potential null/undefined
            };
        }).filter((driver): driver is Driver => driver !== null);
    } catch (error) {
         console.error("Error parsing driver dates:", error);
         return initialMockDrivers; // Return initial mock data on error
    }
};


export const useDriverStore = create<DriverState>()(
  persist(
    (set, get) => ({
      drivers: initialMockDrivers,
      _hasHydrated: false,
      _datesProcessed: false,

      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
      setDatesProcessed: (processed) => set({ _datesProcessed: processed }),

      addDriver: (newDriverData) => {
        const newId = `DRV${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        const newDriver: Driver = {
          ...newDriverData,
          id: newId,
           // Ensure licenseExpiry is a Date object if provided, else use a default
          licenseExpiry: newDriverData.licenseExpiry instanceof Date ? newDriverData.licenseExpiry : new Date(),
        };
        set((state) => ({
          drivers: [...state.drivers, newDriver],
        }));
        console.log("Driver added to store:", newDriver);
        return newId;
      },

      updateDriver: (driverId, updatedData) => {
        set((state) => ({
          drivers: state.drivers.map((driver) =>
            driver.id === driverId
              ? {
                  ...driver,
                  ...updatedData,
                  // Ensure licenseExpiry remains a Date object if updated
                  licenseExpiry: updatedData.licenseExpiry instanceof Date ? updatedData.licenseExpiry : driver.licenseExpiry,
                }
              : driver
          ),
        }));
        console.log(`Driver ${driverId} updated in store.`);
      },

      deleteDriver: (driverId) => {
        // Optional: Check if driver is assigned to a vehicle and handle accordingly
        // (e.g., unassign from vehicle first, or prevent deletion if assigned)
        set((state) => ({
          drivers: state.drivers.filter((driver) => driver.id !== driverId),
        }));
        console.log(`Driver ${driverId} deleted from store.`);
      },

      getDriverById: (driverId) => get().drivers.find(d => d.id === driverId),

      getDrivers: () => get().drivers,
    }),
    {
      name: 'driver-storage',
      storage: createJSONStorage(() => localStorage),

      // Custom hydration logic
      onRehydrateStorage: (): PersistListener<DriverState> => (state, error) => {
        if (error) {
           console.error("Failed to hydrate driver store:", error);
           state?.setHasHydrated(true);
           state?.setDatesProcessed(false);
        } else if (state) {
           // Mark as hydrated, date processing will be handled by the hook
           console.log("Driver store hydration initiated. Marking as hydrated.");
           state.setHasHydrated(true);
           state.setDatesProcessed(false); // Ensure dates are marked as not processed initially after hydration
        } else {
           console.log("No stored driver state found, using initial state and marking as hydrated.");
            // Initial state already has Date objects
            set({ _hasHydrated: true, _datesProcessed: true });
        }
      },

      partialize: (state) => ({
        drivers: state.drivers, // Only persist the drivers array
      }),

       skipHydration: false,
    }
  )
);

// Hook to check hydration status and process dates
export const useIsDriverStoreHydrated = () => {
    const hasHydrated = useDriverStore((state) => state._hasHydrated);
    const datesProcessed = useDriverStore((state) => state._datesProcessed);
    const setDatesProcessed = useDriverStore((state) => state.setDatesProcessed);
    const drivers = useDriverStore((state) => state.drivers);

    useEffect(() => {
        if (hasHydrated && !datesProcessed) {
             console.log("Driver store hydration complete, now processing dates...");
             const processedDrivers = parseDriverDates(drivers);
             // Directly update the state after processing
             useDriverStore.setState({ drivers: processedDrivers });
             setDatesProcessed(true);
             console.log("Driver dates processed successfully.");
        }
    }, [hasHydrated, datesProcessed, setDatesProcessed, drivers]);

    return hasHydrated && datesProcessed;
};

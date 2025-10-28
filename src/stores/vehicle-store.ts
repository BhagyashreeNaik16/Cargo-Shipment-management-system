// src/stores/vehicle-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage, PersistListener } from 'zustand/middleware';
import type { Vehicle, VehicleStatus, VehicleType } from '@/types/vehicle-types';
import { useState, useEffect } from 'react';

// Mock Data for Vehicles (Initial state if localStorage is empty)
const initialMockVehicles: Vehicle[] = [
  {
    id: 'TRK001', type: 'Truck - Large', licensePlate: 'XYZ 1234', capacityWeightKg: 20000, capacityVolumeM3: 80, status: 'Available', assignedDriver: 'John Doe', currentLocation: 'Main Hub', currentLoadWeightKg: 0, currentLoadVolumeM3: 0, assignedShipmentIds: [], maintenanceDate: new Date(2024, 5, 15)
  },
  {
    id: 'VAN002', type: 'Van - Cargo', licensePlate: 'ABC 567', capacityWeightKg: 3000, capacityVolumeM3: 15, status: 'In Use', assignedDriver: 'Jane Smith', currentLocation: 'Route 66', currentLoadWeightKg: 1500, currentLoadVolumeM3: 8, assignedShipmentIds: ['CT12345', 'CT98765'], notes: 'Handle with care items onboard'
  },
  {
    id: 'SHP001', type: 'Ship - Container', capacityWeightKg: 5000000, status: 'Available', currentLocation: 'Port Newark', currentLoadWeightKg: 0, currentLoadVolumeM3: 0, assignedShipmentIds: []
  },
  {
    id: 'CON001', type: 'Container - 40ft', capacityWeightKg: 26000, capacityVolumeM3: 67, status: 'In Use', currentLocation: 'On SHP001', currentLoadWeightKg: 18000, currentLoadVolumeM3: 50, assignedShipmentIds: ['CT55555']
  },
  {
    id: 'TRK003', type: 'Truck - Medium', licensePlate: 'TRK 789', capacityWeightKg: 10000, capacityVolumeM3: 40, status: 'Maintenance', assignedDriver: 'Mike Lee', currentLocation: 'Garage', currentLoadWeightKg: 0, currentLoadVolumeM3: 0, assignedShipmentIds: [], maintenanceDate: new Date(2024, 6, 20)
  },
];

interface VehicleState {
  vehicles: Vehicle[];
  addVehicle: (newVehicleData: Omit<Vehicle, 'currentLoadWeightKg' | 'currentLoadVolumeM3' | 'assignedShipmentIds'>) => void;
  updateVehicle: (vehicleId: string, updatedData: Partial<Omit<Vehicle, 'id' | 'currentLoadWeightKg' | 'currentLoadVolumeM3' | 'assignedShipmentIds'>>) => void;
  deleteVehicle: (vehicleId: string) => void;
  assignShipmentToVehicle: (vehicleId: string, shipmentId: string, weight: number, volume?: number) => void;
  unassignShipmentFromVehicle: (vehicleId: string, shipmentId: string, weight: number, volume?: number) => void;
  updateVehicleStatus: (vehicleId: string, newStatus: VehicleStatus) => void;
  updateVehicleAssignment: (vehicleId: string, driverName: string | null) => void;
  getVehicles: () => Vehicle[];
  getVehicleById: (vehicleId: string) => Vehicle | undefined;
  _hasHydrated: boolean;
  _datesProcessed: boolean;
  setHasHydrated: (hydrated: boolean) => void;
  setDatesProcessed: (processed: boolean) => void;
}


// Helper function to safely parse dates
const parseVehicleDates = (vehicles: any[]): Vehicle[] => {
    if (!Array.isArray(vehicles)) {
        console.warn("Invalid vehicles data received for parsing, returning initial mock data.");
        return initialMockVehicles;
    }
    try {
        return vehicles.map(vehicle => {
             if (!vehicle || typeof vehicle !== 'object') {
                 console.warn("Found invalid vehicle item during parsing:", vehicle);
                 return null; // Skip invalid items
             }
             // Ensure load fields exist and are numbers
             const currentLoadWeightKg = typeof vehicle.currentLoadWeightKg === 'number' ? vehicle.currentLoadWeightKg : 0;
             const currentLoadVolumeM3 = typeof vehicle.currentLoadVolumeM3 === 'number' ? vehicle.currentLoadVolumeM3 : 0;
             const assignedShipmentIds = Array.isArray(vehicle.assignedShipmentIds) ? vehicle.assignedShipmentIds : [];

            return {
                ...vehicle,
                maintenanceDate: vehicle.maintenanceDate ? new Date(vehicle.maintenanceDate) : undefined,
                 currentLoadWeightKg,
                 currentLoadVolumeM3,
                 assignedShipmentIds,
            };
        }).filter((vehicle): vehicle is Vehicle => vehicle !== null); // Filter out nulls
    } catch (error) {
        console.error("Error parsing vehicle dates:", error);
        return initialMockVehicles; // Return initial on error
    }
};


export const useVehicleStore = create<VehicleState>()(
  persist(
    (set, get) => ({
      vehicles: initialMockVehicles,
      _hasHydrated: false,
      _datesProcessed: false,

      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
      setDatesProcessed: (processed) => set({ _datesProcessed: processed }),

      addVehicle: (newVehicleData) => {
        // Check if ID already exists
        if (get().vehicles.some(v => v.id === newVehicleData.id)) {
          console.error(`Vehicle with ID ${newVehicleData.id} already exists.`);
          throw new Error(`Vehicle with ID ${newVehicleData.id} already exists.`); // Throw error to be caught by form handler
        }
        const newVehicle: Vehicle = {
          ...newVehicleData,
           maintenanceDate: newVehicleData.maintenanceDate instanceof Date ? newVehicleData.maintenanceDate : undefined,
           // Initialize load and assignment fields
          currentLoadWeightKg: 0,
          currentLoadVolumeM3: 0,
          assignedShipmentIds: [],
        };
        set((state) => ({
          vehicles: [...state.vehicles, newVehicle],
        }));
        console.log("Vehicle added to store:", newVehicle);
      },

      updateVehicle: (vehicleId, updatedData) => {
        set((state) => ({
          vehicles: state.vehicles.map((vehicle) =>
            vehicle.id === vehicleId
              ? {
                  ...vehicle,
                  ...updatedData,
                   maintenanceDate: updatedData.maintenanceDate instanceof Date ? updatedData.maintenanceDate : vehicle.maintenanceDate,
                }
              : vehicle
          ),
        }));
        console.log(`Vehicle ${vehicleId} updated in store.`);
      },

      deleteVehicle: (vehicleId) => {
        // Optional: Check for assigned shipments and handle (e.g., prevent deletion or unassign)
        set((state) => ({
          vehicles: state.vehicles.filter((vehicle) => vehicle.id !== vehicleId),
        }));
        console.log(`Vehicle ${vehicleId} deleted from store.`);
      },

      // Actions to update load and assignments (example implementation)
      assignShipmentToVehicle: (vehicleId, shipmentId, weight, volume = 0) => {
        set((state) => ({
            vehicles: state.vehicles.map((vehicle) => {
                if (vehicle.id === vehicleId) {
                    // Basic check: Avoid adding if already assigned
                    if (vehicle.assignedShipmentIds.includes(shipmentId)) {
                        return vehicle;
                    }
                    return {
                        ...vehicle,
                        currentLoadWeightKg: vehicle.currentLoadWeightKg + weight,
                        currentLoadVolumeM3: vehicle.currentLoadVolumeM3 + volume,
                        assignedShipmentIds: [...vehicle.assignedShipmentIds, shipmentId],
                        // Optionally update status if it becomes 'In Use'
                        status: 'In Use',
                    };
                }
                return vehicle;
            }),
        }));
      },

      unassignShipmentFromVehicle: (vehicleId, shipmentId, weight, volume = 0) => {
         set((state) => ({
            vehicles: state.vehicles.map((vehicle) => {
                if (vehicle.id === vehicleId && vehicle.assignedShipmentIds.includes(shipmentId)) {
                    const remainingShipments = vehicle.assignedShipmentIds.filter(id => id !== shipmentId);
                    return {
                        ...vehicle,
                        currentLoadWeightKg: Math.max(0, vehicle.currentLoadWeightKg - weight), // Prevent negative load
                        currentLoadVolumeM3: Math.max(0, vehicle.currentLoadVolumeM3 - volume),
                        assignedShipmentIds: remainingShipments,
                         // Optionally update status if it becomes 'Available'
                         status: remainingShipments.length === 0 ? 'Available' : vehicle.status,
                    };
                }
                return vehicle;
            }),
        }));
      },

      updateVehicleStatus: (vehicleId, newStatus) => {
         set((state) => ({
            vehicles: state.vehicles.map((vehicle) =>
                vehicle.id === vehicleId ? { ...vehicle, status: newStatus } : vehicle
            ),
        }));
      },

       updateVehicleAssignment: (vehicleId, driverName) => {
         set((state) => ({
            vehicles: state.vehicles.map((vehicle) =>
                vehicle.id === vehicleId ? { ...vehicle, assignedDriver: driverName ?? undefined } : vehicle
            ),
        }));
       },

      getVehicles: () => get().vehicles,
      getVehicleById: (vehicleId) => get().vehicles.find(v => v.id === vehicleId),

    }),
    {
      name: 'vehicle-storage',
      storage: createJSONStorage(() => localStorage),

      onRehydrateStorage: (): PersistListener<VehicleState> => (state, error) => {
        if (error) {
           console.error("Failed to hydrate vehicle store:", error);
           state?.setHasHydrated(true);
           state?.setDatesProcessed(false);
        } else if (state) {
           console.log("Vehicle store hydration initiated. Marking as hydrated.");
           state.setHasHydrated(true);
           state.setDatesProcessed(false); // Dates need processing
        } else {
           console.log("No stored vehicle state found, using initial state and marking as hydrated.");
           set({ _hasHydrated: true, _datesProcessed: true });
        }
      },

      partialize: (state) => ({
        vehicles: state.vehicles,
      }),

      skipHydration: false,
    }
  )
);


// Hook to check hydration status and process dates
export const useIsVehicleStoreHydrated = () => {
    const hasHydrated = useVehicleStore((state) => state._hasHydrated);
    const datesProcessed = useVehicleStore((state) => state._datesProcessed);
    const setDatesProcessed = useVehicleStore((state) => state.setDatesProcessed);
    const vehicles = useVehicleStore((state) => state.vehicles);

    useEffect(() => {
        if (hasHydrated && !datesProcessed) {
             console.log("Vehicle store hydration complete, now processing dates...");
             const processedVehicles = parseVehicleDates(vehicles);
             // Directly update the state after processing
             useVehicleStore.setState({ vehicles: processedVehicles });
             setDatesProcessed(true);
             console.log("Vehicle dates processed successfully.");
        }
    }, [hasHydrated, datesProcessed, setDatesProcessed, vehicles]);

    return hasHydrated && datesProcessed;
};

// src/types/vehicle-types.ts

export type VehicleStatus = 'Available' | 'In Use' | 'Maintenance';

// Ensure this type is exported and matches the options used in admin/reports/page.tsx
export type VehicleType = 
  | 'Truck - Large' 
  | 'Truck - Medium' 
  | 'Van - Cargo' 
  | 'Van - Refrigerated' 
  | 'Ship - Container' 
  | 'Ship - Bulk' 
  | 'Container - 20ft' 
  | 'Container - 40ft' 
  | 'Other';

export interface Vehicle {
  id: string; // Unique Vehicle ID (e.g., VIN or internal ID)
  type: VehicleType; // Use the defined VehicleType
  licensePlate?: string; // Optional, might not apply to ships/containers
  capacityWeightKg: number; // Maximum weight capacity in kilograms
  capacityVolumeM3?: number; // Maximum volume capacity in cubic meters (optional)
  status: VehicleStatus;
  assignedDriver?: string; // Name or ID of the assigned driver
  currentLocation?: string; // Optional: Current location (e.g., GPS or last known hub)
  maintenanceDate?: Date; // Last maintenance date
  notes?: string; // Optional notes
  // Added fields for load tracking
  currentLoadWeightKg: number; // Current weight of assigned shipments
  currentLoadVolumeM3: number; // Current volume of assigned shipments
  assignedShipmentIds: string[]; // List of Tracking IDs assigned to this vehicle
}

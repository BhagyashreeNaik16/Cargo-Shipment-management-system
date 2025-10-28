// src/types/driver-types.ts

export type DriverStatus = 'Active' | 'Inactive' | 'On Leave';

export interface Driver {
  id: string; // Unique Driver ID (could be employee ID or generated)
  name: string;
  contactPhone: string;
  contactEmail?: string; // Optional email
  licenseNumber: string; // Driver's license number
  licenseExpiry: Date; // License expiry date
  status: DriverStatus;
  assignedVehicleId?: string | null; // ID of the currently assigned vehicle (optional)
  notes?: string; // Optional notes about the driver
}

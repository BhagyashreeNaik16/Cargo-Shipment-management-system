// src/types/booking-types.ts

/**
 * Represents the lifecycle status of a booking request.
 */
export type BookingStatus = 'Pending' | 'Approved' | 'Rejected';

/**
 * Represents the progress status of a shipment after the booking is approved.
 */
export type ShipmentProgressStatus =
  | 'Waiting for Pickup' // Changed from 'Awaiting Dispatch'
  | 'Picked Up' // Changed from 'Dispatched'
  | 'In Transit'
  | 'At Hub'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Delayed'
  | 'Cancelled' // Added Cancelled for completeness
  | 'Booking Created' // Added for initial history
  | 'Booking Approved' // Added for history
  | 'Booking Rejected'; // Added for history

/**
 * Represents a single entry in the shipment's history log.
 */
export interface ShipmentHistoryEntry {
  timestamp: Date;
  status: ShipmentProgressStatus | BookingStatus | 'Booking Created'; // Allow booking statuses in history too
  location?: string; // Location where the status update occurred
  remarks?: string; // Optional remarks (e.g., reason for delay)
  vehicleId?: string | null; // Vehicle involved in this step (optional)
  driverName?: string | null; // Driver involved in this step (optional)
}

/**
 * Represents a single item within a shipment.
 */
export interface ShipmentItem {
  productId: string; // Unique identifier for this specific item instance in the shipment
  name: string; // Name or description of the item provided by the user
}

/**
 * Represents the payment method selected by the user.
 */
export type PaymentMethod = 'UPI' | 'Card' | 'Cash on Delivery';

/**
 * Defines the types of cargo that can be selected.
 */
export type CargoType = 
  | 'General Goods' 
  | 'Perishable' 
  | 'Hazardous' 
  | 'Fragile' 
  | 'Oversized'
  | 'Documents'
  | 'Electronics'
  | 'Furniture'
  | 'Other';


/**
 * Represents a complete booking record, including shipment progress details.
 */
export interface Booking {
  id: string; // Unique Booking ID
  trackingId: string; // Generated Tracking ID
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  senderAddress: string;
  receiverName: string;
  receiverEmail?: string;
  receiverPhone: string;
  receiverAddress: string;
  cargoType: CargoType; // Use the defined CargoType
  weight: number;
  volume?: number;
  numberOfItems: number; // Number of individual items in the shipment
  items?: ShipmentItem[]; // Array containing details of each item, including generated productId
  origin: string;
  destination: string;
  status: BookingStatus; // Booking lifecycle status
  shipmentStatus: ShipmentProgressStatus | null; // Shipment progress status (null if pending/rejected)
  assignedVehicleId?: string | null; // ID of the assigned vehicle
  assignedDriverName?: string | null; // Name of the assigned driver
  bookingDate: Date;
  estimatedDelivery?: Date;
  specialInstructions?: string;
  history?: ShipmentHistoryEntry[]; // Optional array to store shipment history events
  bookedByUsername?: string; // Username of the customer who created the booking
  estimatedPrice?: number; // Added estimated price
  rateUsed?: string; // Added rate description used for estimation
  paymentMethod?: PaymentMethod; // Added payment method
  // Consider adding fields like:
  // lastUpdated: Date;
}

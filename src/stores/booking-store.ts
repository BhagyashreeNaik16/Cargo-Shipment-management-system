// src/stores/booking-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage, PersistListener } from 'zustand/middleware';
import type { Booking, BookingStatus, ShipmentProgressStatus, ShipmentHistoryEntry, ShipmentItem, PaymentMethod } from '@/types/booking-types'; // Import shared types, including ShipmentHistoryEntry and ShipmentItem, PaymentMethod
import { useState, useEffect } from 'react'; // Import useState and useEffect for hydration hook
import { calculateEstimatedPrice } from '@/lib/pricing'; // Import pricing function

// Mock Booking Data (Initial state if localStorage is empty) - Updated to use `items` array and add bookedByUsername
const initialMockBookings: Booking[] = [
  {
    id: 'BK001',
    trackingId: 'CT12345',
    senderName: 'Alice Johnson', // Could be same as bookedByUsername or different if booking for someone else
    senderEmail: 'alice@example.com',
    senderPhone: '111-222-3333',
    senderAddress: '123 Main St, New York, NY',
    receiverName: 'Bob Williams',
    receiverEmail: 'bob@example.com',
    receiverPhone: '444-555-6666',
    receiverAddress: '456 Oak Ave, Los Angeles, CA',
    cargoType: 'General Goods',
    weight: 50,
    volume: 1.5,
    numberOfItems: 2,
    items: [ // Updated from itemNames
        { productId: 'CT12345-P1', name: 'Box A' },
        { productId: 'CT12345-P2', name: 'Box B' }
    ],
    origin: 'New York, NY',
    destination: 'Los Angeles, CA',
    status: 'Pending', // Initial booking status
    shipmentStatus: null, // Initial shipment status
    assignedVehicleId: null,
    assignedDriverName: null,
    bookingDate: new Date(2024, 6, 28), // July 28, 2024
    estimatedDelivery: new Date(2024, 7, 5), // August 5, 2024
    history: [ // Add initial history
        { timestamp: new Date(2024, 6, 28, 9, 0), status: 'Booking Created', location: 'New York, NY' }
    ],
    bookedByUsername: 'alice_j', // Example username
    estimatedPrice: 3000, // Example estimated price
    rateUsed: '₹50.00/kg + Distance Factor', // Example rate used
    paymentMethod: 'Card', // Example payment method
  },
  {
    id: 'BK002',
    trackingId: 'CT67890',
    senderName: 'Charlie Brown',
    senderEmail: 'charlie@sample.net',
    senderPhone: '777-888-9999',
    senderAddress: '789 Pine St, Seattle, WA',
    receiverName: 'Diana Prince',
    receiverEmail: '', // Optional email
    receiverPhone: '101-112-1314',
    receiverAddress: '101 Palm Dr, Miami, FL',
    cargoType: 'Perishable',
    weight: 200,
    volume: 5,
    numberOfItems: 1,
     items: [ // Updated from itemNames
        { productId: 'CT67890-P1', name: 'Frozen Goods Crate' }
    ],
    origin: 'Seattle, WA',
    destination: 'Miami, FL',
    status: 'Approved', // Example booking status
    shipmentStatus: 'Picked Up', // Example shipment status
    assignedVehicleId: 'TRK001',
    assignedDriverName: 'John Doe',
    bookingDate: new Date(2024, 6, 27), // July 27, 2024
    estimatedDelivery: new Date(2024, 7, 1), // August 1, 2024
    history: [
        { timestamp: new Date(2024, 6, 27, 10, 0), status: 'Booking Created', location: 'Seattle, WA' },
        { timestamp: new Date(2024, 6, 27, 14, 0), status: 'Booking Approved', location: 'Seattle, WA' },
        { timestamp: new Date(2024, 6, 28, 8, 30), status: 'Picked Up', location: 'Seattle Hub', vehicleId: 'TRK001', driverName: 'John Doe' }
    ],
     bookedByUsername: 'charlie_b', // Example username
     estimatedPrice: 15000, // Example estimated price
     rateUsed: '₹50.00/kg + 20% surcharge + Distance Factor', // Example rate used
     paymentMethod: 'UPI', // Example payment method
  },
   {
    id: 'BK003',
    trackingId: 'CT11223',
    senderName: 'Ethan Hunt',
    senderEmail: 'ethan@mission.org',
    senderPhone: '123-456-7890',
    senderAddress: '55 Beacon St, Boston, MA',
    receiverName: 'Fiona Glenanne',
    receiverEmail: 'fiona@spy.net',
    receiverPhone: '987-654-3210',
    receiverAddress: '1 Golden Gate, San Francisco, CA',
    cargoType: 'Fragile',
    weight: 15,
    volume: 0.5,
    numberOfItems: 5,
     items: [ // Updated from itemNames
        { productId: 'CT11223-P1', name: 'Vase 1' },
        { productId: 'CT11223-P2', name: 'Vase 2' },
        { productId: 'CT11223-P3', name: 'Glass Plate' },
        { productId: 'CT11223-P4', name: 'Sculpture' },
        { productId: 'CT11223-P5', name: 'Artwork Frame' }
    ],
    origin: 'Boston, MA',
    destination: 'San Francisco, CA',
    status: 'Approved', // Use Approved for testing shipment assignment
    shipmentStatus: 'Waiting for Pickup', // Set initial shipment status
    assignedVehicleId: null, // Initially unassigned
    assignedDriverName: null, // Initially unassigned
    bookingDate: new Date(2024, 6, 29), // July 29, 2024
    estimatedDelivery: new Date(2024, 7, 6), // August 6, 2024
    history: [
        { timestamp: new Date(2024, 6, 29, 11, 0), status: 'Booking Created', location: 'Boston, MA' },
        { timestamp: new Date(2024, 6, 29, 16, 0), status: 'Booking Approved', location: 'Boston, MA' },
        { timestamp: new Date(2024, 6, 30, 9, 0), status: 'Waiting for Pickup', location: 'Boston Hub' }
    ],
    bookedByUsername: 'ethan_h', // Example username
    estimatedPrice: 1500, // Example estimated price
    rateUsed: '₹50.00/kg + 15% surcharge + Multi-item Surcharge + Distance Factor (BOS-SF)', // Example rate used
    paymentMethod: 'Cash on Delivery', // Example payment method
  },
];

// Type for the new history entry data
export type NewHistoryEntryData = {
  status: ShipmentProgressStatus;
  location?: string;
  remarks?: string;
};

interface BookingState {
  bookings: Booking[];
  // Updated addBooking signature
  addBooking: (newBooking: Omit<Booking, 'id' | 'status' | 'bookingDate' | 'shipmentStatus' | 'assignedVehicleId' | 'assignedDriverName' | 'history' | 'estimatedDelivery' | 'estimatedPrice' | 'rateUsed' | 'paymentMethod'> & { trackingId: string; items: ShipmentItem[]; bookedByUsername: string; estimatedPrice: number; rateUsed: string; paymentMethod: PaymentMethod; }) => string;
  // Updated addManualShipment signature
  addManualShipment: (manualData: Omit<Booking, 'id' | 'status' | 'bookingDate' | 'history' | 'estimatedPrice' | 'rateUsed' | 'paymentMethod'> & { initialShipmentStatus: ShipmentProgressStatus; items: ShipmentItem[]; numberOfItems: number; paymentMethod?: PaymentMethod }) => string;
  updateBookingStatus: (bookingId: string, newStatus: 'Approved' | 'Rejected') => void;
  updateShipmentStatus: (bookingId: string, newShipmentStatus: ShipmentProgressStatus, location?: string, remarks?: string) => void; // Added remarks
  addShipmentHistoryEntry: (bookingId: string, entryData: NewHistoryEntryData) => void; // New action for history
  updateShipmentAssignment: (bookingId: string, vehicleId: string | null, driverName: string | null) => void;
  deleteBooking: (bookingId: string) => void;
  getBookings: () => Booking[];
  _hasHydrated: boolean;
  _datesProcessed: boolean;
  setHasHydrated: (hydrated: boolean) => void;
  setDatesProcessed: (processed: boolean) => void;
}

// Helper function to safely parse dates, history, and items
const parseBookingDatesAndHistory = (bookings: any[]): Booking[] => {
    if (!Array.isArray(bookings)) {
        console.warn("Invalid bookings data received for parsing, returning initial mock data.");
        // Ensure initial mock data also has dates parsed correctly (though they are Date objects already)
        return initialMockBookings.map(booking => ({
             ...booking,
             bookingDate: new Date(booking.bookingDate),
             estimatedDelivery: booking.estimatedDelivery ? new Date(booking.estimatedDelivery) : undefined,
             history: (booking.history || []).map(entry => ({
                 ...entry,
                 timestamp: new Date(entry.timestamp)
             })),
             items: Array.isArray(booking.items) ? booking.items : [], // Ensure items is array
             paymentMethod: booking.paymentMethod || 'Card', // Default payment method
         }));
    }
    try {
        return bookings.map(booking => {
             if (!booking || typeof booking !== 'object') {
                 console.warn("Found invalid booking item during parsing:", booking);
                 return null; // Skip invalid items
             }

            const history = Array.isArray(booking.history)
                ? booking.history.map((entry: any) => ({
                      ...entry,
                      timestamp: entry?.timestamp ? new Date(entry.timestamp) : new Date(),
                      location: entry?.location || 'Unknown Location',
                      status: entry?.status || 'Unknown Status',
                  }))
                : [];

             // Ensure items array is handled correctly during parsing
             const items = Array.isArray(booking.items)
                ? booking.items.map((item: any) => ({
                    productId: item?.productId || `MISSING_ID_${Math.random().toString(36).substring(2, 9)}`, // Generate fallback ID if missing
                    name: item?.name || 'Unnamed Item',
                }))
                : [];

            // Ensure numberOfItems matches the actual items array length after parsing
             const numberOfItems = items.length;

             return {
                ...booking,
                bookingDate: booking.bookingDate ? new Date(booking.bookingDate) : new Date(),
                estimatedDelivery: booking.estimatedDelivery ? new Date(booking.estimatedDelivery) : undefined,
                assignedVehicleId: booking.assignedVehicleId !== undefined ? booking.assignedVehicleId : null,
                assignedDriverName: booking.assignedDriverName !== undefined ? booking.assignedDriverName : null,
                history: Array.isArray(history) ? history : [],
                numberOfItems: numberOfItems, // Correct number based on parsed items
                items: items, // Store the parsed items array
                bookedByUsername: booking.bookedByUsername || 'Unknown User', // Add default if missing
                estimatedPrice: typeof booking.estimatedPrice === 'number' ? booking.estimatedPrice : 0, // Ensure price exists
                rateUsed: typeof booking.rateUsed === 'string' ? booking.rateUsed : '', // Ensure rateUsed exists
                paymentMethod: booking.paymentMethod || 'Card', // Ensure paymentMethod exists, default to 'Card'
            };
        }).filter((booking): booking is Booking => booking !== null); // Filter out any skipped null items
    } catch (error) {
        console.error("Error parsing booking dates or history:", error);
         // Ensure initial mock data also has dates parsed correctly on error
         return initialMockBookings.map(booking => ({
             ...booking,
             bookingDate: new Date(booking.bookingDate),
             estimatedDelivery: booking.estimatedDelivery ? new Date(booking.estimatedDelivery) : undefined,
             history: (booking.history || []).map(entry => ({
                 ...entry,
                 timestamp: new Date(entry.timestamp)
             })),
              items: Array.isArray(booking.items) ? booking.items : [], // Ensure items is array
              bookedByUsername: booking.bookedByUsername || 'Unknown User', // Ensure exists in fallback
              estimatedPrice: typeof booking.estimatedPrice === 'number' ? booking.estimatedPrice : 0, // Ensure price exists
              rateUsed: typeof booking.rateUsed === 'string' ? booking.rateUsed : '', // Ensure rateUsed exists
              paymentMethod: booking.paymentMethod || 'Card', // Ensure paymentMethod exists in fallback
         }));
    }
};


export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      bookings: initialMockBookings, // Initialize with mock data
      _hasHydrated: false, // Internal flag, initially false
      _datesProcessed: false, // Internal flag, initially false

      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
      setDatesProcessed: (processed) => set({ _datesProcessed: processed }),

      // Updated addBooking to handle items array, bookedByUsername, price, rate, and paymentMethod
      addBooking: (newBookingData) => {
         const bookingDate = new Date();
         // Basic estimated delivery (e.g., 7 days later) - replace with actual logic if needed, or rely on AI prediction later
         const estimatedDelivery = new Date(bookingDate.getTime() + 7 * 24 * 60 * 60 * 1000);

        const newBooking: Booking = {
          ...newBookingData, // Spread data including trackingId, items, user, price, rate, paymentMethod
          id: `BK${Math.random().toString(36).substring(2, 7).toUpperCase()}`, // Generate simple booking ID
          status: 'Pending',
          shipmentStatus: null, // Initially null
          assignedVehicleId: null, // Initialize assignment fields
          assignedDriverName: null,
          bookingDate: bookingDate,
          estimatedDelivery: estimatedDelivery, // Add estimated delivery
          history: [{ timestamp: bookingDate, status: 'Booking Created', location: newBookingData.origin }], // Initialize history
          // items, bookedByUsername, estimatedPrice, rateUsed, paymentMethod are passed directly in newBookingData now
        };
        set((state) => ({
          bookings: [...state.bookings, newBooking],
        }));
        console.log("Booking added to store:", newBooking);
        return newBooking.id;
      },

      // Updated addManualShipment to receive items and numberOfItems correctly and calculate price
      addManualShipment: (manualData) => {
        const bookingDate = new Date();
        const newBookingId = `BK${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        // Calculate estimated price using imported function
        const { price, rateUsed } = calculateEstimatedPrice({
          weight: manualData.weight,
          volume: manualData.volume,
          cargoType: manualData.cargoType,
          origin: manualData.origin,
          destination: manualData.destination,
          numberOfItems: manualData.numberOfItems,
        });

        // Determine initial history based on the provided initial shipment status
        const initialHistory: ShipmentHistoryEntry[] = [
          { timestamp: bookingDate, status: 'Booking Created', location: manualData.origin },
          { timestamp: new Date(bookingDate.getTime() + 1000), status: 'Booking Approved', location: manualData.origin },
        ];
         if (manualData.initialShipmentStatus) {
            initialHistory.push({
                timestamp: new Date(bookingDate.getTime() + 2000), // Slightly later timestamp
                status: manualData.initialShipmentStatus,
                location: manualData.origin, // Assume starts at origin
                vehicleId: manualData.assignedVehicleId,
                driverName: manualData.assignedDriverName,
            });
         }

         // The items array with IDs is already provided in manualData
         const itemsWithIds = manualData.items;

        const newShipmentRecord: Booking = {
          ...manualData, // Spread the form data
          id: newBookingId, // Generate a booking ID
          status: 'Approved', // Set booking status to Approved directly
          shipmentStatus: manualData.initialShipmentStatus, // Set initial shipment status
          bookingDate: bookingDate,
          history: initialHistory,
          items: itemsWithIds, // Store the provided items array
          numberOfItems: manualData.numberOfItems, // Store the provided numberOfItems
          bookedByUsername: manualData.bookedByUsername || 'Admin Manual', // Add bookedBy or default
          estimatedPrice: price, // Store calculated price
          rateUsed: rateUsed, // Store calculated rate description
          paymentMethod: manualData.paymentMethod || 'Cash on Delivery', // Default if not provided
        };

         set((state) => ({
           bookings: [...state.bookings, newShipmentRecord],
         }));
         console.log("Manual shipment record added to store:", newShipmentRecord);
         return newBookingId;
      },


      updateBookingStatus: (bookingId, newStatus) => {
        set((state) => ({
          bookings: state.bookings.map((booking) => {
            if (booking.id === bookingId) {
               const now = new Date();
               const newHistoryEntry: ShipmentHistoryEntry = {
                  timestamp: now,
                  status: newStatus === 'Approved' ? 'Booking Approved' : 'Booking Rejected',
                  location: booking.origin, // Assuming status change happens at origin initially
                };
                // Ensure history is initialized
               const currentHistory = Array.isArray(booking.history) ? booking.history : [];
               const updatedHistory = [...currentHistory, newHistoryEntry];

               // If Approved, set initial shipment status and add history entry if not already set
               let newShipmentStatus = booking.shipmentStatus;
               if (newStatus === 'Approved' && !newShipmentStatus) {
                   newShipmentStatus = 'Waiting for Pickup';
                    updatedHistory.push({
                        timestamp: new Date(now.getTime() + 1000), // Slightly later timestamp
                        status: 'Waiting for Pickup',
                        location: booking.origin // Or a specific hub
                    });
               }

              return {
                ...booking,
                status: newStatus,
                shipmentStatus: newShipmentStatus, // Update shipment status accordingly
                history: updatedHistory,
              };
            }
            return booking;
          }),
        }));
        console.log(`Booking ${bookingId} status updated to ${newStatus} in store.`);
      },

       // Deprecated - use addShipmentHistoryEntry instead
       updateShipmentStatus: (bookingId, newShipmentStatus, location) => {
          console.warn("updateShipmentStatus is deprecated. Use addShipmentHistoryEntry.");
          get().addShipmentHistoryEntry(bookingId, { status: newShipmentStatus, location });
       },

       addShipmentHistoryEntry: (bookingId, entryData) => {
          set((state) => ({
            bookings: state.bookings.map((booking) => {
              if (booking.id === bookingId) {
                 const currentHistory = Array.isArray(booking.history) ? booking.history : [];
                 const lastLocation = currentHistory.length > 0
                       ? currentHistory[currentHistory.length - 1]?.location
                       : booking.origin; // Fallback to origin

                 const newHistoryEntry: ShipmentHistoryEntry = {
                    timestamp: new Date(),
                    status: entryData.status,
                    location: entryData.location || lastLocation || 'Unknown Location',
                    remarks: entryData.remarks,
                    vehicleId: booking.assignedVehicleId, // Include current assignment info
                    driverName: booking.assignedDriverName,
                 };
                 const updatedHistory = [...currentHistory, newHistoryEntry];
                 return {
                    ...booking,
                    shipmentStatus: entryData.status, // Update the main shipment status
                    history: updatedHistory,
                 };
              }
              return booking;
            }),
          }));
           console.log(`Booking ${bookingId} history updated with status ${entryData.status} in store.`);
       },


       updateShipmentAssignment: (bookingId, vehicleId, driverName) => {
         set((state) => ({
            bookings: state.bookings.map((booking) =>
                booking.id === bookingId
                ? { ...booking, assignedVehicleId: vehicleId, assignedDriverName: driverName }
                : booking
            ),
         }));
         console.log(`Booking ${bookingId} assigned Vehicle ID: ${vehicleId}, Driver: ${driverName} in store.`);
       },

      deleteBooking: (bookingId) => {
         set((state) => ({
            bookings: state.bookings.filter((booking) => booking.id !== bookingId),
         }));
         console.log(`Booking ${bookingId} deleted from store.`);
      },


      getBookings: () => get().bookings,
    }),
    {
      name: 'booking-storage', // Name of the item in localStorage
      storage: createJSONStorage(() => localStorage), // Use localStorage

       // Custom hydration logic using the PersistListener type
       onRehydrateStorage: (): PersistListener<BookingState> => (state, error) => {
        if (error) {
           console.error("Failed to hydrate booking store:", error);
           state?.setHasHydrated(true); // Mark as hydrated even on error
           state?.setDatesProcessed(false); // Dates not processed
        } else if (state) {
           // Don't process dates here directly. Mark as hydrated.
           // The hook useIsBookingStoreHydrated will handle date processing.
           console.log("Booking store: Hydration initiated. Marking as hydrated.");
           state.setHasHydrated(true);
           state.setDatesProcessed(false); // Mark dates as needing processing
        } else {
           console.log("Booking store: No stored state found, using initial state and marking as hydrated.");
            // If no state is restored, the initial state (with Date objects) is used.
            // Mark as hydrated and dates processed.
             useBookingStore.setState({ _hasHydrated: true, _datesProcessed: true }); // Update state after initialization
        }
      },

      // Persist only the raw bookings array
      partialize: (state) => ({
        bookings: state.bookings,
      }),

       skipHydration: false, // Ensure hydration runs
      version: 3, // Current version (was 2, bumped due to paymentMethod addition)
      migrate: (persistedState: any, version: number) => {
        let migratedState = persistedState;
        if (version < 3) {
          // Version 3 added paymentMethod
          if (migratedState && Array.isArray(migratedState.bookings)) {
            migratedState.bookings = migratedState.bookings.map((booking: any) => {
              if (typeof booking === 'object' && booking !== null && !booking.paymentMethod) {
                return {
                  ...booking,
                  paymentMethod: 'Card' as PaymentMethod, // Default to 'Card'
                };
              }
              return booking;
            });
          }
        }
        // Add more migration steps here for future versions
        // e.g., if (version < 4) { ... }
        console.log(`Booking store: Migrated from version ${version} to 3.`);
        return migratedState;
      },
    }
  )
);

// Hook to check hydration status and ensure dates are processed
export const useIsBookingStoreHydrated = () => {
    const hasHydrated = useBookingStore((state) => state._hasHydrated);
    const datesProcessed = useBookingStore((state) => state._datesProcessed);
    const setDatesProcessed = useBookingStore((state) => state.setDatesProcessed);
    const bookings = useBookingStore((state) => state.bookings); // Get current bookings potentially before date processing
    const [isReady, setIsReady] = useState(false); // Local state to track full readiness

    useEffect(() => {
        // Check if hydration is done but dates haven't been processed yet
        if (hasHydrated && !datesProcessed) {
            console.log("Booking store hydration complete, now processing dates...");
            const processedBookings = parseBookingDatesAndHistory(bookings);
            // Update the store with the processed bookings
            useBookingStore.setState({ bookings: processedBookings });
            setDatesProcessed(true); // Mark dates as processed
            setIsReady(true); // Mark as fully ready
            console.log("Booking dates processed successfully.");
        } else if (hasHydrated && datesProcessed) {
            // Already hydrated and processed
             setIsReady(true);
        } else {
            setIsReady(false); // Not ready yet
        }
    }, [hasHydrated, datesProcessed, setDatesProcessed, bookings]); // Rerun when hydration or processing status changes

    // The store is fully ready only when hydration is complete AND dates are processed
    return isReady;
};

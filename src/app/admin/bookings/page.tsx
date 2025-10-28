// src/app/admin/bookings/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookingsTable } from '@/components/admin/bookings-table'; // Import the table component
import { useBookingStore, useIsBookingStoreHydrated } from '@/stores/booking-store'; // Import the Zustand store and hydration hook
import type { Booking } from '@/types/booking-types'; // Import shared types

export default function AdminBookingsPage() {
   // Get state and actions from the Zustand store
   const bookings = useBookingStore((state) => state.bookings);
   const updateBookingStatus = useBookingStore((state) => state.updateBookingStatus);
   const deleteBooking = useBookingStore((state) => state.deleteBooking); // Get delete action
   const isHydrated = useIsBookingStoreHydrated(); // Use the custom hook

   // Local state to prevent rendering before hydration is complete
   const [hasMounted, setHasMounted] = useState(false);

   useEffect(() => {
       setHasMounted(true);
   }, []);


  // Handler for updating booking status (delegates to the store)
  const handleUpdateStatus = (bookingId: string, newStatus: 'Approved' | 'Rejected') => {
    updateBookingStatus(bookingId, newStatus);
    console.log(`Booking ${bookingId} status update requested to ${newStatus}`);
  };

   // Handler for deleting a booking (delegates to the store)
   const handleDeleteBooking = (bookingId: string) => {
     deleteBooking(bookingId);
     console.log(`Booking ${bookingId} deletion requested.`);
   };

   // Render loading state or null until the store is hydrated and component has mounted
   if (!hasMounted || !isHydrated) {
     // You can return a loading skeleton here if preferred
     return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Manage Bookings</h1>
            <Card>
                <CardHeader>
                <CardTitle>Booking List</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Loading bookings...</p>
                </CardContent>
            </Card>
        </div>
        );
   }


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Manage Bookings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Booking List</CardTitle>
        </CardHeader>
        <CardContent>
           {/* Render based on hydrated state */}
          {bookings.length > 0 ? (
             <BookingsTable
               data={bookings}
               onUpdateStatus={handleUpdateStatus}
               onDelete={handleDeleteBooking} // Pass delete handler
             />
           ) : (
             <p className="text-muted-foreground">No bookings found.</p>
           )}
        </CardContent>
      </Card>
    </div>
  );
}

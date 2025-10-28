// src/components/admin/bookings-table.tsx
'use client';

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns'; // For date formatting
import { CheckCircle, XCircle, MoreHorizontal, Hourglass, Package, Truck, Anchor, Warehouse, AlertTriangle, Ban, Trash2, PackageCheck, User, Eye, List, Home as HomeIcon, Phone, Mail, IndianRupee, CreditCard, Smartphone, Truck as TruckIcon } from 'lucide-react'; // Added Eye icon, IndianRupee and payment icons
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog" // Import Alert Dialog
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Booking, BookingStatus, ShipmentProgressStatus, ShipmentItem, PaymentMethod } from '@/types/booking-types'; // Import shared types
import { Separator } from '@/components/ui/separator'; // Import Separator

// Booking and BookingStatus types are now imported from '@/types/booking-types'

interface BookingsTableProps {
  data: Booking[];
  onUpdateStatus: (bookingId: string, newStatus: 'Approved' | 'Rejected') => void;
  onDelete: (bookingId: string) => void; // Add onDelete prop
}

// Function to get badge variant based on booking status
const getBookingStatusBadgeVariant = (status: BookingStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Approved':
        return 'default'; // Use primary color (often green or blue in themes) for Approved
      case 'Pending':
        return 'secondary'; // Use secondary (often yellow or gray) for Pending
      case 'Rejected':
        return 'destructive'; // Use destructive (often red) for Rejected
      default:
        return 'outline';
    }
};

// Function to get badge variant based on shipment status
const getShipmentStatusBadgeVariant = (status: ShipmentProgressStatus | null): "default" | "secondary" | "destructive" | "outline" => {
    if (!status) return 'outline'; // Default for null status
    switch (status) {
      case 'Delivered':
        return 'default'; // Green / Primary
      case 'Picked Up': // Changed from 'Dispatched'
      case 'In Transit':
      case 'At Hub':
      case 'Out for Delivery':
      case 'Waiting for Pickup': // Changed from 'Awaiting Dispatch'
        return 'secondary'; // Blue / Accent (maybe?) or Secondary Yellow/Gray
      case 'Delayed':
        return 'outline'; // Orange/Yellow outline?
      case 'Cancelled':
        return 'destructive'; // Red
      default:
        return 'outline';
    }
};


// Shipment status icons map
const shipmentStatusIcons: Record<ShipmentProgressStatus, React.ElementType> = {
    'Waiting for Pickup': Hourglass, // Changed from 'Awaiting Dispatch'
    'Picked Up': Truck, // Changed from 'Dispatched'
    'In Transit': Anchor, // Or Plane, depending on context? Using Anchor for Sea/General
    'At Hub': Warehouse,
    'Out for Delivery': Truck,
    'Delivered': PackageCheck, // Updated icon for clarity
    'Delayed': AlertTriangle,
    'Cancelled': Ban,
    'Booking Created': Hourglass, // Placeholder, won't show as shipment status
    'Booking Approved': Hourglass, // Placeholder
    'Booking Rejected': Ban, // Placeholder
   };

// Payment method icons map
const paymentMethodIcons: Record<PaymentMethod, React.ElementType> = {
    'UPI': Smartphone,
    'Card': CreditCard,
    'Cash on Delivery': TruckIcon,
};


export function BookingsTable({ data, onUpdateStatus, onDelete }: BookingsTableProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);


  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    // The DialogTrigger will open the Dialog
  };

  const handleDeleteClick = (bookingId: string) => {
      setBookingToDelete(bookingId);
      // Alert Dialog Trigger will handle opening
  };

  const confirmDelete = () => {
      if (bookingToDelete) {
          onDelete(bookingToDelete);
          setBookingToDelete(null); // Close dialog implicitly
      }
  };

  return (
     <Dialog>
        <AlertDialog> {/* Wrap table/relevant part with AlertDialog Provider */}
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Booked By</TableHead> {/* Added Column */}
                    <TableHead>Tracking ID</TableHead>
                    <TableHead>Sender</TableHead>
                    <TableHead>Receiver</TableHead>
                    <TableHead>Origin</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Est. Price</TableHead> {/* Added Price Column */}
                    <TableHead>Payment</TableHead> {/* Added Payment Column */}
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {data.map((booking) => {
                    const PaymentIcon = booking.paymentMethod ? paymentMethodIcons[booking.paymentMethod] : CreditCard; // Default icon
                    return (
                        <TableRow key={booking.id}>
                        <TableCell className="font-medium">{booking.id}</TableCell>
                        <TableCell>
                            <div className="flex items-center gap-1 text-xs">
                            <User className="h-3 w-3 text-muted-foreground"/>
                            {booking.bookedByUsername || 'Unknown'}
                            </div>
                        </TableCell>
                        <TableCell>{booking.trackingId}</TableCell>
                        <TableCell>{booking.senderName}</TableCell>
                        <TableCell>{booking.receiverName}</TableCell>
                        <TableCell>{booking.origin}</TableCell>
                        <TableCell>{booking.destination}</TableCell>
                        <TableCell> {/* Estimated Price Cell */}
                            {booking.estimatedPrice !== undefined ? (
                                <span className="flex items-center gap-1 text-xs">
                                    <IndianRupee className="h-3 w-3 text-muted-foreground"/>{booking.estimatedPrice.toLocaleString('en-IN')}
                                </span>
                            ) : (
                                <span className="text-xs text-muted-foreground">N/A</span>
                            )}
                        </TableCell>
                        <TableCell> {/* Payment Method Cell */}
                            {booking.paymentMethod ? (
                                <span className="flex items-center gap-1 text-xs">
                                    <PaymentIcon className="h-3.5 w-3.5 text-muted-foreground"/>
                                    {booking.paymentMethod}
                                </span>
                            ) : (
                                <span className="text-xs text-muted-foreground">N/A</span>
                            )}
                        </TableCell>
                        <TableCell>
                            <Badge variant={getBookingStatusBadgeVariant(booking.status)}>
                            {booking.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    {/* Use DialogTrigger inside DropdownMenuItem */}
                                    <DialogTrigger asChild onClick={() => handleViewDetails(booking)}>
                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}> {/* Prevent closing dropdown */}
                                            <Eye className="mr-2 h-4 w-4" /> View Details
                                        </DropdownMenuItem>
                                    </DialogTrigger>
                                    <DropdownMenuSeparator />
                                    {booking.status === 'Pending' && (
                                    <>
                                        <DropdownMenuItem
                                            className="text-green-600 focus:text-green-700 focus:bg-green-100"
                                            onClick={() => onUpdateStatus(booking.id, 'Approved')}
                                        >
                                            <CheckCircle className="mr-2 h-4 w-4" /> Approve
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-red-600 focus:text-red-700 focus:bg-red-100"
                                            onClick={() => onUpdateStatus(booking.id, 'Rejected')}
                                        >
                                            <XCircle className="mr-2 h-4 w-4" /> Reject
                                        </DropdownMenuItem>
                                    </>
                                    )}
                                    {/* Add Delete button for Rejected status */}
                                    {booking.status === 'Rejected' && (
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem
                                                className="text-red-600 focus:text-red-700 focus:bg-red-100"
                                                onSelect={(e) => e.preventDefault()} // Prevent default dropdown close
                                                onClick={() => handleDeleteClick(booking.id)}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Booking
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                    )}
                                    {/* Example: Link to Shipments page if approved */}
                                    {(booking.status === 'Approved') && (
                                        <DropdownMenuItem
                                            onClick={() => console.log("Manage Shipment for", booking.trackingId)} // Placeholder
                                        >
                                            Manage Shipment
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                        </TableRow>
                    );
                 })}
                </TableBody>
            </Table>

            {/* Delete Confirmation Dialog Content */}
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the booking record for ID: <span className="font-semibold">{bookingToDelete}</span>.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setBookingToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>


       {/* Dialog for Viewing Details */}
       {selectedBooking && (
         <DialogContent className="sm:max-w-[600px]">
           <DialogHeader>
             <DialogTitle>Booking Details - {selectedBooking.id}</DialogTitle>
             <DialogDescription>
               Review the full details of this booking. Tracking ID: {selectedBooking.trackingId}
               {selectedBooking.bookedByUsername && <span className="block text-xs text-muted-foreground">Booked By: {selectedBooking.bookedByUsername}</span>}
             </DialogDescription>
           </DialogHeader>
           <ScrollArea className="max-h-[60vh] pr-6">
             <div className="grid gap-4 py-4">
                {/* Sender Info */}
               <div className="mb-4 p-4 border rounded-md bg-muted/50">
                 <h4 className="font-semibold mb-2 text-lg">Sender Information</h4>
                 <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                   <div><strong>Name:</strong> {selectedBooking.senderName}</div>
                   <div><strong>Email:</strong> {selectedBooking.senderEmail}</div>
                   <div><strong>Phone:</strong> {selectedBooking.senderPhone}</div>
                   <div className="col-span-2"><strong>Address:</strong> {selectedBooking.senderAddress}</div>
                 </div>
               </div>

                {/* Receiver Info */}
               <div className="mb-4 p-4 border rounded-md bg-muted/50">
                 <h4 className="font-semibold mb-2 text-lg">Receiver Information</h4>
                 <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                   <div><strong>Name:</strong> {selectedBooking.receiverName}</div>
                   <div><strong>Email:</strong> {selectedBooking.receiverEmail || 'N/A'}</div>
                   <div><strong>Phone:</strong> {selectedBooking.receiverPhone}</div>
                   <div className="col-span-2"><strong>Address:</strong> {selectedBooking.receiverAddress}</div>
                 </div>
               </div>

                {/* Cargo Info */}
               <div className="p-4 border rounded-md bg-muted/50">
                  <h4 className="font-semibold mb-2 text-lg">Cargo &amp; Shipment Details</h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div><strong>Cargo Type:</strong> {selectedBooking.cargoType}</div>
                    <div><strong>Weight:</strong> {selectedBooking.weight} kg</div>
                    {selectedBooking.volume && <div><strong>Volume:</strong> {selectedBooking.volume} m³</div>}
                     <div className="col-span-2"><strong>Origin:</strong> {selectedBooking.origin}</div>
                     <div className="col-span-2"><strong>Destination:</strong> {selectedBooking.destination}</div>
                     <div className="col-span-2"><strong>Booking Status:</strong> <Badge variant={getBookingStatusBadgeVariant(selectedBooking.status)}>{selectedBooking.status}</Badge></div>
                     {/* Display Shipment Status if booking is approved */}
                     {selectedBooking.status === 'Approved' && selectedBooking.shipmentStatus && (
                       <div className="col-span-2"><strong>Shipment Status:</strong> <Badge variant={getShipmentStatusBadgeVariant(selectedBooking.shipmentStatus)}>{selectedBooking.shipmentStatus}</Badge></div>
                     )}
                      {/* Display Estimated Price */}
                       <div className="col-span-2 flex items-center gap-1">
                           <strong>Est. Price:</strong>
                           {selectedBooking.estimatedPrice !== undefined ? (
                                <span className="flex items-center gap-0.5"><IndianRupee className="h-3.5 w-3.5"/>{selectedBooking.estimatedPrice.toLocaleString('en-IN')}</span>
                            ) : 'N/A'}
                             {selectedBooking.rateUsed && <span className="text-xs text-muted-foreground">({selectedBooking.rateUsed})</span>}
                       </div>
                       {/* Display Payment Method */}
                        <div className="col-span-2 flex items-center gap-1">
                            <strong>Payment:</strong>
                            {selectedBooking.paymentMethod ? (
                                <span className="flex items-center gap-1">
                                   {(() => {
                                       const IconComponent = paymentMethodIcons[selectedBooking.paymentMethod] || CreditCard;
                                       return <IconComponent className="h-4 w-4 text-muted-foreground" />;
                                   })()}
                                    {selectedBooking.paymentMethod}
                                </span>
                            ) : 'N/A'}
                        </div>
                     <div><strong>Booking Date:</strong> {format(new Date(selectedBooking.bookingDate), 'PPP')}</div>
                    {selectedBooking.estimatedDelivery && <div><strong>Est. Delivery:</strong> {format(new Date(selectedBooking.estimatedDelivery), 'PPP')}</div>}
                     {selectedBooking.specialInstructions && <div className="col-span-2"><strong>Instructions:</strong> {selectedBooking.specialInstructions}</div>}
                     {/* Items Section */}
                      <div className="col-span-2 mt-3 pt-3 border-t">
                          <h5 className="font-medium mb-2 flex items-center gap-1.5"><List className="h-4 w-4"/>Items ({selectedBooking.items?.length || 0})</h5>
                          {(selectedBooking.items && selectedBooking.items.length > 0) ? (
                              <ul className="list-disc list-inside space-y-1 text-xs pl-5">
                                  {selectedBooking.items.map((item) => (
                                      <li key={item.productId}>
                                          <strong>{item.name}</strong> (ID: <span className="font-mono text-muted-foreground">{item.productId}</span>)
                                      </li>
                                  ))}
                              </ul>
                          ) : (
                              <p className="text-xs text-muted-foreground">No item details provided.</p>
                          )}
                      </div>
                  </div>
               </div>
             </div>
           </ScrollArea>
           <DialogFooter>
                {/* Show Approve/Reject only if status is Pending */}
                {selectedBooking.status === 'Pending' && (
                    <>
                      <DialogClose asChild>
                          <Button
                            variant="destructive"
                            onClick={() => {
                                onUpdateStatus(selectedBooking.id, 'Rejected');
                            }}
                          >
                             <XCircle className="mr-2 h-4 w-4" /> Reject
                          </Button>
                      </DialogClose>
                       <DialogClose asChild>
                          <Button
                             className="bg-green-600 hover:bg-green-700 text-white"
                             onClick={() => {
                                onUpdateStatus(selectedBooking.id, 'Approved');
                             }}
                          >
                             <CheckCircle className="mr-2 h-4 w-4" /> Approve
                          </Button>
                       </DialogClose>
                    </>
                )}
                 {/* Show Delete only if status is Rejected */}
                 {selectedBooking.status === 'Rejected' && (
                     <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Booking
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the rejected booking record for ID: <span className="font-semibold">{selectedBooking.id}</span>.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  {/* Ensure Dialog closes after delete */}
                                  <DialogClose asChild>
                                      <AlertDialogAction onClick={() => onDelete(selectedBooking.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                          Delete
                                      </AlertDialogAction>
                                  </DialogClose>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                     </AlertDialog>
                 )}
                {/* Close button */}
                 <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                 </DialogClose>
           </DialogFooter>
         </DialogContent>
       )}
     </Dialog>
  );
}

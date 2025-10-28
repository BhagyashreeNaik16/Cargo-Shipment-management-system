// src/app/admin/shipments/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShipmentsTable } from '@/components/admin/shipments-table'; // Import the table component
import { useBookingStore, useIsBookingStoreHydrated } from '@/stores/booking-store'; // Import the Zustand store and hydration hook
import type { Booking, ShipmentProgressStatus } from '@/types/booking-types'; // Import shared types
import type { Vehicle } from '@/types/vehicle-types'; // Import Vehicle type
import { Button } from '@/components/ui/button'; // Import Button
import { PlusCircle, User, Phone, Mail, Home as HomeIcon, MapPin, Scale, Maximize, Info, Send, Loader2, ScanLine, CalendarIcon, Package, List, Hash, IndianRupee } from 'lucide-react'; // Added icons
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useDriverStore, useIsDriverStoreHydrated as useIsDriverStoreHydratedHook } from '@/stores/driver-store'; // Import driver store for assigning drivers
import { useVehicleStore, useIsVehicleStoreHydrated } from '@/stores/vehicle-store'; // Import vehicle store
import { Separator } from '@/components/ui/separator'; // Import Separator
import { Label } from '@/components/ui/label'; // Import Label component
import type { ShipmentItem } from '@/types/booking-types'; // Import ShipmentItem type
import { calculateEstimatedPrice } from '@/lib/pricing'; // Import pricing function

// Define Zod schema for manual shipment form validation
const manualShipmentSchema = z.object({
  // Updated: Make trackingId optional and allow empty string, validation applies only if provided
  trackingId: z.string()
    .min(5, { message: "Tracking ID needs at least 5 characters if provided" })
    .optional()
    .or(z.literal('')), // Allow empty string

  // Sender Details
  senderName: z.string().min(2, { message: "Sender name requires at least 2 characters" }),
  senderAddress: z.string().min(5, { message: "Sender address requires at least 5 characters" }),
  senderPhone: z.string().min(10, { message: "Sender phone number requires at least 10 digits" }).optional().or(z.literal('')),
  senderEmail: z.string().email({ message: "Invalid sender email address" }).optional().or(z.literal('')),

  // Receiver Details
  receiverName: z.string().min(2, { message: "Receiver name requires at least 2 characters" }),
  receiverAddress: z.string().min(5, { message: "Receiver address requires at least 5 characters" }),
  receiverPhone: z.string().min(10, { message: "Receiver phone number requires at least 10 digits" }),
  receiverEmail: z.string().email({ message: "Invalid receiver email address" }).optional().or(z.literal('')),

   // Cargo Details
  cargoType: z.string().min(1, { message: "Cargo type is required" }),
  weight: z.preprocess(
    (val) => Number(String(val)),
    z.number({ invalid_type_error: "Weight must be a number", required_error: "Weight is required" }).positive({ message: "Weight must be positive" })
  ),
  volume: z.preprocess(
    (val) => val ? Number(String(val)) : undefined,
    z.number({ invalid_type_error: "Volume must be a number" }).positive({ message: "Volume must be positive" }).optional()
  ),
   numberOfItems: z.preprocess(
     (val) => Number(String(val)),
     z.number({ invalid_type_error: "Number of items must be a number", required_error: "Number of items is required" }).int().positive({ message: "Must have at least 1 item" }).max(50, { message: "Maximum 50 items allowed per booking" }) // Added max limit
   ),
   // Update schema for items: array of objects with name property
   items: z.array(z.object({ name: z.string().min(1, { message: "Item name cannot be empty" }) })).optional(),
  origin: z.string().min(3, { message: "Origin requires at least 3 characters" }),
  destination: z.string().min(3, { message: "Destination requires at least 3 characters" }),
  specialInstructions: z.string().optional(),

  // Shipment Specific Fields
  initialShipmentStatus: z.enum(['Awaiting Dispatch', 'Dispatched', 'In Transit'], { required_error: "Initial status is required" }), // Start with a few relevant statuses
  assignedVehicleId: z.string().nullable().optional(),
  assignedDriverName: z.string().nullable().optional(),
  estimatedDelivery: z.date().optional(), // Make delivery date optional for manual entry
  bookedByUsername: z.string().optional(), // Optional field for who is booking manually
}).refine(data => {
   // Custom validation: Ensure items array length matches numberOfItems
   return !data.numberOfItems || !data.items || data.items.length === data.numberOfItems;
 }, {
   message: "Number of item details must match the specified number of items.",
   path: ["items"], // Associate the error with the items field if needed
 });

type ManualShipmentFormValues = z.infer<typeof manualShipmentSchema>;


// Helper to get shipment status options
const shipmentStatusOptions: ShipmentProgressStatus[] = [
    'Awaiting Dispatch',
    'Dispatched',
    'In Transit',
    'At Hub',
    'Out for Delivery',
    'Delivered',
    'Delayed',
    'Cancelled', // Allow admin to cancel
];

export default function AdminShipmentsPage() {
  // Booking Store
  const allBookings = useBookingStore((state) => state.bookings);
  const updateShipmentStatus = useBookingStore((state) => state.updateShipmentStatus); // Deprecated, use addShipmentHistoryEntry
  const addShipmentHistoryEntry = useBookingStore((state) => state.addShipmentHistoryEntry); // New action
  const updateShipmentAssignment = useBookingStore((state) => state.updateShipmentAssignment);
  const addManualShipment = useBookingStore((state) => state.addManualShipment); // Get new action
  const isBookingStoreHydrated = useIsBookingStoreHydrated();

  // Driver Store
  const drivers = useDriverStore((state) => state.drivers);
  const isDriverStoreHydrated = useIsDriverStoreHydratedHook();

  // Vehicle Store
  const vehicles = useVehicleStore((state) => state.vehicles);
  const isVehicleStoreHydrated = useIsVehicleStoreHydrated();


  // Local state
  const [hasMounted, setHasMounted] = useState(false);
  const [approvedShipments, setApprovedShipments] = useState<Booking[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<string[]>([]);
  const [isManualFormOpen, setIsManualFormOpen] = useState(false);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const { toast } = useToast();
  const [manualEstimatedPrice, setManualEstimatedPrice] = useState(0);
  const [manualRateUsed, setManualRateUsed] = useState<string>("");


  // Form instance for manual shipment
  const manualShipmentForm = useForm<ManualShipmentFormValues>({
    resolver: zodResolver(manualShipmentSchema),
    defaultValues: {
      trackingId: "",
      senderName: "",
      senderAddress: "",
      senderPhone: "",
      senderEmail: "",
      receiverName: "",
      receiverAddress: "",
      receiverPhone: "",
      receiverEmail: "",
      cargoType: "",
      weight: undefined,
      volume: undefined,
      numberOfItems: 1,
      items: [{ name: "" }],
      origin: "",
      destination: "",
      specialInstructions: "",
      initialShipmentStatus: undefined, // Default to undefined
      assignedVehicleId: null,
      assignedDriverName: null,
      estimatedDelivery: undefined,
      bookedByUsername: 'Admin', // Default manual bookings to Admin
    },
    mode: 'onChange',
  });

   const watchedNumberOfItems = manualShipmentForm.watch('numberOfItems');
   const watchedManualFields = manualShipmentForm.watch(['weight', 'volume', 'cargoType', 'origin', 'destination', 'numberOfItems']);


  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Populate available vehicles and drivers once stores are hydrated
  useEffect(() => {
    if (isVehicleStoreHydrated) {
       // Filter vehicles that are 'Available' or 'In Use'
      const usableVehicles = vehicles.filter(v => v.status === 'Available' || v.status === 'In Use');
      setAvailableVehicles(usableVehicles);
    }
  }, [isVehicleStoreHydrated, vehicles]);

  useEffect(() => {
    if (isDriverStoreHydrated) {
      // Extract unique, active driver names
      const activeDrivers = drivers
          .filter(d => d.status === 'Active')
          .map(d => d.name);
      setAvailableDrivers(activeDrivers);
    }
  }, [isDriverStoreHydrated, drivers]);


  // Filter bookings to show only approved ones as shipments
  useEffect(() => {
    if (isBookingStoreHydrated) {
      // Combine approved bookings and manually added shipments (which are always approved)
      const filtered = allBookings.filter(booking => booking.status === 'Approved');
      setApprovedShipments(filtered);
    }
  }, [allBookings, isBookingStoreHydrated]);

   // Effect to update estimated price for manual form
    useEffect(() => {
        const [weight, volume, cargoType, origin, destination, numberOfItems] = watchedManualFields;
        const { price, rateUsed: calculatedRate } = calculateEstimatedPrice({ weight, volume, cargoType, origin, destination, numberOfItems });
        setManualEstimatedPrice(price);
        setManualRateUsed(calculatedRate);
    }, [watchedManualFields]);


  // Handler for updating shipment status (uses addShipmentHistoryEntry)
  const handleUpdateStatus = (bookingId: string, newStatus: ShipmentProgressStatus, location?: string, remarks?: string) => {
    addShipmentHistoryEntry(bookingId, { status: newStatus, location, remarks });
    console.log(`Shipment (Booking ID ${bookingId}) status update requested to ${newStatus}`);
  };

  // Handler for updating shipment assignment (delegates to the store)
  const handleUpdateAssignment = (bookingId: string, vehicleId: string | null, driverName: string | null) => {
    updateShipmentAssignment(bookingId, vehicleId, driverName);
    console.log(`Shipment (Booking ID ${bookingId}) assignment requested - Vehicle: ${vehicleId}, Driver: ${driverName}`);
  };

   // Handler to open the manual shipment form
  const handleOpenManualForm = () => {
    manualShipmentForm.reset(); // Reset form to defaults
    setManualEstimatedPrice(0); // Reset price display
    setManualRateUsed("");
    setIsManualFormOpen(true);
  };

  // Handler for submitting the manual shipment form
  const onManualSubmit: SubmitHandler<ManualShipmentFormValues> = async (data) => {
    setIsSubmittingManual(true);
    console.log("Submitting Manual Shipment Data:", data);

     // Generate tracking ID if not provided by the user
    const finalTrackingId = data.trackingId || `CTM${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Generate Product IDs for each item
    const itemsWithProductIds: ShipmentItem[] = (data.items || []).map((item, index) => ({
        productId: `${finalTrackingId}-${index + 1}`, // Use final tracking ID
        name: item.name,
    }));


    try {
        // Call the store action with the potentially generated tracking ID and item IDs
        const newBookingId = addManualShipment({
            ...data,
            trackingId: finalTrackingId, // Pass the final tracking ID
            items: itemsWithProductIds, // Pass items with generated product IDs
            numberOfItems: itemsWithProductIds.length, // Ensure number of items matches
             assignedVehicleId: data.assignedVehicleId === "" ? null : data.assignedVehicleId, // Handle empty string
             assignedDriverName: data.assignedDriverName === "" ? null : data.assignedDriverName, // Handle empty string
        });

        toast({
            title: "Manual Shipment Added",
            description: `Shipment with Tracking ID ${finalTrackingId} (Booking Ref: ${newBookingId}) added successfully.`,
        });
        setIsManualFormOpen(false); // Close the dialog

    } catch (error) {
        console.error("Failed to add manual shipment:", error);
        toast({
            variant: "destructive",
            title: "Error Adding Shipment",
            description: `Could not add manual shipment. ${error instanceof Error ? error.message : 'Please try again.'}`,
        });
    } finally {
       setIsSubmittingManual(false);
    }
  };

   // Effect to sync items array with numberOfItems
    useEffect(() => {
      const currentItems = manualShipmentForm.getValues('items') || [];
      const targetLength = watchedNumberOfItems > 0 ? watchedNumberOfItems : 0; // Ensure target length is non-negative

      if (currentItems.length !== targetLength) {
         const newItems = Array(targetLength).fill(null).map((_, index) => ({
              name: currentItems[index]?.name || "", // Keep existing name or set to empty string
              productId: currentItems[index]?.productId || '', // Keep existing product ID if editing, empty for new
          }));
         manualShipmentForm.setValue('items', newItems, { shouldValidate: true, shouldDirty: true });
      }
      // No need to trigger validation manually here, setValue with shouldValidate does it.
  }, [watchedNumberOfItems, manualShipmentForm]);


  // Render loading state until hydration complete for all relevant stores
  if (!hasMounted || !isBookingStoreHydrated || !isDriverStoreHydrated || !isVehicleStoreHydrated) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Manage Shipments</h1>
          <Button disabled>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Shipment (Manual)
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Shipment List</CardTitle>
            <CardDescription>Loading shipment data...</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Shipments</h1>
         <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleOpenManualForm}>
           <PlusCircle className="mr-2 h-4 w-4" /> Add New Shipment (Manual)
         </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Active Shipments List</CardTitle>
          <CardDescription>Includes approved bookings and manually added shipments.</CardDescription>
        </CardHeader>
        <CardContent>
          {approvedShipments.length > 0 ? (
            <ShipmentsTable
              data={approvedShipments}
              onUpdateStatus={handleUpdateStatus} // Pass the new handler
              onUpdateAssignment={handleUpdateAssignment}
              availableVehicles={availableVehicles}
              availableDrivers={availableDrivers}
              shipmentStatusOptions={shipmentStatusOptions} // Pass status options
            />
          ) : (
            <p className="text-muted-foreground text-center py-4">No active shipments found. Approve bookings or add manually.</p>
          )}
        </CardContent>
      </Card>

      {/* Dialog for Adding Manual Shipment */}
      <Dialog open={isManualFormOpen} onOpenChange={setIsManualFormOpen}>
        <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Add New Shipment Manually</DialogTitle>
              <DialogDescription>
                Enter the details for a new shipment record directly. A booking reference will be created automatically.
              </DialogDescription>
            </DialogHeader>
             <Form {...manualShipmentForm}>
              <form onSubmit={manualShipmentForm.handleSubmit(onManualSubmit)} noValidate className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">

                 {/* Tracking ID (Optional Manual Entry) */}
                 <FormField
                    control={manualShipmentForm.control}
                    name="trackingId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tracking ID <span className="text-xs text-muted-foreground">(Optional - Auto-generated if blank)</span></FormLabel>
                        <FormControl>
                        <Input Icon={ScanLine} placeholder="e.g., CTM123XYZ (min 5 chars if entered)" {...field} value={field.value ?? ''} disabled={isSubmittingManual}/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                 <Separator className="my-2" />

                 {/* Sender Info */}
                 <h4 className="font-semibold text-lg mb-[-10px]">Sender Details</h4>
                 <FormField control={manualShipmentForm.control} name="senderName" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input Icon={User} placeholder="Sender's Name" {...field} disabled={isSubmittingManual}/></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={manualShipmentForm.control} name="senderAddress" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Textarea Icon={HomeIcon} placeholder="Sender's Full Address" {...field} disabled={isSubmittingManual}/></FormControl><FormMessage /></FormItem>)} />
                 <div className="grid grid-cols-2 gap-4">
                    <FormField control={manualShipmentForm.control} name="senderPhone" render={({ field }) => (<FormItem><FormLabel>Phone <span className="text-xs text-muted-foreground">(Opt.)</span></FormLabel><FormControl><Input Icon={Phone} type="tel" placeholder="Sender's Phone" {...field} disabled={isSubmittingManual}/></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={manualShipmentForm.control} name="senderEmail" render={({ field }) => (<FormItem><FormLabel>Email <span className="text-xs text-muted-foreground">(Opt.)</span></FormLabel><FormControl><Input Icon={Mail} type="email" placeholder="Sender's Email" {...field} disabled={isSubmittingManual}/></FormControl><FormMessage /></FormItem>)} />
                 </div>

                 <Separator className="my-2" />

                  {/* Receiver Info */}
                 <h4 className="font-semibold text-lg mb-[-10px]">Receiver Details</h4>
                 <FormField control={manualShipmentForm.control} name="receiverName" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input Icon={User} placeholder="Receiver's Name" {...field} disabled={isSubmittingManual}/></FormControl><FormMessage /></FormItem>)} />
                 <FormField control={manualShipmentForm.control} name="receiverAddress" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Textarea Icon={HomeIcon} placeholder="Receiver's Full Address" {...field} disabled={isSubmittingManual}/></FormControl><FormMessage /></FormItem>)} />
                 <div className="grid grid-cols-2 gap-4">
                    <FormField control={manualShipmentForm.control} name="receiverPhone" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input Icon={Phone} type="tel" placeholder="Receiver's Phone" {...field} disabled={isSubmittingManual}/></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={manualShipmentForm.control} name="receiverEmail" render={({ field }) => (<FormItem><FormLabel>Email <span className="text-xs text-muted-foreground">(Opt.)</span></FormLabel><FormControl><Input Icon={Mail} type="email" placeholder="Receiver's Email" {...field} disabled={isSubmittingManual}/></FormControl><FormMessage /></FormItem>)} />
                 </div>

                <Separator className="my-2" />

                 {/* Cargo & Route Info */}
                 <h4 className="font-semibold text-lg mb-[-10px]">Cargo & Route Details</h4>
                 <div className="grid grid-cols-2 gap-4">
                     <FormField control={manualShipmentForm.control} name="origin" render={({ field }) => (<FormItem><FormLabel>Origin</FormLabel><FormControl><Input Icon={MapPin} placeholder="Origin City/Area" {...field} disabled={isSubmittingManual}/></FormControl><FormMessage /></FormItem>)} />
                     <FormField control={manualShipmentForm.control} name="destination" render={({ field }) => (<FormItem><FormLabel>Destination</FormLabel><FormControl><Input Icon={MapPin} placeholder="Destination City/Area" {...field} disabled={isSubmittingManual}/></FormControl><FormMessage /></FormItem>)} />
                 </div>
                <FormField
                    control={manualShipmentForm.control}
                    name="cargoType"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Cargo Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isSubmittingManual}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select cargo type" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {/* Reusing options from book page */}
                            <SelectItem value="General Goods">General Goods</SelectItem>
                            <SelectItem value="Perishable">Perishable Goods</SelectItem>
                            <SelectItem value="Hazardous">Hazardous Materials</SelectItem>
                            <SelectItem value="Fragile">Fragile Items</SelectItem>
                            <SelectItem value="Oversized">Oversized Cargo</SelectItem>
                            <SelectItem value="Documents">Documents</SelectItem>
                            <SelectItem value="Electronics">Electronics</SelectItem>
                            <SelectItem value="Furniture">Furniture</SelectItem>
                            <SelectItem value="Other">Other (Specify Below)</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <div className="grid grid-cols-2 gap-4">
                     <FormField control={manualShipmentForm.control} name="weight" render={({ field }) => (<FormItem><FormLabel>Weight (kg)</FormLabel><FormControl><Input Icon={Scale} type="text" inputMode="decimal" placeholder="e.g., 50" {...field} onChange={e => field.onChange(e.target.value)} value={field.value ?? ''} disabled={isSubmittingManual}/></FormControl><FormMessage /></FormItem>)} />
                     <FormField control={manualShipmentForm.control} name="volume" render={({ field }) => (<FormItem><FormLabel>Volume (m³) <span className="text-xs text-muted-foreground">(Opt.)</span></FormLabel><FormControl><Input Icon={Maximize} type="text" inputMode="decimal" placeholder="e.g., 1.2" {...field} onChange={e => field.onChange(e.target.value)} value={field.value ?? ''} disabled={isSubmittingManual}/></FormControl><FormMessage /></FormItem>)} />
                 </div>

                  {/* Number of Items */}
                             <FormField
                                control={manualShipmentForm.control}
                                name="numberOfItems"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Number of Items</FormLabel>
                                     <FormControl>
                                         <Input
                                            Icon={Hash}
                                            type="number"
                                            min="1"
                                            max="50" // Consistent with validation
                                            step="1"
                                            placeholder="e.g., 3"
                                            {...field}
                                            onChange={e => field.onChange(parseInt(e.target.value, 10) || 1)} // Ensure integer, default to 1 if invalid
                                            value={field.value === undefined ? '' : String(field.value)}
                                            disabled={isSubmittingManual}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />

                             {/* Dynamic Item Name Fields */}
                            {watchedNumberOfItems > 0 && (
                                <div className="space-y-3 pt-2">
                                    <Label>Item Details</Label>
                                    <Separator />
                                    {Array.from({ length: watchedNumberOfItems }).map((_, index) => (
                                        <FormField
                                        key={index}
                                        control={manualShipmentForm.control}
                                        name={`items.${index}.name`} // Updated name to target nested property
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel className="text-xs font-normal">Item #{index + 1} Name/Description</FormLabel>
                                            <FormControl>
                                                <Input
                                                Icon={Package}
                                                placeholder={`Enter name/description for item ${index + 1}`}
                                                {...field}
                                                value={field.value ?? ''} // Ensure value is controlled, default to empty string
                                                disabled={isSubmittingManual}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                    ))}
                                    {/* Display top-level refine error if applicable */}
                                     {manualShipmentForm.formState.errors.items?.root?.message && (
                                        <p className="text-sm font-medium text-destructive">{manualShipmentForm.formState.errors.items.root.message}</p>
                                    )}
                                </div>
                            )}

                 <FormField control={manualShipmentForm.control} name="specialInstructions" render={({ field }) => (<FormItem><FormLabel>Special Instructions <span className="text-xs text-muted-foreground">(Opt.)</span></FormLabel><FormControl><Textarea Icon={Info} placeholder="Any specific handling notes..." {...field} disabled={isSubmittingManual}/></FormControl><FormMessage /></FormItem>)} />

                  {/* Estimated Price Display */}
                   <Card className="bg-secondary p-3 border border-accent/30 mt-2">
                        <CardTitle className="text-md mb-1 flex items-center">
                           <IndianRupee className="mr-1 h-4 w-4 text-accent"/> Estimated Price
                        </CardTitle>
                         {manualEstimatedPrice > 0 ? (
                             <>
                                <p className="text-lg font-bold text-accent">₹ {manualEstimatedPrice.toLocaleString('en-IN')}</p>
                                <CardDescription className="text-xs mt-1">
                                     Based on: {manualRateUsed || 'N/A'}
                                </CardDescription>
                             </>
                         ) : (
                             <CardDescription className="text-xs">Enter weight/volume/route to calculate.</CardDescription>
                         )}
                    </Card>

                 <Separator className="my-2" />

                 {/* Shipment Status & Assignment */}
                 <h4 className="font-semibold text-lg mb-[-10px]">Initial Status & Assignment</h4>
                  <FormField
                    control={manualShipmentForm.control}
                    name="initialShipmentStatus"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Initial Shipment Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isSubmittingManual}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select initial status" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {/* Offer only relevant starting statuses */}
                            <SelectItem value="Awaiting Dispatch">Awaiting Dispatch</SelectItem>
                            <SelectItem value="Dispatched">Dispatched</SelectItem>
                            <SelectItem value="In Transit">In Transit</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <div className="grid grid-cols-2 gap-4">
                     <FormField
                        control={manualShipmentForm.control}
                        name="assignedVehicleId"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Assign Vehicle <span className="text-xs text-muted-foreground">(Opt.)</span></FormLabel>
                            <Select onValueChange={(value) => field.onChange(value === 'unassign' ? null : value)} value={field.value ?? 'unassign'} disabled={isSubmittingManual}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Assign Vehicle" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                 <SelectItem value="unassign">-- Unassigned --</SelectItem>
                                {availableVehicles.map(vehicle => (
                                <SelectItem key={vehicle.id} value={vehicle.id}>
                                    {vehicle.id} ({vehicle.type})
                                </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={manualShipmentForm.control}
                        name="assignedDriverName"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Assign Driver <span className="text-xs text-muted-foreground">(Opt.)</span></FormLabel>
                            <Select onValueChange={(value) => field.onChange(value === 'unassign' ? null : value)} value={field.value ?? 'unassign'} disabled={isSubmittingManual}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Assign Driver" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="unassign">-- Unassigned --</SelectItem>
                                {availableDrivers.map(driverName => (
                                    <SelectItem key={driverName} value={driverName}>
                                        {driverName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>

                  <FormField
                    control={manualShipmentForm.control}
                    name="estimatedDelivery"
                    render={({ field }) => (
                        <FormItem className="flex flex-col pt-2">
                        <FormLabel>Est. Delivery Date <span className="text-xs text-muted-foreground">(Opt.)</span></FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                disabled={isSubmittingManual}
                                >
                                {field.value ? (
                                    format(field.value, "PPP")
                                ) : (
                                    <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                // Optionally disable past dates
                                // disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                 />


                 <DialogFooter className="mt-4">
                    <DialogClose asChild>
                        <Button type="button" variant="outline" disabled={isSubmittingManual}>Cancel</Button>
                    </DialogClose>
                    <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSubmittingManual}>
                         {isSubmittingManual ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
                            </>
                         ) : (
                           <>
                               <PlusCircle className="mr-2 h-4 w-4" /> Add Shipment
                           </>
                         )}
                    </Button>
                 </DialogFooter>
              </form>
             </Form>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// src/app/book/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2, ScanLine, User, Phone, Mail, Home as HomeIcon, MapPin, Scale, Maximize, Info, IndianRupee, Package, List, Hash, LogIn, CreditCard, Smartphone, Truck as TruckIcon } from 'lucide-react';
import Image from 'next/image';
import { useBookingStore, useIsBookingStoreHydrated } from '@/stores/booking-store';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import type { ShipmentItem, PaymentMethod } from '@/types/booking-types';
import { useAuthStore, useIsAuthStoreHydrated } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { calculateEstimatedPrice } from '@/lib/pricing';

// Define Zod schema for validation - Updated for items array and payment method
const bookingSchema = z.object({
  // Sender Details - Will be pre-filled if user is logged in
  senderName: z.string().min(2, { message: "Sender name requires at least 2 characters" }),
  senderEmail: z.string().email({ message: "Invalid sender email address" }),
  senderPhone: z.string().min(10, { message: "Sender phone number requires at least 10 digits" }),
  senderAddress: z.string().min(5, { message: "Sender address requires at least 5 characters" }),

  // Receiver Details
  receiverName: z.string().min(2, { message: "Receiver name requires at least 2 characters" }),
  receiverEmail: z.string().email({ message: "Invalid receiver email address" }).optional().or(z.literal('')), // Optional
  receiverPhone: z.string().min(10, { message: "Receiver phone number requires at least 10 digits" }),
  receiverAddress: z.string().min(5, { message: "Receiver address requires at least 5 characters" }), // Destination address

   // Cargo Details
  cargoType: z.string().min(1, { message: "Cargo type is required" }),
  weight: z.preprocess(
    (val) => Number(String(val)), // Convert input to number
    z.number({ invalid_type_error: "Weight must be a number", required_error: "Weight is required" }).positive({ message: "Weight must be positive" })
  ),
  volume: z.preprocess(
    (val) => val ? Number(String(val)) : undefined, // Convert input to number only if provided
    z.number({ invalid_type_error: "Volume must be a number" }).positive({ message: "Volume must be positive" }).optional() // Assuming volume is optional
  ),
   numberOfItems: z.preprocess(
     (val) => Number(String(val)),
     z.number({ invalid_type_error: "Number of items must be a number", required_error: "Number of items is required" }).int().positive({ message: "Must have at least 1 item" }).max(50, { message: "Maximum 50 items allowed per booking" })
   ),
   // Update schema for items: array of objects with name and productId properties
   items: z.array(z.object({
       name: z.string().min(1, { message: "Item name cannot be empty" }),
       productId: z.string().optional() // Product ID will be generated later, so it's optional here
    })).optional(),
  origin: z.string().min(3, { message: "Origin requires at least 3 characters" }), // Keep for clarity, though senderAddress might suffice
  destination: z.string().min(3, { message: "Destination requires at least 3 characters" }), // Keep for clarity, though receiverAddress might suffice
  specialInstructions: z.string().optional(),
  paymentMethod: z.enum(['UPI', 'Card', 'Cash on Delivery'], { required_error: "Please select a payment method" }),
}).refine(data => {
   // Custom validation: Ensure items array length matches numberOfItems
   return !data.numberOfItems || !data.items || data.items.length === data.numberOfItems;
 }, {
   message: "Number of item details must match the specified number of items.",
   path: ["items"], // Associate the error with the items field if needed
 });


type BookingFormValues = z.infer<typeof bookingSchema>;

// Mock function to generate a tracking ID and QR code URL
const generateTrackingInfo = async (formData: BookingFormValues) => {
    console.log("Generating tracking info for booking:", formData); // Log input
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate external service call if needed
    const trackingId = `CT${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    // Use a QR code generator API (replace with a real one if needed)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TrackingID:${trackingId},Sender:${formData.senderName},Receiver:${formData.receiverName},Origin:${formData.origin},Destination:${formData.destination}`;
    console.log("Generated Tracking Info:", { trackingId, qrCodeUrl });
    return { trackingId, qrCodeUrl };
};


export default function BookCargoPage() {
  const router = useRouter();
  const { currentUser, users: userCredentials, _hasHydrated: isAuthStoreHydrated } = useAuthStore(); // Get user state
  const isBookingStoreHydrated = useIsBookingStoreHydrated(); // Use hydration hook
  const addBooking = useBookingStore((state) => state.addBooking); // Get addBooking action from store
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState<{ trackingId: string; qrCodeUrl: string } | null>(null);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [rateUsed, setRateUsed] = useState<string>("");
  const [hasMounted, setHasMounted] = useState(false); // Track component mount

  const isReady = isAuthStoreHydrated && isBookingStoreHydrated && hasMounted;

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      senderName: "",
      senderEmail: "",
      senderPhone: "",
      senderAddress: "",
      receiverName: "",
      receiverEmail: "",
      receiverPhone: "",
      receiverAddress: "",
      cargoType: "",
      weight: undefined,
      volume: undefined,
      numberOfItems: 1, // Default to 1 item
      items: [{ name: "", productId: "" }], // Default to one item object with empty name and productId
      origin: "",
      destination: "",
      specialInstructions: "",
      paymentMethod: undefined,
    },
    mode: 'onChange', // Trigger validation and updates on change
  });

  useEffect(() => {
      setHasMounted(true);
      // Redirect if not logged in and store is ready
      if (isAuthStoreHydrated && !currentUser) {
          toast({
              title: "Login Required",
              description: "Please log in to book a shipment.",
              variant: "destructive",
          });
          router.push(`/login?redirect=/book`); // Redirect to login, passing intended destination
      }
  }, [isAuthStoreHydrated, currentUser, router, toast]);

   // Pre-fill sender details if user is logged in
   useEffect(() => {
    if (currentUser && isReady && userCredentials[currentUser]) {
      const userData = userCredentials[currentUser];
      form.reset({
        ...form.getValues(), // Keep other potentially filled values
        senderName: userData.name || currentUser, // Use real name, fallback to username
        senderEmail: userData.email || '', // Use stored email or empty
        senderPhone: userData.phone || '', // Use stored phone
        senderAddress: userData.address || '', // Use stored address
      });
    }
  }, [currentUser, isReady, form, userCredentials]);


  const watchedFields = form.watch(['weight', 'volume', 'cargoType', 'origin', 'destination', 'numberOfItems']); // Added numberOfItems
  const watchedNumberOfItems = form.watch('numberOfItems'); // Watch number of items


   // Effect to update estimated price when relevant fields change
   useEffect(() => {
       const [weight, volume, cargoType, origin, destination, numberOfItems] = watchedFields; // Added numberOfItems
       const { price, rateUsed: calculatedRate } = calculateEstimatedPrice({ weight, volume, cargoType, origin, destination, numberOfItems }); // Pass numberOfItems
       setEstimatedPrice(price);
       setRateUsed(calculatedRate);
   }, [watchedFields]); // Dependency array includes watched fields


  const senderAddress = form.watch('senderAddress');
  const receiverAddress = form.watch('receiverAddress');

  // Effect to update origin based on sender address
  useEffect(() => {
      // You might parse city/country from the address here if needed
      // For simplicity, we just copy the full address for now
      if (senderAddress && !form.getValues('origin')) {
        form.setValue('origin', senderAddress, { shouldValidate: true });
      }
    }, [senderAddress, form]);

   // Effect to update destination based on receiver address
   useEffect(() => {
      if (receiverAddress && !form.getValues('destination')) {
        form.setValue('destination', receiverAddress, { shouldValidate: true });
      }
    }, [receiverAddress, form]);

    // Effect to sync items array with numberOfItems
    useEffect(() => {
      const currentItems = form.getValues('items') || [];
      const targetLength = watchedNumberOfItems > 0 ? watchedNumberOfItems : 0; // Ensure target length is non-negative

      if (currentItems.length !== targetLength) {
         const newItems = Array(targetLength).fill(null).map((_, index) => ({
              name: currentItems[index]?.name || "", // Keep existing name or set to empty string
              productId: currentItems[index]?.productId || '', // Keep existing product ID if editing, empty for new
          }));
         form.setValue('items', newItems, { shouldValidate: true, shouldDirty: true });
      }
  }, [watchedNumberOfItems, form]);


  const onSubmit: SubmitHandler<BookingFormValues> = async (data) => {
    if (!currentUser) {
         toast({ title: "Error", description: "You must be logged in to submit a booking.", variant: "destructive" });
         router.push('/login?redirect=/book');
         return;
     }

    if (isLoading || !isReady) {
        console.log("Submission prevented: isLoading =", isLoading, "isReady =", isReady);
        if (!isReady) {
           toast({
            variant: "destructive",
            title: "System Busy",
            description: "Please wait a moment for the booking system to initialize.",
          });
        }
        return;
    }
    setIsLoading(true);
    setBookingResult(null);
    console.log('Submitting Booking Data:', data);

    try {
      const { trackingId, qrCodeUrl } = await generateTrackingInfo(data);
      const itemsWithProductIds: ShipmentItem[] = (data.items || []).map((item, index) => ({
        productId: `${trackingId}-P${index + 1}`,
        name: item.name,
      }));

      const newBookingData = {
        ...data,
        trackingId,
        items: itemsWithProductIds,
        numberOfItems: itemsWithProductIds.length,
        bookedByUsername: currentUser,
        estimatedPrice: estimatedPrice,
        rateUsed: rateUsed,
        paymentMethod: data.paymentMethod,
      };
      addBooking(newBookingData);

      console.log("Booking successfully added to store with Tracking ID:", trackingId);

      if (data.paymentMethod === 'UPI') {
        toast({
          title: "Booking Initiated",
          description: `Proceed to UPI payment. Tracking ID: ${trackingId}`,
        });
        router.push(`/payment/upi?trackingId=${trackingId}&amount=${estimatedPrice}&receiverName=${encodeURIComponent(data.receiverName)}`);
      } else if (data.paymentMethod === 'Card') {
        toast({
          title: "Booking Initiated",
          description: `Proceed to Card payment. Tracking ID: ${trackingId}`,
        });
        router.push(`/payment/card?trackingId=${trackingId}&amount=${estimatedPrice}&receiverName=${encodeURIComponent(data.receiverName)}`);
      } else {
        setBookingResult({ trackingId, qrCodeUrl });
        toast({
          title: "Booking Submitted!",
          description: `Your shipment booking is pending approval. Tracking ID: ${trackingId}`,
        });
        form.reset();
        if (currentUser && userCredentials[currentUser]) {
             const userData = userCredentials[currentUser];
             form.setValue('senderName', userData.name || currentUser);
             form.setValue('senderEmail', userData.email || '');
             form.setValue('senderPhone', userData.phone || '');
             form.setValue('senderAddress', userData.address || '');
         }
      }
       console.log("Form reset successfully (if not UPI/Card).");

    } catch (error) {
      console.error("Booking submission failed:", error);
       toast({
        variant: "destructive",
        title: "Booking Failed",
        description: `Could not complete booking. ${error instanceof Error ? error.message : 'Please try again.'}`,
      });
    } finally {
       console.log("Setting isLoading to false.");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (form.formState.errors && Object.keys(form.formState.errors).length > 0) {
        console.log("Form Validation Errors:", form.formState.errors);
    }
  }, [form.formState.errors]);

   if (!isReady) {
     return (
       <div className="container mx-auto px-4 py-12 text-center">
         <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
         <p className="text-muted-foreground">Initializing booking system...</p>
       </div>
     );
   }

    if (!currentUser) {
     return (
       <div className="container mx-auto px-4 py-12 flex flex-col items-center text-center">
         <Card className="w-full max-w-md">
            <CardHeader>
                 <CardTitle>Login Required</CardTitle>
                 <CardDescription>You need to be logged in to book a shipment.</CardDescription>
            </CardHeader>
            <CardContent>
                <Link href="/login?redirect=/book">
                    <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                       <LogIn className="mr-2 h-4 w-4"/> Go to Login
                    </Button>
                </Link>
             </CardContent>
         </Card>
       </div>
     );
   }


  return (
    <div className="container mx-auto px-4 py-12">
        {!bookingResult ? (
            <Card className="max-w-3xl mx-auto shadow-lg">
                <CardHeader>
                <CardTitle className="text-3xl">Book Your Cargo Shipment</CardTitle>
                <CardDescription>Fill in the sender, receiver, and cargo details below.</CardDescription>
                </CardHeader>
                <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-8">

                     {/* Sender Details Section */}
                    <Card className="p-6 border-accent/50">
                        <CardHeader className="p-0 pb-4">
                            <CardTitle className="text-xl">Sender Information</CardTitle>
                             <CardDescription>Details are pre-filled from your account.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 space-y-4">
                             <FormField
                                control={form.control}
                                name="senderName"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                    <Input Icon={User} placeholder="Enter sender's full name" {...field} disabled={isLoading || !!currentUser} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <FormField
                                    control={form.control}
                                    name="senderEmail"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                        <Input Icon={Mail} type="email" placeholder="sender@example.com" {...field} disabled={isLoading || !!currentUser}/>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="senderPhone"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone Number</FormLabel>
                                        <FormControl>
                                        <Input Icon={Phone} type="tel" placeholder="Enter sender's phone" {...field} disabled={isLoading || !!currentUser}/>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="senderAddress"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address (Pickup Location)</FormLabel>
                                    <FormControl>
                                    <Textarea Icon={HomeIcon} placeholder="Enter sender's full address (Street, City, State, ZIP, Country)" {...field} disabled={isLoading || !!currentUser}/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="origin"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Origin City/Region</FormLabel>
                                    <FormControl>
                                      <Input Icon={MapPin} placeholder="Derived from address (e.g., City, State)" {...field} disabled={isLoading}/>
                                    </FormControl>
                                     <FormDescription>This is often derived from the address but can be refined.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                     {/* Receiver Details Section */}
                    <Card className="p-6 border-accent/50">
                         <CardHeader className="p-0 pb-4">
                            <CardTitle className="text-xl">Receiver Information</CardTitle>
                        </CardHeader>
                         <CardContent className="p-0 space-y-4">
                           <FormField
                                control={form.control}
                                name="receiverName"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                    <Input Icon={User} placeholder="Enter receiver's full name" {...field} disabled={isLoading}/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <FormField
                                    control={form.control}
                                    name="receiverEmail"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email <span className="text-xs text-muted-foreground">(Optional)</span></FormLabel>
                                        <FormControl>
                                        <Input Icon={Mail} type="email" placeholder="receiver@example.com" {...field} disabled={isLoading}/>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="receiverPhone"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone Number</FormLabel>
                                        <FormControl>
                                        <Input Icon={Phone} type="tel" placeholder="Enter receiver's phone" {...field} disabled={isLoading}/>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="receiverAddress"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address (Delivery Location)</FormLabel>
                                    <FormControl>
                                    <Textarea Icon={HomeIcon} placeholder="Enter receiver's full address (Street, City, State, ZIP, Country)" {...field} disabled={isLoading}/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                           <FormField
                                control={form.control}
                                name="destination"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Destination City/Region</FormLabel>
                                     <FormControl>
                                      <Input Icon={MapPin} placeholder="Derived from address (e.g., City, State)" {...field} disabled={isLoading} />
                                    </FormControl>
                                     <FormDescription>This is often derived from the address but can be refined.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>


                    {/* Cargo Details Section */}
                     <Card className="p-6 border-accent/50">
                         <CardHeader className="p-0 pb-4">
                            <CardTitle className="text-xl">Cargo Details</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 space-y-4">
                            <FormField
                                control={form.control}
                                name="cargoType"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cargo Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                                    <FormControl>
                                        <SelectTrigger>
                                        <SelectValue placeholder="Select cargo type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                control={form.control}
                                name="weight"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Total Weight (kg)</FormLabel>
                                    <FormControl>
                                        <Input Icon={Scale} type="text" inputMode="decimal" placeholder="e.g., 500" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.value)} value={field.value === undefined ? '' : String(field.value)} disabled={isLoading} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <FormField
                                control={form.control}
                                name="volume"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Total Volume (m³) <span className="text-xs text-muted-foreground">(Optional)</span></FormLabel>
                                    <FormControl>
                                        <Input Icon={Maximize} type="text" inputMode="decimal" placeholder="e.g., 2.5" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.value)} value={field.value === undefined ? '' : String(field.value)} disabled={isLoading}/>
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                            </div>

                             {/* Number of Items */}
                             <FormField
                                control={form.control}
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
                                            disabled={isLoading}
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
                                        control={form.control}
                                        name={`items.${index}.name`}
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel className="text-xs font-normal">Item #{index + 1} Name/Description</FormLabel>
                                            <FormControl>
                                                <Input
                                                Icon={Package}
                                                placeholder={`Enter name/description for item ${index + 1}`}
                                                {...field}
                                                value={field.value ?? ''}
                                                disabled={isLoading}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                    ))}
                                     {form.formState.errors.items?.root?.message && (
                                        <p className="text-sm font-medium text-destructive">{form.formState.errors.items.root.message}</p>
                                    )}
                                </div>
                            )}


                             <FormField
                                control={form.control}
                                name="specialInstructions"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Special Instructions <span className="text-xs text-muted-foreground">(Optional)</span></FormLabel>
                                    <FormControl>
                                    <Textarea Icon={Info} placeholder="e.g., Handle with care, Keep refrigerated, Specify if 'Other' cargo type" {...field} disabled={isLoading}/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </CardContent>
                     </Card>

                    {/* Payment Method Section */}
                    <Card className="p-6 border-accent/50">
                        <CardHeader className="p-0 pb-4">
                            <CardTitle className="text-xl">Payment Method</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <FormField
                                control={form.control}
                                name="paymentMethod"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                    <FormLabel>Select Payment Option</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4"
                                        disabled={isLoading}
                                        >
                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                            <FormControl>
                                            <RadioGroupItem value="UPI" />
                                            </FormControl>
                                            <FormLabel className="font-normal flex items-center gap-2">
                                                <Smartphone className="h-5 w-5 text-muted-foreground" /> UPI
                                            </FormLabel>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                            <FormControl>
                                            <RadioGroupItem value="Card" />
                                            </FormControl>
                                            <FormLabel className="font-normal flex items-center gap-2">
                                               <CreditCard className="h-5 w-5 text-muted-foreground" /> Card (Credit/Debit)
                                            </FormLabel>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                            <FormControl>
                                            <RadioGroupItem value="Cash on Delivery" />
                                            </FormControl>
                                            <FormLabel className="font-normal flex items-center gap-2">
                                                <TruckIcon className="h-5 w-5 text-muted-foreground" /> Cash on Delivery
                                            </FormLabel>
                                        </FormItem>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>


                   {/* Pricing Preview Section */}
                    <Card className="bg-secondary p-4 border border-accent/30">
                        <CardTitle className="text-lg mb-2 flex items-center">
                           <IndianRupee className="mr-2 h-5 w-5 text-accent"/> Estimated Price
                        </CardTitle>
                         {estimatedPrice > 0 ? (
                             <>
                                <p className="text-2xl font-bold text-accent">₹ {estimatedPrice.toLocaleString('en-IN')}</p>
                                <CardDescription className="text-xs mt-1">
                                     Based on: {rateUsed || 'N/A'}. Final price may vary.
                                </CardDescription>
                             </>
                         ) : (
                             <CardDescription>Enter weight or volume to calculate price.</CardDescription>
                         )}
                    </Card>


                    <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isLoading || !form.formState.isDirty || !form.formState.isValid || !isReady || estimatedPrice <= 0}>
                        {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting Booking...
                        </>
                        ) : (
                        <>
                           <Send className="mr-2 h-4 w-4" /> Submit Booking
                        </>
                        )}
                    </Button>
                    </form>
                </Form>
                </CardContent>
            </Card>
        ) : (
             <Card className="max-w-md mx-auto text-center shadow-lg">
                <CardHeader>
                    <ScanLine className="h-12 w-12 mx-auto text-green-600 mb-3"/>
                    <CardTitle className="text-2xl text-green-700">Booking Submitted!</CardTitle>
                    <CardDescription>Your booking is pending approval. Use the Tracking ID for updates once approved.</CardDescription>
                </CardHeader>
                 <CardContent className="space-y-4">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Tracking ID (will be active upon approval)</p>
                        <p className="text-xl font-bold text-accent">{bookingResult.trackingId}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Booking QR Code</p>
                         <Image
                           src={bookingResult.qrCodeUrl}
                           alt={`QR Code for ${bookingResult.trackingId}`}
                           width={150}
                           height={150}
                           className="mx-auto border rounded-md"
                           data-ai-hint="qr code tracking"
                         />
                    </div>
                     <p className="text-xs text-muted-foreground">You will receive email/SMS notifications upon approval and further updates.</p>
                 </CardContent>
                 <CardFooter className="flex-col gap-4">
                      <Button onClick={() => {
                          setBookingResult(null);
                           form.reset();
                           if (currentUser && userCredentials[currentUser]) {
                               const userData = userCredentials[currentUser];
                               form.setValue('senderName', userData.name || currentUser);
                               form.setValue('senderEmail', userData.email || '');
                               form.setValue('senderPhone', userData.phone || '');
                               form.setValue('senderAddress', userData.address || '');
                           }
                      }} variant="outline" className="w-full">
                          Book Another Shipment
                       </Button>
                 </CardFooter>
             </Card>
        )}
    </div>
  );
}

// src/app/profile/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import Link from 'next/link'; // Import Link
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore, useIsAuthStoreHydrated, type UserCredentialsData } from '@/stores/auth-store';
import { useBookingStore, useIsBookingStoreHydrated as useIsBookingStoreHydratedHook } from '@/stores/booking-store';
import type { Booking } from '@/types/booking-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, User, Mail, Phone, Home as HomeIcon, FileText, LogIn, CircleCheck, Hourglass, AlertTriangle, Ban, Truck, Anchor, Warehouse, IndianRupee } from 'lucide-react'; // Added IndianRupee
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

// Zod schema for profile update validation (excluding username and password)
const profileUpdateSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().min(10, { message: "Phone number requires at least 10 digits" }),
  address: z.string().min(5, { message: "Address requires at least 5 characters" }),
});

type ProfileUpdateFormValues = z.infer<typeof profileUpdateSchema>;

// Function to get badge variant based on booking status
const getBookingStatusBadgeVariant = (status: Booking['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
        case 'Approved': return 'default';
        case 'Pending': return 'secondary';
        case 'Rejected': return 'destructive';
        default: return 'outline';
    }
};

// Function to get badge variant and icon based on shipment status
const getShipmentStatusInfo = (status: Booking['shipmentStatus']): { variant: "default" | "secondary" | "destructive" | "outline"; Icon: React.ElementType } => {
    if (!status) return { variant: 'outline', Icon: Hourglass };
    switch (status) {
        case 'Delivered': return { variant: 'default', Icon: CircleCheck };
        case 'Awaiting Dispatch': return { variant: 'secondary', Icon: Hourglass };
        case 'Dispatched': return { variant: 'secondary', Icon: Truck };
        case 'In Transit': return { variant: 'secondary', Icon: Anchor };
        case 'At Hub': return { variant: 'secondary', Icon: Warehouse };
        case 'Out for Delivery': return { variant: 'secondary', Icon: Truck };
        case 'Delayed': return { variant: 'outline', Icon: AlertTriangle };
        case 'Cancelled': return { variant: 'destructive', Icon: Ban };
        default: return { variant: 'outline', Icon: Hourglass };
    }
};


export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();

  // Auth Store
  const { currentUser, users, updateUserProfile, _hasHydrated: isAuthHydrated } = useAuthStore();
  const isAuthReady = useIsAuthStoreHydrated();

  // Booking Store
  const { bookings, _hasHydrated: isBookingHydrated } = useBookingStore();
  const isBookingReady = useIsBookingStoreHydratedHook();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [hasMounted, setHasMounted] = useState(false);

  const isReady = isAuthReady && isBookingReady && hasMounted;

  const form = useForm<ProfileUpdateFormValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
    },
  });

  // Redirect if not logged in and store is ready
  useEffect(() => {
    setHasMounted(true);
    if (isAuthReady && !currentUser) {
      toast({
        title: "Login Required",
        description: "Please log in to view your profile.",
        variant: "destructive",
      });
      router.push(`/login?redirect=/profile`);
    }
  }, [isAuthReady, currentUser, router, toast]);

  // Populate form and filter bookings once ready
  useEffect(() => {
    if (isReady && currentUser && users[currentUser]) {
      const userData = users[currentUser];
      form.reset({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || '',
      });

      // Filter bookings for the current user
      const filteredBookings = bookings.filter(b => b.bookedByUsername === currentUser);
      setUserBookings(filteredBookings);
    }
  }, [isReady, currentUser, users, form, bookings]);

  const onSubmit: SubmitHandler<ProfileUpdateFormValues> = async (data) => {
    if (!currentUser) return; // Should not happen if check above works
    setIsLoading(true);
    try {
       await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
      const result = updateUserProfile(currentUser, data);
      if (result.success) {
        toast({ title: "Profile Updated", description: "Your details have been saved." });
        setIsEditing(false); // Exit editing mode
      } else {
        toast({ variant: "destructive", title: "Update Failed", description: result.message });
      }
    } catch (error) {
       toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred." });
       console.error("Profile update error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading State
  if (!isReady) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  // Login Redirect State (handled by useEffect)
  if (!currentUser) {
     return (
       <div className="container mx-auto px-4 py-12 flex flex-col items-center text-center">
         <Card className="w-full max-w-md">
            <CardHeader>
                 <CardTitle>Login Required</CardTitle>
                 <CardDescription>You need to be logged in to view your profile.</CardDescription>
            </CardHeader>
            <CardContent>
                <Link href="/login?redirect=/profile">
                    <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                       <LogIn className="mr-2 h-4 w-4"/> Go to Login
                    </Button>
                </Link>
             </CardContent>
         </Card>
       </div>
     );
   }

  // User exists, render profile page
   const userData = users[currentUser];

  return (
    <div className="container mx-auto px-4 py-12 space-y-8">
      <h1 className="text-3xl md:text-4xl font-bold">Your Profile</h1>

      {/* Profile Details Card */}
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Account Details</CardTitle>
            <CardDescription>View and update your personal information.</CardDescription>
          </div>
          {!isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>Edit Profile</Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input Icon={User} {...field} disabled={isLoading} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input Icon={Mail} type="email" {...field} disabled={isLoading} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input Icon={Phone} type="tel" {...field} disabled={isLoading} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Textarea Icon={HomeIcon} {...field} disabled={isLoading} /></FormControl><FormMessage /></FormItem>)} />
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="ghost" onClick={() => { setIsEditing(false); form.reset(userData); }} disabled={isLoading}>Cancel</Button> {/* Reset to original userData on cancel */}
                  <Button type="submit" disabled={isLoading || !form.formState.isDirty || !form.formState.isValid} className="bg-accent text-accent-foreground hover:bg-accent/90">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="space-y-3 text-sm">
              <p><strong>Username:</strong> {currentUser}</p>
              <p><strong>Name:</strong> {userData?.name || 'N/A'}</p>
              <p><strong>Email:</strong> {userData?.email || 'N/A'}</p>
              <p><strong>Phone:</strong> {userData?.phone || 'N/A'}</p>
              <p><strong>Address:</strong> {userData?.address || 'N/A'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Booking History Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2"><FileText className="h-6 w-6"/>Booking History</CardTitle>
          <CardDescription>A summary of your past and current shipments.</CardDescription>
        </CardHeader>
        <CardContent>
          {userBookings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking Date</TableHead>
                  <TableHead>Tracking ID</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Est. Price (INR)</TableHead> {/* Added Price Column */}
                  <TableHead>Booking Status</TableHead>
                  <TableHead>Shipment Status</TableHead>
                   <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userBookings.slice(0, 10).map((booking) => { // Show recent 10 bookings
                  const { variant: shipmentVariant, Icon: ShipmentIcon } = getShipmentStatusInfo(booking.shipmentStatus);
                  return (
                     <TableRow key={booking.id}>
                        <TableCell>{format(booking.bookingDate, 'PP')}</TableCell>
                        <TableCell className="font-medium">{booking.trackingId}</TableCell>
                        <TableCell>{booking.destination}</TableCell>
                        <TableCell> {/* Estimated Price Cell */}
                            {booking.estimatedPrice !== undefined ? (
                                <span className="flex items-center gap-1 text-sm">
                                   <IndianRupee className="h-3.5 w-3.5"/>{booking.estimatedPrice.toLocaleString('en-IN')}
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
                        <TableCell>
                            {booking.status === 'Approved' ? (
                                <Badge variant={shipmentVariant} className="flex items-center gap-1 w-fit">
                                    <ShipmentIcon className="h-3 w-3" />
                                    {booking.shipmentStatus || 'Pending'}
                                </Badge>
                            ) : (
                                <span className="text-xs text-muted-foreground">N/A</span>
                            )}
                        </TableCell>
                        <TableCell className="text-right">
                           <Link href={`/track?trackingId=${booking.trackingId}`} passHref>
                              <Button variant="outline" size="sm">Track</Button>
                           </Link>
                        </TableCell>
                     </TableRow>
                   );
                 })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">You haven't booked any shipments yet.</p>
          )}
        </CardContent>
         {userBookings.length > 10 && (
             <CardFooter className="justify-center">
                 <p className="text-sm text-muted-foreground">Showing the 10 most recent bookings.</p>
             </CardFooter>
         )}
      </Card>
    </div>
  );
}

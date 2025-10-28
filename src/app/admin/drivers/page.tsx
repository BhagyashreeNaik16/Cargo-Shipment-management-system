// src/app/admin/drivers/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, User, Phone, Mail, BadgeCheck, BadgeX, CalendarClock, Truck } from 'lucide-react'; // Added icons
import { DriversTable } from '@/components/admin/drivers-table';
import type { Driver, DriverStatus } from '@/types/driver-types';
import { useDriverStore, useIsDriverStoreHydrated } from '@/stores/driver-store';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'; // Added FormDescription
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Zod Schema for Driver Form Validation
const driverSchema = z.object({
  id: z.string().optional(), // Optional for add, required for edit (handled in logic)
  name: z.string().min(2, { message: "Driver name requires at least 2 characters" }),
  contactPhone: z.string().min(10, { message: "Phone number requires at least 10 digits" }),
  contactEmail: z.string().email({ message: "Invalid email address" }).optional().or(z.literal('')),
  licenseNumber: z.string().min(5, { message: "License number requires at least 5 characters" }),
  licenseExpiry: z.date({ required_error: "License expiry date is required" }),
  status: z.enum(['Active', 'Inactive', 'On Leave'], { required_error: "Status is required" }),
  assignedVehicleId: z.string().nullable().optional(), // Allow null or string
  notes: z.string().optional(),
});

type DriverFormValues = z.infer<typeof driverSchema>;

export default function AdminDriversPage() {
  const drivers = useDriverStore((state) => state.drivers);
  const addDriver = useDriverStore((state) => state.addDriver);
  const updateDriver = useDriverStore((state) => state.updateDriver);
  const deleteDriver = useDriverStore((state) => state.deleteDriver);
  const isHydrated = useIsDriverStoreHydrated();
  const [hasMounted, setHasMounted] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const form = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      name: "",
      contactPhone: "",
      contactEmail: "",
      licenseNumber: "",
      licenseExpiry: undefined,
      status: undefined,
      assignedVehicleId: null,
      notes: "",
    },
    mode: 'onChange',
  });

   // Handle opening the form (for add or edit)
  const handleOpenForm = (driver: Driver | null = null) => {
    setEditingDriver(driver);
    if (driver) {
       // Pre-populate form, ensure date is Date object
      form.reset({
        ...driver,
        licenseExpiry: driver.licenseExpiry ? new Date(driver.licenseExpiry) : undefined,
        assignedVehicleId: driver.assignedVehicleId ?? null, // Ensure null if undefined
      });
    } else {
      form.reset({ // Reset to defaults for new driver
         name: "",
         contactPhone: "",
         contactEmail: "",
         licenseNumber: "",
         licenseExpiry: undefined,
         status: undefined,
         assignedVehicleId: null,
         notes: "",
       });
    }
    setIsFormOpen(true);
  };

  // Handle form submission (add or edit)
  const onSubmit: SubmitHandler<DriverFormValues> = (data) => {
    // Ensure assignedVehicleId is null if empty string
    const processedData = {
        ...data,
        assignedVehicleId: data.assignedVehicleId === "" ? null : data.assignedVehicleId,
    };

    if (editingDriver) {
      // Edit existing driver
       updateDriver(editingDriver.id, processedData);
       toast({ title: "Driver Updated", description: `Driver ${data.name} has been updated.` });
    } else {
       // Add new driver (omit id, store generates it)
       const { id, ...newDriverData } = processedData;
       const newId = addDriver(newDriverData);
       toast({ title: "Driver Added", description: `Driver ${data.name} (ID: ${newId}) has been added.` });
    }
    setIsFormOpen(false);
  };

  // Handle deleting a driver
  const handleDeleteDriver = (driverId: string) => {
    deleteDriver(driverId);
     toast({
        title: "Driver Deleted",
        description: `Driver ${driverId} has been deleted.`,
        variant: "destructive"
      });
  };

  const driverStatuses: DriverStatus[] = ['Active', 'Inactive', 'On Leave'];

  // Render loading state until hydration is complete
  if (!hasMounted || !isHydrated) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Manage Drivers</h1>
        </div>
        {/* Optional Summary Cards - Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card><CardHeader><CardTitle className="text-sm font-medium">Total Drivers</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">...</div></CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm font-medium">Active</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">...</div></CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm font-medium">Assigned Vehicles</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">...</div></CardContent></Card>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Driver List</CardTitle>
                <CardDescription>Loading driver details...</CardDescription>
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
        <h1 className="text-3xl font-bold">Manage Drivers</h1>
         <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => handleOpenForm()}>
           <PlusCircle className="mr-2 h-4 w-4" /> Add New Driver
         </Button>
      </div>

       {/* Driver Summary Cards */}
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
           <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
                  <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{drivers.length}</div>
              </CardContent>
           </Card>
           <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active</CardTitle>
                  <BadgeCheck className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{drivers.filter(d => d.status === 'Active').length}</div>
              </CardContent>
           </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Assigned Vehicles</CardTitle>
                   <Truck className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{drivers.filter(d => d.assignedVehicleId).length}</div>
              </CardContent>
           </Card>
       </div>

      <Card>
        <CardHeader>
          <CardTitle>Driver List</CardTitle>
           <CardDescription>Overview of all registered drivers and their status.</CardDescription>
        </CardHeader>
        <CardContent>
          {drivers.length > 0 ? (
            <DriversTable data={drivers} onEdit={handleOpenForm} onDelete={handleDeleteDriver} />
          ) : (
             <p className="text-muted-foreground text-center py-4">No drivers found. Click 'Add New Driver' to get started.</p>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Driver Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[600px]">
             <DialogHeader>
                <DialogTitle>{editingDriver ? 'Edit Driver' : 'Add New Driver'}</DialogTitle>
                <DialogDescription>
                    {editingDriver ? `Update details for driver ${editingDriver.name}.` : 'Enter the details for the new driver.'}
                </DialogDescription>
             </DialogHeader>
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                     {/* Driver Name */}
                     <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                            <Input Icon={User} placeholder="Enter driver's full name" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    {/* Contact Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <FormField
                            control={form.control}
                            name="contactPhone"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Contact Phone</FormLabel>
                                <FormControl>
                                <Input Icon={Phone} type="tel" placeholder="Enter phone number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="contactEmail"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Contact Email <span className="text-xs text-muted-foreground">(Optional)</span></FormLabel>
                                <FormControl>
                                <Input Icon={Mail} type="email" placeholder="driver@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>

                     {/* License Info */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <FormField
                            control={form.control}
                            name="licenseNumber"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>License Number</FormLabel>
                                <FormControl>
                                <Input placeholder="Enter license number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="licenseExpiry"
                            render={({ field }) => (
                                <FormItem className="flex flex-col pt-2">
                                <FormLabel>License Expiry Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                        )}
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
                                        disabled={(date) =>
                                          date < new Date(new Date().setHours(0,0,0,0)) // Disable past dates
                                        }
                                        initialFocus
                                    />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Status */}
                     <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                               <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {driverStatuses.map(status => (
                                  <SelectItem key={status} value={status}>{status}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    {/* Assigned Vehicle ID (Optional) */}
                    {/* In a real app, this might be a select dropdown populated from the vehicle store */}
                     <FormField
                        control={form.control}
                        name="assignedVehicleId"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Assigned Vehicle ID <span className="text-xs text-muted-foreground">(Optional)</span></FormLabel>
                            <FormControl>
                            <Input Icon={Truck} placeholder="Enter assigned vehicle ID (e.g., TRK001)" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value || null)} />
                            </FormControl>
                             <FormDescription className="text-xs">Leave blank if unassigned.</FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    {/* Notes */}
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                           <FormLabel>Notes <span className="text-xs text-muted-foreground">(Optional)</span></FormLabel>
                           <FormControl>
                             <Textarea
                               placeholder="Any additional notes about the driver..."
                               className="resize-none"
                               {...field}
                              />
                          </FormControl>
                           <FormMessage />
                        </FormItem>
                      )}
                    />


                 <DialogFooter className="mt-4">
                     <DialogClose asChild>
                        <Button type="button" variant="outline">Cancel</Button>
                     </DialogClose>
                     <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
                       {editingDriver ? 'Save Changes' : 'Add Driver'}
                     </Button>
                 </DialogFooter>
                </form>
             </Form>
          </DialogContent>
      </Dialog>

    </div>
  );
}

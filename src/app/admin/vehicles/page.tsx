// src/app/admin/vehicles/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Truck, Ship, Container, CalendarIcon } from 'lucide-react';
import { VehiclesTable } from '@/components/admin/vehicles-table'; // Import the table component
import type { Vehicle, VehicleStatus, VehicleType } from '@/types/vehicle-types'; // Import Vehicle type
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
import { useVehicleStore, useIsVehicleStoreHydrated } from '@/stores/vehicle-store'; // Import the store and hydration hook
import { useDriverStore, useIsDriverStoreHydrated as useIsDriverStoreHydratedHook } from '@/stores/driver-store'; // Import driver store
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';


// Zod Schema for Vehicle Form Validation (now includes optional maintenance date)
const vehicleSchema = z.object({
    id: z.string().min(3, { message: "Vehicle ID requires at least 3 characters" }),
    type: z.enum(['Truck - Large', 'Truck - Medium', 'Van - Cargo', 'Van - Refrigerated', 'Ship - Container', 'Ship - Bulk', 'Container - 20ft', 'Container - 40ft', 'Other'], {
        required_error: "Vehicle type is required",
    }),
    licensePlate: z.string().optional(),
    capacityWeightKg: z.preprocess(
        (val) => Number(String(val)),
        z.number({ invalid_type_error: "Weight must be a number", required_error: "Weight capacity is required" }).positive({ message: "Weight capacity must be positive" })
    ),
    capacityVolumeM3: z.preprocess(
        (val) => val ? Number(String(val)) : undefined,
        z.number({ invalid_type_error: "Volume must be a number" }).positive({ message: "Volume capacity must be positive" }).optional()
    ),
    status: z.enum(['Available', 'In Use', 'Maintenance'], {
        required_error: "Status is required",
    }),
    assignedDriver: z.string().nullable().optional(), // Use nullable for optional selection
    currentLocation: z.string().optional(),
    maintenanceDate: z.date().optional().nullable(), // Allow date to be optional
    notes: z.string().optional(),
    // Load/assigned shipments are managed by the store internally
});


type VehicleFormValues = z.infer<typeof vehicleSchema>;

export default function AdminVehiclesPage() {
  // Zustand Stores
  const vehicles = useVehicleStore((state) => state.vehicles);
  const addVehicle = useVehicleStore((state) => state.addVehicle);
  const updateVehicle = useVehicleStore((state) => state.updateVehicle);
  const deleteVehicle = useVehicleStore((state) => state.deleteVehicle);
  const isVehicleStoreHydrated = useIsVehicleStoreHydrated();

  const drivers = useDriverStore((state) => state.drivers); // Get drivers for dropdown
  const isDriverStoreHydrated = useIsDriverStoreHydratedHook();

  // Local State
  const [hasMounted, setHasMounted] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const { toast } = useToast();

  // Available options
  const [availableDrivers, setAvailableDrivers] = useState<string[]>([]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

   // Update available drivers when driver store hydrates or changes
   useEffect(() => {
     if (isDriverStoreHydrated) {
       const activeDrivers = drivers.filter(d => d.status === 'Active').map(d => d.name);
       setAvailableDrivers(activeDrivers);
     }
   }, [isDriverStoreHydrated, drivers]);


  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      id: "",
      type: undefined,
      licensePlate: "",
      capacityWeightKg: undefined,
      capacityVolumeM3: undefined,
      status: undefined,
      assignedDriver: null, // Default to null
      currentLocation: "",
      maintenanceDate: null, // Default to null
      notes: "",
    },
    mode: 'onChange',
  });

  // Handle opening the form (for add or edit)
  const handleOpenForm = (vehicle: Vehicle | null = null) => {
    setEditingVehicle(vehicle);
    if (vehicle) {
      form.reset({
        ...vehicle,
        maintenanceDate: vehicle.maintenanceDate ? new Date(vehicle.maintenanceDate) : null, // Ensure Date object or null
        assignedDriver: vehicle.assignedDriver ?? null, // Ensure null if undefined/empty string
      });
    } else {
      form.reset({ // Reset to defaults for new vehicle
         id: "",
         type: undefined,
         licensePlate: "",
         capacityWeightKg: undefined,
         capacityVolumeM3: undefined,
         status: undefined,
         assignedDriver: null,
         currentLocation: "",
         maintenanceDate: null,
         notes: "",
       });
    }
    setIsFormOpen(true);
  };

  // Handle form submission (add or edit)
  const onSubmit: SubmitHandler<VehicleFormValues> = (data) => {
     const processedData = {
        ...data,
        assignedDriver: data.assignedDriver === "" ? null : data.assignedDriver, // Convert empty string to null
        maintenanceDate: data.maintenanceDate instanceof Date ? data.maintenanceDate : undefined, // Pass Date or undefined
      };

    try {
        if (editingVehicle) {
        // Edit existing vehicle (omit load/assignment fields as they are not in the form)
        updateVehicle(editingVehicle.id, processedData);
        toast({ title: "Vehicle Updated", description: `Vehicle ${data.id} has been updated.` });
        } else {
        // Add new vehicle (store initializes load/assignment)
        addVehicle(processedData);
        toast({ title: "Vehicle Added", description: `Vehicle ${data.id} has been added.` });
        }
        setIsFormOpen(false);
    } catch (error) {
         console.error("Error saving vehicle:", error);
          // Display specific error from store if available (e.g., duplicate ID)
          if (error instanceof Error && error.message.includes("already exists")) {
             form.setError("id", { type: "manual", message: error.message });
          } else {
              toast({
                variant: "destructive",
                title: "Operation Failed",
                description: `Could not ${editingVehicle ? 'update' : 'add'} vehicle. ${error instanceof Error ? error.message : 'Please try again.'}`,
              });
          }
    }
  };

  // Handle deleting a vehicle
  const handleDeleteVehicle = (vehicleId: string) => {
    deleteVehicle(vehicleId);
     toast({
        title: "Vehicle Deleted",
        description: `Vehicle ${vehicleId} has been deleted.`,
        variant: "destructive"
      });
  };

  const vehicleTypes: VehicleType[] = ['Truck - Large', 'Truck - Medium', 'Van - Cargo', 'Van - Refrigerated', 'Ship - Container', 'Ship - Bulk', 'Container - 20ft', 'Container - 40ft', 'Other'];
  const vehicleStatuses: VehicleStatus[] = ['Available', 'In Use', 'Maintenance'];


   // Render loading state until hydration is complete for both stores
  if (!hasMounted || !isVehicleStoreHydrated || !isDriverStoreHydrated) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Manage Vehicles</h1>
            <Button disabled>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Vehicle
            </Button>
        </div>
         <Card>
            <CardHeader>
                <CardTitle>Vehicle Inventory</CardTitle>
                <CardDescription>Loading vehicle details...</CardDescription>
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
        <h1 className="text-3xl font-bold">Manage Vehicles</h1>
         <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => handleOpenForm()}>
           <PlusCircle className="mr-2 h-4 w-4" /> Add New Vehicle
         </Button>
      </div>

       {/* Vehicle Summary Cards (Optional) */}
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
           <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
                  <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{vehicles.length}</div>
              </CardContent>
           </Card>
           <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Available</CardTitle>
                  <Truck className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{vehicles.filter(v => v.status === 'Available').length}</div>
              </CardContent>
           </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">In Use</CardTitle>
                   <Ship className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{vehicles.filter(v => v.status === 'In Use').length}</div>
              </CardContent>
           </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
                  <Container className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{vehicles.filter(v => v.status === 'Maintenance').length}</div>
              </CardContent>
           </Card>
       </div>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Inventory</CardTitle>
           <CardDescription>Overview of all registered vehicles and their status.</CardDescription>
        </CardHeader>
        <CardContent>
          {vehicles.length > 0 ? (
            <VehiclesTable data={vehicles} onEdit={handleOpenForm} onDelete={handleDeleteVehicle} />
          ) : (
             <p className="text-muted-foreground text-center py-4">No vehicles found. Click 'Add New Vehicle' to get started.</p>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Vehicle Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[600px]">
             <DialogHeader>
                <DialogTitle>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
                <DialogDescription>
                    {editingVehicle ? `Update details for vehicle ${editingVehicle.id}.` : 'Enter the details for the new vehicle.'}
                </DialogDescription>
             </DialogHeader>
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                     {/* Vehicle ID (Read-only when editing) */}
                     <FormField
                        control={form.control}
                        name="id"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Vehicle ID</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g., TRK001, VIN" {...field} disabled={!!editingVehicle} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    {/* Vehicle Type */}
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Vehicle Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select vehicle type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {vehicleTypes.map(type => (
                                  <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                     {/* License Plate */}
                     <FormField
                        control={form.control}
                        name="licensePlate"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>License Plate <span className="text-xs text-muted-foreground">(Optional)</span></FormLabel>
                            <FormControl>
                            <Input placeholder="e.g., ABC 123" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                     {/* Capacity */}
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="capacityWeightKg"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Weight Capacity (kg)</FormLabel>
                                <FormControl>
                                <Input type="number" placeholder="e.g., 10000" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} value={field.value === undefined ? '' : String(field.value)} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="capacityVolumeM3"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Volume Capacity (m³) <span className="text-xs text-muted-foreground">(Opt.)</span></FormLabel>
                                <FormControl>
                                <Input type="number" placeholder="e.g., 40" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} value={field.value === undefined ? '' : String(field.value)}/>
                                </FormControl>
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
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                               <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {vehicleStatuses.map(status => (
                                  <SelectItem key={status} value={status}>{status}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                     {/* Assigned Driver */}
                      <FormField
                          control={form.control}
                          name="assignedDriver"
                          render={({ field }) => (
                          <FormItem>
                              <FormLabel>Assigned Driver <span className="text-xs text-muted-foreground">(Optional)</span></FormLabel>
                              <Select onValueChange={(value) => field.onChange(value === 'unassign' ? null : value)} value={field.value ?? 'unassign'}>
                              <FormControl>
                                  <SelectTrigger>
                                  <SelectValue placeholder="Select driver" />
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
                              <FormDescription className="text-xs">Only active drivers are listed.</FormDescription>
                              <FormMessage />
                          </FormItem>
                          )}
                      />

                    {/* Current Location */}
                     <FormField
                        control={form.control}
                        name="currentLocation"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Current Location <span className="text-xs text-muted-foreground">(Optional)</span></FormLabel>
                            <FormControl>
                            <Input placeholder="e.g., Main Hub, Route 5" {...field} value={field.value ?? ''}/>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    {/* Maintenance Date */}
                      <FormField
                            control={form.control}
                            name="maintenanceDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col pt-2">
                                <FormLabel>Last Maintenance Date <span className="text-xs text-muted-foreground">(Optional)</span></FormLabel>
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
                                        // disabled={(date) => date > new Date()} // Optionally disable future dates
                                        initialFocus
                                    />
                                    </PopoverContent>
                                </Popover>
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
                               placeholder="Any additional notes about the vehicle..."
                               className="resize-none"
                               {...field}
                               value={field.value ?? ''}
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
                       {editingVehicle ? 'Save Changes' : 'Add Vehicle'}
                     </Button>
                 </DialogFooter>
                </form>
             </Form>
          </DialogContent>
      </Dialog>

    </div>
  );
}

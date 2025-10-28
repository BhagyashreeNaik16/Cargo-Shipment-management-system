// src/components/admin/shipments-table.tsx
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
import { Input } from '@/components/ui/input'; // Added Input
import { Textarea } from '@/components/ui/textarea'; // Added Textarea
import { Label } from '@/components/ui/label'; // Added Label
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns'; // For date formatting
import { MoreHorizontal, Package, Truck, Anchor, Plane, Warehouse, CircleCheck, AlertTriangle, Ban, Hourglass, User, Minus, Eye, List, Home as HomeIcon, Phone, Mail, IndianRupee, MapPin, Edit3 } from 'lucide-react'; // Import relevant icons + User + Minus + Eye + List + HomeIcon + Phone + Mail + Price + MapPin + Edit3
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger, // Added DialogTrigger
  DialogFooter, // Added DialogFooter
  DialogClose, // Added DialogClose
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area'; // Added ScrollArea
import type { Booking, ShipmentProgressStatus, ShipmentItem } from '@/types/booking-types'; // Import shared types
import type { Vehicle } from '@/types/vehicle-types'; // Import Vehicle type
import { Separator } from '@/components/ui/separator'; // Added Separator
import { useToast } from "@/hooks/use-toast"; // Added useToast

// Define the possible shipment statuses the admin can set (passed as prop)
// const shipmentStatusOptions: ShipmentProgressStatus[] = [...] // Now passed as prop

interface ShipmentsTableProps {
  data: Booking[]; // Data will be bookings with status 'Approved'
  onUpdateStatus: (bookingId: string, newStatus: ShipmentProgressStatus, location?: string, remarks?: string) => void; // Updated signature
  onUpdateAssignment: (bookingId: string, vehicleId: string | null, driverName: string | null) => void; // Assignment handler
  availableVehicles: Vehicle[]; // List of available vehicles
  availableDrivers: string[]; // List of available driver names
  shipmentStatusOptions: ShipmentProgressStatus[]; // Pass status options
}

export function ShipmentsTable({ data, onUpdateStatus, onUpdateAssignment, availableVehicles, availableDrivers, shipmentStatusOptions }: ShipmentsTableProps) {
  // State for details dialog
  const [selectedShipment, setSelectedShipment] = useState<Booking | null>(null);
  // State for history update dialog
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [historyFormData, setHistoryFormData] = useState<{bookingId: string; status: ShipmentProgressStatus | ''; location: string; remarks: string}>({
      bookingId: '',
      status: '',
      location: '',
      remarks: '',
  });
  const { toast } = useToast();

  const getShipmentStatusBadgeVariant = (status: ShipmentProgressStatus | null): "default" | "secondary" | "destructive" | "outline" => {
    if (!status) return 'outline';
    switch (status) {
      case 'Delivered':
        return 'default'; // Green / Primary
      case 'Picked Up':
      case 'In Transit':
      case 'At Hub':
      case 'Out for Delivery':
      case 'Waiting for Pickup':
        return 'secondary'; // Blue / Accent (maybe?) or Secondary Yellow/Gray
      case 'Delayed':
        return 'outline'; // Orange/Yellow outline?
      case 'Cancelled':
        return 'destructive'; // Red
      // Added cases for booking lifecycle statuses, though they shouldn't be primary shipment status
      case 'Booking Created':
      case 'Booking Approved':
        return 'secondary';
      case 'Booking Rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

   const statusIcons: Record<ShipmentProgressStatus, React.ElementType> = {
    'Waiting for Pickup': Hourglass,
    'Picked Up': Truck,
    'In Transit': Anchor,
    'At Hub': Warehouse,
    'Out for Delivery': Truck,
    'Delivered': CircleCheck,
    'Delayed': AlertTriangle,
    'Cancelled': Ban,
    // Include other statuses from the enum with appropriate icons
    'Booking Created': Hourglass,
    'Booking Approved': Hourglass,
    'Booking Rejected': Ban,
   };


  const handleViewDetails = (shipment: Booking) => {
    setSelectedShipment(shipment);
    // DialogTrigger will open the View Details Dialog
  };

  // Open history update dialog and prefill data
  const handleOpenHistoryDialog = (bookingId: string) => {
      const booking = data.find(b => b.id === bookingId);
      const lastLocation = booking?.history && booking.history.length > 0
          ? booking.history[booking.history.length - 1]?.location
          : booking?.origin;

      setHistoryFormData({
          bookingId: bookingId,
          status: '', // Reset status selection
          location: lastLocation || '',
          remarks: '',
      });
      setIsHistoryDialogOpen(true);
  };

  // Handle changes in the history form
  const handleHistoryFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setHistoryFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Handle status change in the history form select
  const handleHistoryStatusSelect = (status: ShipmentProgressStatus) => {
      setHistoryFormData(prev => ({ ...prev, status }));
  };


  // Submit the new history event
   const handleAddHistorySubmit = (e: React.FormEvent) => {
       e.preventDefault();
       if (!historyFormData.status) {
            toast({ title: "Validation Error", description: "Please select a status.", variant: "destructive" });
            return;
       }
       onUpdateStatus(historyFormData.bookingId, historyFormData.status, historyFormData.location || undefined, historyFormData.remarks || undefined);
       toast({ title: "History Updated", description: `Added '${historyFormData.status}' event for ${historyFormData.bookingId}.` });
       setIsHistoryDialogOpen(false);
   };


  const handleVehicleAssign = (bookingId: string, vehicleId: string | null) => {
    // Find the current driver assigned to this booking to maintain it, or set to null if unassigning vehicle
    const currentBooking = data.find(b => b.id === bookingId);
    const currentDriver = vehicleId ? currentBooking?.assignedDriverName : null;
    onUpdateAssignment(bookingId, vehicleId, currentDriver);
  };

  const handleDriverAssign = (bookingId: string, driverName: string | null) => {
      // Find the current vehicle assigned to this booking to maintain it
      const currentBooking = data.find(b => b.id === bookingId);
      const currentVehicleId = currentBooking?.assignedVehicleId ?? null; // Keep current vehicle or null
      onUpdateAssignment(bookingId, currentVehicleId, driverName);
  };


  return (
    <Dialog> {/* Main dialog provider for view details */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tracking ID</TableHead>
            <TableHead>Origin</TableHead>
            <TableHead>Destination</TableHead>
            <TableHead>Current Status</TableHead>
            <TableHead>Est. Price</TableHead> {/* Added Price Column */}
            <TableHead>Assigned Vehicle</TableHead>
            <TableHead>Assigned Driver</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((shipment) => {
            const StatusIcon = shipment.shipmentStatus ? (statusIcons[shipment.shipmentStatus] || Package) : Package;
            const assignedVehicle = availableVehicles.find(v => v.id === shipment.assignedVehicleId);
            return (
                <TableRow key={shipment.id}>
                <TableCell className="font-medium">{shipment.trackingId}</TableCell>
                <TableCell>{shipment.origin}</TableCell>
                <TableCell>{shipment.destination}</TableCell>
                <TableCell>
                    {shipment.shipmentStatus ? (
                    <Badge variant={getShipmentStatusBadgeVariant(shipment.shipmentStatus)} className="flex items-center gap-1 w-fit">
                        <StatusIcon className="h-3 w-3" />
                        {shipment.shipmentStatus}
                    </Badge>
                    ) : (
                    <Badge variant="outline">Awaiting</Badge> // Default if somehow null
                    )}
                </TableCell>
                 <TableCell> {/* Estimated Price Cell */}
                    {shipment.estimatedPrice !== undefined ? (
                        <span className="flex items-center gap-1 text-xs">
                            <IndianRupee className="h-3 w-3 text-muted-foreground"/>{shipment.estimatedPrice.toLocaleString('en-IN')}
                        </span>
                    ) : (
                        <span className="text-xs text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                <TableCell>
                    {assignedVehicle ? (
                        <span className="flex items-center gap-1 text-xs">
                          <Truck className="h-3 w-3 text-muted-foreground" /> {assignedVehicle.id} ({assignedVehicle.type})
                        </span>
                    ) : (
                       <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Minus className="h-3 w-3" /> Unassigned
                        </span>
                    )}
                </TableCell>
                <TableCell>
                    {shipment.assignedDriverName ? (
                       <span className="flex items-center gap-1 text-xs">
                         <User className="h-3 w-3 text-muted-foreground" /> {shipment.assignedDriverName}
                       </span>
                    ) : (
                       <span className="flex items-center gap-1 text-xs text-muted-foreground">
                         <Minus className="h-3 w-3" /> Unassigned
                       </span>
                    )}
                </TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Manage Shipment</DropdownMenuLabel>
                        <DialogTrigger asChild onClick={() => handleViewDetails(shipment)}>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                             <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                        </DialogTrigger>
                        <DropdownMenuItem onClick={() => handleOpenHistoryDialog(shipment.id)}>
                             <Edit3 className="mr-2 h-4 w-4" /> Add History Event
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {/* Remove direct status update submenu */}
                        {/* <DropdownMenuSub> ... </DropdownMenuSub> */}

                        {/* Assign Vehicle Submenu */}
                        <DropdownMenuSub>
                             <DropdownMenuSubTrigger>Assign Vehicle</DropdownMenuSubTrigger>
                             <DropdownMenuPortal>
                                <DropdownMenuSubContent className="max-h-60 overflow-y-auto">
                                    <DropdownMenuLabel>Select Vehicle</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                     <DropdownMenuItem onClick={() => handleVehicleAssign(shipment.id, null)} className={!shipment.assignedVehicleId ? 'bg-accent text-accent-foreground' : ''}>
                                        <Minus className="mr-2 h-4 w-4"/> Unassign Vehicle
                                     </DropdownMenuItem>
                                    {availableVehicles.length > 0 ? availableVehicles.map(vehicle => (
                                        <DropdownMenuItem
                                            key={vehicle.id}
                                            onClick={() => handleVehicleAssign(shipment.id, vehicle.id)}
                                            className={shipment.assignedVehicleId === vehicle.id ? 'bg-accent text-accent-foreground' : ''}
                                        >
                                            <Truck className="mr-2 h-4 w-4" /> {vehicle.id} ({vehicle.type})
                                        </DropdownMenuItem>
                                    )) : <DropdownMenuItem disabled>No vehicles available</DropdownMenuItem>}
                                </DropdownMenuSubContent>
                             </DropdownMenuPortal>
                        </DropdownMenuSub>

                        {/* Assign Driver Submenu */}
                         <DropdownMenuSub>
                             <DropdownMenuSubTrigger>Assign Driver</DropdownMenuSubTrigger>
                             <DropdownMenuPortal>
                                <DropdownMenuSubContent className="max-h-60 overflow-y-auto">
                                    <DropdownMenuLabel>Select Driver</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                     <DropdownMenuItem onClick={() => handleDriverAssign(shipment.id, null)} className={!shipment.assignedDriverName ? 'bg-accent text-accent-foreground' : ''}>
                                        <Minus className="mr-2 h-4 w-4"/> Unassign Driver
                                     </DropdownMenuItem>
                                    {availableDrivers.length > 0 ? availableDrivers.map(driver => (
                                        <DropdownMenuItem
                                            key={driver}
                                            onClick={() => handleDriverAssign(shipment.id, driver)}
                                            className={shipment.assignedDriverName === driver ? 'bg-accent text-accent-foreground' : ''}
                                        >
                                            <User className="mr-2 h-4 w-4" /> {driver}
                                        </DropdownMenuItem>
                                    )) : <DropdownMenuItem disabled>No drivers available</DropdownMenuItem>}
                                </DropdownMenuSubContent>
                             </DropdownMenuPortal>
                        </DropdownMenuSub>

                         {/* Potentially add other actions like 'Print Label' */}
                    </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
                </TableRow>
            );
          })}
        </TableBody>
      </Table>

       {/* View Details Dialog Content */}
       {selectedShipment && (
         <DialogContent className="sm:max-w-[700px]">
           <DialogHeader>
             <DialogTitle>Shipment Details - {selectedShipment.trackingId}</DialogTitle>
             <DialogDescription>
                Booking Ref: {selectedShipment.id} | Status: {selectedShipment.shipmentStatus || 'N/A'}
             </DialogDescription>
           </DialogHeader>
           <ScrollArea className="max-h-[70vh] pr-6">
             <div className="grid gap-6 py-4">

               {/* Shipment Overview */}
                <section className="p-4 border rounded-md bg-muted/50">
                  <h4 className="font-semibold mb-3 text-lg">Shipment Overview</h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div><strong>Tracking ID:</strong> {selectedShipment.trackingId}</div>
                    <div><strong>Booking ID:</strong> {selectedShipment.id}</div>
                    <div><strong>Current Status:</strong> <Badge variant={getShipmentStatusBadgeVariant(selectedShipment.shipmentStatus)}>{selectedShipment.shipmentStatus || 'N/A'}</Badge></div>
                     <div><strong>Booking Status:</strong> {selectedShipment.status}</div> {/* Added booking status */}
                     {/* Display Estimated Price */}
                      <div className="flex items-center gap-1">
                           <strong>Est. Price:</strong>
                           {selectedShipment.estimatedPrice !== undefined ? (
                                <span className="flex items-center gap-0.5"><IndianRupee className="h-3.5 w-3.5"/>{selectedShipment.estimatedPrice.toLocaleString('en-IN')}</span>
                            ) : 'N/A'}
                             {selectedShipment.rateUsed && <span className="text-xs text-muted-foreground">({selectedShipment.rateUsed})</span>}
                       </div>
                    <div><strong>Origin:</strong> {selectedShipment.origin}</div>
                    <div><strong>Destination:</strong> {selectedShipment.destination}</div>
                    <div><strong>Assigned Vehicle:</strong> {selectedShipment.assignedVehicleId || 'Unassigned'}</div>
                    <div><strong>Assigned Driver:</strong> {selectedShipment.assignedDriverName || 'Unassigned'}</div>
                     <div><strong>Booking Date:</strong> {format(selectedShipment.bookingDate, 'PPP p')}</div>
                    <div><strong>Est. Delivery:</strong> {selectedShipment.estimatedDelivery ? format(selectedShipment.estimatedDelivery, 'PPP') : 'N/A'}</div>
                  </div>
                </section>

                <Separator />

                {/* Sender & Receiver */}
                <div className="grid md:grid-cols-2 gap-6">
                    <section className="p-4 border rounded-md">
                        <h4 className="font-semibold mb-3 text-lg flex items-center gap-2"><User className="h-5 w-5" />Sender</h4>
                        <div className="space-y-1 text-sm">
                            <p><strong>Name:</strong> {selectedShipment.senderName}</p>
                             <p className="flex items-center gap-1.5"><strong><Mail className="h-3 w-3"/>:</strong> {selectedShipment.senderEmail}</p>
                             <p className="flex items-center gap-1.5"><strong><Phone className="h-3 w-3"/>:</strong> {selectedShipment.senderPhone}</p>
                            <p className="flex items-start gap-1.5"><strong><HomeIcon className="h-3 w-3 mt-0.5"/>:</strong> {selectedShipment.senderAddress}</p>
                        </div>
                    </section>
                     <section className="p-4 border rounded-md">
                         <h4 className="font-semibold mb-3 text-lg flex items-center gap-2"><User className="h-5 w-5" />Receiver</h4>
                         <div className="space-y-1 text-sm">
                            <p><strong>Name:</strong> {selectedShipment.receiverName}</p>
                             <p className="flex items-center gap-1.5"><strong><Mail className="h-3 w-3"/>:</strong> {selectedShipment.receiverEmail || 'N/A'}</p>
                             <p className="flex items-center gap-1.5"><strong><Phone className="h-3 w-3"/>:</strong> {selectedShipment.receiverPhone}</p>
                             <p className="flex items-start gap-1.5"><strong><HomeIcon className="h-3 w-3 mt-0.5"/>:</strong> {selectedShipment.receiverAddress}</p>
                        </div>
                    </section>
                </div>

                <Separator />

                {/* Cargo & Items */}
                <section className="p-4 border rounded-md bg-muted/50">
                  <h4 className="font-semibold mb-3 text-lg">Cargo Details</h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
                    <div><strong>Cargo Type:</strong> {selectedShipment.cargoType}</div>
                    <div><strong>Weight:</strong> {selectedShipment.weight} kg</div>
                    {selectedShipment.volume && <div><strong>Volume:</strong> {selectedShipment.volume} m³</div>}
                     <div className="col-span-2"><strong>Special Instructions:</strong> {selectedShipment.specialInstructions || 'None'}</div>
                  </div>

                  <Separator className="my-3" />

                   <h5 className="font-semibold mb-2 flex items-center gap-2"><List className="h-5 w-5"/> Items Included ({selectedShipment.items?.length || 0})</h5>
                    {(selectedShipment.items && selectedShipment.items.length > 0) ? (
                        <ScrollArea className="h-32 w-full rounded-md border p-2">
                            <ul className="space-y-1 text-xs">
                                {selectedShipment.items.map((item: ShipmentItem) => ( // Ensure item is typed
                                    <li key={item.productId} className="flex justify-between items-center">
                                        <span>{item.name}</span>
                                        <span className="font-mono text-muted-foreground text-[10px]">ID: {item.productId}</span>
                                    </li>
                                ))}
                            </ul>
                        </ScrollArea>
                    ) : (
                        <p className="text-xs text-muted-foreground">No item details available.</p>
                    )}
                </section>

                <Separator />

                 {/* Shipment History */}
                <section className="p-4 border rounded-md">
                    <div className="flex justify-between items-center mb-3">
                       <h4 className="font-semibold text-lg">Shipment History</h4>
                        {/* Button to open history update dialog */}
                        <Button variant="outline" size="sm" onClick={() => {
                             handleOpenHistoryDialog(selectedShipment.id);
                             // Close the details dialog if needed, or keep it open
                             // setIsViewDialogOpen(false);
                        }}>
                           <Edit3 className="mr-1 h-3 w-3" /> Add Event
                        </Button>
                    </div>
                   <ScrollArea className="h-40">
                      <div className="space-y-3 text-xs pl-2 border-l border-muted">
                           {(selectedShipment.history && selectedShipment.history.length > 0) ? (
                             selectedShipment.history.slice().reverse().map((entry, index, arr) => (
                                  <div key={index} className="relative pl-4">
                                      {/* Dot */}
                                      <div className={`absolute -left-[5px] top-[3px] w-2.5 h-2.5 rounded-full border-2 ${index === 0 ? 'border-accent bg-accent/50' : 'border-muted bg-muted'}`}></div>
                                      <p className={`font-medium ${index === 0 ? 'text-foreground' : 'text-muted-foreground'}`}>{entry.status}</p>
                                      <p className="text-muted-foreground">{entry.location || 'Unknown'}</p>
                                      <p className="text-muted-foreground">{format(entry.timestamp, 'PPp')}</p>
                                      {(entry.vehicleId || entry.driverName) && (
                                          <p className="text-[10px] text-muted-foreground italic">
                                              {entry.vehicleId && `Veh: ${entry.vehicleId}`} {entry.driverName && `Driver: ${entry.driverName}`}
                                          </p>
                                      )}
                                      {entry.remarks && <p className="text-[10px] text-muted-foreground">Notes: {entry.remarks}</p>}
                                  </div>
                              ))
                            ) : (
                                <p className="text-muted-foreground pl-4">No history available.</p>
                            )}
                      </div>
                   </ScrollArea>
                </section>

             </div>
           </ScrollArea>
           <DialogFooter className="mt-4">
             <DialogClose asChild>
               <Button variant="outline">Close</Button>
             </DialogClose>
              {/* Add other actions like 'Print Label' etc. here if needed */}
           </DialogFooter>
         </DialogContent>
       )}

        {/* Dialog for Adding History Event */}
        <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Add Shipment History Event</DialogTitle>
                    <DialogDescription>
                       Update the progress for shipment: {historyFormData.bookingId}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddHistorySubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="history-status">New Status</Label>
                        <Select
                            value={historyFormData.status}
                            onValueChange={(value) => handleHistoryStatusSelect(value as ShipmentProgressStatus)}
                         >
                            <SelectTrigger id="history-status">
                                <SelectValue placeholder="Select status..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Shipment Progress</SelectLabel>
                                    {shipmentStatusOptions.map(status => (
                                        <SelectItem key={status} value={status}>{status}</SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                         </Select>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="history-location">Location (Optional)</Label>
                        <Input
                            id="history-location"
                            name="location"
                            value={historyFormData.location}
                            onChange={handleHistoryFormChange}
                            placeholder="e.g., Chicago Hub, On Route 5..."
                            Icon={MapPin}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="history-remarks">Remarks (Optional)</Label>
                        <Textarea
                            id="history-remarks"
                            name="remarks"
                            value={historyFormData.remarks}
                            onChange={handleHistoryFormChange}
                            placeholder="e.g., Weather delay, Cleared customs..."
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">Add Event</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

    </Dialog>
  );
}

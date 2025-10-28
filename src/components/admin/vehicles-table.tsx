// src/components/admin/vehicles-table.tsx
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
import { Progress } from '@/components/ui/progress';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { MoreHorizontal, Pencil, Trash2, Eye, Truck, Ship, Container, PackageOpen } from 'lucide-react'; // Added icons
import type { Vehicle, VehicleStatus, VehicleType } from '@/types/vehicle-types';
import { format } from 'date-fns'; // For date formatting

interface VehiclesTableProps {
  data: Vehicle[];
  onEdit: (vehicle: Vehicle) => void; // Callback for edit action
  onDelete: (vehicleId: string) => void; // Callback for delete action
}

// Function to get badge variant based on vehicle status
const getVehicleStatusBadgeVariant = (status: VehicleStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Available':
        return 'default'; // Green/Blue
      case 'In Use':
        return 'secondary'; // Yellow/Gray
      case 'Maintenance':
        return 'destructive'; // Red/Orange
      default:
        return 'outline';
    }
};

// Function to get icon based on vehicle type
const getVehicleTypeIcon = (type: VehicleType): React.ElementType => {
    if (type.startsWith('Truck')) return Truck;
    if (type.startsWith('Van')) return Truck; // Using Truck for Van as well
    if (type.startsWith('Ship')) return Ship;
    if (type.startsWith('Container')) return Container;
    return PackageOpen; // Default for Other
}

export function VehiclesTable({ data, onEdit, onDelete }: VehiclesTableProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);


  const handleViewDetails = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsViewDialogOpen(true);
  };

   const handleDeleteClick = (vehicleId: string) => {
      setVehicleToDelete(vehicleId);
      setIsDeleteDialogOpen(true);
   };

   const confirmDelete = () => {
     if (vehicleToDelete) {
       onDelete(vehicleToDelete);
       setIsDeleteDialogOpen(false);
       setVehicleToDelete(null);
     }
   };

   // Calculate load percentage (handle potential division by zero)
    const calculateLoadPercentage = (current: number, capacity: number): number => {
      if (capacity <= 0) return 0; // Avoid division by zero or negative capacity
      return Math.min(100, Math.round((current / capacity) * 100)); // Cap at 100%
    };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>License Plate</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Capacity (kg)</TableHead>
            <TableHead>Current Load (kg)</TableHead>
            <TableHead>Driver</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((vehicle) => {
             const TypeIcon = getVehicleTypeIcon(vehicle.type);
             const loadPercentage = calculateLoadPercentage(vehicle.currentLoadWeightKg, vehicle.capacityWeightKg);
             return (
                <TableRow key={vehicle.id}>
                <TableCell className="font-mono text-xs">{vehicle.id}</TableCell>
                <TableCell className="flex items-center gap-2">
                    <TypeIcon className="h-4 w-4 text-muted-foreground" />
                    {vehicle.type}
                </TableCell>
                <TableCell>{vehicle.licensePlate || 'N/A'}</TableCell>
                <TableCell>
                    <Badge variant={getVehicleStatusBadgeVariant(vehicle.status)}>
                    {vehicle.status}
                    </Badge>
                </TableCell>
                 <TableCell>{vehicle.capacityWeightKg.toLocaleString()} kg</TableCell>
                 <TableCell>
                    <div className="flex items-center gap-2">
                       <span>{vehicle.currentLoadWeightKg.toLocaleString()} kg</span>
                       <Progress value={loadPercentage} className="h-2 w-16" title={`${loadPercentage}% loaded`} />
                    </div>
                     {vehicle.capacityVolumeM3 && vehicle.currentLoadVolumeM3 !== undefined && (
                         <span className="text-xs text-muted-foreground">
                         ({vehicle.currentLoadVolumeM3.toLocaleString()} / {vehicle.capacityVolumeM3.toLocaleString()} m³)
                         </span>
                     )}
                 </TableCell>
                <TableCell>{vehicle.assignedDriver || 'Unassigned'}</TableCell>
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
                        <DropdownMenuItem onClick={() => handleViewDetails(vehicle)}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                         </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(vehicle)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 focus:text-red-700 focus:bg-red-100" onClick={() => handleDeleteClick(vehicle.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
                </TableRow>
             );
          })}
        </TableBody>
      </Table>

       {/* View Details Dialog */}
       {selectedVehicle && (
         <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
             <DialogContent className="sm:max-w-[650px]">
               <DialogHeader>
                 <DialogTitle>Vehicle Details - {selectedVehicle.id}</DialogTitle>
                 <DialogDescription>
                    {selectedVehicle.type} - {selectedVehicle.licensePlate || 'No License Plate'}
                 </DialogDescription>
               </DialogHeader>
               <ScrollArea className="max-h-[60vh] pr-6">
                 <div className="grid gap-4 py-4">
                   <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm p-4 border rounded-md bg-muted/50">
                       <div><strong>ID:</strong> <span className="font-mono text-xs">{selectedVehicle.id}</span></div>
                       <div><strong>Type:</strong> {selectedVehicle.type}</div>
                       <div><strong>License Plate:</strong> {selectedVehicle.licensePlate || 'N/A'}</div>
                       <div><strong>Status:</strong> <Badge variant={getVehicleStatusBadgeVariant(selectedVehicle.status)}>{selectedVehicle.status}</Badge></div>
                       <div><strong>Weight Capacity:</strong> {selectedVehicle.capacityWeightKg.toLocaleString()} kg</div>
                       <div><strong>Volume Capacity:</strong> {selectedVehicle.capacityVolumeM3 ? selectedVehicle.capacityVolumeM3.toLocaleString() + ' m³' : 'N/A'}</div>
                       <div><strong>Current Weight Load:</strong> {selectedVehicle.currentLoadWeightKg.toLocaleString()} kg</div>
                       <div><strong>Current Volume Load:</strong> {selectedVehicle.currentLoadVolumeM3 ? selectedVehicle.currentLoadVolumeM3.toLocaleString() + ' m³' : 'N/A'}</div>
                       <div className="col-span-2"><strong>Load Percentage:</strong> <Progress value={calculateLoadPercentage(selectedVehicle.currentLoadWeightKg, selectedVehicle.capacityWeightKg)} className="h-2 w-full mt-1" /></div>
                       <div><strong>Assigned Driver:</strong> {selectedVehicle.assignedDriver || 'Unassigned'}</div>
                       <div><strong>Current Location:</strong> {selectedVehicle.currentLocation || 'Unknown'}</div>
                       <div><strong>Last Maintenance:</strong> {selectedVehicle.maintenanceDate ? format(selectedVehicle.maintenanceDate, 'PP') : 'N/A'}</div>
                       {selectedVehicle.notes && <div className="col-span-2"><strong>Notes:</strong> {selectedVehicle.notes}</div>}
                   </div>
                   {selectedVehicle.assignedShipmentIds.length > 0 && (
                       <div className="p-4 border rounded-md">
                           <h4 className="font-semibold mb-2 text-lg">Assigned Shipments ({selectedVehicle.assignedShipmentIds.length})</h4>
                           <ul className="list-disc list-inside text-sm space-y-1">
                             {selectedVehicle.assignedShipmentIds.map(shipmentId => (
                               <li key={shipmentId}>{shipmentId}</li> // Consider making these links to shipment details
                             ))}
                           </ul>
                       </div>
                   )}
                 </div>
               </ScrollArea>
               <DialogFooter>
                     <DialogClose asChild>
                        <Button variant="outline">Close</Button>
                     </DialogClose>
               </DialogFooter>
             </DialogContent>
         </Dialog>
       )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete vehicle ID: {vehicleToDelete}? This action cannot be undone.
                </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                </DialogFooter>
            </DialogContent>
       </Dialog>
    </>
  );
}

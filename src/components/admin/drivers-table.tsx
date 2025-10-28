// src/components/admin/drivers-table.tsx
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, Pencil, Trash2, Eye, BadgeCheck, BadgeX, CalendarClock, Truck } from 'lucide-react'; // Added icons
import type { Driver, DriverStatus } from '@/types/driver-types';
import { format } from 'date-fns';

interface DriversTableProps {
  data: Driver[];
  onEdit: (driver: Driver) => void;
  onDelete: (driverId: string) => void;
}

// Function to get badge variant based on driver status
const getDriverStatusBadgeVariant = (status: DriverStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Active':
        return 'default'; // Green/Blue
      case 'Inactive':
        return 'secondary'; // Gray
      case 'On Leave':
        return 'outline'; // Yellow/Orange outline
      default:
        return 'outline';
    }
};

// Function to get icon based on driver status
const getDriverStatusIcon = (status: DriverStatus): React.ElementType => {
    switch (status) {
      case 'Active':
        return BadgeCheck;
      case 'Inactive':
        return BadgeX;
      case 'On Leave':
        return CalendarClock;
      default:
        return BadgeX;
    }
}

export function DriversTable({ data, onEdit, onDelete }: DriversTableProps) {
  const [driverToDelete, setDriverToDelete] = useState<string | null>(null);

  const handleDeleteClick = (driverId: string) => {
      setDriverToDelete(driverId);
      // Alert Dialog Trigger will handle opening
  };

  const confirmDelete = () => {
      if (driverToDelete) {
          onDelete(driverToDelete);
          setDriverToDelete(null); // Close dialog implicitly
      }
  };

  return (
    <AlertDialog> {/* Wrap table with AlertDialog Provider */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>License No.</TableHead>
            <TableHead>License Expiry</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assigned Vehicle</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((driver) => {
             const StatusIcon = getDriverStatusIcon(driver.status);
             const isLicenseExpired = driver.licenseExpiry < new Date();
             return (
                <TableRow key={driver.id}>
                <TableCell className="font-mono text-xs">{driver.id}</TableCell>
                <TableCell className="font-medium">{driver.name}</TableCell>
                <TableCell>
                    <div>{driver.contactPhone}</div>
                    {driver.contactEmail && <div className="text-xs text-muted-foreground">{driver.contactEmail}</div>}
                </TableCell>
                 <TableCell>{driver.licenseNumber}</TableCell>
                 <TableCell className={isLicenseExpired ? 'text-destructive font-medium' : ''}>
                    {format(driver.licenseExpiry, 'PP')}
                     {isLicenseExpired && <span className="ml-1">(Expired)</span>}
                 </TableCell>
                <TableCell>
                    <Badge variant={getDriverStatusBadgeVariant(driver.status)} className="flex items-center gap-1 w-fit">
                        <StatusIcon className="h-3 w-3" />
                        {driver.status}
                    </Badge>
                </TableCell>
                <TableCell>
                    {driver.assignedVehicleId ? (
                        <span className="flex items-center gap-1 text-xs">
                           <Truck className="h-3 w-3 text-muted-foreground"/> {driver.assignedVehicleId}
                        </span>
                    ) : (
                       <span className="text-xs text-muted-foreground">Unassigned</span>
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
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                         {/* View Details (Optional - can add a Dialog for this) */}
                         {/* <DropdownMenuItem onClick={() => console.log("View Driver:", driver.id)}>
                             <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem> */}
                        <DropdownMenuItem onClick={() => onEdit(driver)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                         <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                                className="text-red-600 focus:text-red-700 focus:bg-red-100"
                                onSelect={(e) => e.preventDefault()} // Prevent default close
                                onClick={() => handleDeleteClick(driver.id)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
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
                This action cannot be undone. This will permanently delete the driver record for ID: <span className="font-semibold">{driverToDelete}</span>. Associated vehicle assignments might need manual updates.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDriverToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
  );
}

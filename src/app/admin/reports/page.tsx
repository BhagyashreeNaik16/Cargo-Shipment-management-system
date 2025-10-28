// src/app/admin/reports/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Download, CalendarIcon, Filter, XCircle, BarChart3, ListChecks, Scale } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { useBookingStore, useIsBookingStoreHydrated } from '@/stores/booking-store';
import { useVehicleStore, useIsVehicleStoreHydrated as useIsVehicleStoreHydratedHook } from '@/stores/vehicle-store';
import type { Booking, ShipmentProgressStatus, CargoType } from '@/types/booking-types';
import type { VehicleType } from '@/types/vehicle-types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Define available cargo types (consistent with booking form)
const cargoTypes: CargoType[] = [
  'General Goods', 'Perishable', 'Hazardous', 'Fragile', 'Oversized',
  'Documents', 'Electronics', 'Furniture', 'Other'
];

// Define available vehicle types (consistent with vehicle store)
const vehicleTypeOptions: VehicleType[] = [
  'Truck - Large', 'Truck - Medium', 'Van - Cargo', 'Van - Refrigerated',
  'Ship - Container', 'Ship - Bulk', 'Container - 20ft', 'Container - 40ft', 'Other'
];


export default function AdminReportsPage() {
  const allBookings = useBookingStore((state) => state.bookings);
  const isBookingStoreHydrated = useIsBookingStoreHydrated();

  const allVehicles = useVehicleStore((state) => state.vehicles);
  const isVehicleStoreHydrated = useIsVehicleStoreHydratedHook();

  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [hasMounted, setHasMounted] = useState(false);
  const { toast } = useToast();

  // Filter states
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [destinationFilter, setDestinationFilter] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('all'); // Initial state to 'all'
  const [cargoTypeFilter, setCargoTypeFilter] = useState('all'); // Initial state to 'all'

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Effect to set initial filtered bookings once stores are hydrated
  useEffect(() => {
    if (hasMounted && isBookingStoreHydrated && isVehicleStoreHydrated) {
      setFilteredBookings(allBookings); // Initially show all bookings
    }
  }, [hasMounted, isBookingStoreHydrated, isVehicleStoreHydrated, allBookings]);

  const handleApplyFilters = () => {
    if (!isBookingStoreHydrated || !isVehicleStoreHydrated) return;

    let tempFiltered = [...allBookings];

    // Date Range Filter
    if (dateRange?.from) {
      tempFiltered = tempFiltered.filter(booking => {
        const bookingDate = booking.bookingDate instanceof Date ? booking.bookingDate : parseISO(booking.bookingDate as any);
        let inRange = bookingDate >= dateRange.from!;
        if (dateRange.to) {
          inRange = inRange && bookingDate <= dateRange.to!;
        }
        return inRange;
      });
    }

    // Destination Filter
    if (destinationFilter) {
      tempFiltered = tempFiltered.filter(booking =>
        booking.destination.toLowerCase().includes(destinationFilter.toLowerCase())
      );
    }

    // Vehicle Type Filter - apply only if not 'all'
    if (vehicleTypeFilter && vehicleTypeFilter !== 'all') {
      const vehicleIdsOfType = allVehicles
        .filter(vehicle => vehicle.type === vehicleTypeFilter)
        .map(vehicle => vehicle.id);
      tempFiltered = tempFiltered.filter(booking =>
        booking.assignedVehicleId && vehicleIdsOfType.includes(booking.assignedVehicleId)
      );
    }

    // Cargo Type Filter - apply only if not 'all'
    if (cargoTypeFilter && cargoTypeFilter !== 'all') {
      tempFiltered = tempFiltered.filter(booking =>
        booking.cargoType === cargoTypeFilter
      );
    }
    setFilteredBookings(tempFiltered);
  };

  const handleClearFilters = () => {
    setDateRange(undefined);
    setDestinationFilter('');
    setVehicleTypeFilter('all'); // Reset to 'all'
    setCargoTypeFilter('all'); // Reset to 'all'
    if (isBookingStoreHydrated) {
      setFilteredBookings(allBookings); // Reset to all bookings
    } else {
      setFilteredBookings([]);
    }
  };

  const kpiData = useMemo(() => {
    const totalShipments = filteredBookings.length;
    const totalWeight = filteredBookings.reduce((sum, booking) => sum + (booking.weight || 0), 0);
    // Add more KPIs as needed
    return { totalShipments, totalWeight };
  }, [filteredBookings]);


  const getBookingStatusBadgeVariant = (status: Booking['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
        case 'Approved': return 'default';
        case 'Pending': return 'secondary';
        case 'Rejected': return 'destructive';
        default: return 'outline';
    }
  };

  const handleExportCSV = () => {
    if (filteredBookings.length === 0) {
      toast({
        title: "No Data to Export",
        description: "Please apply filters to generate a report before exporting.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Exporting CSV",
      description: "Your CSV report is being generated...",
    });

    const headers = [
      "Booking Date", "Tracking ID", "Origin", "Destination", "Cargo Type", 
      "Weight (kg)", "Volume (m³)", "No. of Items", "Booking Status", 
      "Shipment Status", "Assigned Vehicle", "Assigned Driver", 
      "Sender Name", "Sender Email", "Sender Phone", 
      "Receiver Name", "Receiver Phone", "Est. Price (INR)", "Payment Method", "Booked By"
    ];

    const rows = filteredBookings.map(booking => [
      format(booking.bookingDate instanceof Date ? booking.bookingDate : parseISO(booking.bookingDate as any), 'yyyy-MM-dd'),
      booking.trackingId,
      booking.origin,
      booking.destination,
      booking.cargoType,
      booking.weight,
      booking.volume ?? '',
      booking.numberOfItems,
      booking.status,
      booking.shipmentStatus ?? 'N/A',
      booking.assignedVehicleId ?? 'N/A',
      booking.assignedDriverName ?? 'N/A',
      booking.senderName,
      booking.senderEmail,
      booking.senderPhone,
      booking.receiverName,
      booking.receiverPhone,
      booking.estimatedPrice ?? '',
      booking.paymentMethod ?? 'N/A',
      booking.bookedByUsername ?? 'N/A',
    ]);

    // Simple CSV escaping (wrap in double quotes if contains comma, double quote, or newline)
    const escapeCSV = (value: any): string => {
      const stringValue = String(value === null || value === undefined ? '' : value);
      if (/[",\r\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    let csvContent = headers.map(escapeCSV).join(",") + "\n";
    rows.forEach(rowArray => {
      csvContent += rowArray.map(escapeCSV).join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `shipment_report_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    toast({
      title: "CSV Exported",
      description: "The report has been downloaded.",
    });
  };


  if (!hasMounted || !isBookingStoreHydrated || !isVehicleStoreHydrated) {
    return (
      <div className="space-y-6 text-center">
        <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mt-8" />
        <p className="text-muted-foreground">Loading report data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">Reports &amp; Analytics</h1>
         <Button variant="outline" onClick={handleExportCSV}>
           <Download className="mr-2 h-4 w-4" /> Export CSV {/* Updated Button Text */}
         </Button>
      </div>

       {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5"/> Filters</CardTitle>
          <CardDescription>Refine your report by applying filters below.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range Picker */}
          <div className="space-y-1">
            <Label htmlFor="date-range">Booking Date Range</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date-range"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Destination Filter */}
          <div className="space-y-1">
            <Label htmlFor="destination">Destination</Label>
            <Input
              id="destination"
              placeholder="Enter destination city"
              value={destinationFilter}
              onChange={(e) => setDestinationFilter(e.target.value)}
            />
          </div>

          {/* Vehicle Type Filter */}
          <div className="space-y-1">
            <Label htmlFor="vehicleType">Vehicle Type</Label>
            <Select value={vehicleTypeFilter} onValueChange={setVehicleTypeFilter}>
              <SelectTrigger id="vehicleType">
                <SelectValue placeholder="All Vehicle Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vehicle Types</SelectItem>
                {vehicleTypeOptions.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cargo Type Filter */}
          <div className="space-y-1">
            <Label htmlFor="cargoType">Cargo Type</Label>
            <Select value={cargoTypeFilter} onValueChange={setCargoTypeFilter}>
              <SelectTrigger id="cargoType">
                <SelectValue placeholder="All Cargo Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cargo Types</SelectItem>
                {cargoTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClearFilters}>
            <XCircle className="mr-2 h-4 w-4"/> Clear Filters
          </Button>
          <Button onClick={handleApplyFilters} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Filter className="mr-2 h-4 w-4"/> Apply Filters
          </Button>
        </CardFooter>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Shipments Found</CardTitle>
                <ListChecks className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{kpiData.totalShipments}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Weight (kg)</CardTitle>
                <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{kpiData.totalWeight.toLocaleString()} kg</div>
            </CardContent>
        </Card>
      </div>


      {/* Generated Report Section */}
      <Card>
        <CardHeader>
          <CardTitle>Filtered Shipment Report</CardTitle>
          <CardDescription>Displaying bookings that match the applied filters.</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredBookings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking Date</TableHead>
                  <TableHead>Tracking ID</TableHead>
                  <TableHead>Origin</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Cargo Type</TableHead>
                  <TableHead>Weight (kg)</TableHead>
                  <TableHead>Booking Status</TableHead>
                  <TableHead>Shipment Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{format(booking.bookingDate instanceof Date ? booking.bookingDate : parseISO(booking.bookingDate as any), 'PP')}</TableCell>
                    <TableCell className="font-medium">{booking.trackingId}</TableCell>
                    <TableCell>{booking.origin}</TableCell>
                    <TableCell>{booking.destination}</TableCell>
                    <TableCell>{booking.cargoType}</TableCell>
                    <TableCell>{booking.weight.toLocaleString()}</TableCell>
                    <TableCell>
                        <Badge variant={getBookingStatusBadgeVariant(booking.status)}>
                            {booking.status}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        {booking.shipmentStatus ? (
                             <Badge variant={booking.shipmentStatus === 'Delivered' ? 'default' : 'secondary'}>
                                {booking.shipmentStatus}
                             </Badge>
                        ) : (
                            <Badge variant="outline">N/A</Badge>
                        )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">No bookings match the current filters.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


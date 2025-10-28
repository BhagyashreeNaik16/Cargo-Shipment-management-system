// src/app/track/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Clock, Package, CircleCheck, Truck, Ship, Warehouse, AlertTriangle, Hourglass, Loader2, Ban, User, List, IndianRupee, Phone } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { getWeather, type Location, type Weather } from '@/services/weather';
import { predictDeliveryTime, type PredictDeliveryTimeInput, type PredictDeliveryTimeOutput } from '@/ai/flows/predict-delivery-time';
import { useBookingStore, useIsBookingStoreHydrated } from '@/stores/booking-store'; // Import the booking store and hydration hook
import type { Booking, BookingStatus, ShipmentProgressStatus, ShipmentItem, ShipmentHistoryEntry } from '@/types/booking-types'; // Import shared types
import { useDriverStore, useIsDriverStoreHydrated as useIsDriverStoreHydratedHook } from '@/stores/driver-store'; // Import driver store
import type { Driver } from '@/types/driver-types'; // Import driver type
import { format } from 'date-fns'; // For date formatting
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'; // Import Alert components
// Removed Leaflet imports
import dynamic from 'next/dynamic';

// Removed LeafletMap import
// const LeafletMap = dynamic(() => import('@/components/tracking/leaflet-map'), { ... });


// Interface for tracking page display (updated to include items, price, and driver phone)
interface ShipmentDisplayInfo {
    id: string; // Tracking ID
    bookingId: string; // Original Booking ID
    status: 'Pending Confirmation' | 'Rejected' | ShipmentProgressStatus | 'Not Found'; // Combined status for display
    currentLocation: string; // Can be derived or static for now
    origin: string;
    destination: string;
    estimatedDelivery: string;
    history: { timestamp: string; location: string; status: string; remarks?: string; }[]; // Added remarks to history display
    locationCoords?: Location; // Optional coordinates for map (kept for weather/prediction)
    assignedVehicleId?: string | null; // Added for vehicle display
    assignedDriverName?: string | null; // Added for driver display
    assignedDriverPhone?: string | null; // Added driver phone number
    items?: ShipmentItem[]; // Added to display item details
    estimatedPrice?: number; // Added estimated price
    rateUsed?: string; // Added rate used for estimation
}

// Helper function to map Booking state to ShipmentDisplayInfo['status']
const mapBookingToDisplayStatus = (booking: Booking): ShipmentDisplayInfo['status'] => {
    if (!booking) return 'Not Found'; // Handle undefined booking object
    if (booking.status === 'Pending') {
        return 'Pending Confirmation';
    }
    if (booking.status === 'Rejected') {
        return 'Rejected';
    }
    if (booking.status === 'Approved') {
        // If approved, use the shipmentStatus if available, otherwise default to 'Waiting for Pickup'
        return booking.shipmentStatus ?? 'Waiting for Pickup';
    }
    // Fallback for unexpected booking status (shouldn't happen with current types)
    return 'Not Found';
};

// Helper to get progress value based on display status
const getProgressValue = (status: ShipmentDisplayInfo['status']): number => {
    switch (status) {
        case 'Pending Confirmation': return 5;
        case 'Rejected': return 0;
        case 'Waiting for Pickup': return 10;
        case 'Picked Up': return 25;
        case 'In Transit': return 50;
        case 'At Hub': return 65;
        case 'Out for Delivery': return 80;
        case 'Delivered': return 100;
        case 'Delayed': return 50; // Or adjust based on last known good status before delay
        case 'Cancelled': return 0;
        case 'Not Found': return 0;
        // Add handling for history-related statuses if they ever leak into display status
        case 'Booking Created': return 0;
        case 'Booking Approved': return 5;
        case 'Booking Rejected': return 0;
        default: return 0;
    }
};

// Icons for combined status
const statusIcons: Record<ShipmentDisplayInfo['status'], React.ElementType> = {
    'Pending Confirmation': Hourglass,
    'Rejected': Ban,
    'Waiting for Pickup': Hourglass, // Changed from 'Awaiting Dispatch'
    'Picked Up': Truck, // Changed from 'Dispatched'
    'In Transit': Ship, // Consider changing icon based on transport type later
    'At Hub': Warehouse,
    'Out for Delivery': Truck,
    'Delivered': CircleCheck,
    'Delayed': AlertTriangle,
    'Cancelled': Ban,
    'Not Found': AlertTriangle,
     // Added entries for statuses that might appear in history but shouldn't be the primary *display* status
     // Provide sensible fallbacks just in case.
    'Booking Created': Hourglass,
    'Booking Approved': Hourglass,
    'Booking Rejected': Ban,
};


function TrackPageContent() {
    const searchParams = useSearchParams();
    const initialTrackingId = searchParams.get('trackingId') || '';
    const [trackingId, setTrackingId] = useState(initialTrackingId);
    const [shipmentDisplay, setShipmentDisplay] = useState<ShipmentDisplayInfo | null>(null); // Use the display interface
    const [isLoading, setIsLoading] = useState(false);
    const [weather, setWeather] = useState<Weather | null>(null);
    const [weatherLoading, setWeatherLoading] = useState(false);
    const [deliveryPrediction, setDeliveryPrediction] = useState<PredictDeliveryTimeOutput | null>(null);
    const [predictionLoading, setPredictionLoading] = useState(false);
    // Removed map state
    // const [mapCenter, setMapCenter] = useState<Location | null>(null);
    // const [mapKey, setMapKey] = useState(Date.now()); // Key to force map remount if needed

    // Booking Store
    const bookings = useBookingStore((state) => state.bookings);
    const isBookingStoreHydrated = useIsBookingStoreHydrated();

    // Driver Store
    const drivers = useDriverStore((state) => state.drivers);
    const isDriverStoreHydrated = useIsDriverStoreHydratedHook();

    const [hasMounted, setHasMounted] = useState(false); // Keep mounted state check

    useEffect(() => {
        setHasMounted(true);
        console.log("TrackPage mounted, isBookingStoreHydrated:", isBookingStoreHydrated, "isDriverStoreHydrated:", isDriverStoreHydrated);
    }, [isBookingStoreHydrated, isDriverStoreHydrated]); // Re-check if hydration state changes


    const handleSearch = async (e?: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        console.log("handleSearch called. Tracking ID:", trackingId, "isBookingStoreHydrated:", isBookingStoreHydrated, "isDriverStoreHydrated:", isDriverStoreHydrated, "hasMounted:", hasMounted);
        if (!trackingId || !isBookingStoreHydrated || !isDriverStoreHydrated || !hasMounted) {
            console.log("Search aborted. Conditions not met.");
            // Optionally show a message to wait or if trackingId is empty
            if (!isBookingStoreHydrated || !isDriverStoreHydrated || !hasMounted) console.log("Stores not ready yet...");
            return;
        }

        setIsLoading(true);
        setShipmentDisplay(null); // Clear previous results
        setWeather(null);
        setDeliveryPrediction(null);
        setWeatherLoading(false);
        setPredictionLoading(false);
        // Removed map state reset
        // setMapCenter(null); // Reset map center


        console.log("Searching for Tracking ID:", trackingId.toUpperCase());
        console.log("Bookings in store:", bookings);
        console.log("Drivers in store:", drivers); // Log drivers for debugging

        await new Promise(resolve => setTimeout(resolve, 300)); // Short delay

        const foundBooking = bookings.find(b => b.trackingId?.toUpperCase() === trackingId.toUpperCase());

        console.log("Found Booking:", foundBooking);

        if (foundBooking) {
            const displayStatus = mapBookingToDisplayStatus(foundBooking);
            console.log("Mapped Display Status:", displayStatus);

             // Find the assigned driver details
             let assignedDriverPhone: string | null = null;
             if (foundBooking.assignedDriverName) {
                const foundDriver = drivers.find(d => d.name === foundBooking.assignedDriverName);
                 if (foundDriver) {
                    assignedDriverPhone = foundDriver.contactPhone;
                 }
             }
             console.log(`Driver ${foundBooking.assignedDriverName} found, phone: ${assignedDriverPhone}`);

            // Create a basic history from booking data, ensuring correct types
            const formattedHistory = (foundBooking.history || []).map((h: ShipmentHistoryEntry) => ({
                timestamp: format(h.timestamp, 'PPp'), // Format date here
                location: h.location || 'Unknown',
                status: h.status as string, // Map status to string for display
                remarks: h.remarks, // Include remarks
            }));


            // Try to parse coordinates (basic example, needs better parsing/geocoding)
            const extractCoords = (address: string): Location | undefined => {
                if (!address) return undefined;
                // Simple keyword matching for demo purposes
                // In a real app, use a Geocoding API
                if (address.toLowerCase().includes("chicago")) return { lat: 41.8781, lng: -87.6298 };
                if (address.toLowerCase().includes("new york")) return { lat: 40.7128, lng: -74.0060 };
                if (address.toLowerCase().includes("los angeles")) return { lat: 34.0522, lng: -118.2437 };
                if (address.toLowerCase().includes("miami")) return { lat: 25.7617, lng: -80.1918 };
                if (address.toLowerCase().includes("seattle")) return { lat: 47.6062, lng: -122.3321 };
                if (address.toLowerCase().includes("denver")) return { lat: 39.7392, lng: -104.9903 };
                if (address.toLowerCase().includes("boston")) return { lat: 42.3601, lng: -71.0589 };
                if (address.toLowerCase().includes("san francisco")) return { lat: 37.7749, lng: -122.4194 };
                if (address.toLowerCase().includes("main hub")) return { lat: 40.0, lng: -100.0 }; // Generic hub
                if (address.toLowerCase().includes("port newark")) return { lat: 40.6892, lng: -74.1518 };
                if (address.toLowerCase().includes("route 66")) return { lat: 35.0, lng: -100.0 }; // Generic route
                if (address.toLowerCase().includes("garage")) return { lat: 40.1, lng: -100.1 }; // Generic garage
                return undefined; // No match found
            }

            // Determine current location based on status
             let currentLocation = foundBooking.origin; // Default
             let locationCoords : Location | undefined = undefined;

             if (foundBooking.history && foundBooking.history.length > 0) {
                  const latestHistoryEntry = foundBooking.history.slice().reverse().find(entry => entry.location);
                  if (latestHistoryEntry?.location) {
                     currentLocation = latestHistoryEntry.location;
                  }
             }

             if (displayStatus === 'Delivered') {
                currentLocation = foundBooking.destination;
             }

             locationCoords = extractCoords(currentLocation);
             console.log("Extracted Coords for", currentLocation, ":", locationCoords);

            const displayData: ShipmentDisplayInfo = {
                id: foundBooking.trackingId,
                bookingId: foundBooking.id,
                status: displayStatus,
                currentLocation: currentLocation,
                origin: foundBooking.origin,
                destination: foundBooking.destination,
                estimatedDelivery: foundBooking.estimatedDelivery ? format(foundBooking.estimatedDelivery, 'PPP') : 'Not Available',
                history: formattedHistory, // Use formatted history
                locationCoords: locationCoords, // Use extracted coords
                assignedVehicleId: foundBooking.assignedVehicleId, // Pass vehicle ID
                assignedDriverName: foundBooking.assignedDriverName, // Pass driver name
                assignedDriverPhone: assignedDriverPhone, // Pass driver phone
                items: foundBooking.items, // Pass items array
                estimatedPrice: foundBooking.estimatedPrice, // Pass estimated price
                rateUsed: foundBooking.rateUsed, // Pass rate used
            };
            setShipmentDisplay(displayData);
            // Removed map state update
            // setMapCenter(locationCoords || null); // Update map center
            // setMapKey(Date.now()); // Update map key to force remount if needed (can remove if map updates correctly)
            console.log("Mapped Shipment Display Data:", displayData);


            // Fetch weather and prediction only if shipment is found and actively tracking
            const isActiveTracking = displayStatus !== 'Pending Confirmation' &&
                                     displayStatus !== 'Rejected' &&
                                     displayStatus !== 'Not Found' &&
                                     displayStatus !== 'Delivered' &&
                                     displayStatus !== 'Cancelled';

            // Always try to fetch weather if tracking is active, using a default location if needed
             if (isActiveTracking) {
                setWeatherLoading(true);
                 try {
                     // Use actual coords if available, otherwise use a default location for mock data
                     const weatherLocation = displayData.locationCoords || { lat: 0, lng: 0 }; // Example default
                     const weatherData = await getWeather(weatherLocation);
                     setWeather(weatherData);
                     console.log("Weather Data:", weatherData);
                 } catch (error) {
                     console.error("Failed to fetch weather:", error);
                 } finally {
                     setWeatherLoading(false);
                 }

                // Only run prediction if location coords are available (or adapt prediction if needed)
                if (displayData.locationCoords) {
                    setPredictionLoading(true);
                    try {
                        // Format history for AI prediction
                        const historyForAI = (foundBooking.history || []).map(h =>
                            `${format(h.timestamp, 'yyyy-MM-dd HH:mm')}: ${h.status} at ${h.location || 'Unknown'}`
                        ).join('\n');

                        const predictionInput: PredictDeliveryTimeInput = {
                            currentLocation: displayData.currentLocation,
                            shipmentHistory: historyForAI, // Pass formatted history string
                            destination: displayData.destination,
                        };
                        const predictionData = await predictDeliveryTime(predictionInput);
                        setDeliveryPrediction(predictionData);
                        console.log("Delivery Prediction:", predictionData);
                    } catch(error) {
                        console.error("Failed to predict delivery time:", error);
                    } finally {
                        setPredictionLoading(false);
                    }
                 } else {
                    console.log("Skipping prediction fetch due to missing coordinates");
                 }
            } else {
                 console.log("Skipping weather/prediction fetch for status:", displayStatus);
             }

        } else {
            setShipmentDisplay({ status: 'Not Found', id: trackingId, bookingId: '', origin: '', destination: '', estimatedDelivery: '', history: [] }); // Set as Not Found with default fields
            console.log("Shipment Not Found in store for ID:", trackingId.toUpperCase());
        }

        setIsLoading(false);
    };

    // Trigger search if initialTrackingId exists on mount and store is ready
    useEffect(() => {
        console.log("useEffect trigger for initial search. initialTrackingId:", initialTrackingId, "isBookingStoreHydrated:", isBookingStoreHydrated, "isDriverStoreHydrated:", isDriverStoreHydrated, "hasMounted:", hasMounted);
        if (initialTrackingId && isBookingStoreHydrated && isDriverStoreHydrated && hasMounted) {
            console.log("Conditions met for initial search.");
            handleSearch();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialTrackingId, isBookingStoreHydrated, isDriverStoreHydrated, hasMounted]); // Depend on hydration and mount status


    // Default to Package icon if status is somehow undefined or not in map
    const StatusIcon = shipmentDisplay?.status ? (statusIcons[shipmentDisplay.status] || Package) : Package;

    // Render loading state if store is not hydrated yet or component not mounted
    if (!hasMounted || !isBookingStoreHydrated || !isDriverStoreHydrated) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Loading tracking information...</p>
            </div>
        );
    }


    return (
            <div className="container mx-auto px-4 py-12">
                <Card className="max-w-4xl mx-auto mb-8 shadow-md">
                    <CardHeader>
                        <CardTitle className="text-3xl">Trace &amp; Track Shipment</CardTitle>
                        <CardDescription>Enter your unique tracking ID to view the status of your cargo.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <Input
                                type="text"
                                placeholder="Enter Tracking ID"
                                value={trackingId}
                                onChange={(e) => setTrackingId(e.target.value)}
                                className="flex-grow"
                                required
                                aria-label="Tracking ID"
                            />
                            <Button type="submit" disabled={isLoading || !isBookingStoreHydrated || !isDriverStoreHydrated} className="bg-accent text-accent-foreground hover:bg-accent/90">
                                <Search className="mr-2 h-4 w-4" />
                                {isLoading ? 'Searching...' : 'Track'}
                            </Button>
                        </form>
                        {(!isBookingStoreHydrated || !isDriverStoreHydrated) && <p className="text-xs text-muted-foreground mt-2">Initializing tracking system...</p>}
                    </CardContent>
                </Card>

                {isLoading && (
                    <div className="text-center text-lg flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" /> Loading shipment details...
                    </div>
                )}

                {shipmentDisplay && shipmentDisplay.status !== 'Not Found' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Shipment Details */}
                        <Card className="lg:col-span-2 shadow-lg">
                            <CardHeader>
                                <div className="flex justify-between items-start flex-wrap gap-y-2">
                                    <div>
                                        <CardTitle className="text-2xl mb-1">Shipment ID: {shipmentDisplay.id}</CardTitle>
                                        <CardDescription>{shipmentDisplay.origin} to {shipmentDisplay.destination}</CardDescription>
                                        {/* Show Booking Ref if needed */}
                                        {shipmentDisplay.bookingId && <CardDescription className="text-xs">Booking Ref: {shipmentDisplay.bookingId}</CardDescription>}
                                    </div>
                                    <div className={`flex items-center gap-2 p-2 rounded-md text-sm ${
                                        shipmentDisplay.status === 'Delivered' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                        : shipmentDisplay.status === 'Delayed' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                                        : shipmentDisplay.status === 'Rejected' || shipmentDisplay.status === 'Cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                        : shipmentDisplay.status === 'Pending Confirmation' || shipmentDisplay.status === 'Waiting for Pickup' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' // In Transit, Dispatched, etc.
                                    }`}>
                                        <StatusIcon className="h-5 w-5" />
                                        <span className="font-medium">{shipmentDisplay.status}</span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Progress Bar for active shipments */}
                                {shipmentDisplay.status !== 'Pending Confirmation' && shipmentDisplay.status !== 'Rejected' && shipmentDisplay.status !== 'Cancelled' && shipmentDisplay.status !== 'Not Found' && (
                                    <div className="mb-6">
                                        <label className="text-sm font-medium text-muted-foreground">Progress</label>
                                        <Progress value={getProgressValue(shipmentDisplay.status)} className="w-full h-2 mt-1" aria-label={`Shipment progress: ${getProgressValue(shipmentDisplay.status)}%`} />
                                        {/* Simplified progress labels */}
                                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                            <span>Origin</span>
                                            <span>In Transit</span>
                                            <span>Destination Hub</span>
                                            <span>Delivered</span>
                                        </div>
                                    </div>
                                )}

                                {/* Informational messages for non-active statuses */}
                                {(shipmentDisplay.status === 'Pending Confirmation' || shipmentDisplay.status === 'Rejected' || shipmentDisplay.status === 'Cancelled') && (
                                    <div className="mb-6 p-4 bg-secondary rounded-md text-center">
                                        <p className="font-medium">
                                            {shipmentDisplay.status === 'Pending Confirmation'
                                                ? "Booking is awaiting confirmation."
                                                : shipmentDisplay.status === 'Rejected'
                                                ? "This booking request was rejected."
                                                : "This shipment has been cancelled."}
                                        </p>
                                        {shipmentDisplay.status === 'Pending Confirmation' && <p className="text-sm text-muted-foreground">Tracking details will be available once the booking is approved and dispatched.</p>}
                                    </div>
                                )}

                                <Separator className="my-6" />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1"><MapPin className="h-4 w-4" /> Current Location</p>
                                        <p className="font-semibold">{shipmentDisplay.currentLocation || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1"><Clock className="h-4 w-4" /> Estimated Delivery</p>
                                        <p className={`font-semibold ${shipmentDisplay.status === 'Delayed' ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>{shipmentDisplay.estimatedDelivery}</p>
                                    </div>
                                    {/* Estimated Price */}
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1"><IndianRupee className="h-4 w-4" /> Estimated Price</p>
                                        <p className="font-semibold">
                                            {shipmentDisplay.estimatedPrice !== undefined
                                            ? `₹ ${shipmentDisplay.estimatedPrice.toLocaleString('en-IN')}`
                                            : 'N/A'}
                                            {shipmentDisplay.rateUsed && <span className="text-xs text-muted-foreground block">({shipmentDisplay.rateUsed})</span>}
                                        </p>
                                    </div>
                                    {/* Assigned Vehicle and Driver */}
                                    {shipmentDisplay.status !== 'Pending Confirmation' && shipmentDisplay.status !== 'Rejected' && shipmentDisplay.status !== 'Cancelled' && shipmentDisplay.status !== 'Not Found' && (
                                        <>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1"><Truck className="h-4 w-4" /> Delivery Vehicle</p>
                                                <p className="font-semibold">{shipmentDisplay.assignedVehicleId || 'Not Assigned Yet'}</p>
                                            </div>
                                            <div>
                                                 <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1"><User className="h-4 w-4" /> Delivery Personnel</p>
                                                 <p className="font-semibold">{shipmentDisplay.assignedDriverName || 'Not Assigned Yet'}</p>
                                                 {shipmentDisplay.assignedDriverPhone && (
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                       <Phone className="h-3 w-3" /> {shipmentDisplay.assignedDriverPhone}
                                                    </p>
                                                  )}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Items Included */}
                                {shipmentDisplay.items && shipmentDisplay.items.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="font-semibold mb-2 text-lg flex items-center gap-2"><List className="h-5 w-5"/> Items Included</h4>
                                        <ul className="list-disc list-inside space-y-1 text-sm pl-5">
                                            {shipmentDisplay.items.map((item) => (
                                                <li key={item.productId}>
                                                    <strong>{item.name}</strong> (ID: <span className="font-mono text-xs text-muted-foreground">{item.productId}</span>)
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}


                                {/* Delivery Prediction */}
                                {predictionLoading && (
                                <div className="flex items-center gap-2 text-muted-foreground mb-6">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Predicting delivery time...
                                </div>
                                )}
                                {deliveryPrediction && !predictionLoading && shipmentDisplay.status !== 'Pending Confirmation' && shipmentDisplay.status !== 'Rejected' && shipmentDisplay.status !== 'Cancelled' && shipmentDisplay.status !== 'Delivered' && (
                                    <Card className="mb-6 bg-secondary border-accent/30">
                                        <CardHeader className="pb-2 pt-4">
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                {/* Simple Brain Icon */}
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v1.13a1 1 0 0 0 .5.87h0a4.4 4.4 0 0 1 4 4.9V14"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v1.13a1 1 0 0 1-.5.87h0a4.4 4.4 0 0 0-4 4.9V14"/><path d="M6 14a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h1a2 2 0 0 0 2-2v0a2 2 0 0 0-2-2Z"/><path d="M17 14a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1a2 2 0 0 1-2-2v0a2 2 0 0 1 2-2Z"/><path d="M12 14a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h0a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1Z"/><path d="M15.3 19.5A3.5 3.5 0 0 1 12 22a3.5 3.5 0 0 1-3.3-2.5"/><path d="M12 14v-1.75a3.25 3.25 0 0 0-3.25-3.25H8a3.25 3.25 0 0 0-3.25 3.25V14"/></svg>
                                                AI Delivery Prediction
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-0 pb-4 text-sm">
                                            <p><strong>Estimated Time:</strong> {deliveryPrediction.estimatedDeliveryTime}</p>
                                            <p><strong>Confidence:</strong> {Math.round(deliveryPrediction.confidenceLevel * 100)}%</p>
                                            <p className="text-xs mt-2 text-muted-foreground"><strong>Reasoning:</strong> {deliveryPrediction.reasons}</p>
                                        </CardContent>
                                    </Card>
                                )}


                                <h4 className="font-semibold mb-3 text-lg">Shipment History</h4>
                                <div className="space-y-4 max-h-60 overflow-y-auto pr-2 border-l border-muted pl-4">
                                    {shipmentDisplay.history.slice().reverse().map((item, index, arr) => (
                                        <div key={index} className="relative pl-6">
                                            {/* Dot */}
                                            <div className={`absolute -left-[2px] top-[5px] w-3 h-3 rounded-full border-2 ${index === 0 ? 'border-accent bg-background' : 'border-muted bg-muted'}`}></div>
                                            {/* Line (only if not the last item) */}
                                            {index < arr.length - 1 && <div className="absolute -left-px top-[18px] bottom-[-10px] w-px bg-muted"></div>}
                                            <p className={`font-medium ${index === 0 ? 'text-foreground' : 'text-muted-foreground'}`}>{item.status}</p>
                                            <p className="text-sm text-muted-foreground">{item.location}</p>
                                            <p className="text-xs text-muted-foreground">{item.timestamp}</p>
                                            {/* Display remarks if present */}
                                            {item.remarks && <p className="text-xs text-muted-foreground italic mt-1">Notes: {item.remarks}</p>}
                                        </div>
                                    ))}
                                    {shipmentDisplay.history.length === 0 && <p className="text-sm text-muted-foreground pl-6">No history available yet.</p>}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Right Column: Map Placeholder and Weather */}
                        <div className="space-y-8">
                             {/* Removed Map Card */}
                             {/* <Card className="shadow-lg"> ... </Card> */}

                             <Card className="shadow-lg">
                                <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2"><MapPin className="h-5 w-5 text-accent" /> Location Overview</CardTitle>
                                </CardHeader>
                                <CardContent>
                                <div className="h-64 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                                    {/* Map Placeholder */}
                                    Map Visualization Removed
                                </div>
                                    <p className="text-xs text-muted-foreground mt-2">Current location: {shipmentDisplay.currentLocation || 'N/A'}</p>
                                </CardContent>
                            </Card>

                            {/* Weather Alert */}
                            {/* Display weather even if shipment isn't actively tracking, using mock data */}
                            <Card className="shadow-lg">
                                <CardHeader>
                                    <CardTitle className="text-xl flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-accent" /> Weather Alert</CardTitle>
                                </CardHeader>
                                <CardContent>
                                {weatherLoading && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" /> Loading weather data...
                                    </div>
                                )}
                                {weather && !weatherLoading && (
                                    <div>
                                    <p><strong>Conditions:</strong> {weather.conditions} near {shipmentDisplay.currentLocation || 'shipment area'}</p>
                                    <p><strong>Temperature:</strong> {weather.temperatureFarenheit}°F</p>
                                    {(weather.conditions.toLowerCase().includes('storm') || weather.conditions.toLowerCase().includes('heavy rain') || weather.conditions.toLowerCase().includes('fog') || weather.conditions.toLowerCase().includes('snow') || weather.conditions.toLowerCase().includes('high wind') || weather.conditions.toLowerCase().includes('freezing')) && (
                                        <p className="mt-2 text-yellow-600 dark:text-yellow-400 font-medium flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Weather conditions may impact delivery.</p>
                                    )}
                                    </div>
                                )}
                                {!weather && !weatherLoading && <p className="text-muted-foreground">Could not load weather data.</p>}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {shipmentDisplay && shipmentDisplay.status === 'Not Found' && (
                    <Card className="max-w-md mx-auto text-center border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 shadow-md">
                        <CardHeader>
                            <AlertTriangle className="h-10 w-10 mx-auto text-yellow-500 mb-2" />
                            <CardTitle className="text-2xl text-yellow-700 dark:text-yellow-300">Shipment Not Found</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">We couldn't find any shipment with the ID: <strong>{trackingId}</strong>. Please check the ID and try again, ensuring the booking has been approved.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
    );
}

// Wrap the main content in Suspense for searchParams usage
export default function TrackPage() {
    return (
        <Suspense fallback={<div className="container mx-auto px-4 py-12 text-center">Loading...</div>}>
            <TrackPageContent />
        </Suspense>
    );
}

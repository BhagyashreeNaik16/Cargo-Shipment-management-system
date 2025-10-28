// src/app/admin/weather/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Map, Sun, Cloud, CloudRain, CloudSnow, Wind, Thermometer, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface MockShipmentWeather {
  id: string;
  location: string;
  conditions: string;
  temperature: number; // Celsius
  icon: React.ElementType;
  severity: 'low' | 'medium' | 'high' | 'none';
}

const mockLocations = [
  'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Miami, FL', 'Seattle, WA',
  'Denver, CO', 'Boston, MA', 'San Francisco, CA', 'Houston, TX', 'Atlanta, GA',
  'Port Newark', 'Main Hub', 'Route 66', 'Garage', 'Dallas, TX'
];

const possibleConditions = [
  { name: 'Sunny', icon: Sun, severity: 'none' },
  { name: 'Partly Cloudy', icon: Cloud, severity: 'none' },
  { name: 'Cloudy', icon: Cloud, severity: 'low' },
  { name: 'Light Rain', icon: CloudRain, severity: 'low' },
  { name: 'Heavy Rain', icon: CloudRain, severity: 'medium' },
  { name: 'Thunderstorm', icon: CloudRain, severity: 'high' },
  { name: 'Snowy', icon: CloudSnow, severity: 'high' },
  { name: 'Foggy', icon: Cloud, severity: 'medium' },
  { name: 'Windy', icon: Wind, severity: 'low' },
  { name: 'High Wind', icon: Wind, severity: 'high' },
];

// Generate random weather data
const generateMockWeatherData = (count: number): MockShipmentWeather[] => {
  const data: MockShipmentWeather[] = [];
  const usedLocations = new Set<string>();

  for (let i = 0; i < count; i++) {
    let location = mockLocations[Math.floor(Math.random() * mockLocations.length)];
    // Ensure unique locations for better demo
    while (usedLocations.has(location) && usedLocations.size < mockLocations.length) {
       location = mockLocations[Math.floor(Math.random() * mockLocations.length)];
    }
    usedLocations.add(location);

    const condition = possibleConditions[Math.floor(Math.random() * possibleConditions.length)];
    const temperature = Math.floor(Math.random() * 40) - 5; // Range: -5 to 35 Celsius

    data.push({
      id: `CT${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      location: location,
      conditions: condition.name,
      temperature: temperature,
      icon: condition.icon,
      severity: condition.severity,
    });
  }
  return data;
};

// Function to get severity badge color
const getSeverityBadgeVariant = (severity: MockShipmentWeather['severity']): "default" | "secondary" | "destructive" | "outline" => {
  switch (severity) {
    case 'high': return 'destructive';
    case 'medium': return 'outline'; // Use outline for medium (like yellow/orange)
    case 'low': return 'secondary';
    case 'none': return 'default'; // Use default for no significant alert
    default: return 'outline';
  }
};

export default function AdminWeatherPage() {
  const [weatherData, setWeatherData] = useState<MockShipmentWeather[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data on component mount (client-side)
    setIsLoading(true);
    setTimeout(() => {
      setWeatherData(generateMockWeatherData(5)); // Generate data for 5 locations
      setIsLoading(false);
    }, 500); // Simulate network delay
  }, []);

  return (
    <div className="space-y-6">
       <h1 className="text-3xl font-bold">Weather Alerts</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-yellow-500" /> Active Alerts</CardTitle>
          <p className="text-sm text-muted-foreground">Simulated real-time weather alerts potentially affecting shipping routes.</p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex items-center justify-center gap-2 text-muted-foreground py-8">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading weather data...
             </div>
          ) : weatherData.length > 0 ? (
            <ul className="space-y-4">
              {weatherData.map((alert) => (
                <li key={alert.id} className="p-4 border rounded-md bg-background hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center gap-3">
                      <alert.icon className={`h-6 w-6 ${alert.severity === 'high' ? 'text-destructive' : alert.severity === 'medium' ? 'text-yellow-600' : 'text-accent'}`} />
                      <div>
                        <p className="font-semibold">{alert.location}</p>
                        <p className="text-sm text-muted-foreground">
                           <span className="flex items-center gap-1">
                             <Thermometer className="h-3 w-3"/> {alert.temperature}°C, {alert.conditions}
                           </span>
                           {/* <span className="text-xs">(Affecting Shipment: {alert.id})</span> */}
                        </p>
                      </div>
                    </div>
                     <Badge variant={getSeverityBadgeVariant(alert.severity)} className="capitalize mt-2 sm:mt-0 w-fit">
                        {alert.severity === 'none' ? 'Normal' : `${alert.severity} Severity`}
                    </Badge>
                  </div>
                  {alert.severity !== 'none' && (
                    <p className="mt-2 text-xs text-muted-foreground italic pl-9">
                       Potential impact on routes near {alert.location}. Monitor shipments {alert.id} in this area.
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-4">No active weather alerts.</p>
          )}
        </CardContent>
      </Card>
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Map className="h-5 w-5 text-accent" /> Weather Map</CardTitle>
        </CardHeader>
        <CardContent>
           <div className="h-96 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
             Map visualization of weather-affected zones will be displayed here.
           </div>
           <p className="mt-4 text-muted-foreground">Integration with a weather service (e.g., OpenWeatherMap API) and mapping library (e.g., Leaflet) is required for a functional map.</p>
        </CardContent>
      </Card>
    </div>
  );
}

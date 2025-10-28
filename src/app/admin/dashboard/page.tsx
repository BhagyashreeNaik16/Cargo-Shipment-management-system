'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Ship, CircleCheck, FileText, Truck } from 'lucide-react'; // Import necessary icons
import { ChartTooltip, ChartTooltipContent, ChartContainer } from '@/components/ui/chart' // ShadCN Chart components
import { Bar, Line, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieLabel, PieChart, BarChart, LineChart } from 'recharts'; // Recharts components

// Mock Data - Replace with real data fetching
const kpiData = {
    totalShipments: 1250,
    onTimeDeliveryRate: 92.5,
    activeBookings: 150,
    fleetUsage: 78.3,
};

const shipmentsByStatus = [
    { name: 'Delivered', value: 800, fill: 'hsl(var(--chart-2))' },
    { name: 'In Transit', value: 300, fill: 'hsl(var(--chart-1))' },
    { name: 'At Hub', value: 100, fill: 'hsl(var(--chart-4))' },
    { name: 'Delayed', value: 50, fill: 'hsl(var(--chart-5))' },
];

const monthlyShipments = [
    { month: 'Jan', shipments: 80 },
    { month: 'Feb', shipments: 95 },
    { month: 'Mar', shipments: 110 },
    { month: 'Apr', shipments: 105 },
    { month: 'May', shipments: 130 },
    { month: 'Jun', shipments: 145 },
    { month: 'Jul', shipments: 150 }, // Assuming current month data
];

const deliveryPerformance = [
  { month: 'Jan', onTime: 90, delayed: 10 },
  { month: 'Feb', onTime: 92, delayed: 8 },
  { month: 'Mar', onTime: 88, delayed: 12 },
  { month: 'Apr', onTime: 95, delayed: 5 },
  { month: 'May', onTime: 93, delayed: 7 },
  { month: 'Jun', onTime: 91, delayed: 9 },
  { month: 'Jul', onTime: 92.5, delayed: 7.5 }, // Current rate
];

const chartConfigStatus = {
  value: { label: 'Shipments' },
   delivered: { label: 'Delivered', color: 'hsl(var(--chart-2))' },
   inTransit: { label: 'In Transit', color: 'hsl(var(--chart-1))' },
   atHub: { label: 'At Hub', color: 'hsl(var(--chart-4))' },
   delayed: { label: 'Delayed', color: 'hsl(var(--chart-5))' },
};

const chartConfigMonthly = {
  shipments: { label: 'Shipments', color: 'hsl(var(--chart-1))' },
};

const chartConfigPerformance = {
  onTime: { label: 'On-Time (%)', color: 'hsl(var(--chart-2))' },
  delayed: { label: 'Delayed (%)', color: 'hsl(var(--chart-5))' },
};


export default function AdminDashboardPage() {

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
                        <Ship className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpiData.totalShipments}</div>
                        <p className="text-xs text-muted-foreground">+5% from last month</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">On-Time Delivery Rate</CardTitle>
                        <CircleCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpiData.onTimeDeliveryRate}%</div>
                         <p className="text-xs text-muted-foreground">+1.2% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpiData.activeBookings}</div>
                        <p className="text-xs text-muted-foreground">+20 since last week</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Fleet Usage</CardTitle>
                        <Truck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpiData.fleetUsage}%</div>
                         <p className="text-xs text-muted-foreground">Slightly down from peak</p>
                    </CardContent>
                </Card>
            </div>

             {/* Charts Row 1*/}
             <div className="grid gap-6 md:grid-cols-2">
                 {/* Shipments by Status (Pie Chart) */}
                 <Card>
                     <CardHeader>
                         <CardTitle>Shipments by Status</CardTitle>
                         <CardDescription>Distribution of current shipment statuses.</CardDescription>
                     </CardHeader>
                     <CardContent>
                        <ChartContainer config={chartConfigStatus} className="mx-auto aspect-square max-h-[300px]">
                           <ResponsiveContainer width="100%" height={300}>
                             <PieChart>
                               <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                               <Pie data={shipmentsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                                  const RADIAN = Math.PI / 180;
                                  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                  return (
                                    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                                      {`${(percent * 100).toFixed(0)}%`}
                                    </text>
                                  );
                                }}>
                                  {shipmentsByStatus.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                  ))}
                                </Pie>
                                 <Legend verticalAlign="bottom" height={36} />
                             </PieChart>
                            </ResponsiveContainer>
                         </ChartContainer>
                     </CardContent>
                 </Card>

                  {/* Monthly Shipments (Line Chart) */}
                 <Card>
                     <CardHeader>
                         <CardTitle>Monthly Shipments Trend</CardTitle>
                         <CardDescription>Total shipments over the past few months.</CardDescription>
                     </CardHeader>
                     <CardContent>
                       <ChartContainer config={chartConfigMonthly} className="h-[300px] w-full">
                           <ResponsiveContainer width="100%" height={300}>
                             <LineChart data={monthlyShipments} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                               <CartesianGrid strokeDasharray="3 3" />
                               <XAxis dataKey="month" />
                               <YAxis />
                                <ChartTooltip
                                  cursor={false}
                                  content={<ChartTooltipContent hideLabel />}
                                />
                               <Line type="monotone" dataKey="shipments" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={true} />
                                <Legend verticalAlign="bottom" height={36} />
                             </LineChart>
                            </ResponsiveContainer>
                         </ChartContainer>
                     </CardContent>
                 </Card>
             </div>


              {/* Charts Row 2 (Example: Bar Chart) */}
               <Card>
                 <CardHeader>
                    <CardTitle>Delivery Performance</CardTitle>
                    <CardDescription>On-time vs. Delayed percentage over months.</CardDescription>
                 </CardHeader>
                 <CardContent>
                   <ChartContainer config={chartConfigPerformance} className="h-[300px] w-full">
                       <ResponsiveContainer width="100%" height={300}>
                         <BarChart data={deliveryPerformance} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                           <CartesianGrid strokeDasharray="3 3" />
                           <XAxis dataKey="month" />
                           <YAxis tickFormatter={(value) => `${value}%`} />
                           <ChartTooltip content={<ChartTooltipContent />} />
                           <Legend verticalAlign="top" height={36}/>
                           <Bar dataKey="onTime" stackId="a" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                           <Bar dataKey="delayed" stackId="a" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]}/>
                         </BarChart>
                       </ResponsiveContainer>
                     </ChartContainer>
                 </CardContent>
               </Card>

              {/* Add Filters and Export options here later */}
              {/* Example: */}
              {/* <div className="flex justify-between items-center">
                  <div> Filters... </div>
                  <Button variant="outline">Export CSV</Button>
              </div> */}

        </div>
    );
}

// Helper component for Pie Chart Labels - Adjust as needed
// This is defined as type PieLabel which is imported, so we don't need a separate component definition
// const CustomPieLabel: PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
//   const RADIAN = Math.PI / 180;
//   const radius = innerRadius + (outerRadius - innerRadius) * 1.2; // Adjust label position
//   const x = cx + radius * Math.cos(-midAngle * RADIAN);
//   const y = cy + radius * Math.sin(-midAngle * RADIAN);

//   return (
//     <text x={x} y={y} fill="hsl(var(--foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
//       {`${name} (${(percent * 100).toFixed(0)}%)`}
//     </text>
//   );
// };

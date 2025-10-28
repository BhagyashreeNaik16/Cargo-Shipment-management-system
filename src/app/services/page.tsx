import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Anchor, Plane, Warehouse, PackageCheck, Globe2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ServicesPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <section className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Comprehensive Logistics Services</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Tailored solutions to meet your diverse cargo shipment needs, ensuring efficiency and reliability every step of the way.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {/* Road Freight */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-4 mb-3">
               <div className="p-3 rounded-full bg-accent/10 text-accent">
                  <Truck className="h-7 w-7" />
               </div>
              <CardTitle className="text-2xl">Road Freight</CardTitle>
            </div>
            <CardDescription>Efficient and flexible ground transport solutions.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <Image
              src="https://picsum.photos/400/250?grayscale&random=1"
              alt="Truck on Highway"
              width={400}
              height={250}
              className="rounded-md mb-4 w-full object-cover aspect-video"
              data-ai-hint="truck highway cargo transport"
            />
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Full Truckload (FTL) & Less Than Truckload (LTL)</li>
              <li>Domestic & Cross-Border</li>
              <li>Temperature-Controlled Transport</li>
              <li>Express Delivery Options</li>
            </ul>
          </CardContent>
        </Card>

        {/* Sea Freight */}
        <Card className="flex flex-col">
          <CardHeader>
             <div className="flex items-center gap-4 mb-3">
               <div className="p-3 rounded-full bg-accent/10 text-accent">
                 <Anchor className="h-7 w-7" />
               </div>
              <CardTitle className="text-2xl">Sea Freight</CardTitle>
            </div>
            <CardDescription>Cost-effective global ocean shipping.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
             <Image
              src="https://picsum.photos/400/250?grayscale&random=2"
              alt="Cargo Ship on Ocean"
              width={400}
              height={250}
              className="rounded-md mb-4 w-full object-cover aspect-video"
              data-ai-hint="cargo ship ocean container"
            />
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Full Container Load (FCL) & Less than Container Load (LCL)</li>
              <li>Port-to-Port & Door-to-Door</li>
              <li>Bulk Cargo & Project Logistics</li>
              <li>Customs Clearance Assistance</li>
            </ul>
          </CardContent>
        </Card>

        {/* Air Freight */}
        <Card className="flex flex-col">
          <CardHeader>
             <div className="flex items-center gap-4 mb-3">
               <div className="p-3 rounded-full bg-accent/10 text-accent">
                  <Plane className="h-7 w-7" />
               </div>
              <CardTitle className="text-2xl">Air Freight</CardTitle>
             </div>
            <CardDescription>Rapid transport for time-critical shipments.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <Image
              src="https://picsum.photos/400/250?grayscale&random=3"
              alt="Cargo Plane Taking Off"
              width={400}
              height={250}
              className="rounded-md mb-4 w-full object-cover aspect-video"
              data-ai-hint="cargo plane airport logistics"
            />
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Express & Standard Air Cargo</li>
              <li>Global Airport Network</li>
              <li>Special Handling (Perishables, Valuables)</li>
              <li>Charter Services Available</li>
            </ul>
          </CardContent>
        </Card>

         {/* Warehousing */}
        <Card className="flex flex-col">
          <CardHeader>
             <div className="flex items-center gap-4 mb-3">
               <div className="p-3 rounded-full bg-accent/10 text-accent">
                  <Warehouse className="h-7 w-7" />
               </div>
              <CardTitle className="text-2xl">Warehousing</CardTitle>
             </div>
            <CardDescription>Secure storage and distribution solutions.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <Image
              src="https://picsum.photos/400/250?grayscale&random=4"
              alt="Modern Warehouse Interior"
              width={400}
              height={250}
              className="rounded-md mb-4 w-full object-cover aspect-video"
              data-ai-hint="warehouse interior storage logistics"
            />
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Short-term & Long-term Storage</li>
              <li>Inventory Management</li>
              <li>Order Fulfillment & Distribution</li>
              <li>Cross-Docking Services</li>
            </ul>
          </CardContent>
        </Card>

         {/* Customs Brokerage */}
        <Card className="flex flex-col">
          <CardHeader>
             <div className="flex items-center gap-4 mb-3">
               <div className="p-3 rounded-full bg-accent/10 text-accent">
                  <PackageCheck className="h-7 w-7" />
               </div>
              <CardTitle className="text-2xl">Customs Brokerage</CardTitle>
             </div>
            <CardDescription>Navigating complex customs regulations.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
             <Image
              src="https://picsum.photos/400/250?grayscale&random=5"
              alt="Customs Officer Inspecting Cargo"
              width={400}
              height={250}
              className="rounded-md mb-4 w-full object-cover aspect-video"
              data-ai-hint="customs inspection cargo document"
            />
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Import & Export Documentation</li>
              <li>Duty & Tax Calculation</li>
              <li>Compliance Consulting</li>
              <li>Streamlined Clearance Process</li>
            </ul>
          </CardContent>
        </Card>

         {/* Supply Chain Solutions */}
        <Card className="flex flex-col">
          <CardHeader>
             <div className="flex items-center gap-4 mb-3">
               <div className="p-3 rounded-full bg-accent/10 text-accent">
                  <Globe2 className="h-7 w-7" />
               </div>
              <CardTitle className="text-2xl">Supply Chain Solutions</CardTitle>
             </div>
            <CardDescription>End-to-end logistics optimization.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
             <Image
              src="https://picsum.photos/400/250?grayscale&random=6"
              alt="Global Supply Chain Network Map"
              width={400}
              height={250}
              className="rounded-md mb-4 w-full object-cover aspect-video"
              data-ai-hint="supply chain network map global"
            />
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Logistics Consulting</li>
              <li>Route Optimization</li>
              <li>Vendor Management</li>
              <li>Risk Assessment & Mitigation</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="text-center bg-secondary py-12 rounded-lg">
        <h2 className="text-3xl font-semibold mb-4">Ready to Ship?</h2>
        <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
          Let our experts handle your logistics challenges. Get a quote or book your next shipment today.
        </p>
        <div className="space-x-4">
           <Link href="/book" passHref>
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                Book a Shipment
              </Button>
            </Link>
             <Link href="/contact" passHref>
              <Button size="lg" variant="outline" className="border-accent text-accent hover:bg-accent/10">
                Contact Us
              </Button>
            </Link>
        </div>
      </section>
    </div>
  );
}

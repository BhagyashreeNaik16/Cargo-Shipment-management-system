import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Anchor, Plane, MapPin, Search, UserCog } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative h-[60vh] md:h-[70vh] flex items-center justify-center text-center bg-secondary">
           <Image
              src="https://picsum.photos/1920/1080"
              alt="Cargo Ship at Port"
              layout="fill"
              objectFit="cover"
              quality={80}
              className="absolute inset-0 z-0 opacity-30"
              data-ai-hint="cargo ship port logistics"
            />
          <div className="container mx-auto px-4 z-10 relative">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-primary-foreground mix-blend-difference">Efficient Shipment Management</h1>
            <p className="text-lg md:text-xl mb-8 text-primary-foreground mix-blend-difference">
              Track, manage, and optimize your logistics operations seamlessly with PICK PACK SERVICES.
            </p>
            <div className="space-x-4">
              <Link href="/book" passHref>
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Book a Shipment
                </Button>
              </Link>
              <Link href="/track" passHref>
                <Button size="lg" variant="outline" className="border-accent text-accent hover:bg-accent/10">
                  Track Your Cargo
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section id="about" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-semibold mb-6">About Us</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
              PICK PACK SERVICES is dedicated to providing cutting-edge logistics solutions. Our platform simplifies shipment management, enhances tracking visibility, and optimizes supply chain efficiency for businesses of all sizes. We leverage technology to deliver reliability and peace of mind.
            </p>
             <Image
                src="https://picsum.photos/800/400"
                alt="Logistics Team Meeting"
                width={800}
                height={400}
                className="mx-auto rounded-lg shadow-md"
                data-ai-hint="logistics team meeting office"
              />
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-16 md:py-24 bg-secondary">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-semibold mb-12">Our Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="items-center">
                   <div className="p-3 rounded-full bg-accent/10 text-accent mb-4">
                    <Truck className="h-8 w-8" />
                   </div>
                  <CardTitle>Road Freight</CardTitle>
                  <CardDescription>Reliable and cost-effective ground transportation for domestic and cross-border shipments.</CardDescription>
                </CardHeader>
              </Card>
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="items-center">
                   <div className="p-3 rounded-full bg-accent/10 text-accent mb-4">
                    <Anchor className="h-8 w-8" />
                   </div>
                  <CardTitle>Sea Freight</CardTitle>
                  <CardDescription>Comprehensive ocean freight solutions for global containerized and bulk cargo.</CardDescription>
                </CardHeader>
              </Card>
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="items-center">
                   <div className="p-3 rounded-full bg-accent/10 text-accent mb-4">
                    <Plane className="h-8 w-8" />
                   </div>
                  <CardTitle>Air Freight</CardTitle>
                  <CardDescription>Fast and secure air cargo services for time-sensitive international shipments.</CardDescription>
                </CardHeader>
              </Card>
            </div>
             <div className="mt-12">
                <Link href="/services" passHref>
                 <Button variant="link" className="text-accent text-lg">
                    Learn More About Our Services &rarr;
                 </Button>
                </Link>
             </div>
          </div>
        </section>

        {/* Trace and Track Section */}
         <section id="trace-track" className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-semibold mb-6">Trace & Track Your Shipment</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Enter your unique tracking ID below to get real-time updates on your shipment's status and location.
            </p>
             <div className="max-w-md mx-auto">
               {/* Simplified form for landing page - actual tracking on /track */}
               <form action="/track" method="GET" className="flex gap-2">
                 <input
                   type="text"
                   name="trackingId"
                   placeholder="Enter Tracking ID"
                   className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                   required
                 />
                 <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
                   <Search className="mr-2 h-4 w-4" /> Track
                 </Button>
               </form>
            </div>
             <div className="mt-10">
                 <MapPin className="h-12 w-12 mx-auto text-accent mb-4" />
                <p className="text-muted-foreground">Visualize your shipment's journey on our live map.</p>
             </div>
          </div>
        </section>


        {/* Admin Login Section */}
        <section id="admin-login" className="py-16 md:py-24 bg-secondary">
          <div className="container mx-auto px-4 text-center">
             <UserCog className="h-12 w-12 mx-auto text-accent mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold mb-6">Admin Access</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Authorized personnel can log in to manage shipments, customers, staff, and system settings.
            </p>
            <Link href="/admin/login" passHref>
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                Admin Login
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

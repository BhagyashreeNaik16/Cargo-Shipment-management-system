import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Users, Globe } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <section className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">About PICK PACK SERVICES</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Revolutionizing logistics with technology, transparency, and trust.
        </p>
      </section>

      <section className="mb-16 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl font-semibold mb-4">Our Story</h2>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            Founded by a team of logistics experts and tech innovators, PICK PACK SERVICES was born from the need for a more efficient, transparent, and reliable shipment management solution. We saw the challenges faced by businesses in tracking their goods across complex supply chains and decided to build a platform that simplifies the entire process.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            From humble beginnings, we've grown into a trusted partner for companies worldwide, empowering them with real-time data, powerful analytics, and seamless communication tools. Our commitment is to continuously innovate and provide exceptional service to our clients.
          </p>
        </div>
        <div>
          <Image
            src="https://picsum.photos/600/400"
            alt="PICK PACK SERVICES Team"
            width={600}
            height={400}
            className="rounded-lg shadow-md mx-auto"
            data-ai-hint="logistics team diverse work"
          />
        </div>
      </section>

      <section className="mb-16 text-center">
        <h2 className="text-3xl font-semibold mb-10">Our Core Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-accent">
            <CardHeader className="items-center">
              <div className="p-3 rounded-full bg-accent/10 text-accent mb-4">
                <Target className="h-8 w-8" />
              </div>
              <CardTitle>Customer Centricity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">We prioritize our customers' needs, offering tailored solutions and exceptional support to ensure their success.</p>
            </CardContent>
          </Card>
          <Card className="border-accent">
            <CardHeader className="items-center">
              <div className="p-3 rounded-full bg-accent/10 text-accent mb-4">
                <Globe className="h-8 w-8" />
              </div>
              <CardTitle>Innovation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">We embrace technological advancements to continuously improve our platform and stay ahead in the logistics industry.</p>
            </CardContent>
          </Card>
          <Card className="border-accent">
            <CardHeader className="items-center">
              <div className="p-3 rounded-full bg-accent/10 text-accent mb-4">
                <Users className="h-8 w-8" />
              </div>
              <CardTitle>Integrity & Trust</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">We operate with transparency and honesty, building long-lasting relationships based on mutual trust and reliability.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="text-center bg-secondary py-12 rounded-lg">
        <h2 className="text-3xl font-semibold mb-4">Join Us on Our Journey</h2>
        <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
          Whether you're a small business or a large enterprise, PICK PACK SERVICES is here to optimize your logistics.
        </p>
        {/* Consider adding a Contact Us button or link here */}
      </section>
    </div>
  );
}

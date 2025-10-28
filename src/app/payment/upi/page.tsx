// src/app/payment/upi/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { IndianRupee, QrCode, CreditCard, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';

function UpiPaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [amount, setAmount] = useState<string | null>(null);
  const [receiverName, setReceiverName] = useState<string | null>(null);
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  useEffect(() => {
    setTrackingId(searchParams.get('trackingId'));
    setAmount(searchParams.get('amount'));
    setReceiverName(searchParams.get('receiverName'));
  }, [searchParams]);

  const handleConfirmPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!upiId && !document.getElementById('qrScanConfirmation')?.ariaChecked) { // Simple check if neither UPI ID entered nor QR presumed scanned
        toast({
            variant: "destructive",
            title: "Payment Incomplete",
            description: "Please enter your UPI ID or confirm QR scan.",
        });
        return;
    }

    setIsProcessing(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate payment confirmation
    toast({
      title: "Payment Confirmed (Mock)",
      description: `Payment for Tracking ID ${trackingId} has been confirmed.`,
    });
    setPaymentConfirmed(true);
    setIsProcessing(false);

    // Optional: Redirect after a short delay
    // setTimeout(() => {
    //   router.push(`/track?trackingId=${trackingId}`);
    // }, 3000);
  };

  if (!trackingId || !amount) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-theme(spacing.14)*2)] py-12">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Loading Payment Details...</CardTitle>
          </CardHeader>
          <CardContent>
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentConfirmed) {
    return (
        <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-theme(spacing.14)*2)] py-12">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
                    <CardTitle className="text-2xl">Payment Successful!</CardTitle>
                    <CardDescription>Your payment for Tracking ID <span className="font-semibold">{trackingId}</span> has been confirmed.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">You will receive shipment updates via your registered contact details once the booking is approved by admin.</p>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                    <Link href={`/track?trackingId=${trackingId}`} className="w-full">
                        <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Track Your Shipment</Button>
                    </Link>
                    <Link href="/" className="w-full">
                        <Button variant="outline" className="w-full">Go to Homepage</Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
  }


  const qrData = `upi://pay?pa=merchant-upi@pickpack&pn=PICK%20PACK%20SERVICES&am=${amount}&tid=${trackingId}&cu=INR&tn=Payment%20for%20shipment%20${trackingId}`;
  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;


  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-theme(spacing.14)*2)] py-12">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="text-center">
          <QrCode className="h-10 w-10 mx-auto text-accent mb-2" />
          <CardTitle className="text-2xl font-bold">UPI Payment</CardTitle>
          <CardDescription>
            Complete your payment for Shipment ID: <span className="font-semibold">{trackingId}</span>
            <br />
            Payable to: <span className="font-semibold">{receiverName ? decodeURIComponent(receiverName) : 'PICK PACK SERVICES'}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground">Amount to Pay</p>
            <p className="text-4xl font-bold flex items-center justify-center">
              <IndianRupee className="h-7 w-7 mr-1" />
              {parseFloat(amount).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-center text-muted-foreground">Scan the QR code with your UPI app</p>
            <div className="p-2 border rounded-md bg-white">
                 <Image
                    src={qrCodeApiUrl}
                    alt="UPI Payment QR Code"
                    width={200}
                    height={200}
                    className="rounded-md"
                    data-ai-hint="payment qr code"
                />
            </div>
             {/* Hidden checkbox for "QR scanned" confirmation - for demo without actual scan */}
             <input type="checkbox" id="qrScanConfirmation" className="hidden" aria-label="QR Scanned Confirmation"/>
          </div>

          <div className="relative flex items-center my-4">
            <div className="flex-grow border-t border-muted-foreground"></div>
            <span className="flex-shrink mx-4 text-muted-foreground text-xs">OR</span>
            <div className="flex-grow border-t border-muted-foreground"></div>
          </div>

          <form onSubmit={handleConfirmPayment} className="space-y-4">
            <div>
              <Label htmlFor="upiId" className="text-sm">Enter your UPI ID</Label>
              <Input
                id="upiId"
                type="text"
                placeholder="yourname@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                Icon={CreditCard}
                className="mt-1"
                disabled={isProcessing}
              />
            </div>
            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                'Confirm Payment (Mock)'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground text-center justify-center">
            This is a mock payment page. No real transaction will occur.
        </CardFooter>
      </Card>
    </div>
  );
}


export default function UpiPaymentPage() {
    return (
        <Suspense fallback={
            <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-theme(spacing.14)*2)] py-12">
                <Loader2 className="h-12 w-12 animate-spin text-accent" />
            </div>
        }>
            <UpiPaymentPageContent />
        </Suspense>
    )
}

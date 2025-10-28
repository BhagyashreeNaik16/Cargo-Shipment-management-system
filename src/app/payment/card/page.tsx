// src/app/payment/card/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Correct import for Label
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from "@/hooks/use-toast";
import { IndianRupee, CreditCard, Loader2, CheckCircle, CalendarDays, Lock, User } from 'lucide-react';
import Link from 'next/link';

// Zod schema for card payment validation
const cardPaymentSchema = z.object({
  cardholderName: z.string().min(3, { message: "Cardholder name is required" }),
  cardNumber: z.string()
    .min(13, { message: "Card number must be between 13 and 19 digits" })
    .max(19, { message: "Card number must be between 13 and 19 digits" })
    .regex(/^\d+$/, { message: "Card number must contain only digits" }),
  expiryDate: z.string()
    .min(5, { message: "Expiry date must be MM/YY" })
    .max(5, { message: "Expiry date must be MM/YY" })
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, { message: "Invalid expiry date format (MM/YY)" }),
  cvv: z.string()
    .min(3, { message: "CVV must be 3 or 4 digits" })
    .max(4, { message: "CVV must be 3 or 4 digits" })
    .regex(/^\d{3,4}$/, { message: "Invalid CVV" }),
});

type CardPaymentFormValues = z.infer<typeof cardPaymentSchema>;

function CardPaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [amount, setAmount] = useState<string | null>(null);
  const [receiverName, setReceiverName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  useEffect(() => {
    setTrackingId(searchParams.get('trackingId'));
    setAmount(searchParams.get('amount'));
    setReceiverName(searchParams.get('receiverName'));
  }, [searchParams]);

  const form = useForm<CardPaymentFormValues>({
    resolver: zodResolver(cardPaymentSchema),
    defaultValues: {
      cardholderName: '',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
    },
    mode: 'onChange',
  });

  const handlePaymentSubmit: SubmitHandler<CardPaymentFormValues> = async (data) => {
    console.log("Card Payment Data:", data);
    setIsProcessing(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate payment confirmation
    toast({
      title: "Payment Confirmed (Mock)",
      description: `Card payment for Tracking ID ${trackingId} has been confirmed.`,
    });
    setPaymentConfirmed(true);
    setIsProcessing(false);
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
                    <CardDescription>Your card payment for Tracking ID <span className="font-semibold">{trackingId}</span> has been confirmed.</CardDescription>
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

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-theme(spacing.14)*2)] py-12">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="text-center">
          <CreditCard className="h-10 w-10 mx-auto text-accent mb-2" />
          <CardTitle className="text-2xl font-bold">Card Payment</CardTitle>
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

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handlePaymentSubmit)} className="space-y-4">
               <FormField
                control={form.control}
                name="cardholderName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cardholder Name</FormLabel>
                    <FormControl>
                      <Input Icon={User} placeholder="Full name as on card" {...field} disabled={isProcessing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cardNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Card Number</FormLabel>
                    <FormControl>
                      <Input Icon={CreditCard} type="text" inputMode="numeric" placeholder="0000 0000 0000 0000" {...field} disabled={isProcessing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date</FormLabel>
                      <FormControl>
                        <Input Icon={CalendarDays} type="text" placeholder="MM/YY" {...field} disabled={isProcessing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cvv"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CVV</FormLabel>
                      <FormControl>
                        <Input Icon={Lock} type="password" inputMode="numeric" placeholder="123" {...field} disabled={isProcessing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isProcessing || !form.formState.isValid}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                  </>
                ) : (
                  'Pay Securely (Mock)'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground text-center justify-center">
            This is a mock payment page. No real transaction will occur.
        </CardFooter>
      </Card>
    </div>
  );
}


export default function CardPaymentPage() {
    return (
        <Suspense fallback={
            <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-theme(spacing.14)*2)] py-12">
                <Loader2 className="h-12 w-12 animate-spin text-accent" />
            </div>
        }>
            <CardPaymentPageContent />
        </Suspense>
    )
}

// src/app/register/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea'; // Import Textarea for address
import { Button } from '@/components/ui/button';
import { UserPlus, Loader2, Mail, Phone, Home as HomeIcon } from 'lucide-react'; // Added icons
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from '@/stores/auth-store'; // Import the auth store

// Zod schema for registration validation - Added name, phone, address
const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  username: z.string().min(3, { message: "Username must be at least 3 characters" }).max(20, { message: "Username cannot exceed 20 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().min(10, { message: "Phone number requires at least 10 digits" }), // Added phone validation
  address: z.string().min(5, { message: "Address requires at least 5 characters" }), // Added address validation
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], // Error applies to the confirmPassword field
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const registerUser = useAuthStore((state) => state.register);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "", // Added default value
      username: "",
      email: "",
      phone: "", // Added default value
      address: "", // Added default value
      password: "",
      confirmPassword: "",
    },
    mode: 'onChange',
  });

  // Updated onSubmit to include new fields
  const onSubmit: SubmitHandler<RegisterFormValues> = async (data) => {
    setIsLoading(true);
    console.log('Registration attempt:', data.username, data.email, data.name, data.phone, data.address);

    // Simulate backend call delay (remove in real app)
    await new Promise(resolve => setTimeout(resolve, 500));

    // Pass all required fields to registerUser
    const result = registerUser(
        data.name,
        data.username,
        data.email,
        data.phone,
        data.address,
        data.password
    );

    if (result.success) {
      toast({
        title: "Registration Successful",
        description: "Account created! Please log in.",
      });
      router.push('/login'); // Redirect to login page
    } else {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: result.message,
      });
      // Optionally set form errors if needed (e.g., for username exists)
      if (result.message.includes('Username')) {
           form.setError("username", { type: "manual", message: result.message });
      }
       if (result.message.includes('Email')) {
           form.setError("email", { type: "manual", message: result.message });
       }
    }

    setIsLoading(false);
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-theme(spacing.14)*2)] py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>Sign up to start booking shipments.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
               {/* Added Name Field */}
               <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input Icon={UserPlus} placeholder="Enter your full name" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Choose a username" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input Icon={Mail} type="email" placeholder="Enter your email" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Added Phone Field */}
               <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input Icon={Phone} type="tel" placeholder="Enter your phone number" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Added Address Field */}
               <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                       <Textarea Icon={HomeIcon} placeholder="Enter your full address" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Create a password (min 6 characters)" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirm your password" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isLoading || !form.formState.isValid}>
                 {isLoading ? (
                   <>
                     <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                   </>
                 ) : (
                   <>
                     <UserPlus className="mr-2 h-4 w-4" /> Create Account
                   </>
                 )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground justify-center">
          Already have an account?&nbsp;
          <Link href="/login" className="text-accent hover:underline underline-offset-4">
            Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

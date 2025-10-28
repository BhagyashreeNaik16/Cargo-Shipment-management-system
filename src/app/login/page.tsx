// src/app/login/page.tsx
'use client';

import { useState, useEffect } from 'react'; // Added useEffect
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, LogIn, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuthStore, useIsAuthStoreHydrated } from '@/stores/auth-store'; // Import auth store and hydration hook

// Zod schema for login validation
const loginSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function UserLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null); // Use separate state for form-level error display
  const router = useRouter();
  const { toast } = useToast();
  const loginUser = useAuthStore((state) => state.login);
  const isHydrated = useIsAuthStoreHydrated(); // Check if auth store is hydrated
  const [clientReady, setClientReady] = useState(false); // State to track client-side readiness

  // Ensure the component only proceeds once the store is hydrated
  useEffect(() => {
    if (isHydrated) {
      setClientReady(true);
    }
  }, [isHydrated]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
    mode: 'onChange',
  });

  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    setIsLoading(true);
    setLoginError(null); // Clear previous errors

    // Double-check readiness before proceeding (although button disabling should prevent this)
    if (!clientReady) {
         toast({
            variant: "destructive",
            title: "System Busy",
            description: "Authentication system is initializing. Please try again shortly.",
          });
          setIsLoading(false);
          return;
    }

    // Simulate API call delay (remove in real app)
    // await new Promise(resolve => setTimeout(resolve, 500));

    console.log("Attempting login with:", data.username); // Add logging
    const result = loginUser(data.username, data.password);
    console.log("Login result:", result); // Add logging

    if (result.success) {
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      router.push('/'); // Redirect to home page after successful user login
    } else {
      setLoginError(result.message); // Set the error message to display in the Alert
      toast({
          variant: "destructive",
          title: "Login Failed",
          description: result.message,
        });
    }
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-theme(spacing.14)*2)] py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">User Login</CardTitle>
          <CardDescription>Welcome back! Sign in to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
               {loginError && ( // Display login error if it exists
                 <Alert variant="destructive">
                   <AlertCircle className="h-4 w-4" />
                   <AlertTitle>Error</AlertTitle>
                   <AlertDescription>{loginError}</AlertDescription>
                 </Alert>
               )}
               <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your username" {...field} disabled={isLoading || !clientReady} />
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
                     <div className="flex items-center justify-between">
                       <FormLabel>Password</FormLabel>
                        <Link href="/forgot-password" className="text-sm text-muted-foreground hover:text-accent underline-offset-4 hover:underline">
                          Forgot password?
                        </Link>
                     </div>
                    <FormControl>
                      <Input type="password" placeholder="Enter your password" {...field} disabled={isLoading || !clientReady} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Disable button until client is ready (hydration complete) */}
              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isLoading || !form.formState.isValid || !clientReady}>
                 {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...
                    </>
                    ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" /> Login
                    </>
                    )}
              </Button>
               {!clientReady && <p className="text-xs text-center text-muted-foreground">Initializing...</p>}
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground justify-center">
          Don't have an account?&nbsp;
          <Link href="/register" className="text-accent hover:underline underline-offset-4">
            Create New
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

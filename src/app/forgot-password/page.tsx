// src/app/forgot-password/page.tsx
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'; // Added CardFooter import
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-theme(spacing.14)*2)] py-12">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
          <CardDescription>Enter your email to receive reset instructions.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your registered email"
                required
              />
            </div>
            {/* Add Submit Button Logic later */}
            <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
               <Mail className="mr-2 h-4 w-4" /> Send Reset Link
            </Button>
          </form>
        </CardContent>
         <CardFooter className="text-center text-sm text-muted-foreground justify-center">
            Remembered your password?&nbsp;
            <Link href="/login" className="text-accent hover:underline underline-offset-4">
                Login
            </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

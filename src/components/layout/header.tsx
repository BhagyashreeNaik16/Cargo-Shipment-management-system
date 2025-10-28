// src/components/layout/header.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Ship, User, LogOut, UserCircle2 } from 'lucide-react'; // Added LogOut, UserCircle2
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore, useIsAuthStoreHydrated } from '@/stores/auth-store'; // Import auth store
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar" // Import Avatar components
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator'; // Import Separator

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About Us' },
  { href: '/services', label: 'Services' },
  { href: '/track', label: 'Trace & Track' },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const currentUser = useAuthStore((state) => state.currentUser);
  const users = useAuthStore((state) => state.users); // Get all user data
  const logoutUser = useAuthStore((state) => state.logout);
  const isHydrated = useIsAuthStoreHydrated(); // Check hydration

   const handleLogout = () => {
     logoutUser();
     toast({
       title: "Logged Out",
       description: "You have been successfully logged out.",
     });
     router.push('/'); // Redirect to home after logout
   };

  // Helper function to generate avatar fallback initials
  const getInitials = (name: string | null | undefined): string => {
      if (!name) return 'U'; // Default to 'U' for User
      // Try getting initials from the stored 'name' field if available
      const userData = name && users[name];
      const displayName = userData?.name || name; // Use stored name, fallback to username
      return displayName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .substring(0, 2) // Max 2 initials
          .toUpperCase();
  };

  // Get user's display name (full name or username)
  const getUserDisplayName = (username: string | null): string => {
       if (!username) return '';
       const userData = users[username];
       return userData?.name || username;
   };


  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {navItems.map((item) => (
        <Link key={item.href} href={item.href} passHref legacyBehavior>
          <Button
            variant={pathname === item.href ? 'secondary' : 'ghost'}
            className={cn(
              'w-full justify-start',
              mobile ? 'text-lg py-4' : 'hidden md:inline-flex' // Adjusted classes
            )}
             onClick={() => mobile && document.querySelector('[data-radix-dialog-close]')?.click()} // Close sheet on mobile click
          >
            {item.label}
          </Button>
        </Link>
      ))}
       {/* User Login/Logout/Profile for mobile */}
       {mobile && isHydrated && (
         <>
           <Separator className="my-2" />
            {currentUser ? (
                 <>
                     <Link href="/profile" passHref legacyBehavior>
                        <Button
                            variant={pathname === '/profile' ? 'secondary' : 'ghost'}
                            className={cn('w-full justify-start text-lg py-4')}
                            onClick={() => document.querySelector('[data-radix-dialog-close]')?.click()} // Close sheet on click
                        >
                            <UserCircle2 className="mr-2 h-5 w-5" />
                            Profile
                        </Button>
                     </Link>
                     <Button
                        variant="ghost"
                        className={cn('w-full justify-start text-lg py-4')}
                        onClick={() => { handleLogout(); document.querySelector('[data-radix-dialog-close]')?.click(); }} // Close sheet on click
                    >
                        <LogOut className="mr-2 h-5 w-5" />
                        Logout ({getUserDisplayName(currentUser)})
                    </Button>
                 </>
            ) : (
                <Link href="/login" passHref legacyBehavior>
                <Button
                    variant={pathname === '/login' ? 'secondary' : 'ghost'}
                    className={cn('w-full justify-start text-lg py-4')}
                     onClick={() => document.querySelector('[data-radix-dialog-close]')?.click()} // Close sheet on click
                >
                    <User className="mr-2 h-5 w-5" />
                    User Login
                </Button>
                </Link>
            )}
         </>
       )}
        {mobile && !isHydrated && (
           <>
             <Separator className="my-2" />
              <Button disabled className={cn('w-full justify-start text-lg py-4 opacity-50')}>
                Loading...
              </Button>
            </>
        )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Ship className="h-6 w-6 text-accent" />
          <span className="font-bold sm:inline-block">PICK PACK SERVICES</span>
        </Link>
        <nav className="hidden flex-1 items-center space-x-1 md:flex">
           {/* Render NavLinks directly for desktop */}
           {navItems.map((item) => (
             <Link key={item.href} href={item.href} passHref legacyBehavior>
               <Button
                 variant={pathname === item.href ? 'secondary' : 'ghost'}
                 className={cn(
                    'justify-start', // Ensure text alignment is correct
                    // 'text-sm' // Use default text size
                 )}
               >
                 {item.label}
               </Button>
             </Link>
           ))}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-2 md:space-x-4">

          {/* User Profile/Login Button - Desktop */}
          {isHydrated && currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                     {/* Placeholder image or initials */}
                    <AvatarImage src={`https://avatar.vercel.sh/${currentUser}.png`} alt={currentUser} />
                    <AvatarFallback>{getInitials(currentUser)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{getUserDisplayName(currentUser)}</p>
                    {/* Optional: Add email here if stored */}
                     {/* <p className="text-xs leading-none text-muted-foreground">
                       {users[currentUser]?.email || ''}
                     </p> */}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                 {/* Add links to profile, settings etc. here later */}
                  <Link href="/profile" passHref legacyBehavior>
                    <DropdownMenuItem>
                      <UserCircle2 className="mr-2 h-4 w-4" />
                      <span>View Profile</span>
                    </DropdownMenuItem>
                  </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
           ) : isHydrated ? ( // Only show login button if hydrated and not logged in
             <Link href="/login" passHref legacyBehavior>
               <Button variant="outline" className="hidden md:inline-flex">
                 <User className="mr-2 h-4 w-4" />
                 User Login
               </Button>
             </Link>
           ) : (
             // Optional: Show a skeleton or placeholder while hydrating
             <div className="hidden md:block h-8 w-24 bg-muted rounded-md animate-pulse"></div>
           )}


           {/* Mobile Menu Trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0 w-[var(--sidebar-width)]">
              <Link href="/" className="mr-6 flex items-center space-x-2 mb-6 px-4 pt-4" onClick={() => document.querySelector('[data-radix-dialog-close]')?.click()}>
                <Ship className="h-6 w-6 text-accent" />
                <span className="font-bold sm:inline-block">PICK PACK SERVICES</span>
              </Link>
              <Separator className="mb-2" />
              <div className="flex flex-col space-y-3 px-4">
                <NavLinks mobile />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

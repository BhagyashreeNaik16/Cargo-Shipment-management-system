// src/app/admin/layout.tsx
'use client';

import React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Ship, LayoutDashboard, Users, Truck, FileText, Settings, LogOut, BarChart3, CloudSun, UserCheck } from 'lucide-react'; // Added UserCheck icon
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

// Mock logout function
const handleLogout = (router: ReturnType<typeof useRouter>, toast: ReturnType<typeof useToast>['toast']) => {
   toast({
     title: "Logged Out",
     description: "You have been successfully logged out.",
   });
  // In a real app, clear session/token here
  router.push('/admin/login');
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const menuItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/shipments', label: 'Shipments', icon: Ship },
    { href: '/admin/bookings', label: 'Bookings', icon: FileText },
    { href: '/admin/vehicles', label: 'Vehicles', icon: Truck },
    { href: '/admin/drivers', label: 'Drivers', icon: UserCheck }, // Added Drivers menu item
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
    { href: '/admin/weather', label: 'Weather Alerts', icon: CloudSun },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  // Basic check if we are on the login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }


  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-screen">
        <Sidebar collapsible="icon" variant='sidebar' className="border-r">
          <SidebarHeader className="p-4 items-center justify-between">
             <div className="flex items-center gap-2">
              <Ship className="h-6 w-6 text-accent" />
              <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">Cargo Admin</span>
             </div>
            <SidebarTrigger className="hidden group-data-[collapsible=icon]:flex" />
          </SidebarHeader>
           <Separator className="mb-2" />
          <SidebarContent className="p-2">
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href} passHref legacyBehavior>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(item.href)}
                      tooltip={item.label}
                      className="justify-start"
                    >
                     <a>
                       <item.icon className="h-5 w-5" />
                       <span>{item.label}</span>
                     </a>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
           <Separator className="mt-auto mb-2" />
          <SidebarFooter className="p-2">
             <Button
               variant="ghost"
               className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0"
               onClick={() => handleLogout(router, toast)}
               title="Logout"
             >
               <LogOut className="h-5 w-5" />
               <span className="group-data-[collapsible=icon]:hidden">Logout</span>
             </Button>
          </SidebarFooter>
        </Sidebar>

        {/* Removed bg-secondary from SidebarInset */}
        <SidebarInset className="flex-1 overflow-y-auto">
           {/* Header for mobile or when sidebar is inset */}
           <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
              <SidebarTrigger />
                <h1 className="flex-1 text-lg font-semibold">Cargo Admin</h1>
                {/* Add user profile/menu button here if needed */}
           </header>
          <div className="p-4 md:p-6 lg:p-8">
           {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

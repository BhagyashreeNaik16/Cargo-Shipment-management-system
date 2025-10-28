// src/app/admin/users/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useAuthStore, useIsAuthStoreHydrated, type UserAccount } from '@/stores/auth-store'; // Import store, hook, and UserAccount type
import { UsersTable } from '@/components/admin/users-table'; // Import the new table component
import { useToast } from '@/hooks/use-toast'; // Import toast

export default function AdminUsersPage() {
  const allUsers = useAuthStore((state) => state.users);
  const deleteUserAccount = useAuthStore((state) => state.deleteUser); // Get delete action
  const isHydrated = useIsAuthStoreHydrated();
  const [hasMounted, setHasMounted] = useState(false);
  const { toast } = useToast();

  // State to hold the list of non-admin users
  const [displayUsers, setDisplayUsers] = useState<UserAccount[]>([]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Filter users once hydrated
  useEffect(() => {
    if (isHydrated) {
      // Convert the users object from the store into an array of UserAccount, excluding the admin
      const usersArray: UserAccount[] = Object.entries(allUsers)
        .filter(([username]) => username.toLowerCase() !== 'admin') // Exclude admin user
        .map(([username, userData]) => ({
          username: username,
          email: userData.email, // Get email from user data
          // password: userData.password, // DO NOT include password
        }));
      setDisplayUsers(usersArray);
    }
  }, [isHydrated, allUsers]);

  // Handler for deleting a user
  const handleDeleteUser = (username: string) => {
    const result = deleteUserAccount(username);
    if (result.success) {
      toast({
        title: "User Deleted",
        description: `User account "${username}" has been deleted.`,
        variant: "destructive"
      });
      // The useEffect hook listening to `allUsers` will update the displayUsers state
    } else {
      toast({
        title: "Deletion Failed",
        description: result.message,
        variant: "destructive"
      });
    }
  };


  // Render loading state until hydration is complete
  if (!hasMounted || !isHydrated) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Manage Users</h1>
           <Button disabled>
             <PlusCircle className="mr-2 h-4 w-4" /> Add New User
           </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>User List</CardTitle>
            <CardDescription>Loading user data...</CardDescription>
          </CardHeader>
          <CardContent>
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Users</h1>
         {/* TODO: Implement Add User Functionality */}
         <Button className="bg-accent text-accent-foreground hover:bg-accent/90" disabled>
           <PlusCircle className="mr-2 h-4 w-4" /> Add New User (Future)
         </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>Overview of registered customer accounts.</CardDescription>
        </CardHeader>
        <CardContent>
           {displayUsers.length > 0 ? (
             <UsersTable data={displayUsers} onDelete={handleDeleteUser} />
           ) : (
             <p className="text-muted-foreground text-center py-4">No registered users found (excluding admin).</p>
           )}
        </CardContent>
      </Card>
       {/* Add Dialog for Add/Edit User later */}
    </div>
  );
}

// src/components/admin/users-table.tsx
'use client';

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, Trash2, UserCog, UserCheck } from 'lucide-react'; // Added icons
import type { UserAccount } from '@/stores/auth-store'; // Import UserAccount type

interface UsersTableProps {
  data: UserAccount[]; // Array of UserAccount objects
  onDelete: (username: string) => void; // Callback for delete action
  // Add onEdit callback later if needed
}

export function UsersTable({ data, onDelete }: UsersTableProps) {
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const handleDeleteClick = (username: string) => {
      setUserToDelete(username);
      // Alert Dialog Trigger will handle opening
  };

  const confirmDelete = () => {
      if (userToDelete) {
          onDelete(userToDelete);
          setUserToDelete(null); // Close dialog implicitly
      }
  };

  return (
    <AlertDialog> {/* Wrap table with AlertDialog Provider */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            {/* Add more columns like 'Date Registered' if available */}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((user) => (
            <TableRow key={user.username}>
              <TableCell className="font-medium">{user.username}</TableCell>
              <TableCell>{user.email || 'N/A'}</TableCell>
              <TableCell>
                 {/* Basic Role differentiation */}
                 {user.username.toLowerCase() === 'admin' ? (
                    <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                        <UserCog className="h-3 w-3" /> Admin
                    </Badge>
                 ) : (
                    <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                        <UserCheck className="h-3 w-3" /> Customer
                    </Badge>
                 )}
              </TableCell>
              <TableCell className="text-right">
                 {user.username.toLowerCase() !== 'admin' && ( // Don't allow actions on admin user
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                         {/* Add View/Edit actions later */}
                         {/* <DropdownMenuItem disabled>
                            <Pencil className="mr-2 h-4 w-4" /> Edit (Future)
                         </DropdownMenuItem> */}
                        <DropdownMenuSeparator />
                         <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                                className="text-red-600 focus:text-red-700 focus:bg-red-100"
                                onSelect={(e) => e.preventDefault()} // Prevent default close
                                onClick={() => handleDeleteClick(user.username)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete User
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                    </DropdownMenuContent>
                    </DropdownMenu>
                  )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

       {/* Delete Confirmation Dialog Content */}
       <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the user account: <span className="font-semibold">{userToDelete}</span>.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete User
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
  );
}

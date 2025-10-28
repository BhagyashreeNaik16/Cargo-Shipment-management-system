// src/stores/auth-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage, PersistListener } from 'zustand/middleware';
import { useState, useEffect } from 'react';
import type { UserCredentialsData, UserAccount } from '@/types/auth-types'; // Import updated types


// Use UserCredentialsData for the 'users' state type
type UserCredentials = Record<string, UserCredentialsData>;


interface AuthState {
  users: UserCredentials;
  currentUser: string | null; // Store the username of the logged-in user
  // Updated register signature
  register: (
    name: string,
    username: string,
    email: string,
    phone: string,
    address: string,
    password: string
  ) => { success: boolean; message: string };
  login: (username: string, password: string) => { success: boolean; message: string };
  logout: () => void;
  deleteUser: (username: string) => { success: boolean; message: string };
  updateUserProfile: (username: string, data: Pick<UserCredentialsData, 'name' | 'email' | 'phone' | 'address'>) => { success: boolean; message: string }; // Add update action
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initialize with admin user and the new user "bharatheshsk"
      users: {
        admin: {
            name: 'Administrator',
            password: 'admin',
            email: 'admin@example.com',
            phone: '000-000-0000',
            address: '123 Admin Way'
        },
        bharatheshsk: {
            name: "Bharathesh S K",
            password: "12345678",
            email: "bharatheshsk@gmail.com",
            phone: "8762832399",
            address: "Kayarabettu House, Sampige Post, Moodbidre, D K"
        }
      },
      currentUser: null,
      _hasHydrated: false,

      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },

      // Updated register implementation
      register: (name, username, email, phone, address, password) => {
        const currentUsers = get().users;
        const normalizedUsername = username.toLowerCase(); // Normalize for case-insensitive check
         const normalizedEmail = email?.toLowerCase(); // Normalize email for check (check if email exists)

        if (currentUsers[username]) { // Check original case first for exact match blocking
          return { success: false, message: 'Username already exists.' };
        }
        if (currentUsers[normalizedUsername] && normalizedUsername !== username) { // Check normalized case only if different from original
            return { success: false, message: `Username conflicts with an existing user (case-insensitive). Please choose a different username.` };
        }


        if (normalizedUsername === 'admin') {
          return { success: false, message: 'Cannot register with username "admin".' };
        }
        // Basic email uniqueness check (case-insensitive)
        const emailExists = normalizedEmail && Object.values(currentUsers).some(userData => userData.email?.toLowerCase() === normalizedEmail);
        if (email && emailExists) {
             // Consider making this a hard error depending on requirements
             // console.warn(`Registering user ${username} with duplicate email: ${email}`);
             return { success: false, message: 'Email address is already registered.' };
        }

        // Create the new user data object adhering to UserCredentialsData
        const newUser: UserCredentialsData = {
            name,
            password,
            email,
            phone,
            address
        };


        set((state) => ({
          users: { ...state.users, [username]: newUser }, // Store with original case for display/login, add new user data
        }));
        console.log("User registered:", username, "with details. Current users in store:", get().users);
        return { success: true, message: 'Registration successful!' };
      },

      login: (username, password) => {
        const users = get().users;
        const userData = users[username]; // Login checks original case

        console.log(`Login attempt for user: ${username}. User data exists: ${!!userData}`);
        console.log("Users object at login attempt:", users); // Log the whole users object

        // Prevent non-admin users from accessing admin credentials on the main login page
        if (username.toLowerCase() === 'admin') {
          return { success: false, message: 'Admin login should use the /admin/login page.' };
        }

        if (userData && userData.password === password) {
          set({ currentUser: username });
          console.log("User logged in:", username);
          return { success: true, message: 'Login successful!' };
        } else {
          console.log(`Login failed for ${username}. Password match check: ${userData ? `stored: ${userData.password} vs provided: ${password} -> ${userData.password === password}` : 'User not found'}.`);
          return { success: false, message: 'Invalid username or password.' };
        }
      },

      logout: () => {
        const currentUser = get().currentUser;
        set({ currentUser: null });
        console.log("User logged out:", currentUser);
      },

      deleteUser: (username) => {
        if (username.toLowerCase() === 'admin') {
           return { success: false, message: 'Cannot delete the admin account.' };
        }
        const currentUsers = get().users;
        if (!currentUsers[username]) {
           return { success: false, message: `User "${username}" not found.` };
        }

        const { [username]: deletedUser, ...remainingUsers } = currentUsers;

        set({ users: remainingUsers });
        console.log(`User account "${username}" deleted.`);

        if (get().currentUser === username) {
            set({ currentUser: null });
             console.log(`User "${username}" was logged out due to account deletion.`);
        }

        return { success: true, message: `User "${username}" deleted successfully.` };
      },

      // Action to update user profile details (name, email, phone, address)
      updateUserProfile: (username, data) => {
        const currentUsers = get().users;
        if (!currentUsers[username]) {
           return { success: false, message: 'User not found.' };
        }
         if (username.toLowerCase() === 'admin') {
             return { success: false, message: 'Admin profile cannot be updated through this action.' };
         }

        // Optional: Check if the new email is already taken by another user
        const normalizedNewEmail = data.email?.toLowerCase();
        if (normalizedNewEmail) {
          const emailTaken = Object.entries(currentUsers).some(
              ([uname, udata]) => uname !== username && udata.email?.toLowerCase() === normalizedNewEmail
          );
          if (emailTaken) {
            return { success: false, message: 'Email address is already in use by another account.' };
          }
        }


        set((state) => ({
          users: {
            ...state.users,
            [username]: {
              ...state.users[username], // Keep existing data (like password)
              name: data.name,
              email: data.email,
              phone: data.phone,
              address: data.address,
            },
          },
        }));
        console.log(`User profile for "${username}" updated.`);
        return { success: true, message: 'Profile updated successfully.' };
      },

    }),
    {
      name: 'auth-storage-v2', // Keep consistent name unless major schema break
      storage: createJSONStorage(() => localStorage),
       onRehydrateStorage: () => (state, error) => {
         console.log("Auth store: Attempting rehydration...");
         if (error) {
           console.error("Auth store: Failed to rehydrate:", error);
           state?.setHasHydrated(true); // Still mark as hydrated to allow app to proceed
         } else if (state) {
           // Log the state *after* the middleware has parsed it but *before* we set the hydrated flag
           console.log("Auth store: Rehydration successful. Parsed state:", state);
           console.log("Auth store: Parsed users:", state.users);
           // No date parsing needed here
           state.setHasHydrated(true);
         } else {
           console.log("Auth store: No stored state found, using initial state.");
           // Use setState directly as `state` is null here
           useAuthStore.setState({ _hasHydrated: true });
            console.log("Auth store: Initial state set. Users in store:", useAuthStore.getState().users);
         }
       },
      partialize: (state) => ({
        users: state.users,
        currentUser: state.currentUser,
      }),
       version: 1, // Increment version if you change the persisted structure significantly
    }
  )
);

// Hook to ensure hydration is complete before using the store state
export const useIsAuthStoreHydrated = () => {
  const isHydrated = useAuthStore((state) => state._hasHydrated);
  const [clientReady, setClientReady] = useState(false);

  useEffect(() => {
     if (isHydrated) {
        console.log("Auth store isHydrated flag is true, setting clientReady.");
       setClientReady(true);
     } else {
        console.log("Auth store isHydrated flag is false.");
     }
  }, [isHydrated]);

  return clientReady;
};

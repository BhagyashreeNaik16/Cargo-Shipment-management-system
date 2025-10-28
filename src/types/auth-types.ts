// src/types/auth-types.ts

// Type representing stored user credentials (internal to auth-store)
export type UserCredentialsData = {
  name: string; // Added name
  password: string; // Hashed in a real app
  email?: string;
  phone: string; // Added phone
  address: string; // Added address
};

// Type representing a user account for display purposes (publicly exposable)
export interface UserAccount {
  username: string;
  name?: string; // Added name (optional for display)
  email?: string;
  phone?: string; // Added phone (optional for display)
  address?: string; // Added address (optional for display)
  // Add other relevant, non-sensitive fields like registration date, role, etc. if needed
}

// Authentication types for role-based access control
export type UserRole = 'admin' | 'supervisor' | 'viewer';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  name: string;
  profilePhoto?: string;
  isActive: boolean;
  createdAt: string; // Format: dd-mmm-yyyy
  updatedAt: string; // Format: dd-mmm-yyyy
  lastLoginAt?: string; // Format: dd-mmm-yyyy
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthContextType {
  authState: AuthState;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  hasPermission: (requiredRole: UserRole) => boolean;
}

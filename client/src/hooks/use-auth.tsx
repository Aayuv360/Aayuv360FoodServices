import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "./use-toast";

// Define the User type
type User = {
  id: number;
  username: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
};

// Define the auth context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (newUserData: Partial<User>) => void;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Function to fetch the current user
  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("GET", "/api/auth/me");
      const userData = await res.json();
      setUser(userData);
    } catch (error) {
      // User is not authenticated, clear user state
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // On mount, check if the user is logged in
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Login function
  const login = async (username: string, password: string) => {
    try {
      const res = await apiRequest("POST", "/api/auth/login", { username, password });
      const userData = await res.json();
      setUser(userData);
      // Invalidate queries that depend on auth state
      queryClient.invalidateQueries();
    } catch (error: any) {
      console.error("Login error:", error);
      throw new Error(error.message || "Failed to login");
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      setUser(null);
      // Invalidate queries that depend on auth state
      queryClient.invalidateQueries();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    } catch (error: any) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: error.message || "Failed to logout",
        variant: "destructive",
      });
    }
  };

  // Update user data locally (used after profile updates)
  const updateUser = (newUserData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...newUserData });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "./use-toast";

type User = {
  id: number;
  username: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (newUserData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("GET", "/api/auth/me");
      const userData = await res.json();
      setUser(userData);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await apiRequest("POST", "/api/auth/login", {
        username,
        password,
      });
      const userData = await res.json();
      setUser(userData);
      queryClient.invalidateQueries();
    } catch (error: any) {
      console.error("Login error:", error);
      throw new Error(error.message || "Failed to login");
    }
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      setUser(null);
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

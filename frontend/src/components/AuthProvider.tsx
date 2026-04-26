"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getMe } from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";

export interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginState: (token: string, refreshToken: string, userData: User) => void;
  logoutState: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginState: () => {},
  logoutState: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const userData = await getMe();
        setUser(userData);
      } catch (e) {
        console.error("Auth validation failed", e);
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [pathname]);

  const loginState = (token: string, refreshToken: string, userData: User) => {
    localStorage.setItem("token", token);
    localStorage.setItem("refresh_token", refreshToken);
    setUser(userData);
  };

  const logoutState = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginState, logoutState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

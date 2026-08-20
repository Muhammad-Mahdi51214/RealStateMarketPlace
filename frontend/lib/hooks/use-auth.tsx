"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { UserRole } from "@shared/types/database.types";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  cnic_number: string | null;
  role: UserRole;
  kyc_status: "pending" | "verified" | "rejected";
  suspended: boolean;
  created_at: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<AuthUser | null>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isVendor: boolean;
  ownsProperty: boolean;
  setOwnsProperty: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [ownsProperty, setOwnsProperty] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const json = await res.json();
      const nextUser = (json.data?.user ?? null) as AuthUser | null;
      setUser(nextUser);
      if (nextUser) {
        try {
          const propRes = await fetch("/api/my-property", {
            credentials: "include",
          });
          const propJson = await propRes.json();
          setOwnsProperty((propJson.data?.ownership?.length ?? 0) > 0);
        } catch {
          setOwnsProperty(false);
        }
      } else {
        setOwnsProperty(false);
      }
      return nextUser;
    } catch {
      setUser(null);
      setOwnsProperty(false);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
    setOwnsProperty(false);
    window.location.href = "/";
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      refresh,
      logout,
      isAdmin: Boolean(
        user &&
          ["verification_officer", "sales_admin", "super_admin"].includes(
            user.role,
          ),
      ),
      isVendor: Boolean(
        user && ["vendor", "vendor_employee"].includes(user.role),
      ),
      ownsProperty,
      setOwnsProperty,
    }),
    [user, loading, refresh, logout, ownsProperty],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

"use client";

import { createContext, useContext, ReactNode } from "react";
import { authClient } from "../lib/auth-client";

interface AuthContextType {
  session: { user?: { id: string; email: string; name: string; [key: string]: unknown } } | null;
  isLoading: boolean;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending: isLoading, refetch } = authClient.useSession();

  return (
    <AuthContext.Provider value={{ session, isLoading, refetch: refetch ?? (() => {}) }}>
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

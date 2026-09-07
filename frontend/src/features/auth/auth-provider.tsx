import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AUTH_EXPIRED_EVENT, refreshSession } from "@/lib/api/client";
import type { User } from "@/lib/api/types";
import { authApi } from "./api";

interface AuthContextValue {
  /** undefined = still bootstrapping */
  user: User | null | undefined;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  // Bootstrap the session from the httpOnly refresh cookie. Goes through the
  // client's single-flight refreshSession so a parallel 401-triggered refresh
  // (and StrictMode's double effect run) never races the token rotation.
  useEffect(() => {
    let cancelled = false;
    refreshSession()
      .then((nextUser) => {
        if (!cancelled) setUser(nextUser);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // The API client broadcasts when a refresh ultimately fails mid-session.
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({ user, setUser, logout }), [user, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

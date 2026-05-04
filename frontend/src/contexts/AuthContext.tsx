import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, clearStoredToken, getStoredToken, setStoredToken } from "@/lib/api";

type AuthContextType = {
  user: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  registerTenant: (payload: any) => Promise<any>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      return null;
    }

    try {
      const me = await api.auth.me();
      setUser(me);
      return me;
    } catch {
      clearStoredToken();
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    refreshMe().finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const token = await api.auth.login(email, password);
    setStoredToken(token.access_token);
    return refreshMe();
  };

  const registerTenant = async (payload: any) => {
    const token = await api.auth.registerTenant(payload);
    setStoredToken(token.access_token);
    return refreshMe();
  };

  const logout = () => {
    clearStoredToken();
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, loading, login, registerTenant, logout, refreshMe, isAuthenticated: !!user }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

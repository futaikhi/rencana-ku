import React, { createContext, useContext, useState, useEffect } from "react";
import { User, PlanInvitation } from "../types";
import { api, getToken, removeToken } from "../lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  pendingInvitations: PlanInvitation[];
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; bio?: string }) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { name: string; bio?: string; avatar_url?: string }) => Promise<void>;
  refreshInvitations: () => Promise<void>;
  respondInvitation: (inviteId: string, action: "ACCEPT" | "DECLINE") => Promise<{ message: string; planId?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getToken());
  const [loading, setLoading] = useState(true);
  const [pendingInvitations, setPendingInvitations] = useState<PlanInvitation[]>([]);

  const refreshInvitations = async () => {
    if (!getToken()) return;
    try {
      const res = await api.getInvitations();
      setPendingInvitations(res.invitations);
    } catch (e) {
      console.error("Failed to fetch pending invitations", e);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const currentToken = getToken();
      if (!currentToken) {
        setUser(null);
        setTokenState(null);
        setLoading(false);
        return;
      }

      try {
        const res = await api.getCurrentUser();
        setUser(res.user);
        setTokenState(currentToken);
        await refreshInvitations();
      } catch {
        removeToken();
        setUser(null);
        setTokenState(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    setUser(res.user);
    setTokenState(res.token);
    await refreshInvitations();
  };

  const register = async (data: { name: string; email: string; password: string; bio?: string }) => {
    const res = await api.register(data);
    setUser(res.user);
    setTokenState(res.token);
    await refreshInvitations();
  };

  const updateProfile = async (data: { name: string; bio?: string; avatar_url?: string }) => {
    const res = await api.updateProfile(data);
    setUser(res.user);
  };

  const logout = () => {
    removeToken();
    setUser(null);
    setTokenState(null);
    setPendingInvitations([]);
  };

  const respondInvitation = async (inviteId: string, action: "ACCEPT" | "DECLINE") => {
    const res = await api.respondToInvitation(inviteId, action);
    await refreshInvitations();
    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        pendingInvitations,
        login,
        register,
        logout,
        updateProfile,
        refreshInvitations,
        respondInvitation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

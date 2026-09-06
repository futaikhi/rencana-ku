import React, { createContext, useContext, useState, useEffect } from "react";
import { User, PlanInvitation } from "../types";
import { api, getToken, setToken, removeToken } from "../lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  demoUsers: User[];
  pendingInvitations: PlanInvitation[];
  login: (email: string, password: string) => Promise<void>;
  demoLogin: (email: string) => Promise<void>;
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
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PlanInvitation[]>([]);

  // Fetch demo accounts list
  const loadDemoAccounts = async () => {
    try {
      const res = await api.getDemoAccounts();
      setDemoUsers(res.users);
    } catch (e) {
      console.error("Failed to load demo accounts", e);
    }
  };

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
    loadDemoAccounts();
    const initAuth = async () => {
      // Check for OAuth token in URL hash (set by backend after OAuth flow)
      const hash = window.location.hash;
      const oauthMatch = hash.match(/oauth_token=([^&]+)/);
      if (oauthMatch) {
        const oauthToken = decodeURIComponent(oauthMatch[1]);
        setToken(oauthToken);
        localStorage.setItem("rencanaku_token", oauthToken);
        localStorage.setItem("rencanaku_current_user_id", "");
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      }

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

  const demoLogin = async (email: string) => {
    setLoading(true);
    try {
      const res = await api.demoLogin(email);
      setUser(res.user);
      setTokenState(res.token);
      await refreshInvitations();
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: { name: string; email: string; password: string; bio?: string }) => {
    const res = await api.register(data);
    setUser(res.user);
    setTokenState(res.token);
    await loadDemoAccounts();
    await refreshInvitations();
  };

  const updateProfile = async (data: { name: string; bio?: string; avatar_url?: string }) => {
    const res = await api.updateProfile(data);
    setUser(res.user);
    await loadDemoAccounts();
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
        demoUsers,
        pendingInvitations,
        login,
        demoLogin,
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

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { loginAuth, fetchCurrentUser, logoutAuth, fetchAuthUsers } from "@/services/api";

// Standard Personas matching project data
export const PERSONAS = {
  admin: {
    id: "admin",
    name: "SRE Admin",
    email: "sre-oncall@corp.internal",
    role: "ADMIN",
    title: "Site Reliability Lead",
    roleTitle: "sre-lead",
    department: "Platform Infrastructure & Reliability",
    avatar: "⚡",
    color: "purple",
    permissions: [
      "ACCESS_ALL_TICKETS",
      "APPROVE_REMEDIATION",
      "REJECT_REMEDIATION",
      "VIEW_TRACES",
      "VIEW_CONNECTORS",
      "SEARCH_CORPUS",
      "MANAGE_PIPELINE"
    ]
  },
  rohan: {
    id: "rohan",
    name: "Rohan Sharma",
    email: "rohan.sharma@corp.internal",
    role: "EMPLOYEE",
    title: "Billing Analyst",
    roleTitle: "billing-analyst",
    department: "Finance & Invoicing",
    avatar: "RS",
    color: "cyan",
    activeScopes: ["billing.view"],
    missingScopes: ["billing.read"],
    permissions: [
      "VIEW_OWN_TICKETS",
      "CREATE_TICKET",
      "SEARCH_CORPUS",
      "VIEW_OWN_PERMISSIONS"
    ]
  },
  alex: {
    id: "alex",
    name: "Alex Chen",
    email: "alex.chen@corp.internal",
    role: "EMPLOYEE",
    title: "Senior Engineer",
    roleTitle: "senior-engineer",
    department: "Event Platform Engineering",
    avatar: "AC",
    color: "emerald",
    activeScopes: ["events.read", "kafka.consume"],
    missingScopes: [],
    permissions: [
      "VIEW_OWN_TICKETS",
      "CREATE_TICKET",
      "SEARCH_CORPUS",
      "VIEW_OWN_PERMISSIONS"
    ]
  },
  sam: {
    id: "sam",
    name: "Sam Jenkins",
    email: "sam.jenkins@corp.internal",
    role: "EMPLOYEE",
    title: "DevOps Lead",
    roleTitle: "devops-lead",
    department: "Cloud Operations",
    avatar: "SJ",
    color: "amber",
    activeScopes: ["infra.read", "logs.view"],
    missingScopes: [],
    permissions: [
      "VIEW_OWN_TICKETS",
      "CREATE_TICKET",
      "SEARCH_CORPUS",
      "VIEW_OWN_PERMISSIONS"
    ]
  },
  marcus: {
    id: "marcus",
    name: "Marcus Vance",
    email: "marcus.vance@corp.internal",
    role: "EMPLOYEE",
    title: "Security Auditor",
    roleTitle: "security-auditor",
    department: "InfoSec Compliance",
    avatar: "MV",
    color: "indigo",
    activeScopes: ["audit.read", "compliance.view"],
    missingScopes: [],
    permissions: [
      "VIEW_OWN_TICKETS",
      "CREATE_TICKET",
      "SEARCH_CORPUS",
      "VIEW_OWN_PERMISSIONS"
    ]
  }
};

// Aliases for backward compatibility with any saved tokens/local sessions
PERSONAS.priya = PERSONAS.rohan;
PERSONAS.sarah = PERSONAS.sam;

const AuthContext = createContext({
  user: PERSONAS.admin,
  role: "ADMIN",
  isAdmin: true,
  isEmployee: false,
  isAuthenticated: true,
  token: null,
  login: async () => {},
  logout: async () => {},
  switchPersona: async () => {},
  hasPermission: () => false,
  availablePersonas: Object.values(PERSONAS)
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(PERSONAS.admin);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [token, setToken] = useState(null);

  // Restore session from localStorage or backend token on mount
  useEffect(() => {
    async function hydrateAuth() {
      try {
        const savedToken = localStorage.getItem("velloe_auth_token");
        if (savedToken) {
          setToken(savedToken);
          const remoteUser = await fetchCurrentUser(savedToken);
          if (remoteUser && remoteUser.id) {
            setUser(remoteUser);
            setIsAuthenticated(true);
            return;
          }
        }

        const savedUser = localStorage.getItem("velloe_auth_user");
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if (PERSONAS[parsed.id]) {
            setUser(PERSONAS[parsed.id]);
            setIsAuthenticated(true);
          } else if (parsed && parsed.role) {
            setUser(parsed);
            setIsAuthenticated(true);
          }
        }
      } catch (e) {
        console.warn("Could not load user session", e);
      }
    }
    hydrateAuth();
  }, []);

  const login = async (userData) => {
    let identifier = "admin";
    if (typeof userData === "string") {
      identifier = userData;
    } else if (userData && (userData.username || userData.id || userData.email)) {
      identifier = userData.username || userData.id || userData.email;
    }

    try {
      const res = await loginAuth(identifier);
      if (res && res.success && res.user) {
        setUser(res.user);
        setIsAuthenticated(true);
        if (res.token) {
          setToken(res.token);
          localStorage.setItem("velloe_auth_token", res.token);
        }
        localStorage.setItem("velloe_auth_user", JSON.stringify(res.user));
        return res.user;
      }
    } catch (e) {
      console.warn("Backend login failed, using local persona fallback", e);
    }

    // Local fallback
    const target = PERSONAS[identifier] || userData || PERSONAS.admin;
    setUser(target);
    setIsAuthenticated(true);
    try {
      localStorage.setItem("velloe_auth_user", JSON.stringify(target));
    } catch (e) {}
    return target;
  };

  const switchPersona = async (personaId) => {
    return await login(personaId);
  };

  const logout = async () => {
    try {
      if (token) {
        await logoutAuth(token);
      }
    } catch (e) {}
    setToken(null);
    setIsAuthenticated(false);
    try {
      localStorage.removeItem("velloe_auth_token");
      localStorage.removeItem("velloe_auth_user");
    } catch (e) {}
  };

  const hasPermission = (permission) => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  };

  const isAdmin = user?.role === "ADMIN";
  const isEmployee = user?.role === "EMPLOYEE";

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || "EMPLOYEE",
        isAdmin,
        isEmployee,
        isAuthenticated,
        token,
        login,
        logout,
        switchPersona,
        hasPermission,
        availablePersonas: [PERSONAS.admin, PERSONAS.rohan, PERSONAS.alex, PERSONAS.sam, PERSONAS.marcus]
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

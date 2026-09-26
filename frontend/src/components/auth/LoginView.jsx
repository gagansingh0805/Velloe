"use client";

import React, { useState } from "react";
import { ShieldCheck, User, ArrowRight, Lock, Key, Sparkles, Building2, CheckCircle2 } from "lucide-react";
import BrandLogo from "../layout/BrandLogo";
import { PERSONAS } from "@/context/AuthContext";

export default function LoginView({ onLogin }) {
  const [selectedPersona, setSelectedPersona] = useState("admin");
  const [customEmail, setCustomEmail] = useState("");
  const [customPassword, setCustomPassword] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);

  const handleQuickLogin = (personaKey) => {
    onLogin(personaKey);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customEmail) return;
    // Determine role based on email or default to employee
    const isAdmin = customEmail.includes("admin") || customEmail.includes("sre");
    const customUser = {
      id: customEmail.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-"),
      name: customEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      email: customEmail,
      role: isAdmin ? "ADMIN" : "EMPLOYEE",
      title: isAdmin ? "Site Reliability Engineer" : "Operations Analyst",
      roleTitle: isAdmin ? "sre-engineer" : "analyst",
      department: isAdmin ? "Infrastructure" : "General Operations",
      avatar: isAdmin ? "⚡" : "👤",
      permissions: isAdmin
        ? PERSONAS.admin.permissions
        : (PERSONAS.rohan?.permissions || [])
    };
    onLogin(customUser);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-200 dark:from-zinc-950 dark:via-[#0c0d10] dark:to-zinc-900 font-sans">
      <div className="w-full max-w-xl">
        {/* Main Card */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#111216]/95 backdrop-blur-xl shadow-2xl p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-2">
            <BrandLogo size="lg" className="mb-1" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Corporate Identity &amp; RBAC Access
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 max-w-md">
              Select your persona below to authenticate into either the SRE Administrator Console or Employee Self-Service Portal.
            </p>
          </div>

          {/* Quick Persona Selector Cards */}
          <div className="space-y-3">
            <label className="text-[11px] font-mono uppercase text-zinc-400 font-semibold tracking-wider block">
              1-Click Demo Personas:
            </label>

            {/* Persona 1: Admin */}
            <button
              type="button"
              onClick={() => handleQuickLogin("admin")}
              className="w-full text-left p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-purple-500/60 dark:hover:border-purple-500/60 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-purple-500/5 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center justify-center text-lg font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
                  ⚡
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      SRE Administrator
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                      ROLE: ADMIN
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Platform Infrastructure • Full Ticket Console, Approve/Reject Gates, Traces &amp; Connectors
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
            </button>

            {/* Persona 2: Rohan Sharma (Employee with 403 ticket) */}
            <button
              type="button"
              onClick={() => handleQuickLogin("rohan")}
              className="w-full text-left p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-cyan-500/60 dark:hover:border-cyan-500/60 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-cyan-500/5 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-sm font-bold flex-shrink-0 group-hover:scale-105 transition-transform font-mono">
                  RS
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      Rohan Sharma
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                      ROLE: EMPLOYEE
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Billing Analyst • Author of Ticket TCK-1001 (403 Forbidden missing_scope)
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
            </button>

            {/* Persona 3: Alex Chen (Employee) */}
            <button
              type="button"
              onClick={() => handleQuickLogin("alex")}
              className="w-full text-left p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-emerald-500/5 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-sm font-bold flex-shrink-0 group-hover:scale-105 transition-transform font-mono">
                  AC
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      Alex Chen
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      ROLE: EMPLOYEE
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Senior Engineer • Event Platform • Author of Ticket TCK-1002 (Kafka lag)
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
            </button>
          </div>

          {/* Custom Credentials Toggle */}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
            {!isCustomMode ? (
              <button
                type="button"
                onClick={() => setIsCustomMode(true)}
                className="w-full text-center text-xs font-mono text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 py-1 transition cursor-pointer"
              >
                + Sign in with custom corporate email &rarr;
              </button>
            ) : (
              <form onSubmit={handleCustomSubmit} className="space-y-3 pt-1">
                <div>
                  <label className="text-[11px] font-mono text-zinc-400 block mb-1">Corporate Email</label>
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="user@corp.internal"
                    required
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-cyan-500/60"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-zinc-400 block mb-1">Password / SSO Token</label>
                  <input
                    type="password"
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-cyan-500/60"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCustomMode(false)}
                    className="flex-1 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-bold hover:opacity-90 cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* RBAC Notice */}
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-start gap-2.5 text-xs text-zinc-500">
            <Lock className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Role-Based Access Control (RBAC)</strong> enforced: Administrators possess system-wide ticket approval, trace access, and connector control. Employees access self-service ticket status and personalized knowledge search.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

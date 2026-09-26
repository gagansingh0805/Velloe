"use client";

import React, { useState, useRef, useEffect } from "react";
import BrandLogo from "./BrandLogo";
import { Sun, Moon, Sparkles, ChevronDown, LogOut, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Header({
  activeTab,
  theme,
  onToggleTheme,
  demoActive,
  onToggleDemo,
  onOpenMobileMenu
}) {
  const { user, isAdmin, isEmployee, switchPersona, logout, availablePersonas } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-14 border-b border-zinc-200 dark:border-zinc-800/80 px-3 sm:px-6 flex items-center justify-between bg-white/95 dark:bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40 flex-shrink-0 font-sans">
      {/* Left: Brand Icon + Page Title */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <BrandLogo size="sm" className="flex flex-shrink-0" />

        <h2 className="text-sm sm:text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
          {isEmployee ? (
            <>Employee Portal</>
          ) : (
            <>
              {(activeTab === "mission" || activeTab === "tickets") && <>Ticket Console</>}
              {(activeTab === "glean" || activeTab === "ask") && <>Query Search</>}
              {activeTab === "trace" && <>Trace Log</>}
              {(activeTab === "connectors" || activeTab === "connections") && <>Connections</>}
            </>
          )}
        </h2>
      </div>

      {/* Right Controls: Theme Toggle, Showcase Demo (Admin only), Sleek User Profile */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Tactile Theme Toggle Slider Switch */}
        <button
          type="button"
          role="switch"
          aria-checked={theme === "dark"}
          onClick={onToggleTheme}
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
          className="relative inline-flex items-center rounded-full p-[2px] cursor-pointer select-none flex-shrink-0 transition-colors duration-200 appearance-none outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 shadow-inner"
          style={{
            width: "50px",
            minWidth: "50px",
            maxWidth: "50px",
            height: "28px",
            borderRadius: "9999px",
            overflow: "hidden"
          }}
        >
          <span className="sr-only">Toggle theme</span>
          <span
            className={`flex items-center justify-center rounded-full shadow-md transition-transform duration-200 ease-out border ${
              theme === "dark"
                ? "translate-x-[22px] bg-zinc-950 text-zinc-100 border-zinc-700"
                : "translate-x-0 bg-white text-amber-500 border-zinc-200/90"
            }`}
            style={{
              width: "22px",
              minWidth: "22px",
              maxWidth: "22px",
              height: "22px",
              borderRadius: "9999px"
            }}
          >
            {theme === "dark" ? (
              <Moon className="w-3 h-3 text-zinc-100" />
            ) : (
              <Sun className="w-3 h-3 text-amber-500" />
            )}
          </span>
        </button>

        {/* Demo Showcase Tour (for Admin) */}
        {isAdmin && (
          <button
            onClick={onToggleDemo}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all duration-150 border flex-shrink-0 cursor-pointer ${
              demoActive
                ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100 shadow-sm"
                : "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 hover:opacity-90 shadow-sm"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{demoActive ? "Stop Demo" : "Showcase Demo"}</span>
            <span className="sm:hidden">{demoActive ? "Stop" : "Tour"}</span>
          </button>
        )}

        {/* Clean, Single-Line User Profile Pill */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen((prev) => !prev)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-850 hover:border-zinc-300 dark:hover:border-zinc-700 transition cursor-pointer"
          >
            <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-mono font-bold ${
              isAdmin 
                ? "bg-purple-500/20 text-purple-600 dark:text-purple-400"
                : "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400"
            }`}>
              {user?.avatar || (user?.name ? user.name.slice(0, 2).toUpperCase() : "U")}
            </div>

            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-none hidden sm:inline">
              {user?.name || "User"}
            </span>

            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {/* Persona Switcher Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111216] shadow-xl p-3 space-y-3 z-50 font-sans">
              {/* Active Profile Info */}
              <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {user?.name}
                  </span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    isAdmin 
                      ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                      : "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20"
                  }`}>
                    {user?.role}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                  {user?.title} • {user?.department}
                </div>
                <div className="text-[10px] font-mono text-zinc-400 truncate">
                  {user?.email}
                </div>
              </div>

              {/* RBAC Quick Switcher */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-mono uppercase text-zinc-400 font-bold px-1">
                  Switch Persona (RBAC Console):
                </div>

                {availablePersonas.map((p) => {
                  const isCurrent = user?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        switchPersona(p.id);
                        setIsProfileOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg text-xs transition cursor-pointer flex items-center justify-between ${
                        isCurrent
                          ? "bg-zinc-100 dark:bg-zinc-800/80 font-bold text-zinc-900 dark:text-zinc-100"
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded text-[10px] font-mono font-bold flex items-center justify-center ${
                          p.role === "ADMIN"
                            ? "bg-purple-500/20 text-purple-600 dark:text-purple-400"
                            : "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400"
                        }`}>
                          {p.avatar || p.name.slice(0, 2)}
                        </span>
                        <div>
                          <div className="text-xs leading-snug">{p.name}</div>
                          <div className="text-[9.5px] font-mono text-zinc-400">
                            {p.role === "ADMIN" ? "SRE Admin Console" : `Employee (${p.title})`}
                          </div>
                        </div>
                      </div>

                      {isCurrent && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                    </button>
                  );
                })}
              </div>

              {/* Sign Out */}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="w-full py-1.5 px-2 rounded-lg text-xs font-mono text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

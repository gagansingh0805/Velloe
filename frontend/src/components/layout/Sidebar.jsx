"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  Search,
  Terminal,
  FileCode,
  ShieldCheck,
  GitBranch,
  Play,
  RotateCcw,
  Flame,
  Clock,
  X,
  Pin,
  ChevronRight
} from "lucide-react";
import BrandLogo from "./BrandLogo";
import { useAuth } from "@/context/AuthContext";

export default function Sidebar({
  activeTab,
  setActiveTab,
  isSwarmRunning,
  onTriggerSwarm,
  onReset,
  speedFactor = 1,
  onSpeedChange,
  currentTrace,
  connectors,
  isMobileOpen = false,
  onMobileClose,
  onHoverChange,
}) {
  const { user, isEmployee } = useAuth();

  // Auto-hide by default as requested: hidden when not pointing, reveals on hover
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const enterTimeoutRef = useRef(null);
  const leaveTimeoutRef = useRef(null);

  useEffect(() => {
    onHoverChange?.(isHovered);
  }, [isHovered, onHoverChange]);

  useEffect(() => {
    return () => {
      if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);
      if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    };
  }, []);

  const navItems = isEmployee
    ? [
        {
          id: "mission",
          label: "My Tickets",
          desc: "Personal tickets, status & AI progress",
          icon: LayoutDashboard,
        },
        {
          id: "glean",
          label: "Query Search",
          desc: "Self-serve documentation & runbooks",
          icon: Search,
        },
      ]
    : [
        {
          id: "mission",
          label: "Ticket Console",
          desc: "All tickets, live agent graph & gates",
          icon: LayoutDashboard,
        },
        {
          id: "glean",
          label: "Query Search",
          desc: "Doc chat & enterprise corpus search",
          icon: Search,
        },
        {
          id: "trace",
          label: "Trace Log",
          desc: "Agent step prompt & output transparency",
          icon: FileCode,
        },
        {
          id: "connectors",
          label: "Connections",
          desc: "GitHub, Jaeger, Doc Index & Permissions",
          icon: GitBranch,
        },
      ];

  const suppressHoverRef = useRef(false);

  const retractSidebar = () => {
    if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    suppressHoverRef.current = true;
    setIsHovered(false);
    setTimeout(() => {
      suppressHoverRef.current = false;
    }, 450);
  };

  const handleMouseEnter = () => {
    if (suppressHoverRef.current) return;
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }
    if (enterTimeoutRef.current) {
      clearTimeout(enterTimeoutRef.current);
    }
    // Gentle 80ms intent buffer to avoid accidental twitchy pops
    enterTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
      if (!suppressHoverRef.current) {
        setIsHovered(true);
      }
    }, 80);
  };

  const handleMouseLeave = () => {
    if (enterTimeoutRef.current) {
      clearTimeout(enterTimeoutRef.current);
    }
    if (!isPinned) {
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
      leaveTimeoutRef.current = setTimeout(() => {
        setIsHovered(false);
      }, 350);
    } else {
      setIsHovered(false);
    }
  };

  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col justify-between h-full bg-white/95 dark:bg-[#111216]/95 backdrop-blur-2xl font-sans">
      {/* Top Branding & Nav */}
      <div>
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0 text-left p-1 -m-1 rounded-md group">
            <BrandLogo size="md" className="group-hover:scale-105 transition-transform flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight truncate">
                  Meridian
                </h1>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 truncate">AI Issue-Triage System</p>
            </div>
          </div>

          {/* Desktop Pin Toggle / Mobile Close button */}
          {isMobile ? (
            <button
              onClick={onMobileClose}
              className="p-1.5 ml-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex-shrink-0 cursor-pointer"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsPinned(!isPinned)}
              className={`p-1.5 rounded-md border text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer ${
                isPinned
                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-600 dark:text-cyan-400"
                  : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
              title={isPinned ? "Pinned (Always Open) - Click to enable Auto-Hide" : "Auto-Hide Active (Hover to Reveal) - Click to Pin"}
            >
              <Pin className={`w-3.5 h-3.5 transition-transform ${isPinned ? "rotate-45 text-cyan-500" : ""}`} />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (isMobile && onMobileClose) onMobileClose();
                  if (isMobile) {
                    if (onMobileClose) onMobileClose();
                  } else if (!isPinned) {
                    retractSidebar();
                  }
                }}
                className={`group relative w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all duration-150 focus:outline-none focus:ring-0 cursor-pointer ${
                  isActive
                    ? "bg-zinc-900 text-white border border-zinc-900 shadow-sm dark:bg-zinc-850 dark:text-white dark:border-zinc-700/80 font-medium"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 border border-transparent"
                }`}
              >
                {/* Active Indicator Bar on Left */}
                {isActive && (
                  <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-white dark:bg-zinc-100 rounded-full" />
                )}
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive
                      ? "text-white dark:text-zinc-100 ml-1"
                      : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-800 dark:group-hover:text-zinc-200"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-xs tracking-tight ${
                      isActive
                        ? "font-semibold text-white dark:text-white"
                        : "font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100"
                    }`}
                  >
                    {item.label}
                  </div>
                  <div
                    className={`text-[10.5px] truncate leading-tight mt-0.5 ${
                      isActive
                        ? "text-zinc-300 dark:text-zinc-400"
                        : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-400"
                    }`}
                  >
                    {item.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Integrated Agent Pipeline Status */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/60 space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-zinc-500">
            <span className={`w-2 h-2 rounded-full ${isEmployee ? "bg-cyan-500" : "bg-emerald-500 animate-pulse"}`} />
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {isEmployee ? "Employee Portal" : "AI Triage Pipeline"}
            </span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono">
            {isEmployee ? "Self-Service" : "4 Agents"}
          </span>
        </div>

        {!isEmployee ? (
          <div className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[10.5px] font-mono space-y-1">
            <div className="flex items-center justify-between text-zinc-500">
              <span>Triage</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Classifier</span>
            </div>
            <div className="flex items-center justify-between text-zinc-500">
              <span>Investigate</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-semibold">Correlator</span>
            </div>
            <div className="flex items-center justify-between text-zinc-500">
              <span>Trace Check</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Trace Lookup</span>
            </div>
            <div className="flex items-center justify-between text-zinc-500">
              <span>Resolution</span>
              <span className="text-purple-600 dark:text-purple-400 font-semibold">Resolver</span>
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[11px] font-mono space-y-1.5">
            <div className="text-zinc-400 text-[10px] uppercase font-bold">Assigned Profile</div>
            <div className="text-zinc-800 dark:text-zinc-200 font-semibold truncate">{user?.name || "Rohan Sharma"}</div>
            <div className="text-zinc-500 text-[10px]">{user?.department || "Finance"} • {user?.role || "billing-analyst"}</div>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              onReset?.();
              if (!isPinned) retractSidebar();
            }}
            title="Refresh pipeline status"
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Pipeline</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Left Edge Hover-Trigger Peek Rail (Point/hover here to reveal) */}
      <div
        onMouseEnter={handleMouseEnter}
        className={`fixed left-0 top-0 bottom-0 z-40 hidden lg:flex items-center cursor-pointer group transition-all duration-200 ${
          isHovered || isPinned ? "w-0 pointer-events-none opacity-0" : "w-4 hover:w-7 opacity-100"
        }`}
        title="Hover to reveal navigation sidebar"
      >
        <div className="w-1.5 h-20 rounded-r-full bg-zinc-300/80 dark:bg-zinc-700/80 group-hover:bg-cyan-500 group-hover:h-32 group-hover:w-2 transition-all duration-300 shadow-md ml-0 flex items-center justify-center">
          <ChevronRight className="w-2.5 h-2.5 text-white opacity-0 group-hover:opacity-100 transition-opacity -ml-0.5" />
        </div>
      </div>

      {/* 2. Desktop Backdrop Blur Overlay (Blurs everything on the screen behind the sidebar when hovering) */}
      <div
        aria-hidden="true"
        onClick={() => {
          if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);
          if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
          setIsHovered(false);
          setIsPinned(false);
        }}
        className={`fixed inset-0 z-40 bg-zinc-950/20 dark:bg-black/40 backdrop-blur-md transition-all duration-500 ease-out hidden lg:block ${
          isHovered
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      {/* 3. Desktop Auto-Hiding / Retracting Sidebar */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`fixed top-0 left-0 bottom-0 w-64 border-r border-zinc-200 dark:border-zinc-800 hidden lg:flex flex-col justify-between h-screen select-none z-50 shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${
          isHovered || isPinned
            ? "translate-x-0 opacity-100 pointer-events-auto"
            : "-translate-x-full opacity-0 pointer-events-none"
        }`}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* 3. Mobile Slide-Over Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            onClick={onMobileClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 animate-fadeIn"
          />
          <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 z-50 flex flex-col justify-between h-full select-none shadow-xl overflow-y-auto transform transition-transform duration-200 ease-out">
            {renderSidebarContent(true)}
          </div>
        </div>
      )}
    </>
  );
}

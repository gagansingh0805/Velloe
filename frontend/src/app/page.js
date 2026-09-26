"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import TicketListView from "@/components/mission/TicketListView";
import TicketDetailView from "@/components/mission/TicketDetailView";
import GleanChatView from "@/components/glean/GleanChatView";
import TraceLedgerView from "@/components/audit/TraceLedgerView";
import ConnectorsView from "@/components/connectors/ConnectorsView";
import EmployeePortalView from "@/components/employee/EmployeePortalView";
import LoginView from "@/components/auth/LoginView";
import DemoPresenter from "@/components/showcase/DemoPresenter";
import { useTheme } from "@/hooks/useTheme";
import { DEMO_STAGES } from "@/constants/demoStages";
import { REAL_TICKETS, fetchTickets, createTicket } from "@/services/api";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Lock, ShieldCheck } from "lucide-react";

function MainWorkspace() {
  const { user, isAdmin, isEmployee, isAuthenticated, login, switchPersona } = useAuth();

  const [activeTab, setActiveTab] = useState("mission");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  // Ticket Console Sub-view: "list" | "detail" (for Admin console)
  const [ticketViewMode, setTicketViewMode] = useState("list");

  // Dynamic Tickets List from backend
  const [tickets, setTickets] = useState(REAL_TICKETS);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  // Selected ticket across Ticket Console and Trace Log
  const [selectedTicketId, setSelectedTicketId] = useState("TCK-1001");
  const [selectedTraceTicketId, setSelectedTraceTicketId] = useState("TCK-1001");

  // Clean Theme Engine from custom hook
  const { theme, toggleTheme } = useTheme();

  // Load tickets on mount
  const refreshTickets = useCallback(async () => {
    setIsLoadingTickets(true);
    try {
      const employeeFilter = isEmployee && user?.id ? user.id : null;
      const data = await fetchTickets(employeeFilter);
      if (Array.isArray(data) && data.length > 0) {
        setTickets(data);
        setSelectedTicketId(data[0].id);
      } else {
        setTickets(isEmployee ? [] : REAL_TICKETS);
        setSelectedTicketId(null);
      }
    } catch (e) {
      console.warn("Could not fetch tickets from backend, using current state", e);
    } finally {
      setIsLoadingTickets(false);
    }
  }, [isEmployee, user?.id]);

  // Reset all view state and re-fetch when persona changes
  useEffect(() => {
    setTicketViewMode("list");
    setSelectedTicketId(null);
    setActiveTab("mission");
    refreshTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    refreshTickets();
  }, [refreshTickets]);

  // Handle selecting a ticket from list
  const handleSelectTicket = (ticketId) => {
    setSelectedTicketId(ticketId);
    setSelectedTraceTicketId(ticketId);
    setTicketViewMode("detail");
  };

  // Handle creating a new ticket
  const handleCreateTicket = async (newTicketPayload) => {
    try {
      const created = await createTicket(newTicketPayload);
      if (created && created.id) {
        setTickets((prev) => [created, ...prev]);
        setSelectedTicketId(created.id);
        setSelectedTraceTicketId(created.id);
        setTicketViewMode("detail");
        return created;
      }
    } catch (err) {
      console.error("Error creating ticket:", err);
      throw err;
    }
  };

  // Dynamic Browser Tab Title per page and role
  useEffect(() => {
    const titles = {
      mission: isEmployee ? "Employee Portal | Meridian" : "Ticket Console | Meridian",
      tickets: isEmployee ? "Employee Portal | Meridian" : "Ticket Console | Meridian",
      glean: "Query Search | Assistant",
      ask: "Query Search | Assistant",
      trace: "Trace Log | Meridian",
      connectors: "Connections | Meridian",
      connections: "Connections | Meridian",
    };
    if (typeof document !== "undefined") {
      document.title = titles[activeTab] || "Meridian";
    }
  }, [activeTab, isEmployee]);

  const handleReset = () => {
    refreshTickets();
    setTicketViewMode("list");
  };

  // Showcase Demo Tour Controller
  const [demoActive, setDemoActive] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [demoPaused, setDemoPaused] = useState(false);
  const [demoTimeLeft, setDemoTimeLeft] = useState(12);

  const executeDemoStage = (index) => {
    const stage = DEMO_STAGES[index];
    if (!stage) return;
    setActiveTab(stage.tab);
    setDemoTimeLeft(stage.duration);
    if (stage.tab === "mission") {
      setTicketViewMode("detail");
    }
  };

  const handleStartDemo = () => {
    setDemoActive(true);
    setDemoStep(0);
    setDemoPaused(false);
    executeDemoStage(0);
  };

  const handleStopDemo = () => {
    setDemoActive(false);
    setDemoPaused(false);
  };

  const handleNextDemoStep = () => {
    if (demoStep < DEMO_STAGES.length - 1) {
      const nextIdx = demoStep + 1;
      setDemoStep(nextIdx);
      executeDemoStage(nextIdx);
    } else {
      handleStopDemo();
    }
  };

  const handlePrevDemoStep = () => {
    if (demoStep > 0) {
      const prevIdx = demoStep - 1;
      setDemoStep(prevIdx);
      executeDemoStage(prevIdx);
    }
  };

  // Demo countdown timer
  useEffect(() => {
    if (!demoActive || demoPaused) return;
    const timer = setInterval(() => {
      setDemoTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [demoActive, demoPaused]);

  useEffect(() => {
    if (!demoActive || demoPaused) return;
    if (demoTimeLeft === 0) {
      if (demoStep < DEMO_STAGES.length - 1) {
        const nextIdx = demoStep + 1;
        setDemoStep(nextIdx);
        executeDemoStage(nextIdx);
      } else {
        handleStopDemo();
      }
    }
  }, [demoTimeLeft, demoActive, demoPaused, demoStep]);

  // If user signed out, display Login Screen
  if (!isAuthenticated) {
    return <LoginView onLogin={login} />;
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans">
      {/* Auto-Hiding / Retracting Sidebar Drawer */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onReset={handleReset}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
        onHoverChange={setIsSidebarHovered}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header
          activeTab={activeTab}
          theme={theme}
          onToggleTheme={toggleTheme}
          demoActive={demoActive}
          onToggleDemo={demoActive ? handleStopDemo : handleStartDemo}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        {/* Content Body */}
        <main
          className={`flex-1 p-3 sm:p-4 lg:p-6 ${
            demoActive ? "pb-36 sm:pb-16 xl:pr-[410px]" : "pb-16 lg:pb-6"
          } space-y-4 max-w-[1650px] w-full mx-auto transition-all duration-300 relative`}
        >
          <AnimatePresence mode="wait">
            {/* CONSOLE VIEW FOR EMPLOYEE */}
            {isEmployee && activeTab === "mission" && (
              <motion.div
                key={`employee-portal-${user?.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <EmployeePortalView
                  user={user}
                  tickets={tickets}
                  onCreateTicket={handleCreateTicket}
                  onRefreshTickets={refreshTickets}
                  isLoadingTickets={isLoadingTickets}
                />
              </motion.div>
            )}

            {/* CONSOLE VIEW FOR ADMIN: TICKET CONSOLE */}
            {isAdmin && activeTab === "mission" && (
              <motion.div
                key={`admin-ticket-console-${user?.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                {ticketViewMode === "list" ? (
                  <TicketListView
                    tickets={tickets}
                    onSelectTicket={handleSelectTicket}
                    onCreateTicket={handleCreateTicket}
                    onRefresh={refreshTickets}
                    isLoading={isLoadingTickets}
                  />
                ) : (
                  <TicketDetailView
                    ticketId={selectedTicketId}
                    initialTicket={tickets.find((t) => t.id === selectedTicketId)}
                    onBackToList={() => setTicketViewMode("list")}
                  />
                )}
              </motion.div>
            )}

            {/* SHARED VIEW: QUERY SEARCH (DOC CHAT & BM25 SEARCH) */}
            {activeTab === "glean" && (
              <motion.div
                key="glean"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <GleanChatView />
              </motion.div>
            )}

            {/* ADMIN ONLY VIEW: TRACE LOG */}
            {activeTab === "trace" && (
              <motion.div
                key="trace"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                {isAdmin ? (
                  <TraceLedgerView 
                    selectedTicketId={selectedTraceTicketId}
                    onSelectTicket={setSelectedTraceTicketId}
                    onNavigateToTicketConsole={() => {
                      setSelectedTicketId(selectedTraceTicketId);
                      setTicketViewMode("detail");
                      setActiveTab("mission");
                    }}
                  />
                ) : (
                  <div className="p-8 max-w-lg mx-auto rounded-2xl border border-amber-500/30 bg-white dark:bg-zinc-900 shadow-xl text-center space-y-4 my-12 font-sans">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
                      <Lock className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        RBAC Access Restricted
                      </h2>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                        The <strong>Trace Log</strong> transparency console requires Administrator / SRE privileges. You are currently signed in as <strong>{user?.name}</strong> with role <code className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">{user?.role}</code>.
                      </p>
                    </div>
                    <button
                      onClick={() => switchPersona("admin")}
                      className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition cursor-pointer inline-flex items-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Elevate to SRE Administrator Role</span>
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ADMIN ONLY VIEW: CONNECTIONS */}
            {activeTab === "connectors" && (
              <motion.div
                key="connectors"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                {isAdmin ? (
                  <ConnectorsView />
                ) : (
                  <div className="p-8 max-w-lg mx-auto rounded-2xl border border-amber-500/30 bg-white dark:bg-zinc-900 shadow-xl text-center space-y-4 my-12 font-sans">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
                      <Lock className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        RBAC Access Restricted
                      </h2>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                        The <strong>Connections</strong> infrastructure console requires Administrator privileges. You are currently signed in as <strong>{user?.name}</strong> with role <code className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">{user?.role}</code>.
                      </p>
                    </div>
                    <button
                      onClick={() => switchPersona("admin")}
                      className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition cursor-pointer inline-flex items-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Elevate to SRE Administrator Role</span>
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Floating Demo Presenter Showcase Overlay for Evaluation (Admin Only) */}
      {isAdmin && demoActive && (
        <div
          className={`transition-all duration-500 ease-out ${
            isSidebarHovered ? "filter blur-[6px] opacity-60 pointer-events-none" : ""
          }`}
        >
          <DemoPresenter
            step={demoStep}
            totalSteps={DEMO_STAGES.length}
            currentStage={DEMO_STAGES[demoStep]}
            isPaused={demoPaused}
            onTogglePause={() => setDemoPaused((p) => !p)}
            onNext={handleNextDemoStep}
            onPrev={handlePrevDemoStep}
            onExit={handleStopDemo}
            progress={((DEMO_STAGES[demoStep].duration - demoTimeLeft) / DEMO_STAGES[demoStep].duration) * 100}
            secondsRemaining={demoTimeLeft}
          />
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <MainWorkspace />
    </AuthProvider>
  );
}

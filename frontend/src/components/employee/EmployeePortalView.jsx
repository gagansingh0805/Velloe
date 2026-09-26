"use client";

import React, { useState, useEffect } from "react";
import { 
  Ticket, 
  PlusCircle, 
  ShieldCheck, 
  HelpCircle, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ChevronRight, 
  ArrowLeft,
  User,
  Sparkles,
  Lock,
  ExternalLink,
  RefreshCw,
  Layers,
  FileText
} from "lucide-react";
import GleanChatView from "@/components/glean/GleanChatView";
import { fetchTicketExplanation, fetchTicketSteps } from "@/services/api";

export default function EmployeePortalView({
  user,
  tickets = [],
  onCreateTicket,
  onRefreshTickets,
  isLoadingTickets = false
}) {
  const [activeTab, setActiveTab] = useState("my-tickets"); // 'my-tickets' | 'report-issue' | 'my-access' | 'kb'
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [ticketExplanation, setTicketExplanation] = useState(null);
  const [ticketSteps, setTicketSteps] = useState([]);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);

  // New ticket form
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("PERMISSIONS");
  const [newService, setNewService] = useState("billing-api");
  const [newDescription, setNewDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Filter only tickets belonging to current logged-in employee
  const myTickets = tickets.filter(
    (t) => (t.employeeId && t.employeeId.toLowerCase() === user.id.toLowerCase())
  );

  // Reset internal state when employee persona changes
  useEffect(() => {
    setSelectedTicketId(null);
    setActiveTab("my-tickets");
    setNewTitle("");
    setNewDescription("");
    setSubmitError(null);
  }, [user?.id]);

  const selectedTicket = selectedTicketId 
    ? myTickets.find((t) => t.id === selectedTicketId) || tickets.find((t) => t.id === selectedTicketId)
    : null;

  useEffect(() => {
    if (!selectedTicketId) {
      setTicketExplanation(null);
      setTicketSteps([]);
      return;
    }

    let isMounted = true;
    setIsLoadingExplanation(true);

    Promise.all([
      fetchTicketSteps(selectedTicketId).catch(() => []),
      fetchTicketExplanation(selectedTicketId).catch(() => null)
    ]).then(([steps, explanation]) => {
      if (isMounted) {
        setTicketSteps(steps || []);
        setTicketExplanation(explanation);
        setIsLoadingExplanation(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedTicketId]);

  const correlatorStep = ticketSteps.find(
    (s) => s.agentName === "CORRELATOR" || s.agentName?.name === "CORRELATOR"
  );
  const resolverStep = ticketSteps.find(
    (s) => s.agentName === "RESOLVER" || s.agentName?.name === "RESOLVER"
  );

  const handleApplyPreset = (presetType) => {
    if (presetType === "billing_403") {
      setNewTitle("Cannot access billing dashboard: 403 Forbidden missing_scope");
      setNewCategory("PERMISSIONS");
      setNewService("billing-api");
      setNewDescription("When I navigate to /billing/dashboard, the page immediately returns a 403 error saying missing_scope billing.read. I am in the billing-analyst role and should have access.");
    } else if (presetType === "kafka_lag") {
      setNewTitle("Kafka consumer lag spike on topic billing.events");
      setNewCategory("SERVICE_FAILURE");
      setNewService("billing-processor");
      setNewDescription("Consumer group billing-processor lag exceeded 15,000 messages on partition 2. Inbound event ingestion rate elevated after batch reconciliation.");
    } else if (presetType === "db_pool") {
      setNewTitle("HikariCP database pool connection timeout");
      setNewCategory("SERVICE_FAILURE");
      setNewService("postgres-db");
      setNewDescription("Active connections reached pool exhaustion threshold. Slow queries detected on reporting endpoint.");
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const created = await onCreateTicket({
        title: newTitle.trim(),
        description: newDescription.trim(),
        category: newCategory,
        service: newService,
        employeeId: user.id,
        employeeRole: user.roleTitle || "employee"
      });

      // Clear form
      setNewTitle("");
      setNewDescription("");
      
      // Select newly created ticket and switch to tickets view
      if (created && created.id) {
        setSelectedTicketId(created.id);
      }
      setActiveTab("my-tickets");
    } catch (err) {
      console.error("Failed to create ticket:", err);
      setSubmitError(err.message || "Failed to submit ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Top Banner: Employee Portal Identity */}
      <div className="p-4 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#111216]/95 backdrop-blur-md shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-sm font-mono flex-shrink-0">
              {user.avatar || user.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Welcome, {user.name}
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                  EMPLOYEE PORTAL
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {user.title} • {user.department} (ID: <code className="font-mono text-zinc-700 dark:text-zinc-300">{user.id}</code>)
              </p>
            </div>
          </div>

          {/* Quick Tab Switcher */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab("my-tickets");
                setSelectedTicketId(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer flex-shrink-0 ${
                activeTab === "my-tickets"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>My Tickets ({myTickets.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("report-issue")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer flex-shrink-0 ${
                activeTab === "report-issue"
                  ? "bg-cyan-600 text-white shadow-xs font-bold"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Report an Issue</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("my-access")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer flex-shrink-0 ${
                activeTab === "my-access"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>My Access &amp; Permissions</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("kb")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer flex-shrink-0 ${
                activeTab === "kb"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Self-Serve Help</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUB-VIEW 1: MY TICKETS */}
      {activeTab === "my-tickets" && (
        <div className="space-y-4">
          {!selectedTicket ? (
            /* Ticket List for Employee */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Your Active Tickets ({myTickets.length})
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Track AI triage diagnosis and approval progress for issues reported under your account.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onRefreshTickets}
                  disabled={isLoadingTickets}
                  className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTickets ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {myTickets.length === 0 ? (
                <div className="p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      No open issues for {user.name}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                      All your systems are operational. If you encounter an error or missing permission, report an issue below.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("report-issue")}
                    className="px-4 py-2 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-bold inline-flex items-center gap-1.5 hover:opacity-90 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Report New Issue</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {myTickets.map((t) => {
                    const isPending = t.status === "AWAITING_APPROVAL";
                    const isResolved = t.status === "RESOLVED";
                    const isRejected = t.status === "REJECTED";

                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTicketId(t.id)}
                        className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-cyan-500/50 bg-white dark:bg-zinc-900/60 hover:bg-zinc-50/50 dark:hover:bg-zinc-900 transition-all cursor-pointer space-y-3 shadow-xs group"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                              {t.id}
                            </span>
                            <span className="text-[10.5px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 font-semibold">
                              {t.category || "PERMISSIONS"}
                            </span>
                            {t.service && (
                              <span className="text-[10.5px] font-mono text-zinc-400">
                                Service: <strong>{t.service}</strong>
                              </span>
                            )}
                          </div>

                          {/* Status Badge */}
                          <div>
                            {isPending && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1.5 animate-pulse">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Awaiting SRE Approval</span>
                              </span>
                            )}
                            {isResolved && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Resolved &amp; Active</span>
                              </span>
                            )}
                            {isRejected && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Closed / Rejected</span>
                              </span>
                            )}
                            {!isPending && !isResolved && !isRejected && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>AI Investigating</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title */}
                        <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                          {t.title}
                        </div>

                        {/* Description snippet */}
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                          {t.description}
                        </p>

                        {/* Root Cause / Resolution Summary */}
                        {t.root_cause_hypothesis && (
                          <div className="p-2.5 rounded-lg bg-cyan-500/5 border border-cyan-500/20 text-xs">
                            <span className="font-mono text-[10px] text-cyan-600 dark:text-cyan-400 uppercase font-bold block">
                              AI Diagnosis:
                            </span>
                            <p className="text-zinc-700 dark:text-zinc-300 font-sans text-xs mt-0.5">
                              {t.root_cause_hypothesis}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-zinc-400 font-mono pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
                          <span>Reported {t.createdAt || "recently"}</span>
                          <span className="text-cyan-600 dark:text-cyan-400 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                            View Ticket Progress <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Employee Ticket Detail View */
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setSelectedTicketId(null)}
                className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to my tickets</span>
              </button>

              <div className="p-5 sm:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-5">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                        {selectedTicket.id}
                      </span>
                      <span className="text-xs font-mono text-zinc-400">
                        Service: <strong>{selectedTicket.service || "billing-api"}</strong>
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                      {selectedTicket.title}
                    </h2>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {selectedTicket.status === "AWAITING_APPROVAL" && (
                      <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1.5 animate-pulse">
                        <Clock className="w-4 h-4" />
                        <span>Awaiting SRE Approval</span>
                      </span>
                    )}
                    {selectedTicket.status === "RESOLVED" && (
                      <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Resolved &amp; Verified</span>
                      </span>
                    )}
                    {selectedTicket.status === "REJECTED" && (
                      <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" />
                        <span>Closed</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Friendly Progress Timeline for Employee */}
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <div className="text-[11px] font-mono uppercase text-zinc-400 font-bold tracking-wider">
                    Issue Resolution Progress:
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                    {/* Step 1 */}
                    <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>1. Intake</span>
                      </div>
                      <p className="text-[11px] text-zinc-500">Report received by AI Issue Triage</p>
                    </div>

                    {/* Step 2 */}
                    <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>2. Root Cause</span>
                      </div>
                      <p className="text-[11px] text-zinc-500">Traces &amp; runbooks correlated</p>
                    </div>

                    {/* Step 3 */}
                    <div className={`p-3 rounded-lg border space-y-1 ${
                      selectedTicket.status === "AWAITING_APPROVAL"
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold"
                        : selectedTicket.status === "RESOLVED"
                        ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-400"
                    }`}>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>3. SRE Approval</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 font-normal">
                        {selectedTicket.status === "AWAITING_APPROVAL" ? "Pending On-Call Signoff" : "SRE Approved"}
                      </p>
                    </div>

                    {/* Step 4 */}
                    <div className={`p-3 rounded-lg border space-y-1 ${
                      selectedTicket.status === "RESOLVED"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-400"
                    }`}>
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        <span>4. Complete</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 font-normal">
                        {selectedTicket.status === "RESOLVED" ? "Access Provisioned" : "Pending Approval"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Problem Description as reported by employee */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                    What You Reported:
                  </label>
                  <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed">
                    {selectedTicket.description}
                  </div>
                </div>

                                {/* AI Diagnosis details */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                      Automated Investigation Findings:
                    </label>
                    {isLoadingExplanation && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-cyan-600 dark:text-cyan-400 animate-pulse font-medium">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Synthesizing findings with AI...
                      </span>
                    )}
                  </div>
                  <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 text-xs space-y-2 shadow-2xs">
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100 leading-relaxed">
                      {ticketExplanation?.headline 
                        ? `${ticketExplanation.headline} — ${ticketExplanation.summary}` 
                        : (correlatorStep?.parsedOutput?.root_cause_hypothesis 
                            || selectedTicket.root_cause_hypothesis 
                            || "Multi-agent automated investigation completed.")}
                    </div>
                    {ticketExplanation?.root_cause_analysis && (
                      <p className="text-[11.5px] text-zinc-600 dark:text-zinc-300 leading-relaxed pt-1">
                        <strong>Root Cause:</strong> {ticketExplanation.root_cause_analysis}
                      </p>
                    )}
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2 pt-2 border-t border-cyan-500/10">
                      <span>Category: <code className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">{ticketExplanation?.category || selectedTicket.category || "GENERAL"}</code></span>
                      <span>•</span>
                      <span>Investigated across Telemetry & Corporate Runbooks</span>
                    </div>
                  </div>
                </div>

                {/* Clear RBAC Separation Notice for Employee */}
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/40 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        Administrative Safety Gate (RBAC Protected)
                      </span>
                    </div>
                    {selectedTicket.status === "REJECTED" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        Rejected by Gate
                      </span>
                    )}
                    {selectedTicket.status === "AWAITING_APPROVAL" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        Pending SRE Approval
                      </span>
                    )}
                    {selectedTicket.status === "RESOLVED" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Approved & Executed
                      </span>
                    )}
                  </div>

                  {selectedTicket.status === "REJECTED" ? (
                    <div className="space-y-3 pt-1">
                      <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-900 dark:text-rose-200 text-xs space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-300">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <span>Why Was This Request Closed / Rejected?</span>
                        </div>
                        <p className="leading-relaxed text-[11.5px]">
                          {ticketExplanation?.rejection_reason || "The automated investigation determined that this ticket does not require platform infrastructure changes or elevated backend permissions."}
                        </p>
                      </div>

                      {ticketExplanation?.next_steps && ticketExplanation.next_steps.length > 0 && (
                        <div className="p-3.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                          <div className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Actionable Next Steps:</span>
                          </div>
                          <ul className="space-y-2">
                            {ticketExplanation.next_steps.map((step, idx) => (
                              <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-700 dark:text-zinc-300">
                                <span className="w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-800 text-[10px] font-bold flex items-center justify-center text-zinc-600 dark:text-zinc-300 flex-shrink-0 mt-0.5">
                                  {idx + 1}
                                </span>
                                <span className="leading-relaxed">{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : selectedTicket.status === "AWAITING_APPROVAL" ? (
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2">
                      <p>
                        {resolverStep?.parsedOutput?.proposed_fix 
                          ? <span>The proposed remediation plan has been assembled: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{resolverStep.parsedOutput.proposed_fix}</span></span>
                          : (selectedTicket.category === "PERMISSIONS"
                              ? <span>The remediation plan to provision <code className="font-mono px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold">billing.read</code> for your account has been assembled and queued.</span>
                              : <span>The remediation plan has been assembled and queued for SRE operator review.</span>
                            )
                        }
                      </p>
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 font-mono text-[11.5px]">
                        ℹ️ <strong>Employee Access Constraint</strong>: Corporate security policy requires a human SRE on-call engineer to sign off on system modifications. You do not have permissions to approve your own tickets.
                      </div>
                    </div>
                  ) : selectedTicket.status === "RESOLVED" ? (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs">
                      ✅ <strong>Remediation Approved & Executed</strong>: {resolverStep?.parsedOutput?.proposed_fix || "SRE on-call approved and applied the remediation."}
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500">
                      Ticket status: {selectedTicket.status}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 2: REPORT AN ISSUE */}
      {activeTab === "report-issue" && (
        <div className="p-5 sm:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Report an Issue to the AI Issue-Triage Pipeline
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Submit an issue description. The multi-agent pipeline will immediately inspect error traces, check permission registries, and diagnose the root cause.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono uppercase text-zinc-400 font-semibold block">
              Quick Presets (1-Click Fill):
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset("billing_403")}
                className="px-2.5 py-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/5 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 text-xs font-mono transition cursor-pointer"
              >
                + Billing Dashboard 403 Forbidden
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset("kafka_lag")}
                className="px-2.5 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/5 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 text-xs font-mono transition cursor-pointer"
              >
                + Kafka Lag Spike on billing.events
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset("db_pool")}
                className="px-2.5 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 text-xs font-mono transition cursor-pointer"
              >
                + Database Pool Exhaustion
              </button>
            </div>
          </div>

          {submitError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs">
              {submitError}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Issue Summary / Title *
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Cannot access billing dashboard: 403 Forbidden missing_scope"
                required
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-xs font-sans text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-cyan-500/60"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-cyan-500/60"
                >
                  <option value="PERMISSIONS">PERMISSIONS (Access / 403 / Scopes)</option>
                  <option value="SERVICE_FAILURE">SERVICE_FAILURE (Crashes / Errors / 500s)</option>
                  <option value="CONFIG_DRIFT">CONFIG_DRIFT (Environment / Out-of-sync)</option>
                  <option value="USER_ERROR">USER_ERROR (Incorrect parameter / query)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Service Affected
                </label>
                <input
                  type="text"
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  placeholder="e.g. billing-api, postgres, kafka"
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-cyan-500/60"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                Detailed Description *
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Describe what occurred, any error codes received, and steps to reproduce..."
                rows={4}
                required
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-xs font-sans text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-cyan-500/60"
              />
            </div>

            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-500 flex items-center justify-between">
              <span>Submitting as: <strong>{user.name}</strong> ({user.id})</span>
              <span>Role: <strong>{user.roleTitle || "employee"}</strong></span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab("my-tickets")}
                className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !newTitle.trim()}
                className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispathing to AI Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Submit &amp; Launch Investigation</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-VIEW 3: MY ACCESS & PERMISSIONS */}
      {activeTab === "my-access" && (
        <div className="p-5 sm:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Assigned Permissions &amp; Scopes
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Live authorization profile for employee <code className="font-mono text-zinc-700 dark:text-zinc-300">{user.id}</code> in the corporate authorization server.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Identity Card */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="text-xs font-mono uppercase text-zinc-400 font-bold">
                Employee Profile
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Name:</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Employee ID:</span>
                  <span className="font-mono text-zinc-900 dark:text-zinc-100">{user.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Department:</span>
                  <span className="text-zinc-900 dark:text-zinc-100">{user.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Assigned Role:</span>
                  <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{user.roleTitle || "billing-analyst"}</span>
                </div>
              </div>
            </div>

            {/* Scope Status Card */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="text-xs font-mono uppercase text-zinc-400 font-bold">
                Assigned Scopes
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-[11px] text-zinc-500 block mb-1 font-semibold">Active Scopes:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(user.activeScopes || ["billing.view"]).map((sc) => (
                      <span
                        key={sc}
                        className="px-2.5 py-1 rounded text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{sc}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {user.missingScopes && user.missingScopes.length > 0 && (
                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 block mb-1 font-semibold">
                      Identified Missing Scopes (Triggering 403s):
                    </span>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {user.missingScopes.map((sc) => (
                        <span
                          key={sc}
                          className="px-2.5 py-1 rounded text-xs font-mono font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1"
                        >
                          <AlertCircle className="w-3 h-3" />
                          <span>{sc}</span>
                        </span>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          handleApplyPreset("billing_403");
                          setActiveTab("report-issue");
                        }}
                        className="px-2.5 py-1 rounded text-[11px] font-bold bg-cyan-600 text-white hover:bg-cyan-500 transition cursor-pointer"
                      >
                        Request Scope &rarr;
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: KNOWLEDGE BASE / SELF-SERVE DOC SEARCH */}
      {activeTab === "kb" && (
        <div className="space-y-3">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-[#111216]/95 backdrop-blur-md">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Employee Self-Serve Knowledge Base
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Ask questions to find policies, runbooks, and scope requirements before escalating to a ticket.
            </p>
          </div>
          <GleanChatView />
        </div>
      )}
    </div>
  );
}
